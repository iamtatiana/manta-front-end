// @ts-nocheck
import { useBridgeData } from './BridgeContext/BridgeDataContext';

const BridgeFeeDisplay = () => {
  const { originFee, destinationFee } = useBridgeData();

  const originFeeText = originFee
    ? originFee.toDisplayString(undefined, false)
    : '--';
  const destinationFeeText = destinationFee
    ? destinationFee.toDisplayString(undefined, false)
    : '--';

  return (
    <div className="flex flex-col gap-4 mt-5">
      <div className="px-2 text-white text-sm flex flex-row justify-between">
        <div>{'Origin fee: '}</div>
        <div className="font-red-hat-mono">{originFeeText}</div>
      </div>
      <div className="px-2 text-white text-sm flex flex-row justify-between">
        <div>{'Destination fee: '}</div>
        <div className="font-red-hat-mono">{destinationFeeText}</div>
      </div>
    </div>
  );
};

export default BridgeFeeDisplay;
