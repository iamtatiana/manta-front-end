// @ts-nocheck
import axios from 'axios';
import { useEffect, useMemo } from 'react';
import { useConfig } from 'contexts/configContext';
import classNames from 'classnames';
import { useState } from 'react';
import { useModal } from 'hooks';
import { useBridgeData } from '../BridgeContext/BridgeDataContext';
import ChainStatus from './ChainStatus';
import Indicator from './Indicator';
import StepStatus from './StepStatus';

const celerTransferStatus = [
  'Unknown',
  'Submitting',
  'Failed',
  'Waiting for SGN confirmation',
  'Waiting for fund release',
  'Completed',
  'To be refunded',
  'Requesting refund',
  'Refund to be confirmed',
  'Confirming your refund',
  'Refunded',
  'Delayed'
];

type EvmBridgeData = {
  transferId: string;
};

const EvmBridgeModal = ({ transferId }: EvmBridgeData) => {
  const { originChain, destinationChain } = useBridgeData();

  const config = useConfig();
  const { loading, setLoading } = useState(true);
  const { ModalWrapper, showModal, hideModal } = useModal();
  const [chainList, setChainList] = useState(Array);
  const [steps, setSteps] = useState(Array);

  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [buttonText, setButtonText] = useState('Sending');

  useEffect(() => {
    console.log('render evm bridge modal');
    let originChainName = originChain.name;
    originChainName =
      originChainName.charAt(0).toUpperCase() + originChainName.slice(1);

    let destinationChainName = destinationChain.name;
    destinationChainName =
      destinationChainName.charAt(0).toUpperCase() +
      destinationChainName.slice(1);

    const chainList = [
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
    ];

    const steps = [
      {
        index: 1,
        title: `Send MANTA from ${originChain.name} to Moonbeam`,
        subtitle: 'Please wait, this may take a few minutes.',
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
        title: `Send MANTA from Moonbeam to ${destinationChain.name}`,
        subtitle: `Please send your MANTA from Moonbeam to ${destinationChain.name} via XCM.`,
        status: 0,
        subtitleWarning: false
      }
    ];
    // status, 0 = default, 1 = success, 2 = failed, 3 = pending
    setChainList(chainList);
    setSteps(steps);
    showModal();
    getTransferStatus(transferId);
  }, []);

  const getTransferStatus = async (transferId) => {
    try {
      const data = { transfer_id: transferId };
      const response = await axios.post(
        `${config.CelerEndpoint}/v2/getTransferStatus`,
        data,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      const status = response.data.status;
      if (status < 5) {
        setTimeout(async () => {
          await getTransferStatus(transferId);
        }, 30000);
      } else if (status === 5) {
        // celer transfer complete
        updateChainList(0, 1);
        updateSteps(0, 1, celerTransferStatus[status]);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateChainList = (index, status) => {
    setChainList((preState) => {
      preState[index].status = status;
      return preState;
    });
  };

  const updateSteps = (index, status, subtitle?) => {
    setSteps((preState) => {
      preState[index].status = status;
      preState[index].subtitle = subtitle;
      return preState;
    });
  };

  return (
    <ModalWrapper>
      <div className="px-12" style={{ width: '638px' }}>
        <div className="unselectable-text text-lg text-white text-center text-xl mb-2.5 font-semibold">
          Bridge MANTA from Ethereum to Manta
        </div>
        <div className="text-sm text-center text-white text-opacity-60">
          This need several steps. Please do not close the window during this
          time.
        </div>
        <Indicator chainList={chainList} />
        <ChainStatus chainList={chainList} />
        <StepStatus steps={steps} />
        <Button text={buttonText} disabled={buttonDisabled} />
      </div>
    </ModalWrapper>
  );
};

// Bottom button
const Button = ({ text, disabled }: { text: string; disabled: boolean }) => {
  return (
    <div className="flex items-center justify-center">
      <div
        className={classNames(
          'bg-connect-wallet-button py-2 unselectable-text text-center text-white',
          'rounded-lg w-6/12 filter brightness-50'
        )}>
        {text}
      </div>
    </div>
  );
};

export default EvmBridgeModal;
