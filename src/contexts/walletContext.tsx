import APP_NAME from 'constants/AppConstants';
import WALLET_NAME from 'constants/WalletConstants';
import { Wallet } from 'manta-extension-connect';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { getSubstrateWallets } from 'utils';
import {
  getAuthedWalletListStorage,
  setAuthedWalletListStorage
} from 'utils/persistence/connectAuthorizationStorage';
import {
  getLastAccessedAccount,
  setLastAccessedAccount
} from 'utils/persistence/externalAccountStorage';
import {
  getLastAccessedWallet,
  setLastAccessedWallet
} from 'utils/persistence/walletStorage';
import { WalletAccount } from 'manta-extension-connect';
import { encodeAddress } from '@polkadot/util-crypto';

type subscribedWalletsType = {
  name: string;
  accounts: WalletAccount[];
};

type WalletContextValue = {
  selectedWallet: Wallet | null;
  authedWalletList: string[];
  walletConnectingErrorMessages: { [key: string]: string };
  selectedAccount: WalletAccount | null;
  accountList: WalletAccount[];
  connectWallet: (_: string, __?: boolean) => Promise<boolean | undefined>;
  resetWalletConnectingErrorMessages: () => void;
};
const WalletContext = createContext<WalletContextValue | null>(null);

const getInitialWalletConnectingErrorMessages = () => {
  const errorMessages: { [key: string]: string } = {};
  Object.values(WALLET_NAME).forEach(
    (walletName: string) => (errorMessages[walletName] = '')
  );
  return errorMessages;
};

