import { useMantaWallet } from 'contexts/mantaWalletContext';
import { API_STATE, useSubstrate } from 'contexts/substrateContext';
import getZkTransactBalanceText from 'utils/display/getZkTransactBalanceText';
import { useSend } from '../SendContext';

const useReceiverBalanceText = () => {
  const { receiverCurrentBalance, receiverAddress, isToPrivate, isToPublic } =
    useSend();
  const { isReady } = useMantaWallet();
  const { apiState } = useSubstrate();

  const apiIsDisconnected =
    apiState === API_STATE.ERROR || apiState === API_STATE.DISCONNECTED;

  const balanceText = getZkTransactBalanceText(
    receiverCurrentBalance,
    apiIsDisconnected
  );

  const mantaSignerLoader =
    receiverAddress &&
    !receiverCurrentBalance &&
    !balanceText &&
    (isToPrivate() || isToPublic());

  // Prevent loader from appearing in Manta Wallet mode if Manta Wallet is not synced
  const shouldShowLoader = isReady && mantaSignerLoader;

  return { balanceText, shouldShowLoader };
};

export default useReceiverBalanceText;
