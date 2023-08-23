// @ts-nocheck
import PropTypes from 'prop-types';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react';
import { WalletContextProvider } from './walletContext';

const GlobalContext = createContext();

const GlobalContextProvider = ({ children }) => {
  const [mantaWalletInitialSync, _setMantaWalletInitialSync] = useState(true);

  const setMantaWalletInitialSync = useCallback((state) => {
    _setMantaWalletInitialSync(state);
  }, []);

  const contextValue = useMemo(
    () => ({
      mantaWalletInitialSync,
      setMantaWalletInitialSync
    }),
    [mantaWalletInitialSync, setMantaWalletInitialSync]
  );

  return (
    <GlobalContext.Provider value={contextValue}>
      <WalletContextProvider>{children}</WalletContextProvider>
    </GlobalContext.Provider>
  );
};

GlobalContextProvider.propTypes = {
  children: PropTypes.any
};

export const useGlobal = () => ({
  ...useContext(GlobalContext)
});

export default GlobalContextProvider;
