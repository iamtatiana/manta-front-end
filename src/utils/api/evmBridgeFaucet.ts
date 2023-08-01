import axios from 'axios';

const baseUrl = 'http://8.218.132.38:3000';
export const getCaptcha = (evmAddress: string) => {
  return axios.post(
    `${baseUrl}/v1/captcha/generate`, {
      address: evmAddress
    }
  );
};

export const getFreeGas = (evmAddress: string, captcha: string) => {
  return axios.post(
    `${baseUrl}/v1/claim_with_captcha_verify`, {
      address: evmAddress,
      captcha
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