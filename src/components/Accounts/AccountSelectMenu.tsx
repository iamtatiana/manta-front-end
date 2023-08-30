// @ts-nocheck
import WALLET_NAME from 'constants/WalletConstants';
import classNames from 'classnames';
import Icon from 'components/Icon';
import { useWallet } from 'contexts/walletContext';
import { useMetamask } from 'contexts/metamaskContext';
import { useState } from 'react';
import OutsideClickHandler from 'react-outside-click-handler';
import { useMantaWallet } from 'contexts/mantaWalletContext';
import AccountSelectDropdown from './AccountSelectDropdown';
import { ConnectWalletButton, ConnectWalletIcon } from './ConnectWallet';
import WalletSelectBar from './WalletSelectIconBar';

const DisplayAccountsButton = () => {
  const { ethAddress } = useMetamask();
  const { selectedWallet, selectedAccount } = useWallet();
  const [showAccountList, setShowAccountList] = useState(false);
  const [isMetamaskSelected, setIsMetamaskSelected] = useState(false);
  const { privateWallet } = useMantaWallet();

  const isMetamaskEnabled =
    !!ethAddress && window?.location?.pathname?.includes('bridge');

  // using manta wallet zkAddress combined with other wallets public address
  const isOnlyUsingMantaWalletZKAddress =
    selectedWallet?.extensionName !== WALLET_NAME.MANTA &&
    !!privateWallet &&
    window?.location?.pathname?.includes('transact');

  const succinctAccountName =
    selectedAccount?.name.length > 11
      ? `${selectedAccount?.name.slice(0, 11)}...`
      : selectedAccount?.name;

  const ExternalAccountBlock = ({ text }) => {
    return (
      <>
        <img
          className="unselectable-text w-6 h-6 rounded-full"
          src={selectedWallet.logo.src}
          alt={selectedWallet.logo.alt}
        />
        {isOnlyUsingMantaWalletZKAddress && (
          <Icon
            className="unselectable-text w-6 h-6 rounded-full"
            name="manta"
          />
        )}
        {isMetamaskEnabled && (
          <Icon
            className="unselectable-text w-6 h-6 rounded-full"
            name="metamask"
          />
        )}
        <p className="unselectable-text">{text}</p>
      </>
    );
  };

  return (
    <div className="relative">
      <OutsideClickHandler onOutsideClick={() => setShowAccountList(false)}>
        <div
          className={classNames(
            'flex flex-row justify-center h-10 gap-3 border border-white-light bg-fifth dark:text-black dark:text-white font-red-hat-text w-44 text-sm cursor-pointer rounded-lg items-center'
          )}
          onClick={() => setShowAccountList(!showAccountList)}>
          <ExternalAccountBlock
            text={
              isMetamaskEnabled || isOnlyUsingMantaWalletZKAddress
                ? 'Connected'
                : succinctAccountName
            }
          />
        </div>
        {showAccountList && (
          <div className="w-80 flex flex-col mt-3 absolute right-0 top-full border border-white-light rounded-lg text-black dark:text-white">
            <div className="flex flex-row items-center justify-between bg-fourth rounded-t-lg">
              <div className="flex flex-row items-center">
                <WalletSelectBar
                  isMetamaskSelected={isMetamaskSelected}
                  setIsMetamaskSelected={setIsMetamaskSelected}
                />
              </div>
              <div className="relative top-1">
                <ConnectWalletIcon
                  setIsMetamaskSelected={setIsMetamaskSelected}
                />
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto bg-primary px-5 py-5 rounded-b-lg">
              <AccountSelectDropdown isMetamaskSelected={isMetamaskSelected} />
            </div>
          </div>
        )}
      </OutsideClickHandler>
    </div>
  );
};

const AccountSelectMenu = () => {
  const { selectedAccount } = useWallet();

  return selectedAccount ? (
    <DisplayAccountsButton />
  ) : (
    <ConnectWalletButton
      className={
        'bg-connect-wallet-button text-white font-red-hat-text text-sm h-10 w-44 cursor-pointer rounded-lg'
      }
    />
  );
};

export default AccountSelectMenu;
