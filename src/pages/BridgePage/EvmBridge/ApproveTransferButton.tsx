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
  generateApproveData,
  queryTokenAllowance,
  estimateApproveGasFee,
  estimateSendGasFee
} from './Util';
import EvmBridge from './index';

const buttonText = [
  '',
  'Approve',
  'Transfer', // ethereum to moonbeam
  'The received amount cannot cover fee',
  'Next', // show evm bridge modal
  'The amount is larger than liquidity pool'
];

// Transfer and approve button for the Ethereum chain
const EvmTransferButton = () => {
  const {
    originChain,
    destinationChain,
    senderAssetType,
    senderAssetTargetBalance
  } = useBridgeData();

  const config = useConfig();

  const { ethAddress, provider } = useMetamask();
  const [status, setStatus] = useState(1); // status, 0 = Processing, 1 = Approve, 2 = Transfer, 3 = The received amount cannot cover fee, 4 = Next, 5 = The amount is larger than liquidity pool
  const [isEstimatingFee, setIsEstimatingFee] = useState(false);
  const [bridgeFee, setBridgeFee] = useState(null);
  const [transferId, setTransferId] = useState('');
  const [showEvmBridgeModal, setShowEvmBridgeModal] = useState(false);

  const onClick = () => {
    if (status === 1) {
      onApproveClick();
    } else if (status === 2) {
      onTransferClick();
    } else if (status === 4) {
      setShowEvmBridgeModal(true);
    }
  };

  const getOriginChainInfo = () => {
    let sourceChainId = 0;
    let destinationChainId = 0;
    let celerContractAddress = '';
    let mantaContractAddress = '';
    let originChainGasFeeSymbol = '';
    let isEthereumToManta = null;
    if (originChain.name === 'ethereum') {
      sourceChainId = config.CelerEthereumChainId;
      destinationChainId = config.CelerMoonbeamChainId;
      celerContractAddress = config.CelerContractOnEthereum;
      mantaContractAddress = config.MantaContractOnEthereum;
      originChainGasFeeSymbol = 'ETH';
      isEthereumToManta = true;
    } else {
      sourceChainId = config.CelerMoonbeamChainId;
      destinationChainId = config.CelerEthereumChainId;
      celerContractAddress = config.CelerContractOnMoonbeam;
      mantaContractAddress = config.MantaContractOnMoonbeam;
      originChainGasFeeSymbol = 'GLMR';
      isEthereumToManta = false;
    }

    return {
      sourceChainId: sourceChainId,
      destinationChainId: destinationChainId,
      celerContractAddress: celerContractAddress,
      mantaContractAddress: mantaContractAddress,
      originChainGasFeeSymbol: originChainGasFeeSymbol,
      isEthereumToManta: isEthereumToManta
    };
  };

  useEffect(async () => {
    // calculate transaction fee
    setIsEstimatingFee(true);
    try {
      const originChainInfo = getOriginChainInfo();
      const amount = senderAssetTargetBalance.valueAtomicUnits.toString();

      // Query latest Celer bridge fee
      const latestBridgeFee = await queryCelerBridgeFee(
        originChainInfo.sourceChainId,
        originChainInfo.destinationChainId,
        senderAssetType.baseTicker,
        amount,
        config.CelerEndpoint
      );

      // estimate amount failed
      if (latestBridgeFee.err) {
        setBridgeFee(null);
        setStatus(5);
        setIsEstimatingFee(false);
        return;
      }

      // calculate approve gas fee
      const approveGasFee = await estimateApproveGasFee(
        amount,
        originChainInfo.celerContractAddress,
        originChainInfo.mantaContractAddress,
        provider,
        ethAddress,
        originChainInfo.originChainGasFeeSymbol
      );

      latestBridgeFee.approveGasFee = approveGasFee;
      latestBridgeFee.sendGasFee = 'Waiting for approve';
      latestBridgeFee.isEthereumToManta = originChainInfo.isEthereumToManta;

      if (latestBridgeFee.estimated_receive_amt < 0) {
        // The received amount cannot cover fee
        setStatus(3);
      } else {
        // eligible to transfer
        if (
          originChain.name === 'manta' &&
          destinationChain.name === 'ethereum'
        ) {
          // show evm bridge modal
          setStatus(4);
        } else {
          // approve token from ethereum to moonbeam
          setStatus(1);
        }
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
    const data = await generateApproveData(
      config.CelerContractOnEthereum,
      senderAssetTargetBalance.valueAtomicUnits.toString()
    );

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
        setTransferId(transferId);
        setShowEvmBridgeModal(true);
        setStatus(1);
      })
      .catch(() => {
        setStatus(2);
      });
  };

  // Query user address allowance
  const queryAllowance = async (ethAddress, amount, retryTimes = 12) => {
    if (retryTimes === 0) {
      // show approve button
      setStatus(1);
      return;
    }
    const allowance = await queryTokenAllowance(
      provider,
      config.MantaContractOnEthereum,
      ethAddress,
      config.CelerContractOnEthereum
    );

    if (allowance >= amount) {
      // calculate transfer gas fee
      const originChainInfo = getOriginChainInfo();
      const sendGasFee = await estimateSendGasFee(
        originChainInfo.sourceChainId,
        originChainInfo.destinationChainId,
        senderAssetTargetBalance.valueAtomicUnits.toString(),
        originChainInfo.celerContractAddress,
        originChainInfo.mantaContractAddress,
        provider,
        ethAddress,
        originChainInfo.originChainGasFeeSymbol,
        bridgeFee.max_slippage
      );

      // update gas fee
      setBridgeFee((preState) => {
        preState.sendGasFee = sendGasFee;
        return preState;
      });

      setStatus(2);
    } else {
      setTimeout(() => {
        queryAllowance(ethAddress, amount, --retryTimes);
      }, 5 * 1000);
    }
  };

  return isEstimatingFee ? (
    <LoadingIndicator />
  ) : (
    <div className="mt-7">
      {bridgeFee && (
        <TransferFeeDisplay
          bridgeFee={bridgeFee}
          symbol={senderAssetType.baseTicker}
          numberOfDecimals={senderAssetType.numberOfDecimals}
        />
      )}
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
                'filter brightness-50 cursor-not-allowed':
                  status === 3 || status === 5
              }
            )}>
            {buttonText[status]}
          </button>
        )}
      </div>
      {showEvmBridgeModal && (
        <EvmBridge
          transferId={transferId}
          latency={bridgeFee.latency}
          maxSlippage={bridgeFee.max_slippage}
          bridgeGasFee={bridgeFee.estimated_receive_amt}
        />
      )}
    </div>
  );
};

const LoadingIndicator = () => {
  return (
    <div className="mt-7">
      <Loading
        style={{ alignSelf: 'center' }}
        loading={true}
        text="Processing..."
      />
    </div>
  );
};

export default EvmTransferButton;
