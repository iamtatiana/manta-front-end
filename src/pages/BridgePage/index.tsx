// @ts-nocheck
import { useState } from 'react';
import Navbar from 'components/Navbar';
import PageContent from 'components/PageContent';
import { BridgeDataContextProvider } from './BridgeContext/BridgeDataContext';
import { BridgeTxContextProvider } from './BridgeContext/BridgeTxContext';
import BridgeForm from './BridgeForm';
import EvmBridge from './EvmBridge';

const BridgePage = () => {
  const [showEvmBridge, setShowEvmBridge] = useState(false);

  return (
    <BridgeDataContextProvider>
      <BridgeTxContextProvider>
        <Navbar />
        <PageContent>
          <BridgeForm />
          <EvmBridge showEvmBridge={showEvmBridge} />
        </PageContent>
      </BridgeTxContextProvider>
    </BridgeDataContextProvider>
  );
};

export default BridgePage;
