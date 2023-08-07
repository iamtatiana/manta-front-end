// @ts-nocheck
import { useEffect, useState } from 'react';
import OutsideClickHandler from 'react-outside-click-handler';
import classNames from 'classnames';
import { queryCelerPendingHistory } from 'pages/BridgePage/EvmBridge/Util';
import { useMetamask } from 'contexts/metamaskContext';
import { useConfig } from 'contexts/configContext';
import Icon, { IconName } from 'components/Icon';

const TransactionHistory = () => {
  const config = useConfig();
  const { ethAddress } = useMetamask();

  useEffect(() => {
    initPendingList();
  }, [ethAddress]);

  const initPendingList = async () => {
    if (!ethAddress) {
      return;
    }

    ////////////////////////////////////
    // debug purpose
    // setTransactionList([
    //   {
    //     amount: 100,
    //     link: 'https://moonbase-blockscout.testnet.moonbeam.network/tx/0xb7ebe59d3e1e962bda5ea6afd8be42dcd9dfc8edfa581883ad4f1c9a6cddb5be',
    //     time: new Date(1691401302862).toLocaleString('en-US', {
    //       hour12: false
    //     })
    //   }
    // ]);
    ////////////////////////////////////
    const pendingList = await queryCelerPendingHistory(
      config.CelerEndpoint,
      ethAddress
    );
    setTransactionList(() => pendingList);
  };

  const [showTransactionList, setShowTransactionList] = useState(false);
  const [transactionList, setTransactionList] = useState(Array<object>);

  const showTransferModal = (index) => {
    console.log('show evm bridge');
  };

  const redirectToExplorer = (index) => {
    window.open(transactionList[index].link, '_blank');
  };

  return (
    transactionList.length > 0 && (
      <div>
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
            {transactionList.length} Pending
          </p>
        </div>
        {showTransactionList && (
          <div className="w-90 flex flex-col mx-22 px-3 py-2 absolute right-0 top-full border border-white-light rounded-lg text-black dark:text-white">
            {transactionList.map((item, index) => {
              return (
                <div
                  key={index}
                  className="bg-secondary px-2 my-2 rounded-lg cursor-pointer"
                  onClick={() => showTransferModal(index)}>
                  <div className="max-h-96 overflow-y-auto py-1">
                    <div className="flex flex-row items-center">
                      {item.amount} MANTA from Ethereum to Manta
                      <Icon
                        className={'w-4 h-4 ml-2'}
                        name={'whiteDetail' as IconName}
                      />
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
      </div>
    )
  );
};

export default TransactionHistory;
