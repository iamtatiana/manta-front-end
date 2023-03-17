import React from 'react';
import PageContent from 'components/PageContent';
import Navbar from 'components/Navbar';
import IPBlockingModal from 'components/Modal/IPBlockingModal';
import { useConfig } from 'contexts/configContext';
import { dolphinConfig } from 'config';
import DowntimeModal from 'components/Modal/downtimeModal';
import { SendContextProvider } from './SendContext';
import { PrivateTxHistoryContextProvider } from './privateTxHistoryContext';
import SendForm from './SendForm';

const SendPage = () => {
  const { NETWORK_NAME } = useConfig();
  const isDolphinPage = NETWORK_NAME === dolphinConfig.NETWORK_NAME;
  return (
    <SendContextProvider>
      <PrivateTxHistoryContextProvider>
        <Navbar showZkBtn={true} />
        <PageContent>
          <SendForm />
        </PageContent>
        <IPBlockingModal />
        {isDolphinPage && <DowntimeModal />}
      </PrivateTxHistoryContextProvider>
    </SendContextProvider>
  );
};

export default SendPage;