export const WalletContextProvider = ({
  children
}: {
  children: ReactNode;
}) => {
  const authedWalletInitialized = useRef(false);
  const subscribedWalletList = useRef<subscribedWalletsType[]>([]);
  const [rerenderAccountList, setRerenderAccountList] = useState(false);
  const [accountList, setAccountList] = useState<WalletAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<WalletAccount | null>(
    null
  );

  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [authedWalletList, setAuthedWalletList] = useState<string[]>([]);

  const [walletConnectingErrorMessages, setWalletConnectingErrorMessages] =
    useState(getInitialWalletConnectingErrorMessages());

  const resetWalletConnectingErrorMessages = useCallback(() => {
    setWalletConnectingErrorMessages(getInitialWalletConnectingErrorMessages());
  }, []);

  const addWalletName = (walletName: string, walletNameList: string[]) => {
    const copyWalletNameList = [...walletNameList];
    if (!copyWalletNameList.includes(walletName)) {
      copyWalletNameList.push(walletName);
      return copyWalletNameList;
    }
    return copyWalletNameList;
  };

  const connectWallet = useCallback(
    async (extensionName: string, saveToStorage = true) => {
      if (walletConnectingErrorMessages[extensionName]) {
        setWalletConnectingErrorMessages({
          ...walletConnectingErrorMessages,
          ...{ [extensionName]: '' }
        });
      }
      const substrateWallets = getSubstrateWallets();
      const connectingWallet = substrateWallets.find(
        (wallet: any) => wallet.extensionName === extensionName
      );

      if (!connectingWallet) {
        setWalletConnectingErrorMessages({
          ...walletConnectingErrorMessages,
          ...{ [extensionName]: `${extensionName} not found` }
        });
        return false;
      }
      if (
        !connectingWallet.extension ||
        (extensionName === WALLET_NAME.TALISMAN &&
          !authedWalletList.includes(extensionName))
      ) {
        try {
          await connectingWallet?.enable(APP_NAME);
          setSelectedWallet(connectingWallet);
          saveToStorage && setLastAccessedWallet(connectingWallet);

          if (authedWalletInitialized.current) {
            const newAuthedWalletList = addWalletName(
              extensionName,
              authedWalletList
            );
            setAuthedWalletListStorage(newAuthedWalletList);
            setAuthedWalletList(newAuthedWalletList);
          }

          return true;
        } catch (e: any) {
          setWalletConnectingErrorMessages({
            ...walletConnectingErrorMessages,
            ...{ [extensionName]: e.message }
          });
          return false;
        }
      }
      return true;
    },
    [walletConnectingErrorMessages, authedWalletList]
  );

  useEffect(() => {
    async function sub() {
      for (const extensionName of authedWalletList) {
        const alreadySubscribed = subscribedWalletList.current.find(
          (w) => w.name === extensionName
        );
        if (!alreadySubscribed) {
          const substrateWallets = getSubstrateWallets();
          const _selectedWallet = substrateWallets.find(
            (wallet) => wallet.extensionName === extensionName
          );
          if (!_selectedWallet) return;
          const unsub: any = await _selectedWallet.subscribeAccounts(
            (accounts) => {
              // console.log(extensionName, 'sub');
              if (!accounts) return;
              let _accounts = accounts.filter((account: any) =>
                ['ecdsa', 'ed25519', 'sr25519'].includes(account.type)
              );
              _accounts = _accounts.map((a) => {
                a.address = encodeAddress(
                  a.address,
                  window.location.pathname.includes('manta') ? 77 : 78
                );
                return a;
              });

              if (_accounts.length === 0) {
                // disconnect wallet
                const prevAuthedWalletList = getAuthedWalletListStorage();
                const _authedWalletList = [...prevAuthedWalletList];
                const index = _authedWalletList.indexOf(
                  _selectedWallet.extensionName
                );
                if (index > -1) {
                  _authedWalletList.splice(index, 1);

                  if (_authedWalletList.length > 0) {
                    const wallets = getSubstrateWallets();
                    const defaultWallet = wallets.find(
                      (wallet) => wallet.extensionName === _authedWalletList[0]
                    );
                    if (defaultWallet) {
                      setSelectedWallet(defaultWallet);
                      setAuthedWalletList(_authedWalletList);
                      setAuthedWalletListStorage(_authedWalletList);
                      return;
                    }
                  }
                  setSelectedWallet(null);
                  setSelectedAccount(null);
                  setAuthedWalletList([]);
                  setAuthedWalletListStorage([]);
                }
                unsub();
              } else {
                const index = subscribedWalletList.current.findIndex(
                  (w) => w.name === extensionName
                );
                if (index !== -1) {
                  subscribedWalletList.current.splice(index, 1);
                  subscribedWalletList.current.push({
                    name: extensionName,
                    accounts: _accounts
                  });
                } else {
                  subscribedWalletList.current.push({
                    name: extensionName,
                    accounts: _accounts
                  });
                }

                // trigger rerender account list
                setRerenderAccountList((prev) => !prev);
              }
            }
          );
        }
      }
    }
    sub().catch(console.error);
  }, [authedWalletList]);

  // ensure selectedAccount is the first item of accountList
  const orderAccountList = (
    selectedAccount: WalletAccount,
    newAccounts: WalletAccount[]
  ) => {
    const orderedNewAccounts = [];
    orderedNewAccounts.push(selectedAccount);
    newAccounts.forEach((account) => {
      if (account.address !== selectedAccount.address) {
        orderedNewAccounts.push(account);
      }
    });
    return orderedNewAccounts;
  };

  const updateAccountList = useCallback(
    async (account: WalletAccount, newAccounts: WalletAccount[]) => {
      setSelectedAccount(account);
      setLastAccessedAccount(account);
      setAccountList(orderAccountList(account, newAccounts));
    },
    []
  );

  const changeSelectedAccount = useCallback(
    async (account: WalletAccount) => {
      updateAccountList(account, accountList);
    },
    [updateAccountList, accountList]
  );

  useEffect(() => {
    if (!selectedWallet?.extensionName) return;
    const walletName = selectedWallet.extensionName;
    const selectedWalletAccounts = subscribedWalletList.current.find(
      (w) => w.name === walletName
    );
    if (selectedWalletAccounts) {
      const _accountList = selectedWalletAccounts.accounts.filter(
        (account: any) => ['ecdsa', 'ed25519', 'sr25519'].includes(account.type)
      );
      if (_accountList.length === 0) {
        console.log(`${walletName} has no polkadot accounts`);
        return;
      }

      const activeAccount =
        getLastAccessedAccount(_accountList, walletName) || _accountList[0];

      updateAccountList(activeAccount, _accountList);
    }
  }, [selectedWallet, rerenderAccountList]);

  const batchConnectWallet = useCallback(
    async (extensionNames: string[]) => {
      let walletNames: string[] = [];
      const lastAccessExtensionName = getLastAccessedWallet()?.extensionName;

      for (const extensionName of extensionNames.filter(
        (name) => name !== lastAccessExtensionName
      )) {
        const isConnectedSuccess = await connectWallet(extensionName, true);
        if (isConnectedSuccess) {
          walletNames = addWalletName(extensionName, walletNames);
        }
      }
      if (lastAccessExtensionName) {
        const isConnectedSuccess = await connectWallet(
          lastAccessExtensionName,
          true
        );
        if (isConnectedSuccess) {
          walletNames = addWalletName(lastAccessExtensionName, walletNames);
        }
      }
      setAuthedWalletListStorage(walletNames);
      setAuthedWalletList(walletNames);
    },
    [authedWalletList, connectWallet]
  );

  useEffect(() => {
    async function connectWallets() {
      const prevAuthedWalletList = getAuthedWalletListStorage();
      if (prevAuthedWalletList.length !== 0) {
        await batchConnectWallet(prevAuthedWalletList);
      }
      authedWalletInitialized.current = true;
    }
    connectWallets().catch(console.error);
  }, []);

  const value = useMemo(
    () => ({
      selectedWallet,
      authedWalletList,
      walletConnectingErrorMessages,
      selectedAccount,
      accountList,
      connectWallet,
      resetWalletConnectingErrorMessages,
      setSelectedWallet,
      changeSelectedAccount
    }),
    [
      selectedWallet,
      authedWalletList,
      walletConnectingErrorMessages,
      selectedAccount,
      accountList,
      connectWallet,
      resetWalletConnectingErrorMessages,
      changeSelectedAccount
    ]
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export const useWallet = () => {
  const data = useContext(WalletContext);
  if (!data || !Object.keys(data)?.length) {
    throw new Error(
      'useWallet can only be used inside of <KeyringContext />, please declare it at a higher level.'
    );
  }
  return data;
};
