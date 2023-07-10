import { localStorageKeys } from 'constants/LocalStorageConstants';
import store from 'store';

export const getBridgeOriginChainName = (mantaChainName: string) => {
  const storageKey = `${localStorageKeys.BridgeOriginChainName}-${mantaChainName}`;
  return store.get(storageKey);
};

export const getBridgeDestinationChainName = (mantaChainName: string) => {
  const storageKey = `${localStorageKeys.BridgeDestinationChainName}-${mantaChainName}`;
  return store.get(storageKey);
};

export const setBridgeOriginChainName = (chainName: string, mantaChainName: string) => {
  const storageKey = `${localStorageKeys.BridgeOriginChainName}-${mantaChainName}`;
  store.set(storageKey, chainName);
};

export const setBridgeDestinationChainName = (chainName: string, mantaChainName: string) => {
  const storageKey = `${localStorageKeys.BridgeDestinationChainName}-${mantaChainName}`;
  store.set(storageKey, chainName);
};
