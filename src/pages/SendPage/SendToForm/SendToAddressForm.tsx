// @ts-nocheck
import React from 'react';
import { useSend } from '../SendContext';
import SendToAddressInput from './SendToAddressInput';
import ReceiverBalanceDisplay from './ReceiverBalanceDisplay';
import SendErrorDisplay from './SendErrorDisplay';

const SendToAddressForm = () => {
  const { isPrivateTransfer, isPublicTransfer } = useSend();
  const shouldShowAddressInput = isPrivateTransfer() || isPublicTransfer();

  return (
    <>
      {
        shouldShowAddressInput ? <SendToAddressInput /> : <ReceiverBalanceDisplay />
      }
      <SendErrorDisplay />
    </>
  );
};

export default SendToAddressForm;
