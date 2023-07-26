// @ts-nocheck
import React, { useReducer, useContext, useEffect } from 'react';
import { Wallet } from '@acala-network/sdk/wallet';
import { EvmRpcProvider } from '@acala-network/eth-providers';
import PropTypes from 'prop-types';
import { usePublicAccount } from 'contexts/publicAccountContext';
import Balance from 'types/Balance';
import BN from 'bn.js';
import Decimal from 'decimal.js';
import { useMetamask } from 'contexts/metamaskContext';
import { useConfig } from 'contexts/configContext';
import { firstValueFrom } from 'rxjs';
import { useTxStatus } from 'contexts/txStatusContext';
import TxStatus from 'types/TxStatus';
import { useActive } from 'hooks/useActive';
import { Bridge } from 'manta-bridge/build';
import { ethers } from 'ethers';
import BRIDGE_ACTIONS from './bridgeActions';
import bridgeReducer, { buildInitState } from './bridgeReducer';
import mantaAbi from './mantaAbi';
const BridgeDataContext = React.createContext();

export const BridgeDataContextProvider = (props) => {
  const { ethAddress } = useMetamask();
  const config = useConfig();
  const { externalAccount } = usePublicAccount();
  const { txStatus, txStatusRef, setTxStatus } = useTxStatus();
  const isActive = useActive();

  const [state, dispatch] = useReducer(bridgeReducer, buildInitState(config));
  const {
    isApiInitialized,
    senderAssetType,
    senderAssetTargetBalance,
    senderAssetCurrentBalance,
    originChainOptions,
    originChain,
    destinationChain,
    bridge,
    destinationAddress
  } = state;

  const originAddress =
    originChain.name === 'ethereum' ||
    originChain?.getXcmAdapter().chain.type === 'ethereum'
      ? ethAddress
      : externalAccount?.address;

  const originXcmAdapter = bridge?.adapters.find(
    (adapter) => adapter.chain.id === originChain?.name
  );

  const originApi = originXcmAdapter?.api;

  const originChainIsEvm =
    originChain.name === 'ethereum' ||
    originChain?.getXcmAdapter().chain.type === 'ethereum';
  const destinationChainIsEvm =
    destinationChain.name === 'ethereum' ||
    destinationChain?.getXcmAdapter().chain.type === 'ethereum';
  /**
   *
   * Initialization logic
   *
   */

  useEffect(() => {
    const initBridge = () => {
      if (bridge || !externalAccount || !originChainOptions) {
        return;
      }
      const adapters = originChainOptions
        .filter((chain) => chain.name !== 'ethereum')
        .map((chain) => chain.getXcmAdapter());
      dispatch({
        type: BRIDGE_ACTIONS.SET_BRIDGE,
        bridge: new Bridge({ adapters })
      });
    };
    initBridge();
  }, [externalAccount, originChainOptions]);

  const handleApiDisconnect = (chain) => {
    dispatch({
      type: BRIDGE_ACTIONS.SET_IS_API_DISCONNECTED,
      isApiDisconnected: true,
      chain
    });
    if (
      txStatusRef.current?.isProcessing() &&
      chain.name === originChain.name
    ) {
      setTxStatus(TxStatus.disconnected());
    }
  };

  const handleApiConnect = (chain) => {
    dispatch({
      type: BRIDGE_ACTIONS.SET_IS_API_DISCONNECTED,
      isApiDisconnected: false,
      chain
    });
  };

  useEffect(() => {
    const initBridgeApis = () => {
      if (!bridge) {
        return;
      }
      // mock init ethereum api
      const ethereumChain = originChainOptions.find(
        (chain) => chain.name === 'ethereum'
      );
      dispatch({
        type: BRIDGE_ACTIONS.SET_API_IS_INITIALIZED,
        chain: ethereumChain
      });

      const xcmOriginChainOptions = originChainOptions.filter(
        (chain) => chain.name !== 'ethereum'
      );
      for (const chain of xcmOriginChainOptions) {
        const adapter = bridge.adapters.find(
          (adapter) => adapter.chain.id === chain.name
        );
        const api = chain.getXcmApi();
        api.on('connected', () => {
          handleApiConnect(chain);
          api.isReady.then(() => {
            if (chain.name === 'karura' || chain.name === 'acala') {
              const socket =
                chain.name === 'karura'
                  ? config.KARURA_SOCKET
                  : config.ACALA_SOCKET;
              const acalaConfigs = { evmProvider: new EvmRpcProvider(socket) };
              const wallet = new Wallet(api, acalaConfigs);
              wallet.isReady.then(async () => {
                await adapter.init(api, wallet);
                dispatch({
                  type: BRIDGE_ACTIONS.SET_API_IS_INITIALIZED,
                  chain
                });
              });
            } else {
              adapter.init(api);
              dispatch({
                type: BRIDGE_ACTIONS.SET_API_IS_INITIALIZED,
                chain
              });
            }
          });
        });
        api.on('error', () => handleApiDisconnect(chain));
        api.on('disconnected', () => handleApiDisconnect(chain));
      }
    };
    initBridgeApis();
  }, [bridge, originChainOptions]);

  /**
   *
   * Destination address logic
   *
   */

  useEffect(() => {
    const setDestinationAddressOnChangeChain = () => {
      if (originChainIsEvm || destinationChainIsEvm) {
        dispatch({
          type: BRIDGE_ACTIONS.SET_DESTINATION_ADDRESS,
          destinationAddress: null
        });
      } else {
        dispatch({
          type: BRIDGE_ACTIONS.SET_DESTINATION_ADDRESS,
          destinationAddress: externalAccount?.address
        });
      }
    };
    setDestinationAddressOnChangeChain();
  }, [originChain, destinationChain]);

  useEffect(() => {
    const setDestinationAddressOnChangeExternalAccount = () => {
      if (originChainIsEvm || destinationChainIsEvm) {
        return;
      }
      dispatch({
        type: BRIDGE_ACTIONS.SET_DESTINATION_ADDRESS,
        destinationAddress: externalAccount?.address
      });
    };
    setDestinationAddressOnChangeExternalAccount();
  }, [externalAccount]);

  /**
   *
   * Subscriptions
   *
   */

  const waitForTxFinished = async () => {
    while (txStatusRef.current?.isProcessing()) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  const subscribeSenderBalance = () => {
    const balanceObserveable = originXcmAdapter.subscribeTokenBalance(
      senderAssetType.logicalTicker,
      originAddress
    );
    const unsub = balanceObserveable.subscribe(async (balanceRaw) => {
      const newBalance = Balance.fromBaseUnits(
        senderAssetType,
        balanceRaw.free
      );
      if (
        senderAssetCurrentBalance &&
        newBalance.eq(senderAssetCurrentBalance)
      ) {
        return;
      }
      await waitForTxFinished();
      dispatch({
        type: BRIDGE_ACTIONS.SET_SENDER_ASSET_CURRENT_BALANCE,
        senderAssetCurrentBalance: newBalance
      });
    });
    return unsub;
  };

  const subscribeSenderNativeTokenBalance = () => {
    const balanceObserveable = originXcmAdapter.subscribeTokenBalance(
      originChain.nativeAsset.logicalTicker,
      originAddress
    );
    const unsub = balanceObserveable.subscribe((balanceRaw) => {
      const senderNativeAssetCurrentBalance = Balance.fromBaseUnits(
        originChain.nativeAsset,
        balanceRaw.free
      );
      dispatch({
        type: BRIDGE_ACTIONS.SET_SENDER_NATIVE_ASSET_CURRENT_BALANCE,
        senderNativeAssetCurrentBalance
      });
    });
    return unsub;
  };

  useEffect(() => {
    async function getBalance() {
      if (!window.ethereum || originChain.name !== 'ethereum') {
        return;
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      // native token
      const nativeTokenBalance = await provider.getBalance(ethAddress);
      const formatNativeTokenBalance =
        ethers.utils.formatEther(nativeTokenBalance);
      const senderNativeAssetCurrentBalance = Balance.fromBaseUnits(
        originChain.nativeAsset,
        new Decimal(formatNativeTokenBalance)
      );
      dispatch({
        type: BRIDGE_ACTIONS.SET_SENDER_NATIVE_ASSET_CURRENT_BALANCE,
        senderNativeAssetCurrentBalance
      });

      // senderBalance, should use `senderAssetType`
      // below is a demo for ERC-20 KINE token
      // const mantaAddress = '0xCbfef8fdd706cde6F208460f2Bf39Aa9c785F05D';
      const mantaAddress = '0xd9b0DDb3e3F3721Da5d0B20f96E0817769c2B46D'; // MANTA token deployed in Goerli
      const mantaContract = new ethers.Contract(
        mantaAddress,
        mantaAbi,
        provider
      );
      const senderTokenBalance = await mantaContract.balanceOf(ethAddress);
      const formatSenderTokenBalance =
        ethers.utils.formatEther(senderTokenBalance);
      const newBalance = Balance.fromBaseUnits(
        senderAssetType,
        new Decimal(formatSenderTokenBalance)
      );
      if (
        senderAssetCurrentBalance &&
        newBalance.eq(senderAssetCurrentBalance)
      ) {
        return;
      }
      await waitForTxFinished();
      dispatch({
        type: BRIDGE_ACTIONS.SET_SENDER_ASSET_CURRENT_BALANCE,
        senderAssetCurrentBalance: newBalance
      });
    }
    const timer = setInterval(async () => {
      getBalance();
    }, 3000);
    return () => clearInterval(timer);
  }, [originChain, ethAddress]);

  useEffect(() => {
    let nativeTokenUnsub = null;
    let senderBalanceUnsub = null;
    const subscribeBalances = async () => {
      if (
        !senderAssetType ||
        !originAddress ||
        !isApiInitialized ||
        !originChain ||
        !isActive
      ) {
        return;
      }
      if (originChain.name === 'ethereum') {
        return;
      }
      nativeTokenUnsub = subscribeSenderNativeTokenBalance();
      senderBalanceUnsub = subscribeSenderBalance();
    };
    subscribeBalances();
    return () => {
      nativeTokenUnsub?.unsubscribe();
      senderBalanceUnsub?.unsubscribe();
    };
  }, [
    isActive,
    originXcmAdapter,
    senderAssetType,
    externalAccount,
    originAddress,
    originApi,
    originChain,
    destinationAddress,
    destinationChain,
    txStatus
  ]);

  useEffect(() => {
    function setFees() {
      if (originChain.name !== 'ethereum') {
        return;
      }
      dispatch({
        type: BRIDGE_ACTIONS.SET_FEE_ESTIMATES,
        originFee: Balance.fromBaseUnits(originChain.nativeAsset, '0.00265399'),
        destinationFee: Balance.fromBaseUnits(senderAssetType, 0),
        maxInput: senderAssetCurrentBalance,
        minInput: Balance.fromBaseUnits(senderAssetType, new Decimal(1))
      });
    }
    setFees();
  }, [originChain, senderAssetCurrentBalance, senderAssetType]);

  useEffect(() => {
    const getDestinationFee = (inputConfig) => {
      return Balance.fromBaseUnits(
        senderAssetType,
        inputConfig.destFee.balance
      );
    };
    const getOriginFee = (inputConfig) => {
      return new Balance(
        originChain.nativeAsset,
        new BN(inputConfig.estimateFee)
      );
    };
    const getMaxInput = (inputConfig) => {
      return Balance.fromBaseUnits(
        senderAssetType,
        Decimal.max(
          new Decimal(inputConfig.maxInput.toString()),
          new Decimal(0)
        )
      );
    };
    const getMinInput = (inputConfig) => {
      return Balance.fromBaseUnits(
        senderAssetType,
        new Decimal(inputConfig.minInput.toString())
      );
    };

    const handleInputConfigChange = (inputConfig) => {
      dispatch({
        type: BRIDGE_ACTIONS.SET_FEE_ESTIMATES,
        originFee: getOriginFee(inputConfig),
        destinationFee: getDestinationFee(inputConfig),
        maxInput: getMaxInput(inputConfig),
        minInput: getMinInput(inputConfig)
      });
    };

    const getInputConfigParams = () => {
      const amount = senderAssetTargetBalance
        ? senderAssetTargetBalance.valueBaseUnits.toString()
        : '0';

      let address = destinationAddress;
      // allows us to get fee estimates for EVM chains even when destination address not set
      if (destinationChainIsEvm) {
        const ARBITRARY_EVM_ADDRESS =
          '0x000000000000000000000000000000000000dead';
        address = ARBITRARY_EVM_ADDRESS;
      }
      return {
        signer: originAddress,
        address: address,
        amount: amount,
        to: destinationChain.name,
        token: senderAssetType.logicalTicker
      };
    };

    const subscribeInputConfig = async () => {
      if (
        !isActive ||
        !senderAssetType ||
        !originAddress ||
        !isApiInitialized ||
        !originChain ||
        !destinationAddress
      ) {
        return;
      }
      if (originChain.name === 'ethereum') {
        return;
      }
      // Workaround for Karura adapter internals not being ready on initial connection
      (originChain.name === 'karura' || originChain.name === 'acala') &&
        (await originXcmAdapter.wallet.isReady);
      const inputConfigParams = getInputConfigParams();
      const inputConfigObservable =
        originXcmAdapter.subscribeInputConfig(inputConfigParams);
      const inputConfig = await firstValueFrom(inputConfigObservable);
      handleInputConfigChange(inputConfig);
    };
    subscribeInputConfig();
  }, [
    isActive,
    senderAssetType,
    senderAssetCurrentBalance,
    senderAssetTargetBalance,
    originAddress,
    destinationAddress,
    originChain,
    destinationChain,
    isApiInitialized
  ]);

  /**
   *
   * Mutations exposed through UI
   */

  // Sets the asset type to be transacted
  const setSelectedAssetType = (selectedAssetType) => {
    dispatch({
      type: BRIDGE_ACTIONS.SET_SELECTED_ASSET_TYPE,
      selectedAssetType
    });
  };

  // Sets the balance the user intends to send
  const setSenderAssetTargetBalance = (senderAssetTargetBalance) => {
    dispatch({
      type: BRIDGE_ACTIONS.SET_SENDER_ASSET_TARGET_BALANCE,
      senderAssetTargetBalance
    });
  };

  // Sets the origin chain
  const setOriginChain = (originChain) => {
    dispatch({
      type: BRIDGE_ACTIONS.SET_ORIGIN_CHAIN,
      originChain,
      isApiInitialized: getisApiInitialized(originChain),
      isApiDisconnected: getisApiDisconnected(originChain)
    });
  };

  // Sets the destination chain
  const setDestinationChain = (destinationChain) => {
    dispatch({
      type: BRIDGE_ACTIONS.SET_DESTINATION_CHAIN,
      destinationChain
    });
  };

  // Sets the destination address (only used when bridging too or from EVM chains like Moonriver)
  const setDestinationAddress = (destinationAddress) => {
    dispatch({
      type: BRIDGE_ACTIONS.SET_DESTINATION_ADDRESS,
      destinationAddress
    });
  };

  // Switches origin and destination chain
  const switchOriginAndDestination = () => {
    if (originChain && destinationChain) {
      dispatch({
        type: BRIDGE_ACTIONS.SWITCH_ORIGIN_AND_DESTINATION,
        isApiInitialized: getisApiInitialized(destinationChain),
        isApiDisconnected: getisApiDisconnected(destinationChain)
      });
    }
  };

  // Returns true if the given chain's api is ready
  const getisApiInitialized = (chain) => {
    if (chain.name === 'ethereum') {
      return true;
    }
    const xcmAdapter = bridge?.adapters.find(
      (adapter) => adapter.chain.id === chain?.name
    );
    return !!xcmAdapter?.api?.isReady;
  };

  const getisApiDisconnected = (chain) => {
    if (chain.name === 'ethereum') {
      return false;
    }
    const xcmAdapter = bridge?.adapters.find(
      (adapter) => adapter.chain.id === chain?.name
    );
    return !xcmAdapter?.api?.isConnected;
  };

  const value = {
    originAddress,
    originApi,
    originXcmAdapter,
    originChainIsEvm,
    destinationChainIsEvm,
    setSenderAssetTargetBalance,
    setSelectedAssetType,
    setOriginChain,
    setDestinationChain,
    setDestinationAddress,
    switchOriginAndDestination,
    ...state
  };

  return (
    <BridgeDataContext.Provider value={value}>
      {props.children}
    </BridgeDataContext.Provider>
  );
};

BridgeDataContextProvider.propTypes = {
  children: PropTypes.any
};

export const useBridgeData = () => ({ ...useContext(BridgeDataContext) });
