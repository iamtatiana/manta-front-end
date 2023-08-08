// @ts-nocheck
import Navbar from 'components/Navbar';
import PageContent from 'components/PageContent';
import { BridgeDataContextProvider } from './BridgeContext/BridgeDataContext';
import { BridgeTxContextProvider } from './BridgeContext/BridgeTxContext';
import BridgeForm from './BridgeForm';
import EvmBridge from './EvmBridge/index';

const BridgePage = () => {
  return (
    <BridgeDataContextProvider>
      <BridgeTxContextProvider>
        <Navbar />
        <PageContent>
          <BridgeForm />
          <EvmBridge />
        </PageContent>
      </BridgeTxContextProvider>
    </BridgeDataContextProvider>
  );
};

export default BridgePage;
