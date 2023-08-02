// @ts-nocheck
import axios from 'axios';
import { useEffect } from 'react';
import { useConfig } from 'contexts/configContext';
import classNames from 'classnames';
import { useState } from 'react';
import { useModal } from 'hooks';
import { getFreeGas, checkTxStatus } from 'utils/api/evmBridgeFaucet';
import { transferTokenFromMoonbeamToManta } from 'eth/EthXCM';
import { useTxStatus } from 'contexts/txStatusContext';
import { useMetamask } from 'contexts/metamaskContext';
import TxStatus from 'types/TxStatus';
import { useBridgeData } from '../BridgeContext/BridgeDataContext';
import { useBridgeTx } from '../BridgeContext/BridgeTxContext';
import ChainStatus from './ChainStatus';
import Indicator from './Indicator';
import StepStatus from './StepStatus';
import { queryCelerTransferStatus, generateCelerRefundData } from './Util';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buttonStatus = [
  { index: 0, text: 'Sending', loading: true },
  { index: 1, text: 'Submitting', loading: true },
  { index: 2, text: 'Failed', loading: true },
  { index: 3, text: 'Waiting for SGN confirmation', loading: true },
  { index: 4, text: 'Waiting for fund release', loading: true },
  { index: 5, text: 'Obtain free GLMR', loading: true },
  { index: 6, text: 'To be refunded', loading: true },
  { index: 7, text: 'Requesting refund', loading: true },
  { index: 8, text: 'Confirm Refund', loading: false },
  { index: 9, text: 'Confirming your refund', loading: true },
  { index: 10, text: 'Refunded, try again', loading: false },
  { index: 11, text: 'Submit', loading: false },
  { index: 12, text: 'Transfer', loading: false },
  { index: 13, text: 'Approval', loading: false } // moonbeam -> ethereum, you change this text as you need
];

type EvmBridgeData = {
  transferId?: string;
  latency?: number;
};

