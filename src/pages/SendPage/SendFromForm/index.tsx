// @ts-nocheck
import React from 'react';
import PublicPrivateToggle from 'pages/SendPage/PublicPrivateToggle';
import { useSend } from '../SendContext';
import SendAssetSelect from './SendAssetSelect';

const SendFromForm = () => {
  const {
    toggleSenderIsPrivate,
    senderAssetType,
  } = useSend();

  return (
    <div className="manta-bg-gray rounded-md mb-0.5">
      <div className="items-stretch">
        <div className="flex flex-row px-4 pt-4 justify-between items-center">
          <div className="text-black dark:text-white">From</div>
          <PublicPrivateToggle
            onToggle={toggleSenderIsPrivate}
            isPrivate={senderAssetType.isPrivate}
            prefix="sender"
          />
        </div>
      </div>
      <SendAssetSelect />
    </div>
  );
};

export default SendFromForm;
