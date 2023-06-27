// @ts-nocheck
import React from 'react';
import PublicPrivateToggle from 'pages/SendPage/PublicPrivateToggle';
import { useModal } from 'hooks';
import SendButton from '../SendButton';
import { useSend } from '../SendContext';
import ZkTransactGuideModal from '../ZkTransactGuideModal/ZkTransactGuideModal';
import SendToAddressForm from './SendToAddressForm';

const SendToForm = () => {
  const { toggleReceiverIsPrivate, receiverAssetType } = useSend();
  const { ModalWrapper, showModal } = useModal();

  return (
    <div>
      <div className="mb-6 items-stretch">
        <div className="flex flex-row justify-between mb-4 items-center">
          <div className="text-black dark:text-white">To</div>
          <PublicPrivateToggle
            onToggle={toggleReceiverIsPrivate}
            isPrivate={receiverAssetType?.isPrivate}
            prefix="receiver"
          />
        </div>
        <SendToAddressForm />
      </div>
      <SendButton showModal={showModal} />
      <ModalWrapper>
        <ZkTransactGuideModal />
      </ModalWrapper>
    </div>
  );
};

export default SendToForm;
