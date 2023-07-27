// @ts-nocheck
import { useMemo } from 'react';

const TransferFeeDisplay = (params) => {
  const bridgeFee = params.bridgeFee;
  const symbol = params.symbol;
  const decimal = Math.pow(10, params.numberOfDecimals);

  const displayObject = useMemo(() => {
    const baseFee = parseInt(bridgeFee.base_fee) / decimal;
    const percFee = parseInt(bridgeFee.perc_fee) / decimal;
    const fee = (baseFee + percFee).toFixed(6);

    const estimateReceive = (
      parseInt(bridgeFee.estimated_receive_amt) / decimal
    ).toFixed(6);

    return [
      {
        name: 'Bridge Rate:',
        value: bridgeFee.bridge_rate
      },
      {
        name: 'Fee:',
        value: `${fee} ${symbol}`
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
    <div className="flex flex-col gap-4 mb-7">
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
