// @ts-nocheck
import { useMemo } from 'react';

const TransferFeeDisplay = (params) => {
  const bridgeFee = params.bridgeFee;
  const symbol = params.symbol;
  const decimal = Math.pow(10, params.numberOfDecimals);

  const displayObject = useMemo(() => {
    const estimateReceive = (
      parseInt(bridgeFee.estimated_receive_amt) / decimal
    ).toFixed(6);

    return [
      {
        name: 'Approve Gas Fee:',
        value: bridgeFee.approveGasFee
      },
      {
        name: 'Send Gas Fee:',
        value: bridgeFee.sendGasFee
      },
      {
        name: 'Estimate Receive:',
        value: `${estimateReceive} ${symbol}`
      },
      {
        name: 'Estimated Time of Arrival:',
        value: bridgeFee.latency + ' minutes'
      }
    ];
  }, [bridgeFee]);

  return (
    <div className="flex flex-col gap-4 mb-10">
      {displayObject.map((item, index) => {
        return (
          <div
            key={index}
            className="px-2 text-white text-sm flex flex-row justify-between">
            <div>{item.name}</div>
            <div className="font-red-hat-mono">{item.value}</div>
          </div>
        );
      })}
    </div>
  );
};

export default TransferFeeDisplay;
