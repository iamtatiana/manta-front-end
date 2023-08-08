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
  const { pendingEvmTxList, setPendingEvmTxList } = useTxStatus();

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
    setPendingEvmTxList(() => pendingList);

    if (pendingList.length > 0) {
      setTimeout(() => {
        initPendingList();
      }, 10 * 1000);
    }
  };

  const [showTransactionList, setShowTransactionList] = useState(false);

  const redirectToExplorer = (index) => {
    window.open(pendingEvmTxList[index].link, '_blank');
  };

  return (
    pendingEvmTxList?.length > 0 && (
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
          <div className="bg-secondary w-85 flex flex-col mt-2 mx-2 px-3 py-2 absolute right-0 top-full rounded-lg text-black dark:text-white">
            {pendingEvmTxList.map((item, index) => {
              return (
                <div key={index} className="px-2 my-2 rounded-lg flex flex-row">
                  <div className="w-5 h-1 flex items-center justify-center space-x-1 mt-4 mr-2">
                    <div className="w-1 h-1 rounded-full animate-pulse dark:bg-indigo-400" />
                    <div className="w-1 h-1 rounded-full animate-pulse dark:bg-indigo-400" />
                    <div className="w-1 h-1 rounded-full animate-pulse dark:bg-indigo-400" />
                  </div>
                  <div className="w-80">
                    <div className={'overflow-y-auto py-1'}>
                      <div className="flex flex-row items-center">
                        {parseInt(item.amount) / decimal} MANTA from{' '}
                        {item.originChainName} to {item.destinationChainName}
                      </div>
                    </div>
                    <div className="overflow-y-auto py-1">
                      <div className="flex flex-row items-center opacity-60	">
                        Sent time: {item.time}
                      </div>
                    </div>
                    <div
                      className="overflow-y-auto py-1 cursor-pointer"
                      onClick={() => redirectToExplorer(index)}>
                      <div className="flex flex-row items-center opacity-60	">
                        View Transaction
                        <Icon
                          className={'w-4 h-4 ml-2'}
                          name={'whiteDetail' as IconName}
                        />
                      </div>
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
