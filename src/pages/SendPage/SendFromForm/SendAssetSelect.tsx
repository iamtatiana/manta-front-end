// @ts-nocheck
import React from 'react';
import SendBalanceInput from 'pages/SendPage/SendBalanceInput';
import AssetTypeSelectButton from 'components/Assets/AssetTypeSelectButton';
import { useZkAccountBalances } from 'contexts/zkAccountBalancesContext';
import { usePublicBalances } from 'contexts/publicBalancesContext';
import { useSend } from '../SendContext';

const SendAssetSelect = () => {
  const {
    senderAssetType,
    senderAssetTypeOptions,
    setSelectedAssetType
  } = useSend();
  const { publicBalancesById }  = usePublicBalances();
  const { zkBalancesById } = useZkAccountBalances();
  const balances = senderAssetType?.isPrivate ? zkBalancesById : publicBalancesById;

  return (
    <div className="w-100 relative">
      <AssetTypeSelectButton
        assetType={senderAssetType}
        setSelectedAssetType={setSelectedAssetType}
        balances={balances}
        senderAssetTypeOptions={senderAssetTypeOptions}
      />
      <SendBalanceInput />
    </div>
  );
};

export default SendAssetSelect;
