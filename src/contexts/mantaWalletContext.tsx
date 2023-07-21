import NETWORK from 'constants/NetworkConstants';
import WALLET_NAME from 'constants/WalletConstants';
import {
  dummyPrivateAddress,
  dummyPublicAddress
} from 'constants/DummyTransactions';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { EventRecord, ExtrinsicStatus } from '@polkadot/types/interfaces';
import { BN } from 'bn.js';
import { WarningNotification } from 'components/NotificationContent';
import { useKeyring } from 'contexts/keyringContext';
import { Notification } from 'element-react';
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useLocation } from 'react-router-dom';
import AssetType from 'types/AssetType';
import Balance from 'types/Balance';
import TxStatus from 'types/TxStatus';
import Version from 'types/Version';
import { getSubstrateWallets } from 'utils';
import getPageName from 'utils/display/getPageName';
import { removePendingTxHistoryEvent } from 'utils/persistence/privateTransactionHistory';
import { getLastAccessedWallet } from 'utils/persistence/walletStorage';
import { useConfig } from './configContext';
import { useGlobal } from './globalContexts';
import { PrivateTransactionType, PrivateWallet } from './mantaWalletType';
import { usePublicAccount } from './publicAccountContext';
import { useSubstrate } from './substrateContext';
import { useTxStatus } from './txStatusContext';

type txResHandlerType<T, E = undefined> = (
  result: T,
  extra: E
) => void | Promise<void>;

type MantaWalletContextType = {
  isReady: boolean;
  signerIsConnected: boolean | null;
  hasFinishedInitialBlockDownload: boolean | null;
  privateAddress: string | null;
  getSpendableBalance: (asset: AssetType) => Promise<Balance | null>;
  toPrivate: (balance: Balance, txResHandler: any) => Promise<void>;
  toPublic: (balance: Balance, txResHandler: any) => Promise<void>;
  privateTransfer: (
    balance: Balance,
    receiveZkAddress: string,
    txResHandler: txResHandlerType<any>
  ) => Promise<void>;
  privateWallet: PrivateWallet | null;
  mantaWalletVersion: Version | null;
  sync: () => Promise<void>;
  estimateTransactionBatchCount: (
    _: Balance,
    ___: PrivateTransactionType
  ) => Promise<number | null>;
};

const MantaWalletContext = createContext<MantaWalletContextType | null>(null);

