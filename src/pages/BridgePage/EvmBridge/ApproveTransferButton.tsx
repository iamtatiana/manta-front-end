// @ts-nocheck
import { useState, useEffect } from 'react';
import { Loading } from 'element-react';
import { useMetamask } from 'contexts/metamaskContext';
import classNames from 'classnames';
import { useConfig } from 'contexts/configContext';
import { useBridgeData } from '../BridgeContext/BridgeDataContext';
import TransferFeeDisplay from './TransferFeeDisplay';
import {
  queryCelerBridgeFee,
  generateCelerContractData,
  generateApproveData
} from './Util';
import EvmBridge from './index';

const buttonText = [
  '',
  'Approve',
  'Transfer',
  'The received amount cannot cover fee'
];

// Transfer and approve button for the Ethereum chain
const EvmTransferButton = () => {
  const { originChain, senderAssetType, senderAssetTargetBalance } =
    useBridgeData();

  const config = useConfig();
  const { ethAddress, provider } = useMetamask();
  const [status, setStatus] = useState(1); // status, 0 = Processing, 1 = Approve, 2 = Transfer
  const [isEstimatingFee, setIsEstimatingFee] = useState(false);
  const [bridgeFee, setBridgeFee] = useState({});
  const [transferId, setTransferId] = useState('');

  const onClick = () => {
    if (status === 1) {
      onApproveClick();
    } else if (status === 2) {
      onTransferClick();
    }
  };

  useEffect(async () => {
    //////////////////////////////////////////////////
    // Debug Purpose
    // setTransferId(
    //   '0x01c49648bb6447c2bf393cb4d8ec132fcca88f24af5037b06780a5dd16a65371',
    //   0,
    //   bridgeFee.max_slippage
    // );
    // return;
    //////////////////////////////////////////////////
    setIsEstimatingFee(true);
    try {
      let sourceChainId = 0;
      let destinationChainId = 0;
      if (originChain.name === 'ethereum') {
        sourceChainId = config.CelerEthereumChainId;
        destinationChainId = config.CelerMoonbeamChainId;
      } else {
        sourceChainId = config.CelerMoonbeamChainId;
        destinationChainId = config.CelerEthereumChainId;
      }

      const amount = senderAssetTargetBalance.valueAtomicUnits.toString();
      // Query latest Celer bridge fee
      const latestBridgeFee = await queryCelerBridgeFee(
        sourceChainId,
        destinationChainId,
        senderAssetType.baseTicker,
        amount,
        config.CelerEndpoint
      );

      if (latestBridgeFee.estimated_receive_amt < 0) {
        // The received amount cannot cover fee
        setStatus(3);
      } else {
        setStatus(1);
      }
      setBridgeFee(latestBridgeFee);
      setIsEstimatingFee(false);
    } catch (error) {
      console.error('Error:', error);
    }
  }, [senderAssetTargetBalance.valueAtomicUnits]);

  // Call metamask to approve token
  const onApproveClick = async () => {
    // Approve Celer Contract Address to spend user's token
    const data = await generateApproveData(config.CelerContractOnEthereum);

    setStatus(0);
    await provider
      .request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: ethAddress,
            to: config.MantaContractOnEthereum,
            data: data
          }
        ]
      })
      .then(() => {
        const amount = senderAssetTargetBalance.valueAtomicUnits.toString();
        queryAllowance(ethAddress, amount);
      })
      .catch(() => {
        setStatus(1);
      });
  };

  const onTransferClick = async () => {
    const amount = senderAssetTargetBalance.valueAtomicUnits.toString();
    const sourceChainId = config.CelerEthereumChainId;
    const destinationChainId = config.CelerMoonbeamChainId;

    // Generate data of Celer Contract
    const { data, transferId } = generateCelerContractData(
      sourceChainId,
      destinationChainId,
      ethAddress,
      config.MantaContractOnEthereum,
      amount,
      bridgeFee.max_slippage
    );

    setStatus(0);
    await provider
      .request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: ethAddress,
            to: config.CelerContractOnEthereum,
            data: data
          }
        ]
      })
      .then(() => {
        setTransferId(transferId, bridgeFee.latency, bridgeFee.max_slippage);
        setStatus(1);
      })
      .catch(() => {
        setStatus(2);
      });
  };

  // Query user address allowance
  const queryAllowance = async (ethAddress, amount) => {
    const allowance = await queryTokenAllowance(
      provider,
      config.MantaContractOnEthereum,
      ethAddress,
      config.CelerContractOnEthereum
    );

    if (allowance >= amount) {
      setStatus(2);
    } else {
      setTimeout(() => {
        queryAllowance(ethAddress, amount);
      }, 3000);
    }
  };

  return isEstimatingFee ? (
    <LoadingIndicator />
  ) : (
    <div>
      <TransferFeeDisplay
        bridgeFee={bridgeFee}
        symbol={senderAssetType.baseTicker}
        numberOfDecimals={senderAssetType.numberOfDecimals}
      />
      <div>
        {status === 0 && transferId.length === 0 ? (
          <LoadingIndicator />
        ) : (
          <button
            onClick={onClick}
            className={classNames(
              'bg-connect-wallet-button py-2 unselectable-text cursor-pointer',
              'text-center text-white rounded-lg w-full',
              {
                'filter brightness-50 cursor-not-allowed': status === 3
              }
            )}>
            {buttonText[status]}
          </button>
        )}
      </div>
      {transferId.length > 0 && (
        <EvmBridge transferId={transferId} latency={bridgeFee.latency} />
      )}
    </div>
  );
};

const LoadingIndicator = () => {
  return (
    <div className="my-5">
      <Loading
        style={{ alignSelf: 'center' }}
        loading={true}
        text="Processing..."
      />
    </div>
  );
};

export default EvmTransferButton;
