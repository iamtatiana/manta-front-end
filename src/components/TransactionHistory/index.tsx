// @ts-nocheck
import { useEffect, useState } from 'react';
import OutsideClickHandler from 'react-outside-click-handler';
import classNames from 'classnames';
import { queryCelerPendingHistory } from 'pages/BridgePage/EvmBridge/Util';
import { useMetamask } from 'contexts/metamaskContext';
import { useConfig } from 'contexts/configContext';
import Icon, { IconName } from 'components/Icon';
import { useTxStatus } from 'contexts/txStatusContext';

const decimal = Math.pow(10, 18);

const TransactionHistory = () => {
  const config = useConfig();
  const { ethAddress } = useMetamask();
  const { pendingEvmTxList, setPendingEvmTxList, setCurrentEvmTx } =
    useTxStatus();

  useEffect(() => {
    initPendingList();
  }, [ethAddress, pendingEvmTxList?.length]);

  const initPendingList = async () => {
    if (!ethAddress) {
      return;
    }
    const pendingList = await queryCelerPendingHistory(
      config.CelerEndpoint,
      ethAddress
    );
    if (pendingList.length > 0) {
      setPendingEvmTxList(() => pendingList);
    }
  };

  const [showTransactionList, setShowTransactionList] = useState(false);

  const showTransferModal = (index) => {
    setCurrentEvmTx(() => pendingEvmTxList[index]);
  };

  const redirectToExplorer = (index) => {
    window.open(pendingEvmTxList[index].link, '_blank');
  };

  return (
    pendingEvmTxList && (
      <OutsideClickHandler onOutsideClick={() => setShowTransactionList(false)}>
        <div
          className={classNames(
            'text-third-60 flex flex-row justify-center h-10 gap-3 border border-white-light bg-fifth dark:text-black dark:text-white font-red-hat-text w-28 text-sm cursor-pointer rounded-lg items-center'
          )}
          style={{
            borderColor: 'rgba(0, 175, 165, 0.6)',
            backgroundColor: 'rgba(0, 175, 165, 0.2)'
          }}
          onClick={() => setShowTransactionList(!showTransactionList)}>
          <p style={{ color: 'rgba(0,175,165,1)', fontFamily: 'bold' }}>
            {pendingEvmTxList.length} Pending
          </p>
        </div>
        {showTransactionList && (
          <div className="w-90 flex flex-col mx-22 px-3 py-2 absolute right-0 top-full border border-white-light rounded-lg text-black dark:text-white">
            {pendingEvmTxList.map((item, index) => {
              const isEthereumToManta =
                item.originChainName.toLowerCase() === 'ethereum';
              return (
                <div key={index} className="bg-secondary px-2 my-2 rounded-lg">
                  <div
                    className={classNames('max-h-96 overflow-y-auto py-1', {
                      'cursor-pointer': isEthereumToManta
                    })}
                    onClick={() =>
                      isEthereumToManta && showTransferModal(index)
                    }>
                    <div className="flex flex-row items-center">
                      {parseInt(item.amount) / decimal} MANTA from{' '}
                      {item.originChainName} to {item.destinationChainName}
                      {isEthereumToManta && (
                        <Icon
                          className={'w-4 h-4 ml-2'}
                          name={'whiteDetail' as IconName}
                        />
                      )}
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto py-1">
                    <div className="flex flex-row items-center opacity-60	">
                      Sent time: {item.time}
                    </div>
                  </div>
                  <div
                    className="max-h-96 overflow-y-auto py-1 cursor-pointer"
                    onClick={() => redirectToExplorer(index)}>
                    <div className="flex flex-row items-center opacity-60	">
                      View Transaction
                      <Icon
                        className={'w-3 h-3 ml-2'}
                        name={'whiteDetail' as IconName}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </OutsideClickHandler>
    )
  );
};

export default TransactionHistory;
