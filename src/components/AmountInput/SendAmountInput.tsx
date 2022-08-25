// @ts-nocheck
import React, { useState } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { useTxStatus } from 'contexts/txStatusContext';
import GradientText from 'components/GradientText';
import Balance from 'types/Balance';
import Decimal from 'decimal.js';
import BN from 'bn.js';
import BalanceComponent from 'components/Balance';

const SendAmountInput = ({
  balanceText,
  senderAssetCurrentBalance,
  setSenderAssetTargetBalance,
  senderAssetType,
  maxSendableBalance,
}) => {
  const { txStatus } = useTxStatus();
  const disabled = txStatus?.isProcessing();
  const [inputValue, setInputValue] = useState('');

  const onChangeSendAmountInput = (value) => {
    if (value === '') {
      setSenderAssetTargetBalance(null);
      setInputValue('');
    } else {
      try {
        const targetBalance = Balance.fromBaseUnits(
          senderAssetType,
          new Decimal(value)
        );
        setInputValue(value);
        if (targetBalance.valueAtomicUnits.gt(new BN(0))) {
          setSenderAssetTargetBalance(targetBalance);
        } else {
          setSenderAssetTargetBalance(null);
        }
      } catch (error) {}
    }
  };

  const onClickMax = () => {
    if (maxSendableBalance) {
      onChangeSendAmountInput(maxSendableBalance.toString());
    }
  };

  return (
    <div
      className={classNames(
        'flex flex-col w-full rounded-2xl manta-bg-gray content-around justify-center h-24',
        { disabled: disabled }
      )}
    >
      <div className="flex justify-items-center">
        <input
          id="amountInput"
          onChange={(e) => onChangeSendAmountInput(e.target.value)}
          className={classNames(
            'w-full pl-3 pt-1 text-4xl font-bold text-black dark:text-white manta-bg-gray outline-none rounded-2xl',
            { disabled: disabled }
          )}
          value={inputValue}
          disabled={disabled}
        />
        <MaxButton
          id="maxAmount"
          isDisabled={disabled}
          onClickMax={onClickMax}
        />
      </div>
      <BalanceComponent
        balance={balanceText}
        className="w-full text-xs manta-gray mt-2.5 pl-3"
        loaderClassName="text-manta-gray border-manta-gray bg-manta-gray"
        loader={!senderAssetCurrentBalance}
      />
    </div>
  );
};

SendAmountInput.propTypes = {
  balanceText: PropTypes.string,
  onChange: PropTypes.func,
  value: PropTypes.any,
  onClickMax: PropTypes.func,
  isDisabled: PropTypes.bool
};

const MaxButton = ({ onClickMax, isDisabled }) => {
  const onClick = () => {
    !isDisabled && onClickMax();
  };
  return (
    <span
      onClick={onClick}
      className={classNames(
        'cursor-pointer',
        'text-center rounded-2xl unselectable-text absolute right-6 bottom-1 flex items-center text-xss font-semibold manta-gray',
        { disabled: isDisabled }
      )}
    >
      Send&nbsp; <GradientText text="Max Amount" />
    </span>
  );
};

MaxButton.propTypes = {
  onClickMax: PropTypes.func,
  disabled: PropTypes.bool
};

export default SendAmountInput;
