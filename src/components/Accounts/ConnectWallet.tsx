// @ts-nocheck
import React from 'react';
import classNames from 'classnames';
import { useModal } from 'hooks';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTxStatus } from 'contexts/txStatusContext';
import ConnectWalletModal from 'components/Modal/connectWalletModal';
import { useWallet } from 'contexts/walletContext';

export const ConnectWalletButton = ({
  setIsMetamaskSelected = null,
  text = 'Connect Wallet',
  className = ''
}) => {
  const component = (
    <button className={classNames(className)}>
      <p className="unselectable-text">{text}</p>
    </button>
  );

  return (
    <ConnectWallet
      component={component}
      setIsMetamaskSelected={setIsMetamaskSelected}
      className={className}
    />
  );
};

export const ConnectWalletIcon = ({ setIsMetamaskSelected = null }) => {
  const { txStatus } = useTxStatus();
  const disabled = txStatus?.isProcessing();
  const component = (
    <FontAwesomeIcon
      className={classNames(
        'w-6 h-6 px-5 py-4 z-10 text-secondary',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      )}
      icon={faPlusCircle}
    />
  );
  return (
    <ConnectWallet
      component={component}
      setIsMetamaskSelected={setIsMetamaskSelected}
    />
  );
};

const ConnectWallet = ({ component, setIsMetamaskSelected = null }) => {
  const { resetWalletConnectingErrorMessages } = useWallet();
  const { ModalWrapper, showModal, hideModal } = useModal({
    closeCallback: () => resetWalletConnectingErrorMessages()
  });
  const { txStatus } = useTxStatus();
  const disabled = txStatus?.isProcessing();
  const onClick = () => !disabled && showModal();

  return (
    <>
      <div className={classNames({ disabled: disabled })} onClick={onClick}>
        {component}
      </div>
      <ModalWrapper>
        <ConnectWalletModal
          setIsMetamaskSelected={setIsMetamaskSelected}
          hideModal={hideModal}
        />
      </ModalWrapper>
    </>
  );
};
