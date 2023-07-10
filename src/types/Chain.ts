// @ts-nocheck
import NETWORK from 'constants/NetworkConstants';
import { KaruraAdapter, AcalaAdapter } from 'manta-polkawallet-bridge/build/adapters/acala';
import { CalamariAdapter, MantaAdapter } from 'manta-polkawallet-bridge/build/adapters/manta';
import { KusamaAdapter, PolkadotAdapter } from 'manta-polkawallet-bridge/build/adapters/polkadot';
import { MoonriverAdapter, MoonbeamAdapter } from 'manta-polkawallet-bridge/build/adapters/moonbeam';
import { StatemineAdapter } from 'manta-polkawallet-bridge/build/adapters/statemint';
import { typesBundlePre900 } from 'moonbeam-types-bundle';
import { options } from '@acala-network/api';
import { ApiPromise, WsProvider } from '@polkadot/api';
import types from '../config/types.json';
import AssetType from './AssetType';

export default class Chain {
  name: string;
  displayName: string;
  parachainId: number;
  icon: string;
  socket: string;
  subscanUrl: string;
  xcmAssets: AssetType[];
  nativeAsset: AssetType;
  xcmAdapterClass: any;
  apiTypes: any;
  apiOptions: any;
  apiTypesBundle: any;
  ethMetadata: any;
  ethChainId: null | string;

  constructor(
    name,
    displayName,
    parachainId,
    icon,
    socket,
    subscanUrl,
    xcmAssets,
    nativeAsset,
    xcmAdapterClass,
    apiTypes = null,
    apiOptions = null,
    apiTypesBundle = null,
    ethMetadata = null,
    ethChainId = null
  ) {
    this.name = name;
    this.displayName = displayName;
    this.parachainId = parachainId;
    this.icon = icon;
    this.socket = socket;
    this.subscanUrl = subscanUrl;
    this.xcmAssets = xcmAssets;
    this.nativeAsset = nativeAsset;
    this.xcmAdapterClass = xcmAdapterClass;
    this.apiTypes = apiTypes || {};
    this.apiOptions = apiOptions;
    this.apiTypesBundle = apiTypesBundle;
    this.ethMetadata = ethMetadata;
    this.ethChainId = ethChainId;
    this.api = null;
  }

  static Calamari(config) {
    return new Chain(
      'calamari',
      'Calamari',
      2084,
      'calamariLogo',
      config.CALAMARI_SOCKET,
      config.CALAMARI_SUBSCAN_URL,
      [
        AssetType.Kusama(config),
        AssetType.Karura(config),
        AssetType.Moonriver(config),
        AssetType.Tether(config),
        AssetType.Dai(config),
        AssetType.UsdCoin(config),
        AssetType.WrappedBitcoin(config),
        AssetType.WrappedEthereum(config),
        AssetType.Arbitrum(config),
        AssetType.BinanceCoin(config),
        AssetType.BinanceUsd(config),
        AssetType.Polygon(config),
        AssetType.Lido(config),
        AssetType.ShibaInu(config),
        AssetType.Uniswap(config),
        AssetType.Chainlink(config),
        AssetType.Apecoin(config)
      ],
      AssetType.Calamari(config),
      CalamariAdapter,
      types
    );
  }

  static Manta(config) {
    return new Chain(
      'manta',
      'Manta',
      2104,
      'mantaLogo',
      config.MANTA_SOCKET,
      config.MANTA_SUBSCAN_URL,
      [
        AssetType.Manta(config),
        AssetType.Polkadot(config),
        AssetType.Acala(config), //
        // todo: LDOT
        AssetType.Tether(config),
        AssetType.Dai(config),
        AssetType.UsdCoin(config),
        AssetType.WrappedBitcoin(config),
        AssetType.WrappedEthereum(config),
        AssetType.Arbitrum(config),
        AssetType.BinanceUsd(config),
        AssetType.Lido(config),
        AssetType.ShibaInu(config),
        AssetType.Uniswap(config),
        AssetType.Chainlink(config),
        AssetType.Apecoin(config),
        AssetType.Moonbeam(config),

      ],
      AssetType.Manta(config),
      MantaAdapter,
      types
    );
  }

  static Rococo(config) {
    return new Chain(
      'rococo',
      'Rococo',
      null,
      'roc',
      config.ROCOCO_SOCKET,
      config.ROCOCO_SUBSCAN_URL,
      [AssetType.Rococo(config)],
      AssetType.Rococo(config),
      KusamaAdapter
    );
  }

  static Polkadot(config) {
    return new Chain(
      'polkadot',
      'Polkadot',
      null,
      'polkadot',
      config.POLKADOT_SOCKET,
      config.POLKADOT_SUBSCAN_URL,
      [AssetType.Polkadot(config)],
      AssetType.Polkadot(config),
      PolkadotAdapter
    );
  }

  static Kusama(config) {
    return new Chain(
      'kusama',
      'Kusama',
      null,
      'kusama',
      config.KUSAMA_SOCKET,
      config.KUSAMA_SUBSCAN_URL,
      [AssetType.Kusama(config)],
      AssetType.Kusama(config),
      KusamaAdapter
    );
  }