export const MantaWalletContextProvider = ({
  children
}: {
  children: ReactNode;
}) => {
  // external contexts
  const config = useConfig();
  const { NETWORK_NAME: network } = config;
  const { api } = useSubstrate();
  const { externalAccount } = usePublicAccount();
  const publicAddress = externalAccount?.address;
  const { setTxStatus } = useTxStatus();
  const { pathname } = useLocation();
  const { selectedWallet } = useKeyring();

  // private wallet
  const [privateWallet, setPrivateWallet] = useState<PrivateWallet | null>(
    null
  );

  const [isReady, setIsReady] = useState<boolean>(false);
  const signerIsConnected = !!privateWallet?.getZkBalance;

  const [privateAddress, setPrivateAddress] = useState<string | null>(null);
  const [hasFinishedInitialBlockDownload, setHasFinishedInitialBlockDownload] =
    useState<boolean | null>(null);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [mantaWalletVersion, setMantaWalletVersion] = useState<Version | null>(
    null
  );
  const [showChangeNetworkNotification, setShowChangeNetworkNotification] =
    useState(false);
  const { mantaWalletInitialSync, setMantaWalletInitialSync } = useGlobal();

  // transaction state
  const txQueue = useRef<SubmittableExtrinsic<'promise', any>[]>([]);
  const finalTxResHandler = useRef<txResHandlerType<any> | null>(null);

  const walletNetworkIsActive = useRef(false);

  useEffect(() => {
    walletNetworkIsActive.current = window.location.pathname.includes(
      config.NETWORK_NAME.toLowerCase()
    );
  });

  const getMantaWallet = useCallback(async () => {
    const substrateWallets = await getSubstrateWallets();
    const mantaWallet = substrateWallets.find(
      (wallet) => wallet.extension && wallet.extensionName === WALLET_NAME.MANTA
    );
    return mantaWallet;
  }, []);

  useEffect(() => {
    const getPrivateWallet = async () => {
      if (!privateWallet) {
        const mantaWallet = await getMantaWallet();
        if (mantaWallet?.extension?.privateWallet) {
          setPrivateWallet(mantaWallet?.extension?.privateWallet);
        }
      }
    };
    getPrivateWallet();
  });

  useEffect(() => {
    let unsub: any;
    const getZkAddress = async () => {
      const mantaWallet = await getMantaWallet();
      if (!mantaWallet || !privateWallet) {
        return;
      }
      // @ts-ignore
      const _mantaWalletVersion = new Version(mantaWallet._extension.version);
      setMantaWalletVersion(_mantaWalletVersion);
      const SUBSCRIBE_ACCOUNTS_FIRST_VERSION = new Version('0.0.12');
      if (_mantaWalletVersion.gte(SUBSCRIBE_ACCOUNTS_FIRST_VERSION)) {
        unsub = await mantaWallet.subscribeAccounts((accounts) => {
          if (!accounts || accounts.length <= 0) {
            return;
          }
          // @ts-ignore
          const { zkAddress, network: walletNetwork } = accounts[0];
          if (walletNetwork !== network) {
            setShowChangeNetworkNotification(true);
          } else {
            setShowChangeNetworkNotification(false);
          }
          setPrivateAddress(zkAddress);
        });
      } else {
        const accounts = await mantaWallet.getAccounts();
        if (!accounts || accounts.length <= 0) {
          return;
        }
        // @ts-ignore
        const { zkAddress } = accounts[0];
        setPrivateAddress(zkAddress);
      }
    };
    getZkAddress();
    return () => unsub && unsub();
  }, [privateWallet, signerIsConnected, isReady, isBusy, network]);

  useEffect(() => {
    // We can not use `selectedWallet` directly to do a check, because it changes when page loading.
    // Use localstorage `lastAccessedWallet` value instead. The localstorage value changes after `selectedWallet` changes.
    // So use a setTimeout here.
    setTimeout(() => {
      // because for now, we have manta & calamari mantaWalletContext running at the same time,
      // we have to add the network type check to only show the Notification once
      const isCalamari = window.location.pathname.includes('calamari');
      const isManta = !isCalamari;
      const isMantapayPage = window.location.pathname.includes('transact');
      if (
        showChangeNetworkNotification &&
        (isMantapayPage ||
          (!isMantapayPage &&
            getLastAccessedWallet()?.extensionName === WALLET_NAME.MANTA)) &&
        ((isCalamari && network === NETWORK.CALAMARI) ||
          (isManta && network === NETWORK.MANTA))
      ) {
        const updateVersionWarningInfo = {
          title: 'Please switch networks',
          content: `To use ${getPageName()} on ${network}, please select ${network} network in Manta Wallet.`
        };
        Notification({
          message: <WarningNotification {...updateVersionWarningInfo} />,
          duration: 15000,
          offset: 70
        });
      }
    }, 0);
  }, [showChangeNetworkNotification, pathname, selectedWallet]);

  useEffect(() => {
    let unsub: any;
    if (privateWallet) {
      unsub = privateWallet.subscribeWalletState((state) => {
        const { isWalletReady, isWalletBusy } = state;
        setIsReady(isWalletReady);
        setIsBusy(isWalletBusy);
      });
    }
    return () => unsub && unsub();
  }, [privateWallet]);

  const getSpendableBalance = useCallback(
    async (assetType: AssetType) => {
      if (!privateWallet?.getZkBalance) {
        return null;
      }
      try {
        const balanceRaw = await privateWallet.getZkBalance({
          network,
          assetId: `${assetType.assetId}`
        });
        setHasFinishedInitialBlockDownload(true);
        return new Balance(assetType, new BN(balanceRaw || 0));
      } catch (error: any) {
        if (error.message === 'Need to sync the wallet first') {
          setHasFinishedInitialBlockDownload(false);
        }
        return null;
      }
    },
    [privateWallet, isReady, network]
  );

  const sync = useCallback(async () => {
    if (privateWallet && isReady) {
      try {
        const synced = await privateWallet.walletSync();
        if (synced) setMantaWalletInitialSync(false);
      } catch (error) {
        console.error('error syncing wallet', error);
      }
    }
  }, [privateWallet, isReady]);

  useEffect(() => {
    const initialSync = async () => {
      if (mantaWalletInitialSync) {
        await sync();
      }
    };
    initialSync();
  }, [isReady, mantaWalletInitialSync, privateWallet]);

  const getFinalTxResHandler = (
    baseTxResHandler: txResHandlerType<any>,
    finalTx: SubmittableExtrinsic<'promise', any>
  ) => {
    return async (res: any) => {
      const { status, txHash } = res;
      const txHistoryIsEnabled =
        typeof privateWallet?.matchPrivateTransaction === 'function';
      if (status.isBroadcast && txHistoryIsEnabled) {
        // update transaction history in Manta Wallet
        const matchData = {
          network,
          extrinsicHash: txHash.toHex(),
          method: finalTx.method.toHex()
        };
        await privateWallet?.matchPrivateTransaction(matchData);
      }
      await baseTxResHandler(res, undefined);
    };
  };

  const handleInternalTxRes = async ({
    status,
    events
  }: {
    status: ExtrinsicStatus;
    events: EventRecord[];
  }) => {
    if (status.isInBlock) {
      for (const event of events) {
        if (api.events.utility.BatchInterrupted.is(event.event)) {
          setTxStatus(TxStatus.failed('Transaction failed'));
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
        const lastTx: any = txQueue.current.shift();
        if (!lastTx) {
          console.error(new Error('can not get lastTx'));
          setTxStatus(TxStatus.failed(''));
          return;
        }
        await lastTx.signAndSend(
          publicAddress,
          { nonce: -1 },
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
        const internalTx: any = txQueue.current.shift();
        await internalTx.signAndSend(
          publicAddress,
          { nonce: -1 },
          handleInternalTxRes
        );
      } catch (e) {
        setTxStatus(TxStatus.failed('internalTx failed'));
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

  const publishBatchesSequentially = async (
    batches: SubmittableExtrinsic<'promise', any>[],
    txResHandler: txResHandlerType<any>
  ) => {
    txQueue.current = batches;
    const finalTx = txQueue.current[txQueue.current.length - 1];
    finalTxResHandler.current = getFinalTxResHandler(txResHandler, finalTx);
    try {
      publishNextBatch();
      return true;
    } catch (e) {
      console.error('Sequential baching failed', e);
      return false;
    }
  };

  const getBatches = async (signResult: string[]) => {
    const batches = [];
    for (let index = 0; index < signResult.length; index++) {
      const sign = signResult[index];
      const tx = api.tx(sign);
      batches.push(tx);
    }
    return batches;
  };

  const toPublic = useCallback(
    async (balance: Balance, txResHandler: txResHandlerType<any>) => {
      try {
        const signResult = await privateWallet?.toPublicBuild({
          assetId: `${balance.assetType.assetId}`,
          amount: balance.valueAtomicUnits.toString(),
          polkadotAddress: publicAddress,
          network
        });
        const batches = await getBatches(signResult as string[]);
        await publishBatchesSequentially(batches, txResHandler);
      } catch (e) {
        setTxStatus(TxStatus.failed('Transaction declined'));
      }
    },
    [privateWallet, publicAddress, network, api]
  );

  const privateTransfer = useCallback(
    async (
      balance: Balance,
      receiveZkAddress: string,
      txResHandler: txResHandlerType<any>
    ) => {
      try {
        const signResult = await privateWallet?.privateTransferBuild({
          assetId: `${balance.assetType.assetId}`,
          amount: balance.valueAtomicUnits.toString(),
          polkadotAddress: publicAddress,
          toZkAddress: receiveZkAddress,
          network
        });
        const batches = await getBatches(signResult as string[]);
        await publishBatchesSequentially(batches, txResHandler);
      } catch (e) {
        setTxStatus(TxStatus.failed('Transaction declined'));
      }
    },
    [privateWallet, publicAddress, network, api]
  );

  const publicTransfer = useCallback(
    async (
      batches: SubmittableExtrinsic<'promise', any>[],
      txResHandler: txResHandlerType<any>
    ) => {
      try {
        await publishBatchesSequentially(batches, txResHandler);
      } catch (e) {
        setTxStatus(TxStatus.failed('Transaction declined'));
      }
    },
    [privateWallet, publicAddress, network, api]
  );

  const toPrivate = useCallback(
    async (balance: Balance, txResHandler: txResHandlerType<any>) => {
      try {
        const signResult = await privateWallet?.toPrivateBuild({
          assetId: `${balance.assetType.assetId}`,
          amount: balance.valueAtomicUnits.toString(),
          polkadotAddress: publicAddress,
          network
        });
        const batches = await getBatches(signResult as string[]);
        await publishBatchesSequentially(batches, txResHandler);
      } catch (e) {
        setTxStatus(TxStatus.failed('Transaction declined'));
      }
    },
    [privateWallet, publicAddress, network, api]
  );

  const estimateTransactionBatchCount = useCallback(
    async (targetBalance: Balance, transactionType: PrivateTransactionType) => {
      if (!privateWallet || !targetBalance) {
        return null;
      }
      let address;
      switch (transactionType) {
        case 'privateToPublic':
          address = dummyPublicAddress;
          break;
        case 'privateToPrivate':
          address = dummyPrivateAddress;
          break;
        default:
          return 1;
      }
      try {
        const transferPostsCount =
          await privateWallet?.estimateTransferPostsCount({
            network,
            transactionType,
            assetId: targetBalance.assetType.assetId.toString(),
            amount: targetBalance.valueAtomicUnits.toString(),
            zkAddressOrPolkadotAddress: address
          });
        return Math.ceil(transferPostsCount / 2);
      } catch (e) {
        console.error('Error getting transaction batches count', e);
        return null;
      }
    },
    [privateWallet, externalAccount, network, privateAddress]
  );

  const value = useMemo(
    () => ({
      isReady,
      hasFinishedInitialBlockDownload,
      privateAddress,
      getSpendableBalance,
      toPrivate,
      toPublic,
      privateTransfer,
      publicTransfer,
      privateWallet,
      sync,
      signerIsConnected,
      mantaWalletVersion,
      showChangeNetworkNotification,
      estimateTransactionBatchCount
    }),
    [
      isReady,
      hasFinishedInitialBlockDownload,
      privateAddress,
      externalAccount,
      api,
      getSpendableBalance,
      toPrivate,
      toPublic,
      privateTransfer,
      publicTransfer,
      sync,
      privateWallet,
      signerIsConnected,
      mantaWalletVersion,
      showChangeNetworkNotification,
      estimateTransactionBatchCount
    ]
  );

  return (
    <MantaWalletContext.Provider value={value}>
      {children}
    </MantaWalletContext.Provider>
  );
};

export const useMantaWallet = () => ({
  ...useContext(MantaWalletContext)
});
