// @ts-nocheck
import NETWORK from 'constants/NetworkConstants';
import BN from 'bn.js';

const CalamariAssetIds = {
  KMA: 1,
  KAR: 8,
  AUSD: 9,
  LKSM: 10,
  MOVR: 11,
  KSM: 12,
  USDT: 14,
  DAI: 15,
  USDC: 16
};

const MantaAssetIds = {
  MANTA: 1,
  DOT: 8,
  GLMR: 10,
  ACA: 11,
  DAI: 31,
  WETH: 32,
  USDC: 33,
  tBTC: 34,
  WBNB: 35
};

const getAssetIds = (config) => {
  if (config.NETWORK_NAME === NETWORK.CALAMARI) {
    return CalamariAssetIds;
  } else  {
    return MantaAssetIds;
  }
};

export default class AssetType {
  assetId: number;
  baseName: string;
  name: string;
  baseTicker: string;
  ticker: string;
  logicalTicker: string;
  icon: string;
  numberOfDecimals: number;
  existentialDeposit: BN;
  existentialDeposit: BN;
  isPrivate: boolean;
  isTestnet: boolean;
  isNativeToken: boolean;
  coingeckoId: string;
  displayDecimals: number;

  constructor(
    assetId,
    baseName,
    baseTicker,
    icon,
    numberOfDecimals,
    existentialDeposit,
    isPrivate,
    coingeckoId,
    isTestnet,
    isNativeToken = false,
    logicalTicker = null,
    displayDecimals = 2
  ) {
    this.assetId = assetId;
    this.baseName = baseName;
    this.baseTicker = baseTicker;
    this.logicalTicker = logicalTicker || baseTicker;
    this.name = AssetType._getFullName(baseName, isPrivate, isTestnet);
    this.ticker = AssetType._getFullTicker(baseTicker, isPrivate);
    this.icon = icon;
    this.numberOfDecimals = numberOfDecimals;
    this.existentialDeposit = existentialDeposit;
    this.isPrivate = isPrivate;
    this.isTestnet = isTestnet;
    this.isNativeToken = isNativeToken;
    this.coingeckoId = coingeckoId;
    this.displayDecimals = displayDecimals;
  }

  static Native(config) {
    if (config.NETWORK_NAME === 'Calamari') {
      return AssetType.Calamari(config, false);
    } else {
      return AssetType.Manta(config, false);
    }
  }

  static Calamari(config, isPrivate) {
    return new AssetType(
      getAssetIds(config).KMA,
      'Calamari',
      'KMA',
      'calamari',
      12,
      new BN('100000000000'),
      isPrivate,
      'calamari-network',
      config.IS_TESTNET,
      true
    );
  }

  static Karura(config, isPrivate) {
    return new AssetType(
      getAssetIds(config).KAR,
      'Karura',
      'KAR',
      'kar',
      12,
      new BN('100000000000'),
      isPrivate,
      'karura',
      config.IS_TESTNET,
    );
  }

  static Kusama(config, isPrivate) {
    return new AssetType(
      getAssetIds(config).KSM,
      'Kusama',
      'KSM',
      'kusama',
      12,
      new BN('500000000'),
      isPrivate,
      'kusama',
      config.IS_TESTNET,
    );
  }

  static Moonriver(config, isPrivate) {
    return new AssetType(
      getAssetIds(config).MOVR,
      'Moonriver',
      'MOVR',
      'movr',
      18,
      new BN('100000000000000000'),
      isPrivate,
      'moonriver',
      config.IS_TESTNET,
    );
  }

  static Tether(config, isPrivate) {
    return new AssetType(
      getAssetIds(config).USDT,
      'Tether USD',
      'USDT',
      'tether',
      6,
      new BN('1000'),
      isPrivate,
      'tether',
      config.IS_TESTNET,
    );
  }

  // static WrappedBitcoin(config, isPrivate) {
  //   return new AssetType(
  //     getAssetIds(config).WBTC,
  //     'Wrapped Bitcoin',
  //     'WBTC',
  //     'wbtc', // need to find image (just bitcoin image maybe okay)
  //     8, // pretty sure, check
  //     new BN('1'), // not sure
  //     isPrivate,
  //     'wrapped-bitcoin',
  //     config.IS_TESTNET,
  //   );
  // }

  // static WrappedEthereum(config, isPrivate) {
  //   return new AssetType(
  //     getAssetIds(config).WETH,
  //     'Wrapped Ethereum',
  //     'WETH',
  //     'weth', // need to find image (just ETH image maybe okay)
  //     18, // pretty sure, check
  //     new BN('1'), // not sure
  //     isPrivate,
  //     'weth',
  //     config.IS_TESTNET,
  //   );
  // }

  static Dai(config, isPrivate) {
    return new AssetType(
      getAssetIds(config).DAI,
      'DAI Stablecoin',
      'DAI',
      'dai',
      18,
      new BN('10000000000000000'),
      isPrivate,
      'dai',
      config.IS_TESTNET,
    );
  }

  static UsdCoin(config, isPrivate) {
    return new AssetType(
      getAssetIds(config).USDC,
      'USD Coin',
      'USDC',
      'usdc',
      6,
      new BN('10000'),
      isPrivate,
      'usd-coin',
      config.IS_TESTNET,
      false,
      'USDCet'
    );
  }

