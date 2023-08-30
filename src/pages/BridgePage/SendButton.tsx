// @ts-nocheck
import WALLET_NAME from 'constants/WalletConstants';
import NETWORK from 'constants/NetworkConstants';
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { useTxStatus } from 'contexts/txStatusContext';
import MantaLoading from 'components/Loading';
import { ConnectWalletButton } from 'components/Accounts/ConnectWallet';
import { useMetamask } from 'contexts/metamaskContext';
import { API_STATE, useSubstrate } from 'contexts/substrateContext';
import Chain from 'types/Chain';
import { useConfig } from 'contexts/configContext';
import { useMantaWallet } from 'contexts/mantaWalletContext';
import { useWallet } from 'contexts/walletContext';
import { xTokenContractAddressList } from 'eth/EthXCM';
import BN from 'bn.js';
import { useBridgeTx } from './BridgeContext/BridgeTxContext';
import { useBridgeData } from './BridgeContext/BridgeDataContext';
import EvmTransferButton from './EvmBridge/ApproveTransferButton';

const ValidationButton = () => {
  const config = useConfig();
  const { apiState, api } = useSubstrate();
  const { showChangeNetworkNotification } = useMantaWallet();
  const { selectedWallet, selectedAccount: externalAccount } = useWallet();
  const {
    senderAssetType,
    minInput,
    originChain,
    originChainIsEvm,
    destinationChain,
    destinationChainIsEvm,
    destinationAddress,
    senderAssetTargetBalance
  } = useBridgeData();
  const { txIsOverMinAmount, userHasSufficientFunds, userCanPayOriginFee } =
    useBridgeTx();
  const { ethAddress, chainId } = useMetamask();
  const { txStatus, EVMBridgeProcessing } = useTxStatus();
  const disabled = txStatus?.isProcessing();
  const [GLMRBalance, setGLMRBalance] = useState('');
  const apiIsDisconnected =
    apiState === API_STATE.ERROR || apiState === API_STATE.DISCONNECTED;

  const evmIsEnabled = originChainIsEvm || destinationChainIsEvm;

  let validationMsg = null;
  let isConnectWallet = false;
  let isSwitchNetwork = false;
  let connectWalletText = 'Connect Wallet';
  let evmChain;
  if (originChain.name === 'ethereum') {
    evmChain = Chain.Ethereum(config);
  } else {
    evmChain =
      config.NETWORK_NAME === NETWORK.MANTA
        ? Chain.Moonbeam(config)
        : Chain.Moonriver(config);
  }
  const evmChainId = evmChain.ethChainId;

  const isFromMantaToMoonbeam =
    originChain.name === 'manta' && destinationChain.name === 'moonbeam';
  const isMRLAsset = Object.keys(xTokenContractAddressList)
    .filter((name) => name !== 'MANTA')
    .includes(senderAssetType.baseTicker);

  useEffect(() => {
    async function getGLMRBalance() {
      const result = await api.query.assets.account(
        10,
        externalAccount.address
      );
      const balanceString = result?.value?.balance?.toString();
      setGLMRBalance(balanceString);
    }
    if (isFromMantaToMoonbeam && isMRLAsset) {
      getGLMRBalance();
    }
  });

  if (!externalAccount) {
    isConnectWallet = true;
  } else if (!ethAddress && originChainIsEvm) {
    isConnectWallet = true;
    connectWalletText = 'Connect MetaMask';
  } else if (apiIsDisconnected) {
    validationMsg = 'Connecting to network';
  } else if (
    evmIsEnabled &&
    Number(chainId) !== Number(evmChainId) &&
    !EVMBridgeProcessing
  ) {
    isSwitchNetwork = true;
  } else if (
    selectedWallet?.extensionName === WALLET_NAME.MANTA &&
    showChangeNetworkNotification
  ) {
    validationMsg = 'Switch Networks in Manta Wallet';
  } else if (!senderAssetTargetBalance) {
    validationMsg = 'Enter amount';
  } else if (userHasSufficientFunds() === false && !EVMBridgeProcessing) {
    validationMsg = 'Insuffient balance';
  } else if (evmIsEnabled && !destinationAddress) {
    validationMsg = `Enter ${originChainIsEvm ? 'substrate' : 'EVM'} address`;
  } else if (userCanPayOriginFee() === false && !EVMBridgeProcessing) {
    validationMsg = `Insufficient ${originChain.nativeAsset.ticker} to pay origin fee`;
  } else if (txIsOverMinAmount() === false) {
    const MIN_INPUT_DIGITS = 6;
    validationMsg = `Minimum ${
      senderAssetType.ticker
    } transaction is ${minInput.toDisplayString(MIN_INPUT_DIGITS)}`;
  } else if (isFromMantaToMoonbeam && isMRLAsset) {
    // transfer MRL assets from manta to moonbema
    const minGasFee = '56362740000000000';
    if (new BN(GLMRBalance).lt(new BN(minGasFee))) {
      validationMsg = 'Insufficient GLMR to pay destination fee';
    }
  }

  const ValidationText = ({ validationMsg }) => {
    return (
      <div
        className={classNames(
          'bg-connect-wallet-button py-2 unselectable-text text-center text-white mt-7',
          'rounded-lg w-full filter brightness-50 cursor-not-allowed'
        )}>
        {validationMsg}
      </div>
    );
  };

  const shouldShowSendButton =
    !disabled && !isConnectWallet && !validationMsg && !isSwitchNetwork;
  const shouldShowConnectWallet = !disabled && isConnectWallet;
  const shouldShowValidation =
    !disabled && !isConnectWallet && validationMsg && !EVMBridgeProcessing;
  const shouldShowSwitchNetwork =
    !disabled && !isConnectWallet && !validationMsg && isSwitchNetwork;

  let isEvmTransfer = false;
  if (originChain.name === 'ethereum' || destinationChain.name === 'ethereum') {
    isEvmTransfer = true;
  }

  return (
    <>
      {disabled && <MantaLoading className="py-3" />}
      {shouldShowSendButton &&
        (isEvmTransfer ? <EvmTransferButton /> : <SendButton />)}
      {shouldShowConnectWallet && (
        <ConnectWalletButton
          text={connectWalletText}
          className={classNames(
            'bg-connect-wallet-button py-2 unselectable-text cursor-pointer mt-7',
            'text-center text-white rounded-lg w-full'
          )}
        />
      )}
      {shouldShowValidation && <ValidationText validationMsg={validationMsg} />}
      {shouldShowSwitchNetwork && <SwitchNetworkButton />}
    </>
  );
};

const SwitchNetworkButton = () => {
  const config = useConfig();
  const { configureMoonBeam } = useMetamask();
  const { originChain } = useBridgeData();

  let networkName;
  if (originChain.name === 'ethereum') {
    networkName = 'Ethereum';
  } else {
    networkName =
      config.NETWORK_NAME === NETWORK.MANTA ? 'Moonbeam' : 'Moonriver';
  }

  const onClick = () => {
    configureMoonBeam(networkName);
  };

  return (
    <button
      onClick={onClick}
      className={classNames(
        'bg-connect-wallet-button py-2 unselectable-text cursor-pointer mt-7',
        'text-center text-white rounded-lg w-full'
      )}>
      {`Switch Network to ${networkName}`}
    </button>
  );
};

const SendButton = () => {
  const { send, isValidToSend } = useBridgeTx();

  const onClick = () => {
    send();
  };

  return (
    <button
      onClick={onClick}
      className={classNames(
        'bg-connect-wallet-button py-2 unselectable-text cursor-pointer mt-7',
        'text-center text-white rounded-lg w-full',
        { 'filter brightness-50 cursor-not-allowed': !isValidToSend() }
      )}>
      Submit
    </button>
  );
};

export default ValidationButton;
