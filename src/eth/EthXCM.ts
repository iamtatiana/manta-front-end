// @ts-nocheck
import NETWORK from 'constants/NetworkConstants';
import { ethers } from 'ethers';
import Xtokens from 'eth/Xtokens.json';
import Chain from 'types/Chain';
import { hexStripPrefix, hexAddPrefix, u8aToHex } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';

// Same for Moonbeam, Moonriver, Moonbase
const ERC_PRECOMPILE_ADDRESS = '0x0000000000000000000000000000000000000802';
const XTOKENS_PRECOMPILE_ADDRESS = '0x0000000000000000000000000000000000000804';

const XTOKENS_PRECOMPILE_PARACHAIN_SELECTOR = '0x00';
const XTOKENS_PRECOMPILE_ACCOUNT_ID_32_SELECTOR = '0x01';
const XTOKENS_PRECOMPILE_NETWORK_ANY_SUFFIX  = '00';

const DESTINATION_WEIGHT = '4000000000';

const addressToAccountId = (address) => {
  return hexAddPrefix(u8aToHex(decodeAddress(address)));
};

const u32ToHex = (value) => {
  return ('00000000' + value.toString(16).toUpperCase()).slice(-8);
};

const getXtokensPrecompileLocation = (destinationParachainId, accountId) => {
  return [
    1,
    getXtokensPrecompileInterior(destinationParachainId, accountId)
  ];
};

const getXtokensPrecompileInterior = (destinationParachainId, accountId) => {
  return [
    getXtokensPrecompileParachainId(destinationParachainId),
    getXtokensPrecompileAccountId32(accountId)
  ];
};

const getXtokensPrecompileParachainId = (destinationParachainId) => {
  return XTOKENS_PRECOMPILE_PARACHAIN_SELECTOR + u32ToHex(destinationParachainId);
};

const getXtokensPrecompileAccountId32 = (accountId) => {
  return (
    XTOKENS_PRECOMPILE_ACCOUNT_ID_32_SELECTOR
    + hexStripPrefix(accountId)
    + XTOKENS_PRECOMPILE_NETWORK_ANY_SUFFIX
  );
};

export const transferGlmrFromMoonbeamToManta = async (config, provider, balance, address) => {
  const abi = Xtokens.abi;
  const ethersProvider = new ethers.providers.Web3Provider(provider);
  const signer = ethersProvider.getSigner();
  const contract = new ethers.Contract(XTOKENS_PRECOMPILE_ADDRESS, abi, signer);

  const amount = balance.valueAtomicUnits.toString();
  const accountId = addressToAccountId(address);
  let parachainId;
  if (config.NETWORK_NAME === NETWORK.MANTA) {
    parachainId = Chain.Manta(config).parachainId;
  } else if (config.NETWORK_NAME === NETWORK.CALAMARI) {
    parachainId = Chain.Calamari(config).parachainId;
  } else {
    throw new Error('Unsupported network');
  }
  const destination = getXtokensPrecompileLocation(parachainId, accountId);
  const weight = DESTINATION_WEIGHT;

  try {
    const createReceipt = await contract.transfer(ERC_PRECOMPILE_ADDRESS, amount, destination, weight);
    await createReceipt.wait();
    return createReceipt.hash;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const getEstimatedGasLimit = async (config, provider, balance, address) => {
  const abi = Xtokens.abi;
  const ethersProvider = new ethers.providers.Web3Provider(provider);
  const signer = ethersProvider.getSigner();
  const contract = new ethers.Contract(XTOKENS_PRECOMPILE_ADDRESS, abi, signer);

  const amount = balance.valueAtomicUnits.toString();
  const accountId = addressToAccountId(address);
  let parachainId;
  if (config.NETWORK_NAME === NETWORK.MANTA) {
    parachainId = Chain.Manta(config).parachainId;
  } else if (config.NETWORK_NAME === NETWORK.CALAMARI) {
    parachainId = Chain.Calamari(config).parachainId;
  } else {
    throw new Error('Unsupported network');
  }
  const destination = getXtokensPrecompileLocation(parachainId, accountId);
  const weight = DESTINATION_WEIGHT;

  try {
    const gas = await contract.estimateGas.transfer(ERC_PRECOMPILE_ADDRESS, amount, destination, weight);
    return gas.toString();
  } catch (error) {
    console.error('getEstimatedGasLimit', error);
    return 57783; // fallback
  }
};

export type xTokenContractAddressListType = {
  MANTA: string,
  DAI: string,
  USDC: string,
  WBNB: string,
  tBTC: string,
  WETH: string
}
// xToken contract address list
export const xTokenContractAddressList = {
  MANTA: '0xfFFffFFf7D3875460d4509eb8d0362c611B4E841',
  DAI: '0x06e605775296e851FF43b4dAa541Bb0984E9D6fD',
  USDC: '0x931715FEE2d06333043d11F658C8CE934aC61D0c',
  WBNB: '0xE3b841C3f96e647E6dc01b468d6D0AD3562a9eeb',
  tBTC: '0xeCd65E4B89495Ae63b4f11cA872a23680A7c419c',
  WETH: '0xab3f0245B83feB11d15AAffeFD7AD465a59817eD'
};

/**
  * Transfer token from Moonbeam to Manta via XCM
  * @param {string}    xTokenType - token type name
  * @param {object}    config     - config object
  * @param {object}    provider   - metamask provider
  * @param {BigNumber} balance    - account balance
  * @param {string}    address    - account address
  */
export const transferTokenFromMoonbeamToManta = async (
  xTokenType,
  config,
  provider,
  balance,
  address
) => {
  // init moonbeam contract
  const abi = Xtokens.abi;
  const ethersProvider = new ethers.providers.Web3Provider(provider);
  const signer = ethersProvider.getSigner();
  const contract = new ethers.Contract(XTOKENS_PRECOMPILE_ADDRESS, abi, signer);

  // init XCM transaction data
  const amount = balance.valueAtomicUnits.toString();
  const accountId = addressToAccountId(address);
  let parachainId;
  let tokenContractAddress;

  if (config.NETWORK_NAME === NETWORK.MANTA) {
    parachainId = Chain.Manta(config).parachainId;
  } else {
    throw new Error('Unsupported network');
  }

  if(xTokenContractAddressList[xTokenType]){
    tokenContractAddress = xTokenContractAddressList[xTokenType];
  }else{
    throw new Error('Unsupported token');
  }

  const destination = getXtokensPrecompileLocation(parachainId, accountId);
  const weight = DESTINATION_WEIGHT;

  try {
    const createReceipt = await contract.transfer(
      tokenContractAddress,
      amount,
      destination,
      weight
    );
    await createReceipt.wait();
    return createReceipt.hash;
  } catch (error) {
    console.error(error);
    return false;
  }
};

