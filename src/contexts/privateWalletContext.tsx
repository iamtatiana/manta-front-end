// @ts-nocheck
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef
} from 'react';
import PropTypes from 'prop-types';
import { BN } from 'bn.js';
import Balance from 'types/Balance';
import Version from 'types/Version';
import TxStatus from 'types/TxStatus';
import signerIsOutOfDate from 'utils/validation/signerIsOutOfDate';
import { MantaPrivateWallet, MantaUtilities, Environment } from 'manta.js';
import {
  removePendingTxHistoryEvent,
} from 'utils/persistence/privateTransactionHistory';
import { useExternalAccount } from './externalAccountContext';
import { useSubstrate } from './substrateContext';
import { useTxStatus } from './txStatusContext';
import { useConfig } from './configContext';

const PrivateWalletContext = createContext();

export const PrivateWalletContextProvider = (props) => {
  // external contexts
  const config = useConfig();
  const { api, socket } = useSubstrate();
  const { externalAccountSigner, externalAccount, extensionSigner } =
    useExternalAccount();
  const { setTxStatus, txStatusRef } = useTxStatus();

  // private wallet
  const [privateAddress, setPrivateAddress] = useState(null);
  const [privateWallet, setPrivateWallet] = useState(null);
  const walletNetworkIsActive = useRef(false);
  useEffect(() => {
    walletNetworkIsActive.current = window.location.pathname.includes(config.NETWORK_NAME.toLowerCase());
  });

  // signer connection
  const [signerIsConnected, setSignerIsConnected] = useState(null);
  const [signerVersion, setSignerVersion] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const isInitialSync = useRef(false);
  const canFetchZkAddress = privateWallet && signerIsConnected;

  const setDisconnectedState = () => {
    setSignerIsConnected(false);
    setSignerVersion(null);
    setPrivateAddress(null);
    setPrivateWallet(null);
  };

  // transaction state
  const txQueue = useRef([]);
  const finalTxResHandler = useRef(null);
  const [balancesAreStale, _setBalancesAreStale] = useState(false);
  const balancesAreStaleRef = useRef(false);

  const setBalancesAreStale = (areBalancesStale) => {
    balancesAreStaleRef.current = areBalancesStale;
    _setBalancesAreStale(areBalancesStale);
  };

  useEffect(() => {
    setIsReady(privateWallet?.api.isReady && signerIsConnected);
  }, [privateWallet, signerIsConnected]);

  // Wallet must be reinitialized when socket changes
  // because the old api will have been disconnected
  useEffect(() => {
    setIsReady(false);
  }, [socket]);


  useEffect(() => {
    const canInitWallet = () => {
      return (
        walletNetworkIsActive.current &&
        signerIsConnected &&
        signerVersion &&
        !signerIsOutOfDate(config, signerVersion) &&
        !isInitialSync.current
      );
    };

    const initWallet = async () => {
      isInitialSync.current = true;
      const privateWalletConfig = {
        environment: Environment.Production,
        network: config.NETWORK_NAME,
        loggingEnabled: true
      };

      const privateWallet = await MantaPrivateWallet.init(privateWalletConfig);
      const privateAddress = await privateWallet.getZkAddress();
      setPrivateAddress(privateAddress);
      await privateWallet.initialWalletSync();
      setPrivateAddress(privateAddress);
      setPrivateWallet(privateWallet);
      isInitialSync.current = false;
    };

    if (canInitWallet() && !isReady) {
      initWallet();
    }
  }, [api, signerIsConnected, signerVersion]);

  const fetchSignerVersion = async () => {
    try {
      const updatedSignerVersion = await MantaUtilities.getSignerVersion();
      const updatedSignerIsConnected = !!updatedSignerVersion;
      if (updatedSignerIsConnected) {
        setSignerIsConnected(true);
        if (signerVersion?.toString() !== updatedSignerVersion) {
          setSignerVersion(new Version(updatedSignerVersion));
        }
      } else {
        setDisconnectedState();
      }
    } catch (err) {
      console.error(err);
      setDisconnectedState();
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      walletNetworkIsActive.current && fetchSignerVersion();
    }, 1000);
    return () => interval && clearInterval(interval);
  }, [api, privateWallet]);

  const fetchZkAddress = async () => {
    try {
      const currentPrivateAddress = await privateWallet.getZkAddress();
      if (currentPrivateAddress !== privateAddress) {
        setPrivateAddress(currentPrivateAddress);
      }
    } catch (err) {
      setDisconnectedState();
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      if (canFetchZkAddress && walletNetworkIsActive.current) {
        fetchZkAddress();
      }
    }, 1000);
    return () => interval && clearInterval(interval);
  }, [isReady]);

  const sync = async () => {
    // Don't refresh during a transaction to prevent stale balance updates
    // from being applied after the transaction is finished
    if (txStatusRef.current?.isProcessing()) {
      return;
    }
    await privateWallet.walletSync();
    setBalancesAreStale(false);
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      if (isReady && walletNetworkIsActive.current) {
        sync();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [isReady]);

  const getSpendableBalance = async (assetType) => {
    if (!isReady || balancesAreStaleRef.current) {
      return null;
    }
    const balanceRaw = await privateWallet.getPrivateBalance(
      new BN(assetType.assetId)
    );
    return new Balance(assetType, balanceRaw);
  };

  const handleInternalTxRes = async ({ status, events }) => {
    if (status.isInBlock) {
      for (const event of events) {
        if (api.events.utility.BatchInterrupted.is(event.event)) {
          setTxStatus(TxStatus.failed());
          txQueue.current = [];
          console.error('Internal transaction failed', event);
        }
      }
    } else if (status.isFinalized) {
      console.log('Internal transaction finalized');
      await publishNextBatch();
    }
  };

  const publishNextBatch = async () => {
    const sendExternal = async () => {
      try {
        const lastTx = txQueue.current.shift();
        await lastTx.signAndSend(
          externalAccountSigner,
          finalTxResHandler.current
        );
        setTxStatus(TxStatus.processing(null, lastTx.hash.toString()));
      } catch (e) {
        console.error('Error publishing private transaction batch', e);
        setTxStatus(TxStatus.failed('Transaction declined'));
        removePendingTxHistoryEvent();
        txQueue.current = [];
      }
    };

    const sendInternal = async () => {
      try {
        const internalTx = txQueue.current.shift();
        await internalTx.signAndSend(
          externalAccountSigner,
          handleInternalTxRes
        );
      } catch (e) {
        setTxStatus(TxStatus.failed());
        txQueue.current = [];
      }
    };

    if (txQueue.current.length === 0) {
      return;
    } else if (txQueue.current.length === 1) {
      sendExternal();
    } else {
      sendInternal();
    }
  };

  const publishBatchesSequentially = async (batches, txResHandler) => {
    txQueue.current = batches;
    finalTxResHandler.current = txResHandler;
    try {
      publishNextBatch();
      return true;
    } catch (e) {
      console.error('Sequential baching failed', e);
      return false;
    }
  };

  const toPublic = async (balance, txResHandler) => {
    const signResult = await privateWallet.toPublicBuild(
      new BN(balance.assetType.assetId),
      balance.valueAtomicUnits,
      extensionSigner,
      externalAccount.address
    );
    if (signResult === null) {
      setTxStatus(TxStatus.failed('Transaction declined'));
      return;
    }
    const batches = signResult.txs;
    await publishBatchesSequentially(batches, txResHandler);
  };

  const privateTransfer = async (balance, recipient, txResHandler) => {
    const signResult = await privateWallet.privateTransferBuild(
      new BN(balance.assetType.assetId),
      balance.valueAtomicUnits,
      recipient,
      extensionSigner,
      externalAccount.address
    );
    if (signResult === null) {
      setTxStatus(TxStatus.failed('Transaction declined'));
      return;
    }
    const batches = signResult.txs;
    await publishBatchesSequentially(batches, txResHandler);
  };

  const toPrivate = async (balance, txResHandler) => {
    const signResult = await privateWallet.toPrivateBuild(
      new BN(balance.assetType.assetId),
      balance.valueAtomicUnits,
      extensionSigner,
      externalAccount.address
    );
    if (signResult === null) {
      setTxStatus(TxStatus.failed('Transaction declined'));
      return;
    }
    const batches = signResult.txs;
    await publishBatchesSequentially(batches, txResHandler);
  };

  const value = {
    isReady,
    privateAddress,
    getSpendableBalance,
    toPrivate,
    toPublic,
    privateTransfer,
    sync,
    signerIsConnected,
    signerVersion,
    isInitialSync,
    setBalancesAreStale,
    balancesAreStale,
    balancesAreStaleRef
  };

  return (
    <PrivateWalletContext.Provider value={value}>
      {props.children}
    </PrivateWalletContext.Provider>
  );
};

PrivateWalletContextProvider.propTypes = {
  children: PropTypes.any
};

export const usePrivateWallet = () => ({ ...useContext(PrivateWalletContext) });
