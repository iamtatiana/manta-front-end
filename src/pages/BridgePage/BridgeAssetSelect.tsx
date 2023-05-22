// @ts-nocheck
import React from 'react';
import BridgeBalanceInput from 'pages/BridgePage/BridgeBalanceInput';
import AssetTypeSelectButton from 'components/Assets/AssetTypeSelectButton';
import { useBridgeData } from './BridgeContext/BridgeDataContext';

const BridgeAssetSelect = () => {
  const {
    senderAssetType,
    senderAssetTypeOptions,
    setSelectedAssetType,
    senderAssetBalances
  } = useBridgeData();

  return (
    <div className="w-100 relative">
      <AssetTypeSelectButton
        assetType={senderAssetType}
        balances={senderAssetBalances}
        senderAssetTypeOptions={senderAssetTypeOptions}
        setSelectedAssetType={setSelectedAssetType}
      />
      <BridgeBalanceInput />
    </div>
  );
};

export default BridgeAssetSelect;
