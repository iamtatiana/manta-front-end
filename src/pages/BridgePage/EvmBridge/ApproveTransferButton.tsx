// @ts-nocheck
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Loading } from 'element-react';
import { useMetamask } from 'contexts/metamaskContext';
import classNames from 'classnames';
import { useBridgeData } from '../BridgeContext/BridgeDataContext';
import MantaABI from './abi/manta.json';
import TransferFeeDisplay from './TransferFeeDisplay';

import { queryCelerBridgeFee, generateCelerContractData } from './Util';

const mantaEthereumContractAddress =
  '0xd9b0DDb3e3F3721Da5d0B20f96E0817769c2B46D';
const celerEthereumContractAddress =
  '0x358234B325EF9eA8115291A8b81b7d33A2Fa762D';
const mantaContractABI = MantaABI.abi;

const ethereumChainID = 5;
const moonbeamChainID = 1287;

const paddingZero = '000000000000000000000000';

// Transfer and approve button for the Ethereum chain
const EvmTransferButton = () => {
  const {
    isApiInitialized,
    isApiDisconnected,
    senderAssetType,
    senderAssetCurrentBalance,
    senderAssetTargetBalance,
    originChain,
    originApi,
    destinationChain,
    destinationAddress,
    senderNativeAssetCurrentBalance,
    originFee
  } = useBridgeData();

  const { ethAddress, provider } = useMetamask();
  const [status, setStatus] = useState(1); // status, 0 = Processing, 1 = Approve, 2 = Transfer
  const [isEstimatingFee, setIsEstimatingFee] = useState(true);
  const [bridgeFee, setBridgeFee] = useState();

  const onClick = () => {
    if (status === 1) {
      onApproveClick();
    } else if (status === 2) {
      onTransferClick();
    }
  };

  useEffect(async () => {
    console.log('query celer');
    setIsEstimatingFee(true);
    try {
      const sourceChainId = ethereumChainID;
      const destinationChainId = moonbeamChainID;
      const amount = senderAssetTargetBalance.valueAtomicUnits.toString();

      // Query latest Celer bridge fee
      const latestBridgeFee = await queryCelerBridgeFee(
        sourceChainId,
        destinationChainId,
        senderAssetType.baseTicker,
        amount
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
    const spenderAddress = celerEthereumContractAddress
      .slice(2)
      .toLocaleLowerCase(); // Celer Bridge Contract Address
    const defaultAmount =
      '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'; // default amount for metamask
    const hashedPrefix = '0x095ea7b3'; // web3.sha3("approve(address,uint256)").slice(0,10)
    const data =
      hashedPrefix + paddingZero + spenderAddress + defaultAmount.slice(2);

    setStatus(0);
    await provider
      .request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: ethAddress,
            to: mantaEthereumContractAddress,
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
    const sourceChainId = ethereumChainID;
    const destinationChainId = moonbeamChainID;

    const { data, transferId } = generateCelerContractData(
      sourceChainId,
      destinationChainId,
      ethAddress,
      mantaEthereumContractAddress,
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
            to: celerEthereumContractAddress,
            data: data
          }
        ]
      })
      .then(() => {
        getTransferStatus(transferId);
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
      mantaEthereumContractAddress,
      mantaContractABI,
      ethersProvider
    );

    const allowance = await mantaEthereumContract.allowance(
      ethAddress,
      celerEthereumContractAddress
    );
    if (allowance.toString() >= amount) {
      setStatus(2);
    } else {
      setTimeout(() => {
        queryAllowance(mantaEthereumContract, ethAddress, amount);
      }, 3000);
    }
  };

  const getTransferStatus = async (transferID: string) => {
    try {
      const data = { transfer_id: transferID };
      const response = await axios.post(
        `${celerEndpoint}/v2/getTransferStatus`,
        data,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(response.data);
      setTimeout(async () => {
        await getTransferStatus(transferID);
      }, 30000);
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };

  return isEstimatingFee || status === 0 ? (
    <Loading
      style={{ alignSelf: 'center' }}
      loading={true}
      text="Processing..."></Loading>
  ) : (
    <div>
      <TransferFeeDisplay
        bridgeFee={bridgeFee}
        symbol={senderAssetType.baseTicker}
        numberOfDecimals={senderAssetType.numberOfDecimals}
      />
      <button
        onClick={onClick}
        className={classNames(
          'bg-connect-wallet-button py-2 unselectable-text cursor-pointer',
          'text-center text-white rounded-lg w-full'
        )}>
        {status === 1 ? 'Approve' : 'Transfer'}
      </button>
    </div>
  );
};

export default EvmTransferButton;
