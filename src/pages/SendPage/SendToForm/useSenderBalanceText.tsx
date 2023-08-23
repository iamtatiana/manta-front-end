import { useWallet } from 'contexts/walletContext';
import { useMantaWallet } from 'contexts/mantaWalletContext';
import { API_STATE, useSubstrate } from 'contexts/substrateContext';
import { useSend } from 'pages/SendPage/SendContext';
import getZkTransactBalanceText from 'utils/display/getZkTransactBalanceText';

const useSenderBalanceText = () => {
  const { apiState } = useSubstrate();
  const { senderAssetCurrentBalance, senderIsPrivate } = useSend();
  const { selectedAccount: externalAccount } = useWallet();
  const { privateAddress, isReady } = useMantaWallet();

  const apiIsDisconnected =
    apiState === API_STATE.ERROR || apiState === API_STATE.DISCONNECTED;

  const balanceText = getZkTransactBalanceText(
    senderAssetCurrentBalance,
    apiIsDisconnected
  );

  const shouldShowPublicLoader = Boolean(
    !senderAssetCurrentBalance && externalAccount?.address && !balanceText
  );

  const shouldShowPrivateLoader = Boolean(
    !senderAssetCurrentBalance && privateAddress && !balanceText
  );

  const mantaSignerLoader = senderIsPrivate()
    ? shouldShowPrivateLoader
    : shouldShowPublicLoader;

  // Prevent loader from appearing in Manta Wallet mode if Manta Wallet is not synced
  const shouldShowLoader = isReady && mantaSignerLoader;

  return { balanceText, shouldShowLoader };
};

export default useSenderBalanceText;
