// @ts-nocheck
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Loading } from 'element-react';
import { useMetamask } from 'contexts/metamaskContext';
import classNames from 'classnames';
import { useConfig } from 'contexts/configContext';
import { useBridgeData } from '../BridgeContext/BridgeDataContext';
import MantaABI from './abi/manta.json';
import TransferFeeDisplay from './TransferFeeDisplay';
import { queryCelerBridgeFee, generateCelerContractData } from './Util';
import EvmBridge from './index';

const mantaContractABI = MantaABI.abi;

// Transfer and approve button for the Ethereum chain
const EvmTransferButton = () => {
  const { senderAssetType, senderAssetTargetBalance } = useBridgeData();

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
    setTransferId(
      '0xe1015da268695400a6417f4b94a6bff4620e2016626e5610539c3905f570fa3f'
    );
    return;
    setIsEstimatingFee(true);
    try {
      const sourceChainId = config.CelerEthereumChainId;
      const destinationChainId = config.MoonbeamChainID;
      const amount = senderAssetTargetBalance.valueAtomicUnits.toString();

      // Query latest Celer bridge fee
      const latestBridgeFee = await queryCelerBridgeFee(
        sourceChainId,
        destinationChainId,
        senderAssetType.baseTicker,
        amount,
        config.CelerEndpoint
      );
      setBridgeFee(latestBridgeFee);
      setIsEstimatingFee(false);
    } catch (error) {
      console.error('Error:', error);
    }
  }, [senderAssetTargetBalance.valueAtomicUnits]);

  // Call metamask to approve token
  const onApproveClick = async () => {
    // Approve Celer Contract Address to spend user's token
    // Create the data parameter of the eth_sendTransaction so that the Ethereum node understands the request
    const spenderAddress =
      config.CelerEthereumContractAddress.slice(2).toLocaleLowerCase(); // Celer Bridge Contract Address
    const defaultAmount =
      '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'; // default amount for metamask
    const hashedPrefix = '0x095ea7b3'; // web3.sha3("approve(address,uint256)").slice(0,10)
    const addressPaddingZero = '000000000000000000000000';
    const data =
      hashedPrefix +
      addressPaddingZero +
      spenderAddress +
      defaultAmount.slice(2);

    setStatus(0);
    await provider
      .request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: ethAddress,
            to: config.MantaEthereumContractAddress,
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
    const destinationChainId = config.MoonbeamChainID;

    // Generate data of Celer Contract
    const { data, transferId } = generateCelerContractData(
      sourceChainId,
      destinationChainId,
      ethAddress,
      config.MantaEthereumContractAddress,
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
            to: config.CelerEthereumContractAddress,
            data: data
          }
        ]
      })
      .then(() => {
        setTransferId(transferId);
      })
      .catch(() => {
        setStatus(2);
      });
  };

  // Query user address allowance
  const queryAllowance = async (ethAddress, amount) => {
    const ethersProvider = new ethers.providers.Web3Provider(provider);
    // Init Manta Token Smart Contract
    const mantaEthereumContract = new ethers.Contract(
      config.MantaEthereumContractAddress,
      mantaContractABI,
      ethersProvider
    );

    const allowance = await mantaEthereumContract.allowance(
      ethAddress,
      config.CelerEthereumContractAddress
    );
    if (allowance.toString() >= amount) {
      setStatus(2);
    } else {
      setTimeout(() => {
        queryAllowance(mantaEthereumContract, ethAddress, amount);
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
        {status === 0 ? (
          <LoadingIndicator />
        ) : (
          <button
            onClick={onClick}
            className={classNames(
              'bg-connect-wallet-button py-2 unselectable-text cursor-pointer',
              'text-center text-white rounded-lg w-full'
            )}>
            {status === 1 ? 'Approve' : 'Transfer'}
          </button>
        )}
      </div>
      {transferId.length > 0 && <EvmBridge transferId={transferId} />}
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
