// @ts-nocheck
import store from 'store';

const LAST_ACCOUNT_STORAGE_KEY = 'lastAccessedAccountAddress';

export const getLastAccessedAccount = (accounts, walletType) => {
  const STORAGE_KEY = `${LAST_ACCOUNT_STORAGE_KEY}`;
  const lastStore = store.get(STORAGE_KEY) || {};
  const lastAccountAddress = lastStore[walletType];
  if (!lastAccountAddress) {
    return null;
  }
  return accounts.find(account => account.address === lastAccountAddress);
};

export const setLastAccessedAccount = lastAccount => {
  const STORAGE_KEY = `${LAST_ACCOUNT_STORAGE_KEY}`;
  const { source: key, address } = lastAccount;
  const lastStore = store.get(STORAGE_KEY);
  store.set(STORAGE_KEY, { ...lastStore, [key]: address });
};
