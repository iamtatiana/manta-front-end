// @ts-nocheck
import { useEffect } from 'react';
import { useConfig } from 'contexts/configContext';
import classNames from 'classnames';
import { useState } from 'react';
import { useModal } from 'hooks';
import {
  getFreeGasEth2Manta,
  getFreeGasManta2Eth,
  checkTxStatus
} from 'utils/api/evmBridgeFaucet';
import { transferTokenFromMoonbeamToManta } from 'eth/EthXCM';
import { useTxStatus } from 'contexts/txStatusContext';
import { useMetamask } from 'contexts/metamaskContext';
import { useKeyring } from 'contexts/keyringContext';
import { usePublicAccount } from 'contexts/publicAccountContext';
// import { stringToHex } from '@polkadot/util';
import Balance from 'types/Balance';
import BN from 'bn.js';
import Chain from 'types/Chain';
import { useBridgeData } from '../BridgeContext/BridgeDataContext';
import { useBridgeTx } from '../BridgeContext/BridgeTxContext';
import ChainStatus from './ChainStatus';
import Indicator from './Indicator';
import StepStatus from './StepStatus';
import {
  queryCelerTransferStatus,
  generateCelerRefundData,
  generateCelerContractData,
  queryTokenAllowance,
  generateApproveData
} from './Util';

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
  { index: 10, text: 'Transfer refund completed', loading: false },
  { index: 11, text: 'Transfer', loading: false }, // moonbeam to manta
  { index: 12, text: 'Transfer', loading: false }, // manta to moonbeam
  { index: 13, text: 'Approve MANTA', loading: false },
  { index: 14, text: 'Transfer', loading: false }, // moonbeam to ethereum
  {
    index: 15,
    text: 'Completed! Your token is now available on ',
    loading: false
  },
  { index: 16, text: 'Processing', loading: true }
];

type EvmBridgeData = {
  transferId?: string;
  latency?: number;
  maxSlippage?: number;
  estimatedReceiveAmt?: number;
  setShowEvmBridgeModal: React.Dispatch<React.SetStateAction<boolean>>;
};

