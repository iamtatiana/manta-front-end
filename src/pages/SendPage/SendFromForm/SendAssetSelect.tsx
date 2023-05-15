// @ts-nocheck
import React from 'react';
import SendBalanceInput from 'pages/SendPage/SendBalanceInput';
import AssetTypeSelectButton from 'components/Assets/AssetTypeSelectButton';
import { useSend } from '../SendContext';

const SendAssetSelect = () => {
  const {
    senderAssetType,
    senderAssetTypeOptions,
    setSelectedAssetType
  } = useSend();

  return (
    <div className="w-100 relative">
      <AssetTypeSelectButton
        assetType={senderAssetType}
        assetTypeOptions={senderAssetTypeOptions}
        setSelectedAssetType={setSelectedAssetType}
      />
      <SendBalanceInput />
    </div>
  );
};

export default SendAssetSelect;
