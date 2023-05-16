// @ts-nocheck
import React, {
  createContext,
  useState,
  useEffect,
  useContext
} from 'react';
import PropTypes from 'prop-types';
import { BN } from 'bn.js';
import Balance from 'types/Balance';
import AssetType from 'types/AssetType';
import { usePublicAccount } from './publicAccountContext';
import { useSubstrate } from './substrateContext';
import { useConfig } from './configContext';
import { useTxStatus } from './txStatusContext';

interface IPublicBalances {
  [key: number]: Balance;
}

const PublicBalancesContext = createContext();

export const PublicBalancesContextProvider = (props) => {
  const { api } = useSubstrate();
  const config = useConfig();
  const { externalAccount } = usePublicAccount();
  const { txStatusRef } = useTxStatus();

  const waitForTxFinished = async () => {
    while (txStatusRef.current?.isProcessing()) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  const [publicBalancesById, setPublicBalancesById] = useState<
    IPublicBalances | undefined
  >();

  const subscribeBalanceChange = async (
    address: string,
    assetType: AssetType
  ) => {
    if (!api || !address) {
      return null;
    }

    if (assetType.isNativeToken) {
      const unsub = await api.query.system.account(address, async (balance) => {
        await waitForTxFinished();
        setPublicBalancesById((prev) => {
          return {
            ...prev,
            [assetType.assetId]: new Balance(
              assetType,
              new BN(balance.data.free.toString())
            )
          };
        });
      });
      return unsub;
    }
    const unsub = await api.query.assets.account(
      assetType.assetId,
      address,
      async ({ value }) => {
        const balanceString = value.isEmpty ? '0' : value.balance.toString();
        await waitForTxFinished();
        setPublicBalancesById((prev) => {
          return {
            ...prev,
            [assetType.assetId]: new Balance(assetType, new BN(balanceString))
          };
        });
      }
    );
    return unsub;
  };

  const subscribeAddressBalanceChanges = async (address: string) => {
    if (!api || !address) {
      return null;
    }

    const assetTypes = AssetType.AllCurrencies(config, false);
    await Promise.all(
      assetTypes.map(async (assetType) => {
        await subscribeBalanceChange(address, assetType);
      })
    );
  };

  const getPublicBalance = (assetType: AssetType) => {
    return publicBalancesById[assetType.assetId];
  };

  useEffect(() => {
    let unsub;
    const subcribeBalanceChanges = async () => {
      if (api && externalAccount) {
        unsub = await subscribeAddressBalanceChanges(externalAccount?.address);
      }
    };
    subcribeBalanceChanges();
    return unsub && unsub();
  }, [api, externalAccount]);

  const value = {
    publicBalancesById,
    getPublicBalance
  };

  return (
    <PublicBalancesContext.Provider value={value}>
      {props.children}
    </PublicBalancesContext.Provider>
  );
};

PublicBalancesContextProvider.propTypes = {
  children: PropTypes.any
};

export const usePublicBalances = () => ({
  ...useContext(PublicBalancesContext)
});
