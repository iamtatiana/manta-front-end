// @ts-nocheck
import NETWORK from 'constants/NetworkConstants';
import React, { createContext, useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import detectEthereumProvider from '@metamask/detect-provider';
import Chain from 'types/Chain';
import {
  getHasAuthToConnectMetamaskStorage,
  setHasAuthToConnectMetamaskStorage
} from 'utils/persistence/connectAuthorizationStorage';
import { useActive } from 'hooks/useActive';
import { useConfig } from './configContext';

const MetamaskContext = createContext();

export const MetamaskContextProvider = (props) => {
  const config = useConfig();
  const [provider, setProvider] = useState(null);
  const [ethAddress, setEthAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [hasAuthConnectMetamask, setHasAuthConnectMetamask] = useState(
    getHasAuthToConnectMetamaskStorage()
  );
  const isActive = useActive();

  const metamaskIsInstalled =
    window.ethereum?.isMetaMask &&
    !window.ethereum?.isBraveWallet &&
    !window.ethereum.isTalisman;

  const configureMoonBeam = async () => {
    if (!metamaskIsInstalled) {
      return;
    }
    try {
      const chain =
        config.NETWORK_NAME === NETWORK.CALAMARI
          ? Chain.Moonriver(config)
          : Chain.Moonbeam(config);
      await provider?.request({ method: 'eth_requestAccounts' });
      if (provider?.chainId !== chain.ethMetadata.chainId) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [chain.ethMetadata]
        });
      }
      setHasAuthConnectMetamask(true);
      setHasAuthToConnectMetamaskStorage(true);
      return true;
    } catch (e) {
      console.error(e);
      setHasAuthConnectMetamask(false);
      setHasAuthToConnectMetamaskStorage(false);
      return false;
    }
  };

  const detectMetamask = async () => {
    if (!provider && metamaskIsInstalled) {
      const metamask = await detectEthereumProvider({
        mustBeMetaMask: true
      });
      if (metamask) {
        setProvider(metamask);
        setChainId(metamask.networkVersion);
        // check metamask locked
        if (metamask?.selectedAddress && hasAuthConnectMetamask) {
          setEthAddress(metamask.selectedAddress);
        }
      }
    } else {
      // check metamask locked
      if (provider?.selectedAddress && hasAuthConnectMetamask) {
        setEthAddress(provider.selectedAddress);
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      if (isActive) detectMetamask();
    }, 500);
    return () => clearInterval(interval);
  });

  useEffect(() => {
    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        detectMetamask();
      } else {
        setEthAddress(null);
      }
    };
    window.ethereum?.on('accountsChanged', handleAccountsChanged);
    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
    };
  });

  useEffect(() => {
    const handleNetworkChanged = (chainId) => {
      setChainId(parseInt(chainId, 16).toString());
    };
    window.ethereum?.on('chainChanged', handleNetworkChanged);
    return () => {
      window.ethereum?.removeListener('chainChanged', handleNetworkChanged);
    };
  });

  const value = {
    provider,
    chainId,
    setProvider,
    ethAddress,
    configureMoonBeam,
    setHasAuthConnectMetamask
  };

  return (
    <MetamaskContext.Provider value={value}>
      {props.children}
    </MetamaskContext.Provider>
  );
};

MetamaskContextProvider.propTypes = {
  children: PropTypes.any
};

export const useMetamask = () => ({
  ...useContext(MetamaskContext)
});