const EvmBridgeModal = ({
  transferId,
  latency,
  maxSlippage,
  estimatedReceiveAmt,
  setShowEvmBridgeModal
}: EvmBridgeData) => {
  const { SetEVMBridgeProcessing } = useTxStatus();
  const { provider, ethAddress, chainId } = useMetamask();
  const {
    senderAssetType,
    destGasFee,
    originChain,
    destinationChain,
    destinationAddress,
    senderAssetTargetBalance
  } = useBridgeData();
  const amount = new Balance(senderAssetType, new BN(estimatedReceiveAmt));
  const isEthereumToManta = originChain?.name === 'ethereum';
  const { sendSubstrate } = useBridgeTx();
  const config = useConfig();

  const { ModalWrapper, showModal } = useModal({
    closeDisabled: true,
    closeCallback: () => SetEVMBridgeProcessing(false)
  });
  const [modalText, setModalText] = useState({});
  const [currentButtonStatus, setCurrentButtonStatus] = useState(
    isEthereumToManta ? buttonStatus[0] : buttonStatus[5]
  );
  const [captcha, setCaptcha] = useState('');
  const [errMsgObj, setErrMsgObj] = useState({});
  const { selectedWallet } = useKeyring();
  const { externalAccount } = usePublicAccount();
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
          index: 1,
          title: `Send MANTA from ${originChainName} to Moonbeam`,
          subtitle: isEthereumToManta
            ? `Please wait. Estimated time of arrival: ${latency} minutes`
            : 'Please send your MANTA from Manta to Moonbeam via XCM.',
          status: isEthereumToManta ? 3 : 0,
          success: 'MANTA has been successfully sent to Moonbeam.'
        },
        {
          index: 2,
          title: 'Obtain free GLMR to cover transfer fee',
          subtitle: 'Obtain GLMR for free to cover your future transfer fees.',
          status: 0,
          withCaptcha: true,
          success: 'Free GLMR has been successfully sent to your account.'
        },
        {
          index: 3,
          title: `Send MANTA from Moonbeam to ${destinationChainName}`,
          subtitle: isEthereumToManta
            ? `Please send your MANTA from Moonbeam to ${destinationChainName} via XCM.`
            : `Please wait. Estimated time of arrival: ${latency} minutes`,
          status: 0,
          success: `'MANTA has been successfully sent to ${destinationChainName}.`
        }
      ]
    };

    setModalText(initialModalText);
    showModal();
    if (isEthereumToManta) {
      // query transfer status
      updateTransferStatus(transferId);
    } else {
      // manta to moonbeam
      startMantaToMoonbeam();
    }
  }, []);

  const startMantaToMoonbeam = async () => {
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
              index: 0,
              errMsg: errorMsg
            });
          } else {
            const errorMsg = dispatchError.toString();
            setErrMsgObj({
              index: 0,
              errMsg: errorMsg
            });
          }
          updateStepStatus(0, 2);
          setCurrentButtonStatus(buttonStatus[12]);
        } else {
          // succeed
          updateStepStatus(0, 1);
          setCurrentButtonStatus(buttonStatus[5]);
        }
      }
    };

    if (errMsgObj.index === 0) {
      setErrMsgObj({
        index: 0,
        errMsg: ''
      });
    }
    setCurrentButtonStatus(buttonStatus[16]);
    updateStepStatus(0, 3);
    try {
      await sendSubstrate(handleTxRes);
    } catch (e) {
      setErrMsgObj({
        index: 0,
        errMsg: e.message
      });
      updateStepStatus(0, 2);
      setCurrentButtonStatus(buttonStatus[12]);
    }
  };

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
      const currentIndex = isEthereumToManta ? 0 : 2;
      if (status < 5 || status === 6 || status === 7) {
        // celer transfer pending
        setTimeout(async () => {
          await updateTransferStatus(transferId);
        }, 10000);
        setCurrentButtonStatus(buttonStatus[status]);
      } else if (status === 5) {
        // celer transfer complete
        updateStepStatus(currentIndex, 1);
        if (isEthereumToManta) {
          setCurrentButtonStatus(buttonStatus[status]);
        } else {
          // moonbeam to ethereum complete
          showCompletedButton();
        }
      } else {
        if (status === 8) {
          const newRefundData = {
            transferId: transferId,
            wdmsg: data.wd_onchain,
            sortedSigs: data.sorted_sigs,
            signers: data.signers,
            powers: data.powers
          };
          setRefundData(newRefundData);
        }
        // celer transfer failed
        updateStepStatus(currentIndex, 2);
        setCurrentButtonStatus(buttonStatus[status]);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const showCompletedButton = () => {
    updateStepStatus(2, 1);
    const finalButtonStatus = buttonStatus[15];
    finalButtonStatus.text =
      finalButtonStatus.text + (isEthereumToManta ? 'Manta' : 'Ethereum');
    setCurrentButtonStatus(finalButtonStatus);
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
        }, 10 * 1000);
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
      setCurrentButtonStatus(buttonStatus[16]);
      updateStepStatus(1, 3);
      try {
        let freeGas;
        if (isEthereumToManta) {
          freeGas = await getFreeGasEth2Manta(ethAddress, captcha);
        } else {
          // no need sign anymore because no need to valid polkadot assets for now
          // const randomStr = await getRandomStr(externalAccount.address);
          // const signedMsg = randomStr.data.randomStr;
          // const { signature } = await selectedWallet._signer.signRaw({
          //   address: externalAccount.address,
          //   data: stringToHex(signedMsg),
          //   type: 'bytes'
          // });
          // if (signature) {
          //   freeGas = await getFreeGasManta2Eth(
          //     ethAddress,
          //     captcha,
          //     externalAccount.address,
          //     signature
          //   );
          // }
          freeGas = await getFreeGasManta2Eth(ethAddress, captcha);
        }
        const txHash = freeGas?.data?.txHash;
        if (txHash) {
          let checkingStatus = true;
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

          updateStepStatus(1, 1);
          if (isEthereumToManta) {
            setCurrentButtonStatus(buttonStatus[11]);
          } else {
            approveFromMoonbeamToEthereum();
          }
        }
      } catch (e) {
        let errMsg = e.response?.data?.message || e.message;
        if (e.response?.data?.reason === 'ADDRESS_EXCEED_LIMIT') {
          errMsg =
            'One request per address every 5 minutes. Please wait and try again later.';
        } else if (e.response?.data?.reason === 'SYSTEM_EMERGENCY_STOP') {
          errMsg =
            'Faucet is temporarily unavailable. Please find GLMR from other sources.';
        }
        setErrMsgObj({ index: 1, errMsg });
        if (e.response?.status === 400) {
          const errReason = e.response.data.reason;
          const reasons = [
            // 'ADDRESS_EXCEED_LIMIT',
            'SYSTEM_EXCEED_LIMIT',
            'SYSTEM_EMERGENCY_STOP'
          ];
          if (reasons.includes(errReason)) {
            updateStepStatus(1, 2);
            if (isEthereumToManta) {
              setCurrentButtonStatus(buttonStatus[11]);
            } else {
              approveFromMoonbeamToEthereum();
            }
            return;
          }
        }
        updateStepStatus(1, 2);
        setCurrentButtonStatus({ ...buttonStatus[5], loading: false });
      }
    } else if (index === 8) {
      if (errMsgObj.index === 0) {
        setErrMsgObj({
          index: 0,
          errMsg: ''
        });
      }
      let to = '';
      if (isEthereumToManta) {
        to = config.CelerContractOnEthereum;
        // swith to ethereum
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: Chain.Ethereum(config).ethMetadata.chainId }]
          });
        } catch (e) {
          setErrMsgObj({
            index: 0,
            errMsg: e.message
          });
          setCurrentButtonStatus(buttonStatus[8]);
          updateStepStatus(0, 2);
          return;
        }
      } else {
        to = config.CelerContractOnMoonbeam;
        // swith to moonbeam
        // switch user's metamask to moonbeam network
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: Chain.Moonbeam(config).ethMetadata.chainId }]
          });
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
            try {
              await provider.request({
                method: 'wallet_addEthereumChain',
                params: [Chain.Moonbeam(config).ethMetadata]
              });
            } catch (addError) {
              // handle "add" error
              setErrMsgObj({
                index: 0,
                errMsg: addError.message
              });
              setCurrentButtonStatus(buttonStatus[8]);
              updateStepStatus(0, 2);
              return;
            }
          }
          // handle other "switch" errors
          setErrMsgObj({
            index: 0,
            errMsg: switchError.message
          });
          setCurrentButtonStatus(buttonStatus[8]);
          updateStepStatus(0, 2);
          return;
        }
      }
      // Confirm Refund
      const data = await generateCelerRefundData(refundData);
      setCurrentButtonStatus(buttonStatus[0]);
      await provider
        .request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: ethAddress,
              to: to,
              data: data
            }
          ]
        })
        .then(() => {
          updateRefundStatus(refundData.transferId);
        })
        .catch(() => {
          setErrMsgObj({
            index: 0,
            errMsg: switchError.message
          });
          updateStepStatus(0, 2);
          setCurrentButtonStatus(buttonStatus[8]);
        });
    } else if (index === 10) {
      // Refunded, try again
      setShowEvmBridgeModal(false);
    } else if (index === 11) {
      // moonbeam to manta
      setCurrentButtonStatus(buttonStatus[16]);
      updateStepStatus(2, 3);
      if (errMsgObj.index === 2) {
        setErrMsgObj({
          index: 2,
          errMsg: ''
        });
      }
      // switch user's metamask to moonbeam network
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: Chain.Moonbeam(config).ethMetadata.chainId }]
        });
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [Chain.Moonbeam(config).ethMetadata]
            });
          } catch (addError) {
            // handle "add" error
            setErrMsgObj({
              index: 2,
              errMsg: addError.message
            });
            setCurrentButtonStatus(buttonStatus[11]);
            updateStepStatus(2, 2);
            return;
          }
        }
        // handle other "switch" errors
        setErrMsgObj({
          index: 2,
          errMsg: switchError.message
        });
        setCurrentButtonStatus(buttonStatus[11]);
        updateStepStatus(2, 2);
        return;
      }
      // send token from moonbeam to manta
      const txHash = await transferTokenFromMoonbeamToManta(
        'MANTA',
        config,
        provider,
        amount,
        destinationAddress
      );
      if (txHash) {
        showCompletedButton();
      } else {
        setErrMsgObj({
          index: 2,
          errMsg: 'Transaction declined.'
        });
        setCurrentButtonStatus(buttonStatus[11]);
        updateStepStatus(2, 2);
      }
    } else if (index === 12) {
      await startMantaToMoonbeam();
    } else if (index === 13) {
      // approve moonbeam to ethereum
      if (Number(chainId) !== Number(Chain.Moonbeam(config).ethChainId)) {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: Chain.Moonbeam(config).ethMetadata.chainId }]
        });
      }
      if (errMsgObj.index === 2) {
        setErrMsgObj({
          index: 2,
          errMsg: ''
        });
      }

      // Approve Celer Contract Address to spend user's token
      const data = await generateApproveData(
        config.CelerContractOnMoonbeam,
        senderAssetTargetBalance.sub(destGasFee).valueAtomicUnits.toString()
      );

      updateStepStatus(2, 3);
      setCurrentButtonStatus(buttonStatus[16]);
      try {
        await provider.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: ethAddress,
              to: config.MantaContractOnMoonbeam,
              data: data
            }
          ]
        });
        const amount = senderAssetTargetBalance
          .sub(destGasFee)
          .valueAtomicUnits.toString();
        queryAllowance(ethAddress, amount);
      } catch (e) {
        setErrMsgObj({
          index: 2,
          errMsg: 'Send transaction failed, please try again'
        });
        updateStepStatus(2, 2);
        setCurrentButtonStatus(buttonStatus[13]);
      }
    } else if (index === 14) {
      updateStepStatus(2, 3);
      // transfer moonbeam to ethereum
      if (Number(chainId) !== Number(Chain.Moonbeam(config).ethChainId)) {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: Chain.Moonbeam(config).ethMetadata.chainId }]
        });
      }

      if (errMsgObj.index === 2) {
        setErrMsgObj({
          index: 2,
          errMsg: ''
        });
      }
      const amount = senderAssetTargetBalance
        .sub(destGasFee)
        .valueAtomicUnits.toString();
      const sourceChainId = config.CelerMoonbeamChainId;
      const destinationChainId = config.CelerEthereumChainId;

      // Generate data of Celer Contract
      const { data, transferId } = await generateCelerContractData(
        sourceChainId,
        destinationChainId,
        ethAddress,
        config.MantaContractOnMoonbeam,
        amount,
        maxSlippage
      );
      updateStepStatus(2, 3);
      setCurrentButtonStatus(buttonStatus[16]);
      try {
        await provider.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: ethAddress,
              to: config.CelerContractOnMoonbeam,
              data: data
            }
          ]
        });
        updateTransferStatus(transferId);
      } catch (e) {
        setErrMsgObj({
          index: 2,
          errMsg: 'Send transaction failed, please try again'
        });
        updateStepStatus(2, 2);
        setCurrentButtonStatus(buttonStatus[14]);
      }
    } else {
      setShowEvmBridgeModal(false);
    }
  };

  const approveFromMoonbeamToEthereum = async () => {
    const allowance = await queryTokenAllowance(
      provider,
      config.MantaContractOnMoonbeam,
      ethAddress,
      config.CelerContractOnMoonbeam
    );

    if (allowance >= amount) {
      setCurrentButtonStatus(buttonStatus[14]);
    } else {
      setCurrentButtonStatus(buttonStatus[13]);
    }
  };

  // Query user address allowance
  const queryAllowance = async (ethAddress, amount, retryTimes = 12) => {
    try {
      if (retryTimes === 0) {
        // show approve button
        setCurrentButtonStatus(buttonStatus[13]);
        return;
      }
      const allowance = await queryTokenAllowance(
        provider,
        config.MantaContractOnMoonbeam,
        ethAddress,
        config.CelerContractOnMoonbeam
      );

      if (allowance >= amount) {
        updateStepStatus(2, 0);
        setCurrentButtonStatus(buttonStatus[14]);
      } else {
        retryQueryAllowance(ethAddress, amount, --retryTimes);
      }
    } catch (e) {
      retryQueryAllowance(ethAddress, amount, --retryTimes);
    }
  };

  const retryQueryAllowance = (ethAddress, amount, retryTimes) => {
    setTimeout(() => {
      queryAllowance(ethAddress, amount, retryTimes);
    }, 5 * 1000);
  };

  return (
    <ModalWrapper>
      <div
        className="rounded-xl bg-fourth"
        style={{ width: '638px', padding: '24px 72px', margin: '-24px' }}>
        <div className="unselectable-text text-white text-center text-xl mb-2 font-semibold">
          {modalText.title}
        </div>
        <div className="text-sm text-center text-white">
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
              'text-center text-white rounded-lg w-11/12',
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
