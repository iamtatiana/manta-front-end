// @ts-nocheck
import { FixedPointNumber } from '@acala-network/sdk-core';
import { useMetamask } from 'contexts/metamaskContext';
import { useTxStatus } from 'contexts/txStatusContext';
import PropTypes from 'prop-types';
import React, { useContext } from 'react';
import TxStatus from 'types/TxStatus';
import extrinsicWasSentByUser from 'utils/api/ExtrinsicWasSendByUser';
import {
  transferGlmrFromMoonbeamToManta,
  transferTokenFromMoonbeamToManta,
  xTokenContractAddressList
} from 'eth/EthXCM';
import { transferMRLAssetsFromMantaToMoonbeam } from 'eth/MRL_XCM';
import { useConfig } from 'contexts/configContext';
import Balance from 'types/Balance';
import { useWallet } from 'contexts/walletContext';
import { useSubstrate } from 'contexts/substrateContext';
import { useBridgeData } from './BridgeDataContext';

const BridgeTxContext = React.createContext();

export const BridgeTxContextProvider = (props) => {
  const config = useConfig();
  const { provider } = useMetamask();
  const { setTxStatus, txStatusRef } = useTxStatus();
  const { selectedAccount: externalAccount } = useWallet();
  const {
    isApiInitialized,
    isApiDisconnected,
    senderAssetType,
    senderAssetCurrentBalance,
    senderAssetTargetBalance,
    originChain,
    originApi,
    originChainIsEvm,
    originXcmAdapter,
    destinationChain,
    destinationAddress,
    maxInput,
    minInput,
    senderNativeAssetCurrentBalance,
    originFee
  } = useBridgeData();
  const { api } = useSubstrate();

  /**
   *
   * Transaction validation
   */

  const userCanPayOriginFee = () => {
    if (
      !senderNativeAssetCurrentBalance ||
      !senderAssetTargetBalance ||
      !originChain ||
      !originFee
    ) {
      return null;
    } else if (originChain.name === 'ethereum') {
      return senderNativeAssetCurrentBalance.gte(originFee);
    } else if (
      senderNativeAssetCurrentBalance.assetType.assetId !==
      originFee.assetType.assetId
    ) {
      return null;
    }

    const nativeAsset = originChain.nativeAsset;
    let txNativeTokenCost = originFee;
    if (senderAssetTargetBalance?.assetType.assetId === nativeAsset.assetId) {
      txNativeTokenCost = txNativeTokenCost.add(senderAssetTargetBalance);
    }
    const reservedNativeBalance = new Balance(
      nativeAsset,
      nativeAsset.existentialDeposit
    );
    const minBalanceToPayOriginFee = txNativeTokenCost.add(
      reservedNativeBalance
    );
    return senderNativeAssetCurrentBalance.gte(minBalanceToPayOriginFee);
  };

  // Checks if the user has enough funds to pay for a transaction
  const userHasSufficientFunds = () => {
    if (!maxInput || !senderAssetTargetBalance) {
      return null;
    } else if (
      senderAssetTargetBalance.assetType.assetId !== maxInput.assetType.assetId
    ) {
      return null;
    }
    return senderAssetTargetBalance.lte(maxInput);
  };

  const txIsOverMinAmount = () => {
    if (!minInput || !senderAssetTargetBalance) {
      return null;
    } else if (
      senderAssetTargetBalance.assetType.assetId !== minInput.assetType.assetId
    ) {
      return null;
    }
    return senderAssetTargetBalance.gte(minInput);
  };

  const userCanSign = () => {
    if (senderAssetType?.ethMetadata) {
      return provider !== null;
    }
    return true;
  };

  // Checks that it is valid to attempt a transaction
  const isValidToSend = () => {
    return (
      isApiInitialized &&
      !isApiDisconnected &&
      destinationAddress &&
      senderAssetTargetBalance &&
      senderAssetCurrentBalance &&
      userCanSign() &&
      userHasSufficientFunds() &&
      txIsOverMinAmount() &&
      userCanPayOriginFee()
    );
  };

  /**
   *
   * Transactions
   */

  // Handles the result of a transaction
  const handleTxRes = async ({ status, events }) => {
    if (status.isInBlock) {
      for (const event of events) {
        if (originApi.events.system.ExtrinsicFailed.is(event.event)) {
          const error = event.event.data[0];
          if (error.isModule) {
            const decoded = originApi.registry.findMetaError(
              error.asModule.toU8a()
            );
            const { docs, method, section } = decoded;
            console.error(`${section}.${method}: ${docs.join(' ')}`);
          } else {
            console.error(error.toString());
          }
          // Don't show failure if tx interrupted by disconnection
          txStatusRef.current?.isProcessing() && setTxStatus(TxStatus.failed());
        } else if (originApi.events.system.ExtrinsicSuccess.is(event.event)) {
          // Don't show success if tx interrupted by disconnection
          if (txStatusRef.current?.isProcessing()) {
            try {
              const signedBlock = await originApi.rpc.chain.getBlock(
                status.asInBlock
              );
              const extrinsics = signedBlock.block.extrinsics;
              const extrinsic = extrinsics.find((extrinsic) =>
                extrinsicWasSentByUser(extrinsic, externalAccount, originApi)
              );
              const extrinsicHash = extrinsic.hash.toHex();
              setTxStatus(
                TxStatus.finalized(extrinsicHash, originChain.subscanUrl)
              );
            } catch (error) {
              console.error(error);
            }
          }
        }
      }
    }
  };

  // Attempts to build and send a bridge transaction
  const send = async () => {
    if (!isValidToSend()) {
      return;
    }
    setTxStatus(TxStatus.processing());
    if (originChainIsEvm) {
      await sendEth();
    } else {
      try {
        const MRL_ASSETS = Object.keys(xTokenContractAddressList).filter(
          (name) => name !== 'MANTA'
        );
        if (
          MRL_ASSETS.includes(senderAssetType.baseTicker) &&
          config.NETWORK_NAME === 'Manta'
        ) {
          return await sendMRL();
        }
        await sendSubstrate();
      } catch (e) {
        console.log(e.message);
        txStatusRef.current?.isProcessing() && setTxStatus(TxStatus.failed());
      }
    }
  };

  // Attempts to build and send a bridge transaction with a substrate origin chain
  // with `handleTxResCb` means this is used in EVM bridge, step of manta -> moonbeam
  const sendSubstrate = async (handleTxResCb) => {
    const value = senderAssetTargetBalance.valueAtomicUnits.toString();
    const tx = originXcmAdapter.createTx({
      amount: FixedPointNumber.fromInner(value, 10),
      to: handleTxResCb ? 'moonbeam' : destinationChain.name,
      token: senderAssetTargetBalance.assetType.baseTicker,
      address: destinationAddress
    });
    await tx.signAndSend(
      externalAccount.address,
      { nonce: -1, signer: externalAccount.signer },
      handleTxResCb || handleTxRes
    );
  };

  const sendMRL = async () => {
    if (!api) {
      console.error('api not found');
      return;
    }
    await transferMRLAssetsFromMantaToMoonbeam(
      api,
      externalAccount,
      destinationAddress,
      senderAssetType.baseTicker,
      senderAssetTargetBalance.valueAtomicUnits.toString(),
      handleTxRes
    );
  };

  // Attempts to build and send a bridge transaction with an Eth-like origin chain
  const sendEth = async () => {
    if (
      originChain.name === 'moonriver' ||
      (originChain.name === 'moonbeam' && senderAssetType.baseTicker === 'GLMR')
    ) {
      const txHash = await transferGlmrFromMoonbeamToManta(
        config,
        provider,
        senderAssetTargetBalance,
        destinationAddress
      );
      if (txHash) {
        setTxStatus(TxStatus.finalized(txHash));
      } else {
        setTxStatus(TxStatus.failed('Transaction declined'));
      }
    } else {
      const txHash = await transferTokenFromMoonbeamToManta(
        senderAssetType.baseTicker,
        config,
        provider,
        senderAssetTargetBalance,
        destinationAddress
      );
      if (txHash) {
        setTxStatus(TxStatus.finalized(txHash));
      } else {
        setTxStatus(TxStatus.failed('Transaction declined'));
      }
    }
  };

  const value = {
    userHasSufficientFunds,
    txIsOverMinAmount,
    isValidToSend,
    userCanPayOriginFee,
    send,
    sendSubstrate
  };

  return (
    <BridgeTxContext.Provider value={value}>
      {props.children}
    </BridgeTxContext.Provider>
  );
};

BridgeTxContextProvider.propTypes = {
  children: PropTypes.any
};

export const useBridgeTx = () => ({ ...useContext(BridgeTxContext) });
