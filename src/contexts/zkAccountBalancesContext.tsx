//@ts-nocheck
import BN from 'bn.js';
import { useMantaWallet } from 'contexts/mantaWalletContext';
import PropTypes from 'prop-types';
import { createContext, useContext, useEffect, useState } from 'react';
import AssetType from 'types/AssetType';
import Balance from 'types/Balance';
import Usd from 'types/Usd';
import { useConfig } from './configContext';

const ZkAccountBalancesContext = createContext();

export type ZkAccountBalance = {
  assetType: AssetType;
  usdBalance: Usd | null;
  usdBalanceString: string;
  privateBalance: Balance;
};

export const ZkAccountBalancesContextProvider = (props) => {
  const config = useConfig();
  const { privateWallet, privateAddress } = useMantaWallet();
  const { NETWORK_NAME: network } = useConfig();

  const [balances, setBalances] = useState([]);

  const fetchPrivateBalancesMantaWallet = async () => {
    const assets = AssetType.AllCurrencies(config, true);
    const assetIds = assets.map((asset) => asset.assetId.toString());
    const balancesRaw = await privateWallet.getMultiZkBalance({
      assetIds: assetIds,
      network
    });
    const balances = [];
    for (let i = 0; i < balancesRaw.length; i++) {
      const balance = new Balance(assets[i], new BN(balancesRaw[i]));
      const zkAccountBalance = {
        assetType: assets[i],
        usdBalance: null,
        usdBalanceString: '',
        privateBalance: balance
      };
      balances.push(zkAccountBalance);
    }
    setBalances(balances);
  };

  const fetchPrivateBalances = async () => {
    fetchPrivateBalancesMantaWallet();
  };

  useEffect(() => {
    const clearBalancesOnDeleteZkAccount = () => {
      if (!privateAddress) {
        setBalances([]);
      }
    };
    clearBalancesOnDeleteZkAccount();
  }, [privateAddress]);

  const value = {
    balances,
    fetchPrivateBalances
  };

  return (
    <ZkAccountBalancesContext.Provider value={value}>
      {props.children}
    </ZkAccountBalancesContext.Provider>
  );
};

ZkAccountBalancesContextProvider.propTypes = {
  children: PropTypes.any
};

export const useZkAccountBalances = () => ({
  ...useContext(ZkAccountBalancesContext)
});
