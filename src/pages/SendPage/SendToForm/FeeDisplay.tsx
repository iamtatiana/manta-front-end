// @ts-nocheck
import React from 'react';
import { useSend } from '../SendContext';

const FeeDisplay = () => {
  const { feeEstimate } = useSend();
  return (
    <div className="flex justify-between items-center inline w-full pt-3">
      <div className="text-white">Gas fee</div>
      <div className="text-white">{feeEstimate?.toDisplayString() || '-'}</div>
    </div>
  );
};

export default FeeDisplay;
