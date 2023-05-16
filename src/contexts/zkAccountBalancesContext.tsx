//@ts-nocheck
import BN from 'bn.js';
import { usePrivateWallet } from 'contexts/privateWalletContext';
import { useUsdPrices } from 'contexts/usdPricesContext';
import Decimal from 'decimal.js';
import PropTypes from 'prop-types';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AssetType from 'types/AssetType';
import Balance from 'types/Balance';
import Usd from 'types/Usd';
import { useActive } from 'hooks/useActive';
import { useConfig } from './configContext';
import { useGlobal } from './globalContexts';

const ZkAccountBalancesContext = createContext();

export type ZkAccount = {
  assetType: AssetType;
  usdBalance: Usd | null;
  usdBalanceString: string;
  privateBalance: Balance;
};

export const ZkAccountBalancesContextProvider = (props) => {
  const config = useConfig();
  const { privateWallet, privateAddress, getSpendableBalance, isReady } = usePrivateWallet();
  const { usdPrices } = useUsdPrices();
  const { NETWORK_NAME: network } = useConfig();

  const assets = AssetType.AllCurrencies(config, true);
  const [totalBalanceString, setTotalBalanceString] = useState('$0.00');
  const { usingMantaWallet } = useGlobal();
  const isActive = useActive();

  const [zkAccountsById, setZkAccountsById] = useState({});

  const zkAccounts = useMemo(() => {
    return Object.values(zkAccountsById);
  }, [zkAccountsById]);

  const zkBalancesById = useMemo(() => {
    return Object.values(zkAccountsById).reduce((acc, balance) => {
      return {
        ...acc,
        [balance.assetType.assetId]: balance.privateBalance
      };
    }, {});
  }, [zkAccountsById]);

  const zkBalances = useMemo(() => {
    return Object.values(zkBalancesById);
  }, [zkBalancesById]);

  useEffect(() => {
    const clearAccountsOnSwitchMode = () => {
      setZkAccountsById({});
      setTotalBalanceString('$0.00');
    };
    clearAccountsOnSwitchMode();
  }, [usingMantaWallet]);

  const fetchPrivateBalanceMantaSigner = async (assetType) => {
    let usdBalance = null;
    const privateBalance = await getSpendableBalance(assetType);
    if (privateBalance) {
      const assetUsdValue = usdPrices[assetType.baseTicker] || null;
      if (assetUsdValue) {
        usdBalance = privateBalance.toUsd(assetUsdValue);
      }
      const usdBalanceString = config.IS_TESTNET
        ? '$0.00'
        : usdBalance?.toString() || '';
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

  const fetchPrivateBalancesMantaWallet = async () => {
    const assets = AssetType.AllCurrencies(config, true);
    const assetIds = assets.map(asset => asset.assetId.toString());
    const balancesRaw = await privateWallet.getMultiZkBalance({assetIds: assetIds, network });
    const accounts = {};
    for (let i = 0; i < balancesRaw.length; i++) {
      const balance = new Balance(assets[i], new BN(balancesRaw[i]));
      const zkAccountBalance = {
        assetType: assets[i],
        usdBalance: null,
        usdBalanceString: '',
        privateBalance: balance
      };
      accounts[assets[i].assetId] = zkAccountBalance;
    }
    setZkAccountsById(accounts);
    // Not tracked in Manta Wallet mode
    setTotalBalanceString('$0.00');
  };

  const fetchPrivateBalancesMantaSigner = async () => {
    const totalUsd = new Usd(new Decimal(0));
    const accounts = {};
    for (let i = 0; i < assets.length; i++) {
      const balance = await fetchPrivateBalanceMantaSigner(assets[i]);
      accounts[balance.assetType.assetId] = balance;
      balance?.usdBalance?.value && totalUsd.add(balance.usdBalance);
    }
    setZkAccountsById(accounts);
    setTotalBalanceString(totalUsd.toString());
  };

  const fetchPrivateBalances = async () => {
    if (usingMantaWallet) {
      fetchPrivateBalancesMantaWallet();
    } else {
      fetchPrivateBalancesMantaSigner();
    }
  };

  useEffect(() => {
    // When using manta wallet, balances are only fetched on demand to reduce load on the extension
    if (!usingMantaWallet) {
      const interval = setInterval(() => {
        if (isActive && isReady && privateAddress) {
          fetchPrivateBalances();
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isReady, privateAddress, usingMantaWallet]);

  useEffect(() => {
    const clearBalancesOnDeleteZkAccount = () => {
      if (!privateAddress) {
        setZkAccountsById({});
        setTotalBalanceString('$0.00');
      }
    };
    clearBalancesOnDeleteZkAccount();
  }, [privateAddress]);

  const value = {
    zkBalances,
    zkAccounts,
    zkAccountsById,
    zkBalancesById,
    totalBalanceString,
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
