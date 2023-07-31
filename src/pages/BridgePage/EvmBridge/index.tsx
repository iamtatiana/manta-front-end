// @ts-nocheck
import axios from 'axios';
import { useEffect } from 'react';
import { useConfig } from 'contexts/configContext';
import classNames from 'classnames';
import { useState } from 'react';
import { useModal } from 'hooks';
import { useBridgeData } from '../BridgeContext/BridgeDataContext';
import ChainStatus from './ChainStatus';
import Indicator from './Indicator';
import StepStatus from './StepStatus';

const buttonStatus = [
  { index: 0, text: 'Sending', loading: true },
  { index: 1, text: 'Submitting', loading: true },
  { index: 2, text: 'Failed', loading: true },
  { index: 3, text: 'Waiting for SGN confirmation', loading: true },
  { index: 4, text: 'Waiting for fund release', loading: true },
  { index: 5, text: 'Obtain free GLMR', loading: false },
  { index: 6, text: 'To be refunded', loading: true },
  { index: 7, text: 'Requesting refund', loading: true },
  { index: 8, text: 'Refund to be confirmed', loading: false },
  { index: 9, text: 'Confirming your refund', loading: true },
  { index: 10, text: 'Refunded, try again', loading: false },
  { index: 11, text: 'Submit', loading: false }
];

type EvmBridgeData = {
  transferId: string;
  latency: number;
};

const EvmBridgeModal = ({ transferId, latency }: EvmBridgeData) => {
  const { originChain, destinationChain } = useBridgeData();

  const config = useConfig();
  const { ModalWrapper, showModal, hideModal } = useModal();
  const [modalText, setModalText] = useState({});
  const [currentButtonStatus, setCurrentButtonStatus] = useState(
    buttonStatus[0]
  );

  useEffect(() => {
    console.log('render evm bridge modal');
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
          index: 1,
          title: `Send MANTA from ${originChainName} to Moonbeam`,
          subtitle: `Please wait. Estimated time of arrival: ${latency} minutes`,
          status: 3,
          subtitleWarning: false
        },
        {
          index: 2,
          title: 'Obtain free GLMR to cover transfer fee',
          subtitle: 'Obtain GLMR for free to cover your future transfer fees.',
          status: 0,
          subtitleWarning: false
        },
        {
          index: 3,
          title: `Send MANTA from Moonbeam to ${destinationChainName}`,
          subtitle: `Please send your MANTA from Moonbeam to ${destinationChainName} via XCM.`,
          status: 0,
          subtitleWarning: false
        }
      ]
    };

    setModalText(initialModalText);
    showModal();
    getTransferStatus(transferId);
  }, []);

  const getTransferStatus = async (transferId) => {
    try {
      const data = { transfer_id: transferId };
      const response = await axios.post(
        `${config.CelerEndpoint}/getTransferStatus`,
        data,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      const status = response.data.status;
      const currentIndex = 0;
      if (status < 5) {
        // celer transfer pending
        setTimeout(async () => {
          await getTransferStatus(transferId);
        }, 10000);
      } else if (status === 5) {
        // celer transfer complete
        updateStepStatus(currentIndex, 1);
      } else {
        // celer transfer failed
        updateStepStatus(currentIndex, 2);
      }
      setCurrentButtonStatus(buttonStatus[status]);
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

  const onButtonClick = () => {
    if (currentButtonStatus.loading) {
      return;
    }
    setCurrentButtonStatus(buttonStatus[0]);
    if (buttonStatus.index === 5) {
      // Obtain free GLMR (Step 2)
    } else if (buttonStatus.index === 8) {
      // Refund to be confirmed
    } else if (buttonStatus.index === 10) {
      // Refunded, try again
      hideModal();
    } else if (buttonStatus.index === 11) {
      // Submit (Step 3)
    }
  };

  return (
    <ModalWrapper>
      <div className="px-12" style={{ width: '638px' }}>
        <div className="unselectable-text text-lg text-white text-center text-xl mb-2.5 font-semibold">
          {modalText.title}
        </div>
        <div className="text-sm text-center text-white text-opacity-60">
          {modalText.subtitle}
        </div>
        <Indicator chainList={modalText.chainList} />
        <ChainStatus chainList={modalText.chainList} />
        <StepStatus steps={modalText.steps} />

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
