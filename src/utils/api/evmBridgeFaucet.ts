import axios from 'axios';

const baseUrl = 'https://faucet-test.oral-craft.com';

export const getRandomStr = (manta_address: string) => {
  return axios.post(
    `${baseUrl}/v1/get_random_string_to_sign`, {
      manta_address
    }
  );
};

export const getCaptcha = (evm_address: string) => {
  return axios.post(
    `${baseUrl}/v1/captcha/generate`, {
      evm_address
    }
  );
};

export const getFreeGasEth2Manta = (evm_address: string, captcha: string) => {
  return axios.post(
    `${baseUrl}/v1/claim_with_captcha_verify/eth_2_manta`, {
      evm_address,
      captcha
    }
  );
};

export const getFreeGasManta2Eth = (evm_address: string, captcha: string, manta_address: string, sign: string) => {
  return axios.post(
    `${baseUrl}/v1/claim_with_captcha_verify/manta_2_eth`, {
      evm_address,
      captcha,
      manta_address,
      sign
    }
  );
};

export const checkTxStatus = (txHash: string) => {
  return axios.post(
    `${baseUrl}/v1/check_transaction_status`, {
      txHash
    }
  );
};