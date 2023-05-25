import React from 'react';
import { useSend } from '../SendContext';

const FeeDisplay = () => {
  const { feeEstimate } = useSend();
  const feeText = feeEstimate?.toDisplayString() || '-';
  return (
    <div className="flex justify-between items-center inline w-full pt-3">
      <div className="text-white text-sm">Transaction fee</div>
      <div className="text-white text-sm">{feeText}</div>
    </div>
  );
};

export default FeeDisplay;
