//@ts-nocheck
import React, { useEffect, useState, createContext, useContext } from 'react';
import BN from 'bn.js';
import Decimal from 'decimal.js';
import { useUsdPrices } from 'contexts/usdPricesContext';
import { useSend } from 'pages/SendPage/SendContext';
import { useTxStatus } from 'contexts/txStatusContext';
import { usePrivateWallet } from 'contexts/privateWalletContext';
import AssetType from 'types/AssetType';
import Balance from 'types/Balance';
import Usd from 'types/Usd';
import PropTypes from 'prop-types';
import { useConfig } from './configContext';

const ZkAccountBalancesContext = createContext();

export type ZkAccountBalance = {
  assetType: AssetType;
  usdBalance: Usd;
  usdBalanceString: string;
  privateBalance: Balance;
};

export const ZkAccountBalancesContextProvider = (props) => {
  const config = useConfig();
  const { txStatus } = useTxStatus();
  const { privateAddress, getSpendableBalance, isReady, balancesAreStale } =
    usePrivateWallet();
  const {
    senderAssetCurrentBalance,
    senderAssetType,
    receiverAssetType,
    receiverCurrentBalance
  } = useSend();
  const { usdPrices } = useUsdPrices();

  const assets = AssetType.AllCurrencies(config, true);
  const [totalBalanceString, setTotalBalanceString] = useState('$0.00');
  const [balances, setBalances] = useState([]);

  const fetchPrivateBalance = async (assetType) => {
    let usdBalance = null;
    const privateBalance = await getSpendableBalance(assetType);
    if (privateBalance) {
      const assetUsdValue = usdPrices[assetType.baseTicker] || null;
      if (assetUsdValue) {
        usdBalance = privateBalance.toUsd(assetUsdValue);
      }
      const usdBalanceString = config.IS_TESTNET ? '$0.00' : usdBalance?.toString() || '';
      return {
        assetType,
        usdBalance,
        usdBalanceString,
        privateBalance
      };
    }
    return {
      assetType,
      usdBalance,
      usdBalanceString: '',
      privateBalance
    };
  };

  const fetchPrivateBalances = async () => {
    const totalUsd = new Usd(new Decimal(0));
    const updatedBalances = [];
    for (let i = 0; i < assets.length; i++) {
      const balance = await fetchPrivateBalance(assets[i]);
      updatedBalances.push(balance);
      balance?.usdBalance?.value && totalUsd.add(balance.usdBalance);
    }
    const nonzeroBalances = [
      ...updatedBalances.filter(
        (balance) =>
          balance.privateBalance &&
          balance.privateBalance.gt(new Balance(balance.assetType, new BN(0)))
      )
    ];
    setBalances(nonzeroBalances);
    setTotalBalanceString(totalUsd.toString());
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isReady && privateAddress) {
        fetchPrivateBalances();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const clearBalancesOnDeleteZkAccount = () => {
      if (!privateAddress) {
        setBalances([]);
        setTotalBalanceString('$0.00');
      }
    };
    clearBalancesOnDeleteZkAccount();
  }, [privateAddress]);

  const value = {
    balances,
    totalBalanceString
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
