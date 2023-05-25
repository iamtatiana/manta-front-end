// @ts-nocheck
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useBridgeData } from 'pages/BridgePage/BridgeContext/BridgeDataContext';
import handleChangeBalanceInput from 'utils/validation/handleChangeBalanceInput';
import BalanceInput from '../../components/Balance/BalanceInput';

const BridgeBalanceInput = () => {
  const {
    isApiDisconnected,
    senderAssetCurrentBalance,
    senderAssetTargetBalance,
    setSenderAssetTargetBalance,
    senderAssetType,
    maxInput,
    originAddress
  } = useBridgeData();
  const shouldShowLoader = originAddress && !senderAssetCurrentBalance && !isApiDisconnected;
  const balanceText = isApiDisconnected
    ? 'Connecting to network'
    : senderAssetCurrentBalance?.toString();

  const [inputValue, setInputValue] = useState('');

  const onChangeSendAmountInput = (newInputValue) => {
    handleChangeBalanceInput({
      newInputString: newInputValue,
      prevInputString: inputValue,
      setInputString: setInputValue,
      setBalance: setSenderAssetTargetBalance,
      assetType: senderAssetType
    });
  };

  useEffect(() => {
    const truncateDecimalsOnChangeAssetType = () => {
      senderAssetTargetBalance && onChangeSendAmountInput(senderAssetTargetBalance.toStringUnrounded());
    };
    truncateDecimalsOnChangeAssetType();
  }, [senderAssetType]);

  const onClickMax = () => {
    if (maxInput) {
      onChangeSendAmountInput(maxInput.toString());
    }
  };

  return (
    <BalanceInput
      onChangeAmountInput={onChangeSendAmountInput}
      inputValue={inputValue}
      onClickMax={onClickMax}
      balanceText={balanceText}
      shouldShowLoader={shouldShowLoader}
      isBridgePage={true}
    />
  );
};

BridgeBalanceInput.propTypes = {
  balanceText: PropTypes.string,
  onChange: PropTypes.func,
  value: PropTypes.any,
  onClickMax: PropTypes.func,
  isDisabled: PropTypes.bool
};


export default BridgeBalanceInput;
