// @ts-nocheck
import React from 'react';
import classNames from 'classnames';
import Icon from 'components/Icon';
import { useWallet } from 'contexts/walletContext';
import { useMetamask } from 'contexts/metamaskContext';
import { useTxStatus } from 'contexts/txStatusContext';
import { getSubstrateWallets } from 'utils';
import { setLastAccessedWallet } from 'utils/persistence/walletStorage';

const SubstrateWallets = ({ isMetamaskSelected, setIsMetamaskSelected }) => {
  const { txStatus } = useTxStatus();
  const disabled = txStatus?.isProcessing();
  const { setSelectedWallet, selectedWallet, authedWalletList } = useWallet();
  const substrateWallets = getSubstrateWallets();
  const enabledExtentions = substrateWallets.filter((wallet) =>
    authedWalletList.includes(wallet.extensionName)
  );
  const onClickWalletIconHandler = (wallet) => {
    if (disabled) return;
    setSelectedWallet(wallet);
    setLastAccessedWallet(wallet);
    setIsMetamaskSelected(false);
  };

  return enabledExtentions.map((wallet) => (
    <button
      className={classNames('px-5 py-5 rounded-t-lg', {
        'bg-primary':
          wallet.extensionName === selectedWallet.extensionName &&
          !isMetamaskSelected,
        disabled: disabled
      })}
      key={wallet.extensionName}
      onClick={() => onClickWalletIconHandler(wallet)}>
      <img
        className="w-6 h-6 max-w-6 max-h-6"
        src={wallet.logo.src}
        alt={wallet.logo.alt}
      />
    </button>
  ));
};

const MetamaskWallet = ({ isMetamaskSelected, setIsMetamaskSelected }) => {
  const { txStatus } = useTxStatus();
  const disabled = txStatus?.isProcessing();
  const onClickMetamaskHandler = () => {
    !disabled && setIsMetamaskSelected(true);
  };
  return (
    <button
      className={classNames('px-5 py-5', {
        'bg-primary': isMetamaskSelected,
        disabled: disabled
      })}
      onClick={onClickMetamaskHandler}>
      <Icon className="w-6 h-6 max-w-6 max-h-6" name="metamask" />
    </button>
  );
};

const WalletSelectIconBar = ({ isMetamaskSelected, setIsMetamaskSelected }) => {
  const { ethAddress } = useMetamask();
  const isBridgePage = window?.location?.pathname?.includes('bridge');
  return (
    <>
      <SubstrateWallets
        isMetamaskSelected={isMetamaskSelected}
        setIsMetamaskSelected={setIsMetamaskSelected}
      />
      {isBridgePage && ethAddress && (
        <MetamaskWallet
          isMetamaskSelected={isMetamaskSelected}
          setIsMetamaskSelected={setIsMetamaskSelected}
        />
      )}
    </>
  );
};

export default WalletSelectIconBar;
