// @ts-nocheck
import NETWORK from 'constants/NetworkConstants';
import { bnToU8a } from '@polkadot/util';
import BN from 'bn.js';
import { useConfig } from 'contexts/configContext';
import { useGlobal } from 'contexts/globalContexts';
import { usePrivateWallet } from 'contexts/privateWalletContext';
import { usePublicAccount } from 'contexts/publicAccountContext';
import { useSubstrate } from 'contexts/substrateContext';
import { useTxStatus } from 'contexts/txStatusContext';
import { useActive } from 'hooks/useActive';
import PropTypes from 'prop-types';
import React, { useContext, useEffect, useReducer } from 'react';
import AssetType from 'types/AssetType';
import Balance from 'types/Balance';
import { HISTORY_EVENT_STATUS } from 'types/TxHistoryEvent';
import TxStatus from 'types/TxStatus';
import getExtrinsicGivenBlockHash from 'utils/api/getExtrinsicGivenBlockHash';
import { updateTxHistoryEventStatus } from 'utils/persistence/privateTransactionHistory';
import { usePublicBalances } from 'contexts/publicBalancesContext';
import SEND_ACTIONS from './sendActions';
import sendReducer, { buildInitState } from './sendReducer';

const SendContext = React.createContext();

export const SendContextProvider = (props) => {
  const { usingMantaWallet } = useGlobal();
  const config = useConfig();
  const { api } = useSubstrate();
  const { setTxStatus, txStatus, txStatusRef } = useTxStatus();
  const { externalAccount, externalAccountSigner } = usePublicAccount();
  const { publicBalancesById } = usePublicBalances();
  const privateWallet = usePrivateWallet();
  const { isReady: privateWalletIsReady, privateAddress } = privateWallet;
  const [state, dispatch] = useReducer(sendReducer, buildInitState(config));
  const isActive = useActive();
  const {
    senderAssetType,
    senderAssetCurrentBalance,
    senderAssetTargetBalance,
    senderNativeTokenPublicBalance,
    senderPublicAccount,
    receiverAssetType,
    receiverAddress
  } = state;

  /**
   * Initialization logic
   */

  // Adds the user's default private address to state on pageload
  useEffect(() => {
    const initSenderPrivateAddress = () => {
      dispatch({
        type: SEND_ACTIONS.SET_SENDER_PRIVATE_ADDRESS,
        senderPrivateAddress: privateAddress
      });
    };
    initSenderPrivateAddress();
    if (privateAddress && isToPrivate()) {
      setReceiver(privateAddress);
    }
  }, [privateAddress]);

  // Initializes the receiving address
  useEffect(() => {
    const initReceiver = (receiverAddress) => {
      dispatch({
        type: SEND_ACTIONS.SET_RECEIVER,
        receiverAddress
      });
    };
    if (!receiverAddress && isToPublic() && senderPublicAccount) {
      initReceiver(senderPublicAccount.address);
    } else if (!receiverAddress && isToPrivate() && privateAddress) {
      initReceiver(privateAddress);
    }
  }, [privateAddress, senderPublicAccount]);

  useEffect(() => {
    const resetReceivingAddressOnSignerDisconnect = () => {
      if (isToPrivate() && !privateAddress) {
        dispatch({
          type: SEND_ACTIONS.SET_RECEIVER,
          receiverAddress: null
        });
      }
    };
    resetReceivingAddressOnSignerDisconnect();
  }, [privateAddress]);

  /**
   * External state
   */

  // Synchronizes the user's current 'active' public account in local state
  // to macth its upstream source of truth in `publicAccountContext`
  // The active `senderPublicAccount` receivs `toPublic` payments,
  // send `toPrivate` and `publicTransfer` payments, and covers fees for all payments
  useEffect(() => {
    const syncPublicAccountToExternalAccount = () => {
      dispatch({
        type: SEND_ACTIONS.SET_SENDER_PUBLIC_ACCOUNT,
        senderPublicAccount: externalAccount
      });
    };
    syncPublicAccountToExternalAccount();
  }, [externalAccount]);

  /**
   *
   * Mutations exposed through UI
   */

  // Toggles the private/public status of the sender's account
  const toggleSenderIsPrivate = () => {
    dispatch({ type: SEND_ACTIONS.TOGGLE_SENDER_ACCOUNT_IS_PRIVATE });
  };

  // Toggles the private/public status of the receiver's account
  const toggleReceiverIsPrivate = () => {
    dispatch({
      type: SEND_ACTIONS.TOGGLE_RECEIVER_ACCOUNT_IS_PRIVATE
    });
  };

  const swapSenderAndReceiverArePrivate = () => {
    dispatch({
      type: SEND_ACTIONS.SWAP_SENDER_AND_RECEIVER_ACCOUNTS_ARE_PRIVATE
    });
  };

  // Sets the asset type to be transacted
  const setSelectedAssetType = (selectedAssetType) => {
    dispatch({ type: SEND_ACTIONS.SET_SELECTED_ASSET_TYPE, selectedAssetType });
  };

  // Sets the balance the user intends to send
  const setSenderAssetTargetBalance = (senderAssetTargetBalance) => {
    dispatch({
      type: SEND_ACTIONS.SET_SENDER_ASSET_TARGET_BALANCE,
      senderAssetTargetBalance
    });
  };

  // Sets the intended recipient of the transaction, whether public or private
  const setReceiver = (receiverAddress) => {
    dispatch({
      type: SEND_ACTIONS.SET_RECEIVER,
      receiverAddress
    });
  };

  /**
   *
   * Balance refresh logic
   */

  // Dispatches the receiver's balance in local state if the user would be sending a payment internally
  // i.e. if the user is sending a `To Private` or `To Public` transaction
  const setReceiverCurrentBalance = (
    receiverCurrentBalance,
    receiverAssetType = null,
    receiverAddress = null
  ) => {
    dispatch({
      type: SEND_ACTIONS.SET_RECEIVER_CURRENT_BALANCE,
      receiverCurrentBalance,
      receiverAssetType,
      receiverAddress
    });
  };

  // Dispatches the user's available balance to local state for the currently selected account and asset
  const setSenderAssetCurrentBalance = (
    senderAssetCurrentBalance,
    senderPublicAddress,
    senderAssetType,
    senderAddress
  ) => {
    dispatch({
      type: SEND_ACTIONS.SET_SENDER_ASSET_CURRENT_BALANCE,
      senderAssetCurrentBalance,
      senderPublicAddress,
      senderAssetType,
      senderAddress
    });
  };

  // Dispatches the user's available public balance for the currently selected fee-paying account to local state
  const setSenderNativeTokenPublicBalance = (
    senderNativeTokenPublicBalance
  ) => {
    dispatch({
      type: SEND_ACTIONS.SET_SENDER_NATIVE_TOKEN_PUBLIC_BALANCE,
      senderNativeTokenPublicBalance
    });
  };

  // Handle changes to user public balances from upstream source of truth in `publicBalancesContext`
  useEffect(() => {
    const handleUpdateNativeToken = () => {
      const nativeToken = AssetType.Native(config);
      const nativeTokenPublicBalance = publicBalancesById?.[nativeToken.assetId] || null;
      setSenderNativeTokenPublicBalance(nativeTokenPublicBalance);
    };

    const handleUpdateSenderPublicBalance = () => {
      if (!externalAccount?.address || !senderAssetType || senderAssetType.isPrivate) {
        return;
      }
      const senderPublicBalance = publicBalancesById?.[senderAssetType.assetId] || null;
      setSenderAssetCurrentBalance(
        senderPublicBalance, externalAccount.address, senderAssetType, externalAccount?.address
      );
    };

    const handleUpdateReceiverPublicBalance = () => {
      if (!receiverAddress || !receiverAssetType) {
        return;
      } else if (isToPublic()) {
        const receiverPublicBalance = publicBalancesById?.[senderAssetType.assetId] || null;
        setReceiverCurrentBalance(receiverPublicBalance, receiverAssetType, externalAccount?.address);
      } else if (isPublicTransfer()) {
        setReceiverCurrentBalance(null, receiverAssetType, receiverAddress);
      }
    };

    handleUpdateNativeToken();
    handleUpdateSenderPublicBalance();
    handleUpdateReceiverPublicBalance();

  }, [
    publicBalancesById, externalAccount?.address, senderAssetType, receiverAddress, receiverAssetType
  ]);

  // Gets the available balance for the currently selected sender private account
  const fetchSenderPrivateBalance = async () => {
    if (senderAssetType.isPrivate && !txStatus?.isProcessing()) {
      const privateBalance = await privateWallet.getSpendableBalance(
        senderAssetType
      );
      privateBalance &&
        setSenderAssetCurrentBalance(
          privateBalance,
          senderPublicAccount?.address,
          senderAssetType,
          privateAddress
        );
    }
  };

  // Gets the available balance for the currently selected receiver private account
  const fetchReceiverPrivateBalance = async () => {
    // Send page doesn't display receiver balances if the receiver is external
    if (isPrivateTransfer()) {
      setReceiverCurrentBalance(null, receiverAssetType, receiverAddress);
      // private balances cannot be queried while a transaction is processing
      // because the private web assambly wallet panics if asked to do two things at a time
    } else if (isToPrivate() && !txStatus?.isProcessing()) {
      const privateBalance = await privateWallet.getSpendableBalance(
        receiverAssetType
      );
      privateBalance &&
        setReceiverCurrentBalance(privateBalance, receiverAssetType, privateAddress);
    }
  };

  const fetchZkBalances = async () => {
    await fetchSenderPrivateBalance();
    await fetchReceiverPrivateBalance();
  };

  useEffect(() => {
    if (api || privateWalletIsReady) {
      fetchZkBalances();
    }
  }, [
    externalAccount,
    senderPublicAccount,
    senderAssetType?.ticker,
    receiverAssetType?.ticker,
    receiverAddress,
    privateAddress,
    txStatus,
    api,
    privateWalletIsReady
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (
        !isActive ||
        txStatus?.isProcessing() ||
        !externalAccount ||
        !senderPublicAccount
      ) {
        return;
      }
      fetchZkBalances();
    }, 120000); // refetch every two mins
    return () => clearInterval(interval);
  }, [
    senderPublicAccount,
    externalAccount,
    isActive,
    txStatus?.isProcessing()
  ]);

  /**
   *
   * Transaction validation
   */

  // Gets the highest amount the user is allowed to send for the currently
  // selected asset
  const getMaxSendableBalance = () => {
    if (!senderAssetCurrentBalance || !senderNativeTokenPublicBalance) {
      return null;
    }
    if (senderAssetType.isNativeToken && !senderAssetType.isPrivate) {
      const reservedNativeTokenBalance = getReservedNativeTokenBalance();
      const zeroBalance = new Balance(senderAssetType, new BN(0));
      return Balance.max(
        senderAssetCurrentBalance.sub(reservedNativeTokenBalance),
        zeroBalance
      );
    }
    if (senderAssetType.isPrivate) {
      return senderAssetCurrentBalance;
    }
    return senderAssetCurrentBalance.valueOverExistentialDeposit();
  };

  // Gets the amount of the native token the user is not allowed to go below
  // If the user attempts a transaction with less than this amount of the
  // native token, the transaction will fail.
  // Note that estimates are conservative (2x observed fees) and inexact
  const getReservedNativeTokenBalance = () => {
    if (!senderNativeTokenPublicBalance) {
      return null;
    }
    let feeEstimate;
    if (config.NETWORK_NAME === NETWORK.DOLPHIN) {
      feeEstimate = Balance.fromBaseUnits(AssetType.Native(config), 50);
    } else if (config.NETWORK_NAME === NETWORK.CALAMARI) {
      feeEstimate = Balance.fromBaseUnits(AssetType.Native(config), 1);
    } else {
      throw new Error('Unknown network');
    }
    const existentialDeposit = Balance.Native(
      config,
      AssetType.Native(config).existentialDeposit
    );
    return feeEstimate.add(existentialDeposit);
  };

  // Returns true if the current tx would cause the user to go below a
  // recommended min fee balance of 150. This helps prevent users from
  // accidentally becoming unable to transact because they cannot pay fees
  const txWouldDepleteSuggestedMinFeeBalance = () => {
    if (
      senderAssetCurrentBalance?.assetType.isNativeToken &&
      senderAssetTargetBalance?.assetType.isNativeToken &&
      (isToPrivate() || isPublicTransfer())
    ) {
      let suggestedMinFeeBalance;
      if (config.NETWORK_NAME === NETWORK.DOLPHIN) {
        suggestedMinFeeBalance = Balance.fromBaseUnits(
          AssetType.Native(config),
          150
        );
      } else if (config.NETWORK_NAME === NETWORK.CALAMARI) {
        suggestedMinFeeBalance = Balance.fromBaseUnits(
          AssetType.Native(config),
          5
        );
      } else {
        throw new Error('Unknown network');
      }
      const balanceAfterTx = senderAssetCurrentBalance.sub(
        senderAssetTargetBalance
      );
      return suggestedMinFeeBalance.gte(balanceAfterTx);
    }
    return false;
  };

  // Checks if the user has enough funds to pay for a transaction
  const userHasSufficientFunds = () => {
    if (
      !senderAssetTargetBalance ||
      !senderAssetCurrentBalance ||
      !senderNativeTokenPublicBalance
    ) {
      return null;
    } else if (
      senderAssetTargetBalance.assetType.assetId !==
      senderAssetCurrentBalance.assetType.assetId
    ) {
      return null;
    }
    const maxSendableBalance = getMaxSendableBalance();
    return maxSendableBalance.gte(senderAssetTargetBalance);
  };

  // Checks if the user has enough native token to pay fees & publish a transaction
  const userCanPayFee = () => {
    if (!senderNativeTokenPublicBalance || !senderAssetTargetBalance) {
      return null;
    }
    let requiredNativeTokenBalance = getReservedNativeTokenBalance();
    if (senderAssetType.isNativeToken && !senderAssetType.isPrivate) {
      requiredNativeTokenBalance = requiredNativeTokenBalance.add(
        senderAssetTargetBalance
      );
    }
    return senderNativeTokenPublicBalance.gte(requiredNativeTokenBalance);
  };

  // Checks the user is sending at least the existential deposit
  const receiverAmountIsOverExistentialBalance = () => {
    if (!senderAssetTargetBalance) {
      return null;
    }
    return senderAssetTargetBalance.valueAtomicUnits.gte(
      receiverAssetType.existentialDeposit
    );
  };

  // Checks that it is valid to attempt a transaction
  const isValidToSend = () => {
    // Debug logging for issue #1005 ("Sometimes when I click 'To Private', there is no response")
    // Committed intentionally, but should be removed after issue is resolved
    console.log('isValidToSend', {
      privateWalletIsReady: privateWallet?.isReady,
      isPublicTransfer: isPublicTransfer(),
      api,
      externalAccountSigner,
      receiverAddress,
      senderAssetTargetBalance,
      senderAssetCurrentBalance,
      userHasSufficientFunds: userHasSufficientFunds(),
      userCanPayFee: userCanPayFee(),
      receiverAmountIsOverExistentialBalance: receiverAmountIsOverExistentialBalance()
    });
    return (
      (privateWallet?.isReady || isPublicTransfer()) &&
      api &&
      externalAccountSigner &&
      receiverAddress &&
      senderAssetTargetBalance &&
      senderAssetCurrentBalance &&
      userHasSufficientFunds() &&
      userCanPayFee() &&
      receiverAmountIsOverExistentialBalance()
    );
  };

  /**
   *
   * Transaction logic
   */

  // Handles the result of a transaction
  const handleTxRes = async ({ status, events }) => {
    if (status.isInBlock) {
      const extrinsic = await getExtrinsicGivenBlockHash(
        status.asInBlock,
        externalAccount,
        api
      );
      for (const event of events) {
        if (api.events.utility.BatchInterrupted.is(event.event)) {
          handleTxFailure(extrinsic);
        }
      }
    } else if (status.isFinalized) {
      for (const event of events) {
        if (api.events.utility.BatchInterrupted.is(event.event)) {
          return;
        }
      }
      await handleTxSuccess(status);
    }
  };

  const handleTxFailure = (extrinsic) => {
    // Don't show failure if the tx was interrupted by disconnection
    txStatusRef.current?.isProcessing() && setTxStatus(TxStatus.failed());
    updateTxHistoryEventStatus(
      HISTORY_EVENT_STATUS.FAILED,
      extrinsic.hash.toString()
    );
    console.error('Transaction failed', event);
  };

  const handleTxSuccess = async (status) => {
    try {
      // Don't show success if the tx was interrupted by disconnection
      const extrinsic = await getExtrinsicGivenBlockHash(
        status.asFinalized,
        externalAccount,
        api
      );
      const extrinsicHash = extrinsic.hash.toHex();
      if (txStatusRef.current?.isProcessing()) {
        setTxStatus(TxStatus.finalized(extrinsicHash, config.SUBSCAN_URL));
      }
      updateTxHistoryEventStatus(
        HISTORY_EVENT_STATUS.SUCCESS,
        extrinsic.hash.toString()
      );
      // Correct private balances will only appear after a sync has completed
      // Until then, do not display stale balances
      privateWallet.setBalancesAreStale(true);
      await privateWallet.sync();
      await fetchZkBalances();
    } catch (error) {
      console.error(error);
    }
  };

  // Attempts to build and send a transaction
  const send = async () => {
    if (!isValidToSend()) {
      return;
    }

    setTxStatus(TxStatus.processing());

    if (usingMantaWallet) {
      await privateWallet.sync();
      if (!isValidToSend()) {
        setTxStatus(TxStatus.failed());
        return;
      }
    }

    if (isPrivateTransfer()) {
      await privateTransfer(state);
    } else if (isPublicTransfer()) {
      await publicTransfer(state);
    } else if (isToPrivate()) {
      await toPrivate(state);
    } else if (isToPublic()) {
      await toPublic(state);
    }
  };

  // Attempts to build and send an internal transaction minting public tokens to private tokens
  const toPrivate = async () => {
    await privateWallet.toPrivate(state.senderAssetTargetBalance, handleTxRes);
  };

  // Attempts to build and send an internal transaction reclaiming private tokens to public tokens
  const toPublic = async () => {
    await privateWallet.toPublic(state.senderAssetTargetBalance, handleTxRes);
  };

  // Attempts to build and send a transaction to some private account
  const privateTransfer = async () => {
    const { senderAssetTargetBalance, receiverAddress } = state;
    await privateWallet.privateTransfer(
      senderAssetTargetBalance,
      receiverAddress,
      handleTxRes
    );
  };

  const buildPublicTransfer = async (
    senderAssetTargetBalance,
    receiverAddress
  ) => {
    const assetId = senderAssetTargetBalance.assetType.assetId;
    const valueAtomicUnits = senderAssetTargetBalance.valueAtomicUnits;
    const assetIdArray = bnToU8a(new BN(assetId), { bitLength: 256 });
    const valueArray = valueAtomicUnits.toArray('le', 16);
    const tx = await api.tx.mantaPay.publicTransfer(
      { id: assetIdArray, value: valueArray },
      receiverAddress
    );
    return tx;
  };

  // Attempts to build and send a transaction to some public account
  const publicTransfer = async () => {
    const tx = await buildPublicTransfer(
      senderAssetTargetBalance,
      receiverAddress
    );
    try {
      await tx.signAndSend(externalAccountSigner, handleTxRes);
    } catch (e) {
      console.error('Failed to send transaction', e);
      setTxStatus(TxStatus.failed('Transaction declined'));
    }
  };

  const isToPrivate = () => {
    return !senderAssetType?.isPrivate && receiverAssetType?.isPrivate;
  };

  const isToPublic = () => {
    return senderAssetType?.isPrivate && !receiverAssetType?.isPrivate;
  };

  const isPrivateTransfer = () => {
    return senderAssetType?.isPrivate && receiverAssetType?.isPrivate;
  };

  const isPublicTransfer = () => {
    return !senderAssetType?.isPrivate && !receiverAssetType?.isPrivate;
  };

  const senderIsPrivate = () => {
    return isPrivateTransfer() || isToPublic();
  };

  const senderIsPublic = () => {
    return isPublicTransfer() || isToPrivate();
  };

  const receiverIsPrivate = () => {
    return isPrivateTransfer() || isToPrivate();
  };

  const receiverIsPublic = () => {
    return isPublicTransfer() || isToPublic();
  };

  const value = {
    userHasSufficientFunds,
    userCanPayFee,
    getMaxSendableBalance,
    receiverAmountIsOverExistentialBalance,
    txWouldDepleteSuggestedMinFeeBalance,
    isValidToSend,
    setSenderAssetTargetBalance,
    toggleSenderIsPrivate,
    toggleReceiverIsPrivate,
    swapSenderAndReceiverArePrivate,
    setSelectedAssetType,
    setReceiver,
    send,
    isPrivateTransfer,
    isPublicTransfer,
    isToPrivate,
    isToPublic,
    senderIsPrivate,
    receiverIsPrivate,
    receiverIsPublic,
    senderIsPublic,
    ...state
  };

  return (
    <SendContext.Provider value={value}>{props.children}</SendContext.Provider>
  );
};

SendContextProvider.propTypes = {
  children: PropTypes.any
};

export const useSend = () => ({ ...useContext(SendContext) });
