// @ts-nocheck
import React from 'react';
import { useTxStatus } from 'contexts/txStatusContext';
import {
  validatePrivateAddress,
  validatePublicAddress
} from 'utils/validation/validateAddress';
import classNames from 'classnames';
import { useSend } from '../SendContext';

const SendToAddressInput = () => {
  const { setReceiver, receiverAssetType, receiverAddress } = useSend();
  const { txStatus } = useTxStatus();
  const disabled = txStatus?.isProcessing();

  const onChangePrivateInput = (event) => {
    if (event.target.value === '') {
      setReceiver(null);
      return;
    }
    const addressIsValid = validatePrivateAddress(event.target.value);
    if (addressIsValid) {
      setReceiver(event.target.value);
    } else {
      setReceiver(false);
    }
  };

  const onChangePublicInput = (event) => {
    if (event.target.value === '') {
      setReceiver(null);
      return;
    }
    const addressIsValid = validatePublicAddress(event.target.value);
    if (addressIsValid) {
      setReceiver(event.target.value);
    } else {
      setReceiver(false);
    }
  };

  const onChangeInput = receiverAssetType?.isPrivate
    ? onChangePrivateInput
    : onChangePublicInput;
  const placeholderMsg = receiverAssetType?.isPrivate
    ? 'Enter recipient zkAddress'
    : 'Enter recipient substrate address';
  return (
    <>
      <div
        className={classNames(
          { error: receiverAddress === false },
          'h-12 rounded-lg px-0.5 py-2 flex-grow manta-bg-gray',
          { disabled: disabled }
        )}>
        <input
          id="recipientAddress"
          className={classNames(
            'w-full h-full rounded-lg manta-bg-gray px-5 text-black dark:text-white outline-none text-sm box-border',
            { disabled: disabled }
          )}
          autoComplete="off"
          onChange={(e) => onChangeInput(e)}
          disabled={disabled}
          placeholder={placeholderMsg}
        />
      </div>
    </>
  );
};

export default SendToAddressInput;
