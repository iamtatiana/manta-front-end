// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useTxStatus } from 'contexts/txStatusContext';
import classNames from 'classnames';
import Icon from 'components/Icon';
import { useModal } from 'hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { usePrivateWallet } from 'contexts/privateWalletContext';
import { useZkAccountBalances } from 'contexts/zkAccountBalancesContext';

const AssetTypeOption = ({index, hideModal, setSelectedAssetType, balance, assetType}) => {
  const onClick = () => {
    setSelectedAssetType(assetType);
    hideModal();
  };
  return (
    <div onClick={onClick}>
      {index !== 0 ? <hr className="h-px mx-6 bg-gray-200 border-0 dark:bg-gray-700" /> : null}
      <div className="w-full cursor-pointer my-1 hover:bg-dropdown-hover">
        <div
          id={assetType.ticker}
          className="flex justify-between items-center inline w-full">
          <div className="flex inline">
            <Icon className="ml-5 w-8 rounded-full" name={assetType.icon} />
            <div className="p-2 pl-3">
              <div className="text-sm block text-white">
                <p className="text-white text-lg unselectable-text">{assetType.ticker}</p>
              </div>
              <div className="text-xs block text-white unselectable-text text-opacity-60">
                {assetType.name}
              </div>
            </div>
          </div>
          <div className="text-white text-md font-red-hat-mono pr-7">{balance?.toString()}</div>
        </div>
      </div>
    </div>
  );
};

const AssetSelectModal = ({ setSelectedAssetType, senderAssetTypeOptions, hideModal, balances }) => {
  const [filterText, setFilterText] = useState('');
  const { privateWallet } = usePrivateWallet();
  const { fetchPrivateBalances } = useZkAccountBalances();

  const filteredAssetTypes = senderAssetTypeOptions.filter((assetType) => {
    return (
      assetType.ticker.toLowerCase().includes(filterText.toLowerCase())
    || assetType.name.toLowerCase().includes(filterText.toLowerCase())
    );
  });

  const filteredBlances = filteredAssetTypes.map((option) => {
    return balances.find((balance) => balance?.assetType.assetId === option.assetId) || null;
  });

  const options = filteredAssetTypes.map((assetType, i) => {
    return {
      assetType,
      balance: filteredBlances[i]
    };
  });

  useEffect(() => {
    fetchPrivateBalances();
  }, [privateWallet]);

  return (
    <div className="w-96 bg-fourth -mx-6 -my-6 rounded-lg pt-4 pb-2">
      <div className="text-white unselectable-text text-lg pl-8 pt-1">Select a Token</div>
      <div className="w-58 p-2 pl-2 mt-3 mx-8 rounded-md border border-white border-opacity-20 flex items-center text-secondary bg-secondary">
        <span>
          <FontAwesomeIcon icon={faSearch} />
          <input
            className="pl-2 bg-transparent font-red-hat-text text-sm text-thirdry outline-none"
            placeholder="Search Name"
            onChange={(e) => setFilterText(e.target.value)}
            value={filterText}
          />
        </span>
      </div>
      <div className="mt-1 ml-2 overflow-y-auto h-64">
        {options.map((option, i) => {
          return <AssetTypeOption
            key={option.assetType.assetId}
            hideModal={hideModal}
            setSelectedAssetType={setSelectedAssetType}
            index={i}
            assetType={option.assetType}
            balance={option.balance}
          />;
        })}
      </div>
    </div>
  );
};

const AssetTypeSelectButton = ({
  assetType,
  balances,
  setSelectedAssetType,
  senderAssetTypeOptions
}) => {
  const { txStatus } = useTxStatus();
  const disabled = txStatus?.isProcessing();
  const { ModalWrapper, showModal, hideModal } = useModal();
  const onClick = () => {
    if (disabled) {
      return;
    }
    showModal();
  };

  return (
    <div>
      <div
        onClick={onClick}
        className={classNames(
          'absolute right-6 top-2 border-0 cursor-pointer',
          'flex flex-y items-center cursor-pointer gap-3 mt-2',
          {disabled: disabled}
        )}
      >
        <div>
          <Icon
            className="w-6 h-6 rounded-full"
            name={assetType?.icon}
          />
        </div>
        <div className="text-black dark:text-white place-self-center">
          {assetType?.ticker}
        </div>
        <Icon
          className="w-3 h-3"
          name={'assetSelector'}
        />
      </div>
      <ModalWrapper>
        <AssetSelectModal
          showModal={showModal}
          hideModal={hideModal}
          balances={balances}
          setSelectedAssetType={setSelectedAssetType}
          senderAssetTypeOptions={senderAssetTypeOptions}
        />
      </ModalWrapper>
    </div>
  );
};

export default AssetTypeSelectButton;
