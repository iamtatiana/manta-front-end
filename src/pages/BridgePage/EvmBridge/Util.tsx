// @ts-nocheck
import axios from 'axios';
import { ethers } from 'ethers';

export const queryCelerBridgeFee = async (
  sourceChainId,
  destinationChainId,
  symbol,
  amount,
  celerEndpoint
) => {
  // Query celer bridge fee
  const feeResponse = await axios.get(`${celerEndpoint}/v2/estimateAmt`, {
    params: {
      src_chain_id: sourceChainId,
      dst_chain_id: destinationChainId,
      token_symbol: symbol,
      amt: amount
    },
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Query estimated time of arrival
  const latency = await axios.get(
    `${celerEndpoint}/v2/getLatest7DayTransferLatencyForQuery`,
    {
      params: {
        src_chain_id: sourceChainId,
        dst_chain_id: destinationChainId
      },
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  // Update bridge fee and time response
  const latestBridgeFee = feeResponse.data;
  latestBridgeFee.latency = Math.ceil(
    latency.data.median_transfer_latency_in_second / 60
  );
  return latestBridgeFee;
};

// Number to bytes 32 hex
const numberToHex = (number) => {
  return ethers.utils.hexZeroPad(ethers.utils.hexlify(number), 32).slice(2);
};

// String to bytes 32 hex
const stringToHex = (string) => {
  return ethers.utils
    .hexZeroPad(ethers.BigNumber.from(string).toHexString(), 32)
    .slice(2);
};

const addressPaddingZero = '000000000000000000000000';

export const generateCelerContractData = (
  sourceChainId,
  destinationChainId,
  userAddress,
  mantaEthereumContractAddress,
  amount,
  maxSlippage
) => {
  // Send transfer transaction to Celer Contract
  // Create the data parameter of the eth_sendTransaction so that the Ethereum node understands the request
  const hashedPrefix = '0xa5977fbb'; // web3.sha3("send(address,address,uint256,uint64,uint64,uint32)").slice(0,10);
  const approvedAmount = stringToHex(amount);

  const destinationChainIdHex = numberToHex(destinationChainId);
  const nonce = Date.now();
  const nonceHex = numberToHex(nonce);

  const data =
    hashedPrefix +
    addressPaddingZero +
    userAddress.slice(2) +
    addressPaddingZero +
    mantaEthereumContractAddress.slice(2) +
    approvedAmount +
    destinationChainIdHex +
    nonceHex +
    numberToHex(maxSlippage);

  // Show Bridge Processing Modal
  const transferId = ethers.utils.solidityKeccak256(
    ['address', 'address', 'address', 'uint256', 'uint64', 'uint64', 'uint64'],
    [
      userAddress, /// User's wallet address,
      userAddress, /// User's wallet address,
      mantaEthereumContractAddress, /// Wrap token address/ ERC20 token address
      amount, /// Send amount in String
      destinationChainId.toString(), /// Destination chain id
      nonce.toString(), /// Nonce
      sourceChainId /// Source chain id
    ]
  );

  return { data: data, transferId: transferId };
};
