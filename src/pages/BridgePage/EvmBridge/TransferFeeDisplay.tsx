// @ts-nocheck
import { useEffect, useState } from 'react';

const TransferFeeDisplay = (params) => {
  const bridgeFee = params.bridgeFee;
  const symbol = params.symbol;
  const decimal = Math.pow(10, params.numberOfDecimals);
  const payerInfo = params.bridgeFee.isEthereumToManta ? null : 'Paid by Manta';

  const [gasFee, setGasFee] = useState([]);
  useEffect(() => {
    const estimateReceive = (
      parseInt(bridgeFee.estimated_receive_amt) / decimal
    ).toFixed(6);

    const gasFeeData = [
      {
        name: 'Approve Gas Fee:',
        value: bridgeFee.approveGasFee,
        payerInfo: payerInfo
      },
      {
        name: 'Send Gas Fee:',
        value: bridgeFee.sendGasFee,
        payerInfo: payerInfo
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

    setGasFee(gasFeeData);
  }, [bridgeFee.sendGasFee]);

  return (
    <div className="flex flex-col gap-4 mb-10">
      {gasFee.map((item, index) => {
        return (
          <div
            key={index}
            className="px-2 text-white text-sm flex flex-row justify-between">
            <div>{item.name}</div>
            <div className="flex flex-col">
              <div className="font-red-hat-mono">{item.value}</div>
              {item.payerInfo && (
                <div
                  className="font-red-hat-mono text-right"
                  style={{ color: 'rgb(252, 207, 134,0.6)' }}>
                  {item.payerInfo}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TransferFeeDisplay;
