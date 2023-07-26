// @ts-nocheck
import React, { useEffect, useMemo } from 'react';
import { useTxStatus } from 'contexts/txStatusContext';
import { useConfig } from 'contexts/configContext';
import classNames from 'classnames';
import { useState } from 'react';
import { useModal } from 'hooks';
import ChainStatus from './ChainStatus';
import Indicator from './Indicator';
import StepStatus from './StepStatus';

const failedColor = '#F9413E';
const successColor = '#2EE9A5';

const EvmBridgeModal = ({ showEvmBridge }: { showEvmBridge: boolean }) => {
  const config = useConfig();
  const { txStatus } = useTxStatus();
  const disabled = txStatus?.isProcessing();

  const { ModalWrapper, showModal, hideModal } = useModal();

  const sourceChain = 'Ethereum';
  const destinationChain = 'Manta';
  // status, 0 = default, 1 = success, 2 = failed
  const chainList = useMemo(() => {
    return [
      {
        name: sourceChain,
        logo: sourceChain.toLocaleLowerCase(),
        status: 1
      },
      { name: 'Moonbeam', logo: 'moonbeam', status: 1 },
      {
        name: destinationChain,
        logo: destinationChain.toLocaleLowerCase(),
        status: 2
      }
    ];
  });

  // status, 0 = default, 1 = success, 2 = failed, 3 = pending
  const steps = useMemo(() => {
    return [
      {
        index: 1,
        title: `Send MANTA from ${sourceChain.name} to Moonbeam`,
        subtitle: 'Please wait, this may take a few minutes.',
        status: 1,
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
        status: 3,
        subtitleWarning: false
      }
    ];
  });

  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [buttonText, setButtonText] = useState('Sending');

  useEffect(() => {
    console.log('showEvmBridge: ' + showEvmBridge);
    if (showEvmBridge) {
      showModal();
    }
  });

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
