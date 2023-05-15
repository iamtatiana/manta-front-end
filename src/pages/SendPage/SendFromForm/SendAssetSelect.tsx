// @ts-nocheck
import React from 'react';
import SendBalanceInput from 'pages/SendPage/SendBalanceInput';
import AssetTypeSelectButton from 'components/Assets/AssetTypeSelectButton';
import { useZkAccountBalances } from 'contexts/zkAccountBalancesContext';
import { useSend } from '../SendContext';

const SendAssetSelect = () => {
  const {
    senderAssetType,
    senderAssetTypeOptions,
    setSelectedAssetType
  } = useSend();
  const zkAccountBalances = (useZkAccountBalances()).balances.map((balance) => balance.privateBalance);
  const publicBalances = zkAccountBalances; // todo fix
  const balances = senderAssetType?.isPrivate ? zkAccountBalances : publicBalances;

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