  // mainnet
  static Ethereum(config, isPrivate) {
    return new AssetType(
      getAssetIds(config).ETH,
      'Ethereum',
      'ETH',
      'ethereum',
      18,
      new BN(0), // no ED
      isPrivate,
      'eth',
      config.IS_TESTNET,
      true
    );
  }

  static Manta(config, isPrivate) {
    return new AssetType(
      getAssetIds(config).MANTA,
      'Manta',
      'MANTA',
      'manta',
      18,
      new BN('100000000000000000'),
      isPrivate,
      'manta-network', // todo: use actual manta coingecko id when available
      config.IS_TESTNET,
      true
    );
  }

  static Acala(config, isPrivate) {
    return new AssetType(
      getAssetIds(config).ACA,
      'Acala',
      'ACA',
      'acala',
      12,
      new BN('100000000000'),
      isPrivate,
      'karura',
      config.IS_TESTNET,
    );
  }

  static Polkadot(config, isPrivate) {
    return new AssetType(
      getAssetIds(config).DOT,
      'Polkadot',
      'DOT',
      'polkadot',
      10,
      new BN('10000000000'),
      isPrivate,
      'polkadot',
      config.IS_TESTNET,
    );
  }
  static Moonbeam(config, isPrivate) {
    return new AssetType(
      getAssetIds(config).GLMR,
      'Moonbeam',
      'GLMR',
      'moonbeam',
      18,
      new BN('2000000000000000'),
      isPrivate,
      'moonbeam',
      config.IS_TESTNET,
    );
  }

  static WETH(config, isPrivate) {
    return new AssetType(
      getAssetIds(config).WETH,
      'Wrapped Ether',
      'WETH',
      'ethereum',
      18,
      new BN('5555555555555'),
      isPrivate,
      'weth',
      config.IS_TESTNET,
      false,
      null,
      8
    );
  }


  static tBTC(config, isPrivate) {
    return new AssetType(
      getAssetIds(config).tBTC,
      'tBTC v2',
      'tBTC',
      'bitcoin',
      18,
      new BN('1'),
      isPrivate,
      'tbtc',
      config.IS_TESTNET,
      false,
      null,
      8
    );
  }

  static WBNB(config, isPrivate) {
    return new AssetType(
      getAssetIds(config).WBNB,
      'Wrapped BNB',
      'WBNB',
      'bnb',
      18,
      new BN('1'),
      isPrivate,
      'wbnb',
      config.IS_TESTNET,
    );
  }

  static AllCurrencies(config, isPrivate) {
    if (config.NETWORK_NAME === NETWORK.MANTA) {
      return [
        AssetType.Manta(config, isPrivate),
        AssetType.Polkadot(config, isPrivate),
        AssetType.Acala(config, isPrivate),
        AssetType.Moonbeam(config, isPrivate),
        AssetType.Dai(config, isPrivate),
        AssetType.UsdCoin(config, isPrivate),
        AssetType.tBTC(config, isPrivate),
        AssetType.WBNB(config, isPrivate),
        AssetType.WETH(config, isPrivate),
      ];
    } else if (config.NETWORK_NAME === NETWORK.CALAMARI) {
      return [
        AssetType.Calamari(config, isPrivate),
        AssetType.Karura(config, isPrivate),
        AssetType.Kusama(config, isPrivate),
        AssetType.Moonriver(config, isPrivate),
        AssetType.Tether(config, isPrivate),
        // AssetType.WrappedBitcoin(config, isPrivate),
        // AssetType.WrappedEthereum(config, isPrivate),
        AssetType.Dai(config, isPrivate),
        AssetType.UsdCoin(config, isPrivate)
      ];
    }
  }

  static _getFullName(baseName, isPrivate, isTestnet) {
    let name = isTestnet ? 'Test ' : '';
    if (isPrivate) {
      name += 'zk';
    }
    return name + baseName;
  }

  static _getFullTicker(baseTicker, isPrivate) {
    return isPrivate ? `zk${baseTicker}` : baseTicker;
  }

  toPrivate() {
    return new AssetType(
      this.assetId,
      this.baseName,
      this.baseTicker,
      this.icon,
      this.numberOfDecimals,
      this.existentialDeposit,
      true,
      this.coingeckoId,
      this.isTestnet,
      this.isNativeToken,
      this.logicalTicker
    );
  }

  toPublic() {
    return new AssetType(
      this.assetId,
      this.baseName,
      this.baseTicker,
      this.icon,
      this.numberOfDecimals,
      this.existentialDeposit,
      false,
      this.coingeckoId,
      this.isTestnet,
      this.isNativeToken,
      this.logicalTicker
    );
  }

  toggleIsPrivate() {
    if (this.isPrivate) {
      return this.toPublic();
    } else {
      return this.toPrivate();
    }
  }

  canTransferXcm = (originChain, destinationChain) => {
    return (
      originChain.xcmAssets.find((asset) => asset.name === this.name) &&
      destinationChain.xcmAssets.find((asset) => asset.name === this.name)
    );
  };
}
