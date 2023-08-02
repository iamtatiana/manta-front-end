// @ts-nocheck
import axios from 'axios';
import { ethers } from 'ethers';
import { base64, getAddress, hexlify, hexZeroPad } from 'ethers/lib/utils';

export const queryCelerBridgeFee = async (
  sourceChainId,
  destinationChainId,
  symbol,
  amount,
  celerEndpoint
) => {
  // Query celer bridge fee
  const feeResponse = await axios.get(`${celerEndpoint}/estimateAmt`, {
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
    `${celerEndpoint}/getLatest7DayTransferLatencyForQuery`,
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
  return hexZeroPad(hexlify(number), 32).slice(2);
};

// String to bytes 32 hex
const stringToHex = (string) => {
  return hexZeroPad(ethers.BigNumber.from(string).toHexString(), 32).slice(2);
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
  // https://github.com/celer-network/sgn-v2-contracts/blob/main/contracts/liquidity-bridge/Bridge.sol
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
      mantaEthereumContractAddress, /// Wrap token address ERC20 token address
      amount, /// Send amount in String
      destinationChainId.toString(), /// Destination chain id
      nonce.toString(), /// Nonce
      sourceChainId /// Source chain id
    ]
  );

  return { data: data, transferId: transferId };
};

/**
 * Generate refund transaction data for Celer contract
 * @param {object} refundData - celer bridge data
 */
export const generateCelerRefundData = (refundData) => {
  // Init data to withdraw token from Celer contract
  const wdmsg = base64.decode(refundData.wdmsg);
  const sigs = refundData.sortedSigs.map((item) => {
    return base64.decode(item);
  });
  const signers = refundData.signers.map((item) => {
    const decodeSigners = base64.decode(item);
    const hexlifyObj = hexlify(decodeSigners);
    return getAddress(hexlifyObj);
  });
  const powers = refundData.powers.map((item) => {
    return base64.decode(item);
  });

  // Send transfer transaction to Celer Contract
  // Create the data parameter of the eth_sendTransaction so that the Ethereum node understands the request
  // https://github.com/celer-network/sgn-v2-contracts/blob/main/contracts/liquidity-bridge/Pool.sol
  const ABI = [
    'function withdraw(bytes _wdmsg, bytes[] _sigs, address[] _signers, uint256[] _powers)'
  ];

  const iface = new ethers.utils.Interface(ABI);
  const data = iface.encodeFunctionData('withdraw', [
    wdmsg,
    sigs,
    signers,
    powers
  ]);

  return data;
};

export const queryCelerTransferStatus = async (celerEndpoint, transferId) => {
  try {
    const data = { transfer_id: transferId };
    const response = await axios.post(
      `${celerEndpoint}/getTransferStatus`,
      data,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (e) {
    console.error(e);
    return null;
  }
};
