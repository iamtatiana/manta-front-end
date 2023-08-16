// @ts-nocheck
import axios from 'axios';
import { ethers } from 'ethers';
import { base64, getAddress, hexlify, hexZeroPad } from 'ethers/lib/utils';
import MantaABI from './abi/manta.json';

const mantaContractABI = MantaABI.abi;
const decimal = Math.pow(10, 18);

/**
 * Generate transfer data for Celer contract
 * @param {number} sourceChainId - source chain id for Celer contract
 * @param {number} destinationChainId - destination chain id for Celer contract
 * @param {string} symbol - token symbol
 * @param {number} amount - transfer amount
 * @param {string} celerEndpoint - Celer RPC
 * @param {string} celerContractAddress - celer Contract address
 * @param {object} provider - metamask provider
 * @param {string} ethAddress - user's metamask address
 * @param {string} originChainGasFeeSymbol - gas fee symbol
 */
export const queryCelerBridgeFee = async (
  sourceChainId,
  destinationChainId,
  symbol,
  amount,
  celerEndpoint
) => {
  try {
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
    latestBridgeFee.amount = amount;
    latestBridgeFee.latency = Math.ceil(
      latency.data.median_transfer_latency_in_second / 60
    );
    return latestBridgeFee;
  } catch (e) {
    console.log(e);
    return await queryCelerBridgeFee(
      sourceChainId,
      destinationChainId,
      symbol,
      amount,
      celerEndpoint
    );
  }
};

export const estimateApproveGasFee = async (
  amount,
  celerContractAddress,
  mantaContractAddress,
  provider,
  ethAddress,
  originChainGasFeeSymbol
) => {
  try {
    const ethersProvider = new ethers.providers.Web3Provider(provider);
    const feeData = await ethersProvider.getFeeData();
    const gasPrice = ethers.utils.formatUnits(
      feeData.maxPriorityFeePerGas,
      'wei'
    );

    // calculate approved transaction gas fee
    const approvedData = await generateApproveData(
      celerContractAddress,
      amount
    );
    const approveGasLimit = await ethersProvider.estimateGas({
      from: ethAddress,
      to: mantaContractAddress,
      data: approvedData
    });
    return (
      ((approveGasLimit * gasPrice) / decimal).toFixed(8) +
      ' ' +
      originChainGasFeeSymbol
    );
  } catch (e) {
    console.log(e);
    return await estimateApproveGasFee(
      amount,
      celerContractAddress,
      mantaContractAddress,
      provider,
      ethAddress,
      originChainGasFeeSymbol
    );
  }
};

export const estimateSendGasFee = async (
  sourceChainId,
  destinationChainId,
  amount,
  celerContractAddress,
  mantaContractAddress,
  provider,
  ethAddress,
  originChainGasFeeSymbol,
  maxSlippage
) => {
  const ethersProvider = new ethers.providers.Web3Provider(provider);
  const feeData = await ethersProvider.getFeeData();
  const gasPrice = ethers.utils.formatUnits(
    feeData.maxPriorityFeePerGas,
    'wei'
  );
  // calculate send transaction gas fee
  const sentData = await generateCelerContractData(
    sourceChainId,
    destinationChainId,
    ethAddress,
    mantaContractAddress,
    amount,
    maxSlippage
  );

  const sendGasLimit = await ethersProvider.estimateGas({
    from: ethAddress,
    to: celerContractAddress,
    data: sentData.data
  });

  console.log('sendGasLimit: ' + sendGasLimit);
  return (
    ((sendGasLimit * gasPrice * 1.5) / decimal).toFixed(8) +
    ' ' +
    originChainGasFeeSymbol
  );
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

/**
 * Generate transfer data for Celer contract
 * @param {number} sourceChainId - source chain id for Celer contract
 * @param {number} destinationChainId - destination chain id for Celer contract
 * @param {string} userAddress - user's address
 * @param {string} MantaContractOnEthereum - Manta ERC20 contract address on Ethereum
 * @param {number} amount - transfer amount
 * @param {number} maxSlippage - max slippage for Celer contract
 */
export const generateCelerContractData = (
  sourceChainId,
  destinationChainId,
  userAddress,
  MantaContractOnEthereum,
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
    MantaContractOnEthereum.slice(2) +
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
      MantaContractOnEthereum, /// Wrap token address ERC20 token address
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
  // https://cbridge-docs.celer.network/developer/api-reference/contract-pool-based-transfer-refund
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

/**
 * Query transfer status of Celer
 * @param {string} celerEndpoint - Celer RPC
 * @param {string} transferId - transfer id of Celer transaction
 */
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

/**
 * Generate approve transaction data
 * @param {string} spenderAddress - spender address
 */
export const generateApproveData = async (spenderAddress, amount?) => {
  // Approve Celer Contract Address to spend user's token
  // Create the data parameter of the eth_sendTransaction so that the Ethereum node understands the request

  const ABI = ['function approve(address spender, uint256 amount)'];
  const iface = new ethers.utils.Interface(ABI);
  const data = iface.encodeFunctionData('approve', [
    spenderAddress,
    amount ? amount : decimal.toString()
  ]);

  return data;
};

/**
 * Query user address allowance
 * @param {object} provider - metamask provider
 * @param {string} contractAddress - ERC20 token contract address
 * @param {string} userAddress - user's address
 * @param {string} spenderAddress - spender's address
 */
export const queryTokenAllowance = async (
  provider,
  contractAddress,
  userAddress,
  spenderAddress
) => {
  try {
    const ethersProvider = new ethers.providers.Web3Provider(provider);
    // Init Manta Token Smart Contract
    const mantaEthereumContract = new ethers.Contract(
      contractAddress,
      mantaContractABI,
      ethersProvider
    );

    const allowance = await mantaEthereumContract.allowance(
      userAddress,
      spenderAddress
    );
    return allowance.toString();
  } catch (e) {
    console.log(e);
    return 0;
  }
};

/**
 * Query transaction execute status
 * @param {object} provider - metamask provider
 * @param {string} transactionHash - transaction hash
 */
export const queryTransactionReceipt = async (provider, txHash) => {
  try {
    const ethersProvider = new ethers.providers.Web3Provider(provider);
    const receipt = await ethersProvider.getTransactionReceipt(txHash);
    // receipt.status
    // 1 = execute success, 0 = execute failed, undefined = not found
    return receipt?.status;
  } catch (e) {
    console.log(e);
    return null;
  }
};
