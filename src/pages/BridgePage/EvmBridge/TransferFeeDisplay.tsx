// @ts-nocheck
import { useEffect, useState } from 'react';
import Balance from 'types/Balance';
import BN from 'bn.js';
import Icon from 'components/Icon';
import { Tooltip } from 'element-react';
import { useBridgeData } from '../BridgeContext/BridgeDataContext';

const TransferFeeDisplay = (params) => {
  const { originGasFee, destGasFee, senderAssetType, destinationChain } =
    useBridgeData();
  const bridgeFee = params.bridgeFee;
  const symbol = params.symbol;
  const decimal = Math.pow(10, params.numberOfDecimals);
  const [gasFee, setGasFee] = useState([]);

  useEffect(() => {
    if (originGasFee.isZero()) {
      return;
    }
    const estimateReceive = (
      parseInt(bridgeFee.estimated_receive_amt) / decimal
    ).toFixed(6);

    const celerFee = new Balance(
      senderAssetType,
      new BN(bridgeFee.amount).sub(new BN(bridgeFee.estimated_receive_amt))
    );
    let bridgeFees = celerFee.add(destGasFee);

    const destIsEthereum = destinationChain.name === 'ethereum';
    if (destIsEthereum) {
      bridgeFees = bridgeFees.add(originGasFee);
    }
    // console.log('celerFee', celerFee.toFeeDisplayString());
    // console.log('destGasFee', destGasFee.toFeeDisplayString());
    // console.log('originGasFee', originGasFee.toFeeDisplayString());

    const bridgeFeesTooltip = (
      <div style={{ width: '300px', color: '#989292' }}>
        {destIsEthereum && (
          <>
            <div>{`The Network Fee: ${originGasFee.toFeeDisplayString()}`}</div>
            <div>{`The XCM Execution Fee: ${destGasFee.toFeeDisplayString()}`}</div>
            <div>{`The cBridge Fee: ${celerFee.toFeeDisplayString()}`}</div>
            <div className="mt-2">
              The Network Fee: The network fee covers the gas cost for transfers
              on the Manta network.
            </div>
            <div className="mt-2">
              The XCM Execution Fee covers the transfer cost from Manta to
              Moonbeam via XCM.
            </div>
            <div className="mt-2">
              The cBridge Fee is for transferring from Moonbeam to Ethereum via
              Celer network.
            </div>
          </>
        )}
        {!destIsEthereum && (
          <>
            <div>{`The cBridge Fee: ${celerFee.toFeeDisplayString()}`}</div>
            <div>{`The XCM Execution Fee: ${destGasFee.toFeeDisplayString()}`}</div>
            <div className="mt-2">
              The cBridge Fee is for transferring from Ethereum to Moonbeam via
              Celer network.
            </div>
            <div className="mt-2">
              The XCM Execution Fee covers the transfer cost from Moonbeam to
              Manta via XCM.
            </div>
          </>
        )}
      </div>
    );

    const gasFeeData = [
      {
        name: (
          <div className="flex items-center gap-1">
            Bridge Fees
            <Tooltip
              className="item"
              effect="dark"
              content={bridgeFeesTooltip}
              placement="right"
              visibleArrow={false}>
              <Icon name="information" className="cursor-help text-white" />
            </Tooltip>
          </div>
        ),
        value: `${bridgeFees} ${symbol}`
      },
      {
        name: (
          <div className="flex items-center gap-1">
            Network Fee
            <Tooltip
              className="item"
              effect="dark"
              content={
                <div style={{ width: '300px', color: '#989292' }}>
                  The network fee covers the gas cost for transfers on the
                  Moonbeam network.
                </div>
              }
              placement="right"
              visibleArrow={false}>
              <Icon name="information" className="cursor-help" />
            </Tooltip>
          </div>
        ),
        value: (
          <span>
            GLMR
            <span
              className="font-red-hat-mono text-right ml-1"
              style={{ color: 'rgb(252, 207, 134,0.6)' }}>
              (Paid by Manta)
            </span>
          </span>
        )
      },
      {
        name: (
          <div className="flex items-center gap-1">
            Estimate Receive
            <Tooltip
              className="item"
              effect="dark"
              content={
                <div style={{ color: '#989292' }}>
                  The estimated amount you will receive.
                </div>
              }
              placement="right"
              visibleArrow={false}>
              <Icon name="information" className="cursor-help" />
            </Tooltip>
          </div>
        ),
        value: `${estimateReceive} ${symbol}`
      }
    ];

    setGasFee(gasFeeData);
  }, [bridgeFee, originGasFee]);

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
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TransferFeeDisplay;
