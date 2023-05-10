import React, { useState, useEffect } from 'react';
import IPBlockingModal from 'components/Modal/IPBlockingModal';
import Navbar from 'components/Navbar';
import PageContent from 'components/PageContent';
import axios from 'axios';
import { SendContextProvider } from './SendContext';
import SendForm from './SendForm';
import { PrivateTxHistoryContextProvider } from './privateTxHistoryContext';

const blockedCountries = ['US', 'CN', 'IR', 'CU', 'KP', 'SY', 'MM'];
const blockedRegions = ['Crimea', "Luhans'k", "Donets'k"];
const IPDATA_APIKEY =
  'f47f1429b7dfb0d01a6d049b7cd283087b1b75fc3891f249d9c0919b';

const SendPage = () => {
  const [shouldBlockIP, setShouldBlockIP] = useState(false);
  const [checkingIP, setCheckingIP] = useState(true);

  useEffect(() => {
    async function getUserGeolocation() {
      const res = await axios.get(
        `https://api.ipdata.co?api-key=${IPDATA_APIKEY}`
      );
      if (res.status === 200) {
        const country_code = res?.data?.country_code;
        const region = res?.data?.region;
        if (
          blockedCountries.includes(country_code) ||
          blockedRegions.includes(region)
        ) {
          setShouldBlockIP(true);
        }
      }
    }
    setShouldBlockIP(true);
    getUserGeolocation()
      .catch(console.error)
      .finally(() => setCheckingIP(false));
  }, []);

  if (checkingIP) {
    return null;
  }

  if (shouldBlockIP) {
    return <IPBlockingModal />;
  }

  return (
    <SendContextProvider>
      <PrivateTxHistoryContextProvider>
        <Navbar />
        <PageContent>
          <SendForm />
        </PageContent>
      </PrivateTxHistoryContextProvider>
    </SendContextProvider>
  );
};

export default SendPage;