  static Acala(config) {
    return new Chain(
      'acala',
      'Acala',
      2000,
      'acala',
      config.ACALA_SOCKET,
      config.ACALA_SUBSCAN_URL,
      [
        AssetType.Acala(config),
        AssetType.Tether(config),
        AssetType.Dai(config),
        AssetType.UsdCoin(config),
        AssetType.WrappedBitcoin(config),
        AssetType.WrappedEthereum(config),
        AssetType.Apecoin(config),
        // AssetType.Arbitrum(config), //
        // AssetType.BinanceUsd(config), //
        // AssetType.Lido(config), //
        // AssetType.ShibaInu(config), //
        // AssetType.Uniswap(config), //
        // AssetType.Chainlink(config), //
      ],
      AssetType.Acala(config),
      AcalaAdapter,
      null,
      options
    );
  }

  static Statemine(config) {
    return new Chain(
      'statemine',
      'Statemine',
      1000,
      'statemine',
      config.STATEMINE_SOCKET,
      config.STATEMINE_SUBSCAN_URL,
      [AssetType.Tether(config)],
      AssetType.Kusama(config),
      StatemineAdapter
    );
  }

  static Karura(config) {
    return new Chain(
      'karura',
      'Karura',
      2000,
      'kar',
      config.KARURA_SOCKET,
      config.KARURA_SUBSCAN_URL,
      [
        AssetType.Karura(config),
        AssetType.UsdCoin(config),
        AssetType.Dai(config),
        AssetType.Tether(config),
        AssetType.WrappedBitcoin(config),
        AssetType.WrappedEthereum(config),
        AssetType.Arbitrum(config),
        AssetType.BinanceCoin(config),
        AssetType.BinanceUsd(config),
        AssetType.Polygon(config),
        AssetType.Lido(config),
        AssetType.ShibaInu(config),
        AssetType.Uniswap(config),
        AssetType.Chainlink(config),
        AssetType.Apecoin(config)
      ],
      AssetType.Karura(config),
      KaruraAdapter,
      null,
      options
    );
  }

  static Moonriver(config) {
    const moonriverEthMetadata = {
      chainId: config.IS_TESTNET ? '0x500' : '0x505',
      chainName: config.IS_TESTNET ? 'Moonriver Development Testnet' : 'Moonriver',
      nativeCurrency: {
        name: 'MOVR',
        symbol: 'MOVR',
        decimals: 18
      },
      rpcUrls: [config.MOONRIVER_RPC]
    };

    return new Chain(
      'moonriver',
      'Moonriver',
      1000,
      'movr',
      config.MOONRIVER_SOCKET,
      config.MOONRIVER_SUBSCAN_URL,
      [AssetType.Moonriver(config)],
      AssetType.Moonriver(config),
      MoonriverAdapter,
      typesBundlePre900,
      null,
      null,
      moonriverEthMetadata,
      config.IS_TESTNET ? '1280' : '1285'
    );
  }

  static Moonbeam(config) {
    const moonbeamEthMetadata = {
      chainId: '0x504',
      chainName: 'Moonbeam',
      nativeCurrency: {
        name: 'GLMR',
        symbol: 'GMLR',
        decimals: 18
      },
      rpcUrls: [config.MOONBEAM_RPC]
    };

    return new Chain(
      'moonbeam',
      'Moonbeam',
      2004,
      'moonbeam',
      config.MOONBEAM_SOCKET,
      config.MOONBEAM_SUBSCAN_URL,
      [AssetType.Moonbeam(config)],
      AssetType.Moonbeam(config),
      MoonbeamAdapter,
      typesBundlePre900,
      null,
      null,
      moonbeamEthMetadata,
      1284
    );
  }


  static All(config) {
    if (config.NETWORK_NAME === NETWORK.CALAMARI) {
      return [
        Chain.Calamari(config),
        Chain.Kusama(config),
        Chain.Karura(config),
        Chain.Moonriver(config),
        Chain.Statemine(config)
      ];
    } else if (config.NETWORK_NAME === NETWORK.MANTA) {
      return [Chain.Manta(config), Chain.Acala(config), Chain.Polkadot(config), Chain.Moonbeam(config)];
    }
  }

  getXcmApi() {
    const provider = new WsProvider(this.socket);
    if (this.apiOptions) {
      const api = new ApiPromise(options({ provider, types: this.apiTypes}));
      return api;
    } else {
      const api = new ApiPromise({provider, types: this.apiTypes, typesBundle: this.apiTypesBundle});
      return api;
    }
  }

  getXcmAdapter() {
    return new this.xcmAdapterClass();
  }

  canTransferXcm(otherChain) {
    if (this.name === otherChain.name) {
      return false;
    }
    for (let i = 0; i < this.xcmAssets.length; i++) {
      const asset = this.xcmAssets[i];
      if (
        otherChain.xcmAssets.find(
          (otherAsset) => asset.assetId === otherAsset.assetId
        )
      ) {
        return true;
      }
    }
    return false;
  }
}
