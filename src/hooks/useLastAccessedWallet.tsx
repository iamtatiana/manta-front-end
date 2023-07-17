import WALLET_NAME from 'constants/WalletConstants';
import { useKeyring } from 'contexts/keyringContext';
import { usePublicAccount } from 'contexts/publicAccountContext';
import { useCallback } from 'react';
import { setLastAccessedWallet } from 'utils/persistence/walletStorage';
import getSubstrateWallets from '../utils/getSubstrateWallets';
import { getLastAccessedWallet } from '../utils/persistence/walletStorage';

export default () => {
  const {
    refreshWalletAccounts,
    getLatestAccountAndPairs,
    keyringIsBusy,
    authedWalletList
  } = useKeyring();
  const { changeExternalAccountOptions } = usePublicAccount();

  const resetMantaWalletModeLastAccessedWallet = useCallback(async () => {
    const substrateWallets = getSubstrateWallets();
    const enabledExtentions = substrateWallets.filter(
      (wallet) =>
        authedWalletList.includes(wallet.extensionName) &&
        wallet.extensionName !== WALLET_NAME.MANTA
    );
    if (enabledExtentions.length > 0) {
      // switch to another wallet as the default wallet
      if (keyringIsBusy.current === false) {
        const defaultWallet = enabledExtentions[0];
        await refreshWalletAccounts(defaultWallet);
        const { account, pairs } = getLatestAccountAndPairs();
        changeExternalAccountOptions(account, pairs);
        setLastAccessedWallet(defaultWallet);
      }
    } else {
      // reset state if no wallet exists
      changeExternalAccountOptions(null, []);
      setLastAccessedWallet(null);
    }
  }, [authedWalletList]);

  const resetLastAccessedWallet = useCallback(async () => {
    const lastAccessExtensionName = getLastAccessedWallet()?.extensionName;
    // Handle switching to Manta Signer mode if Manta wallet is selected
    if (lastAccessExtensionName === WALLET_NAME.MANTA) {
      await resetMantaWalletModeLastAccessedWallet();
      // Handle switching to Manta Wallet mode if no wallet is selected
    }
  }, [resetMantaWalletModeLastAccessedWallet]);

  return { resetLastAccessedWallet };
};