const EvmBridgeModal = ({ transferId, latency }: EvmBridgeData) => {
  const { setTxStatus, SetEVMBridgeProcessing } = useTxStatus();
  const { provider, ethAddress } = useMetamask();
  const {
    originChain,
    destinationChain,
    destinationAddress,
    senderAssetTargetBalance
  } = useBridgeData();
  const isEthereumToManta = originChain?.name === 'ethereum';
  const { sendSubstrate } = useBridgeTx();
  const config = useConfig();

  const { ModalWrapper, showModal, hideModal } = useModal({
    closeCallback: () => SetEVMBridgeProcessing(false)
  });
  const [modalText, setModalText] = useState({});
  const [currentButtonStatus, setCurrentButtonStatus] = useState(
    isEthereumToManta ? buttonStatus[0] : buttonStatus[5]
  );
  const [captcha, setCaptcha] = useState('');
  const [errMsgObj, setErrMsgObj] = useState({});
  const [refundData, setRefundData] = useState({});

  useEffect(() => {
    // captcha length is 4
    if (captcha.length !== 4) {
      setCurrentButtonStatus((prev) => ({ ...prev, loading: true }));
    } else if (modalText.steps[1].status !== 3) {
      setCurrentButtonStatus((prev) => ({ ...prev, loading: false }));
    }
  }, [captcha]);

  useEffect(() => {
    SetEVMBridgeProcessing(true);
    let originChainName = originChain.name;
    originChainName =
      originChainName.charAt(0).toUpperCase() + originChainName.slice(1);

    let destinationChainName = destinationChain.name;
    destinationChainName =
      destinationChainName.charAt(0).toUpperCase() +
      destinationChainName.slice(1);

    // status, 0 = default, 1 = success, 2 = failed, 3 = pending
    const initialModalText = {
      title: `Bridge MANTA from ${originChainName} to ${destinationChainName}`,
      subtitle:
        'This need several steps. Please do not close the window during this time.',
      chainList: [
        {
          name: originChainName,
          logo: originChainName.toLocaleLowerCase(),
          status: 3
        },
        { name: 'Moonbeam', logo: 'moonbeam', status: 0 },
        {
          name: destinationChainName,
          logo: destinationChainName.toLocaleLowerCase(),
          status: 0
        }
      ],
      steps: [
        {
          index: isEthereumToManta ? 1 : 2,
          title: `Send MANTA from ${originChainName} to Moonbeam`,
          subtitle: isEthereumToManta
            ? `Please wait. Estimated time of arrival: ${latency} minutes`
            : 'Please send your MANTA from Manta to Moonbeam to via XCM.',
          status: isEthereumToManta ? 3 : 0,
          subtitleWarning: false
        },
        {
          index: isEthereumToManta ? 2 : 1,
          title: 'Obtain free GLMR to cover transfer fee',
          subtitle: 'Obtain GLMR for free to cover your future transfer fees.',
          status: 0,
          subtitleWarning: false,
          withCaptcha: true
        },
        {
          index: 3,
          title: `Send MANTA from Moonbeam to ${destinationChainName}`,
          subtitle:
            isEthereumToManta &&
            `Please send your MANTA from Moonbeam to ${destinationChainName} via XCM.`,
          status: 0,
          subtitleWarning: false
        }
      ]
    };

    setModalText(initialModalText);
    showModal();
    if (isEthereumToManta) {
      updateTransferStatus(transferId);
    } else {
      setCurrentButtonStatus(buttonStatus[5]);
    }
  }, []);

  const updateTransferStatus = async (transferId) => {
    try {
      const data = await queryCelerTransferStatus(
        config.CelerEndpoint,
        transferId
      );
      if (!data) {
        return;
      }
      const status = data.status;
      const currentIndex = 0;
      if (status < 5 || status === 6 || status === 7) {
        // celer transfer pending
        setTimeout(async () => {
          await updateTransferStatus(transferId);
        }, 10000);
      } else if (status === 5) {
        // celer transfer complete
        updateStepStatus(currentIndex, 1);
      } else {
        if (status === 8) {
          const newRefundData = {
            wdmsg: data.wd_onchain,
            sortedSigs: data.sorted_sigs,
            signers: data.signers,
            powers: data.powers
          };
          setRefundData(newRefundData);
        }
        // celer transfer failed
        updateStepStatus(currentIndex, 2);
      }
      setCurrentButtonStatus(buttonStatus[status]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateRefundStatus = async (transferId) => {
    try {
      const data = await queryCelerTransferStatus(
        config.CelerEndpoint,
        transferId
      );
      if (!data) {
        return;
      }
      const status = data.status;
      if (status === 8) {
        // celer refund is still submitting
        setTimeout(async () => {
          await updateRefundStatus(transferId);
        }, 10000);
      } else {
        setCurrentButtonStatus(buttonStatus[status]);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // update step UI layout
  const updateStepStatus = (index, status) => {
    setModalText((preState) => {
      preState.chainList[index].status = status;
      preState.steps[index].status = status;
      return preState;
    });
  };

  const onButtonClick = async () => {
    if (currentButtonStatus.loading) {
      return;
    }
    const index = currentButtonStatus.index;
    if (index === 5) {
      // Obtain free GLMR (Step 2)
      if (!ethAddress || !captcha) return;
      setCurrentButtonStatus((prev) => ({ ...prev, loading: true }));
      updateStepStatus(isEthereumToManta ? 1 : 0, 3);
      try {
        const freeGas = await getFreeGas(ethAddress, captcha);
        const txHash = freeGas?.data?.txHash;
        if (txHash) {
          const checkingStatus = true;
          // you can comment below while statement for fast test
          while (checkingStatus) {
            try {
              const status = await checkTxStatus(txHash);
              const confirmed = status?.data?.confirmed;
              if (confirmed) {
                checkingStatus = false;
              }
            } catch (e) {
              console.log(e.message);
              checkingStatus = false;
            }
            await sleep(3000);
          }
        }

        updateStepStatus(isEthereumToManta ? 1 : 0, 1);
        setCurrentButtonStatus(buttonStatus[12]);
      } catch (e) {
        const errMsg = e.response.data.message;
        setErrMsgObj({ index: isEthereumToManta ? 1 : 0, errMsg });
        if (e.response.status === 400) {
          // TODO, need to check the msg content with backend
          if (errMsg === 'already have fetched free gas') {
            updateStepStatus(isEthereumToManta ? 1 : 0, 1);
            setCurrentButtonStatus(buttonStatus[12]);
            return;
          }
        }
        updateStepStatus(isEthereumToManta ? 1 : 0, 2);
        setCurrentButtonStatus((prev) => ({ ...prev, loading: false }));
      }
    } else if (index === 8) {
      // Confirm Refund
      const data = generateCelerRefundData(refundData);
      setCurrentButtonStatus(buttonStatus[0]);
      await provider
        .request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: ethAddress,
              to: config.CelerEthereumContractAddress,
              data: data
            }
          ]
        })
        .then(() => {
          updateRefundStatus(transferId);
        })
        .catch(() => {
          setCurrentButtonStatus(buttonStatus[8]);
        });
    } else if (index === 10) {
      // Refunded, try again
      hideModal();
    } else if (index === 11) {
      // Submit (Step 3)
      try {
        // switch user's metamask to moonbeam network
        // TODO, refer to metamask context, switch or add
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x507' }]
        });

        setCurrentButtonStatus((prev) => ({ ...prev, loading: true }));
        updateStepStatus(2, 3);
        // send token from moonbeam to manta
        const txHash = await transferTokenFromMoonbeamToManta(
          'MANTA',
          config,
          provider,
          senderAssetTargetBalance,
          destinationAddress
        );
        if (txHash) {
          setTxStatus(TxStatus.finalized(txHash));
          hideModal();
        } else {
          setTxStatus(TxStatus.failed('Transaction declined'));
        }
      } catch (e) {
        console.log('step3 error', e);
        setCurrentButtonStatus((prev) => ({ ...prev, loading: false }));
        updateStepStatus(2, 0);
      }
    } else if (index === 12) {
      // manta to moonbeam
      const handleTxRes = ({ status, dispatchError }) => {
        if (status.isInBlock) {
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = api?.registry.findMetaError(
                dispatchError.asModule
              ) as any;
              const errorMsg = `${decoded.section}.${decoded.name}`;
              setErrMsgObj({
                index: 1,
                errMsg: errorMsg
              });
            } else {
              const errorMsg = dispatchError.toString();
              setErrMsgObj({
                index: 1,
                errMsg: errorMsg
              });
            }
            updateStepStatus(1, 2);
            setCurrentButtonStatus((prev) => ({ ...prev, loading: false }));
          } else {
            // succeed
            updateStepStatus(1, 1);
            setCurrentButtonStatus(buttonStatus[13]);
          }
        }
      };

      setCurrentButtonStatus((prev) => ({ ...prev, loading: true }));
      updateStepStatus(1, 3);
      await sendSubstrate(handleTxRes);
    }
  };

  return (
    <ModalWrapper>
      <div
        className="rounded-xl bg-fourth"
        style={{ width: '638px', padding: '24px 72px', margin: '-24px' }}>
        <div className="unselectable-text text-white text-center text-xl mb-2.5 font-semibold">
          {modalText.title}
        </div>
        <div className="text-sm text-center text-white text-opacity-60">
          {modalText.subtitle}
        </div>
        <Indicator chainList={modalText.chainList} />
        <ChainStatus chainList={modalText.chainList} />
        <StepStatus
          steps={modalText.steps}
          ethAddress={ethAddress}
          setCaptcha={setCaptcha}
          currentButtonIndex={currentButtonStatus.index}
          errMsgObj={errMsgObj}
        />

        <div className="flex items-center justify-center">
          <div
            className={classNames(
              'bg-connect-wallet-button py-2 unselectable-text cursor-pointer',
              'text-center text-white rounded-lg w-6/12',
              {
                'filter brightness-50 cursor-not-allowed':
                  currentButtonStatus.loading
              }
            )}
            onClick={onButtonClick}>
            {currentButtonStatus.text}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default EvmBridgeModal;
