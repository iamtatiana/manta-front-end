import { useMetamask } from 'contexts/metamaskContext';
import { useBridgeData } from '../BridgeContext/BridgeDataContext';

// Transfer and approve button for the Ethereum chain
const EvmTransferButton = () => {
  const {
    isApiInitialized,
    isApiDisconnected,
    senderAssetType,
    senderAssetCurrentBalance,
    senderAssetTargetBalance,
    originChain,
    originApi,
    originChainIsEvm,
    destinationChain,
    destinationAddress,
    senderNativeAssetCurrentBalance,
    originFee
  } = useBridgeData();

  const { ethAddress, provider } = useMetamask();

  const onClick = async () => {
    // call metamask to approve
    const amount = senderAssetTargetBalance.valueAtomicUnits.toString();
    await provider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: ethAddress,
          to: '0xd9b0DDb3e3F3721Da5d0B20f96E0817769c2B46D'
        }
      ]
    });
  };
  return (
    <div>
      <button
        onClick={onClick}
        className={classNames(
          'bg-connect-wallet-button py-2 unselectable-text cursor-pointer',
          'text-center text-white rounded-lg w-full'
        )}>
        Approve
      </button>
    </div>
  );
};

export default EvmTransferButton;
