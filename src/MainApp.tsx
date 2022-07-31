// @ts-nocheck
import React, { useEffect } from 'react';
import config from 'config';
import { Route, Switch, withRouter, Redirect } from 'react-router-dom';
import { SendPage } from 'pages';
import MissingRequiredSoftwareModal from 'components/Modal/missingRequiredSoftwareModal';
import MobileNotSupportedModal from 'components/Modal/mobileNotSupported';
import Sidebar from 'components/Sidebar';
import ThemeToggle from 'components/ThemeToggle';
import userIsMobile from 'utils/ui/userIsMobile';
import NewerSignerVersionRequiredModal from 'components/Modal/newerSignerVersionRequiredModal';
import DowntimeModal from 'components/Modal/downtimeModal';
import signerIsOutOfDate from 'utils/validation/signerIsOutOfDate';
import { usePrivateWallet } from 'contexts/privateWalletContext';
import { useSubstrate } from 'contexts/substrateContext';
import { useKeyring } from 'contexts/keyringContext';
import { XcmVersionedMultiLocation, XcmV1MultilocationJunctions,  } from '@polkadot/types/lookup';
import { XcmVersionedMultiAsset } from '@polkadot/types/lookup';
import { XcmV1MultiLocation } from '@polkadot/types/lookup';
import BN from 'bn.js';
import { useExternalAccount } from 'contexts/externalAccountContext';
import { ApiBase } from '@polkadot/api/base';
import BridgePage from 'pages/BridgePage';
import { decodeAddress } from '@polkadot/util-crypto';
import { hexAddPrefix, u8aToHex } from '@polkadot/util';
import { transferKarFromKaruraToCalamari, transferRocFromCalamariToRococo, transferRocFromRococoToCalamari } from 'utils/api/XCM';



function MainApp() {
  const  { api } = useSubstrate();
  const { externalAccountSigner } = useExternalAccount();


  useEffect(() => {
    if (!api || !externalAccountSigner) return;

    const tryXCMFromKarura = async () => {
      await api.isReady;

      const assetId = generateKaruraAssetId();
      const valueAtomicUnitsKar = new BN(10000000000000);
      const dest = generateDolphinDestXTokens();
      const tx = api.tx.xTokens.transfer(assetId, valueAtomicUnitsKar, dest, 4000000000);
      try {
        console.log(externalAccountSigner, 'externalAccountSigner');
        await tx.signAndSend(externalAccountSigner, () => null);
        console.log('tx sent');
      } catch (error) {
        console.error(error, 'tx failed to send');
      }

    };
    // tryXCMFromKarura()

    const tryXcmToKarura = async () => {
      await api.isReady;
      console.log('okay');

      const  assetId = api.createType('CurrencyId', {
        MantaCurrency: api.createType('AssetId',  8)
      });
      console.log('assetId', assetId);

      const dest = api.createType('XcmVersionedMultiLocation', {
        v1: api.createType('XcmV1MultiLocation', {
          parents: 1,
          interior: api.createType('XcmV1MultilocationJunctions', {
            x2: [
              api.createType('XcmV1Junction', {
                parachain: 2000
              }),
              api.createType('XcmV1Junction', {
                accountId32: {
                  network: api.createType('XcmV0JunctionNetworkId', { any: true }),
                  id: '0x067cd1c1f643afa675c6103c073188908a38f493771af44c71603f28b775370e' // param 1
                }
              }),
            ]
          })
        })
      });
      console.log('dest');

      const tx = api.tx.xTokens.transfer(assetId, new BN(1000000000000), dest, 800000000);
      try {
        console.log(externalAccountSigner, 'externalAccountSigner');
        await tx.signAndSend(externalAccountSigner, () => null);
        console.log('tx sent');
      } catch (error) {
        console.error(error, 'tx failed to send');
      }
      console.log('dest', dest);
    };
    // tryXcmToKarura()




    const tryXCMToRococo= async () => {
      await api.isReady;
      console.log('okay');

      const  assetId = api.createType('CurrencyId', {
        MantaCurrency: api.createType('AssetId',  8)
      });
      console.log('assetId', assetId);

      const dest = api.createType('XcmVersionedMultiLocation', {
        v1: api.createType('XcmV1MultiLocation', {
          parents: 1, // 0 if sending from relay chain
          interior: api.createType('XcmV1MultilocationJunctions', {
            x1: api.createType('XcmV1Junction', {
              accountId32: {
                network: api.createType('XcmV0JunctionNetworkId', { any: true }),
                id: '0x067cd1c1f643afa675c6103c073188908a38f493771af44c71603f28b775370e' // param 1
              }
            })
          })
        })
      });
      console.log('dest');

      const tx = api.tx.xTokens.transfer(assetId, new BN(10000000000000), dest, 4000000000);
      try {
        console.log(externalAccountSigner, 'externalAccountSigner');
        await tx.signAndSend(externalAccountSigner, () => null);
        console.log('tx sent');
      } catch (error) {
        console.error(error, 'tx failed to send');
      }
      console.log('dest', dest);
    };

    const tryXCMInbound = async () => {
      await api.isReady;

      const dest = api.createType('XcmVersionedMultiLocation', {
        v1: api.createType('XcmV1MultiLocation', {
          parents: 0,
          interior: api.createType('XcmV1MultilocationJunctions', {
            x1: api.createType('XcmV1Junction', {
              parachain: 2084
            })
          })
        })
      });

      const beneficiary = api.createType('XcmVersionedMultiLocation', {
        v1: api.createType('XcmV1MultiLocation', {
          parents: 0,
          interior: api.createType('XcmV1MultilocationJunctions', {
            x1: api.createType('XcmV1Junction', {
              accountId32: {
                network: api.createType('XcmV0JunctionNetworkId', { any: true }),
                id: '0x067cd1c1f643afa675c6103c073188908a38f493771af44c71603f28b775370e' // param 1
              }
            })
          })
        })
      });

      const assets = api.createType('XcmVersionedMultiAssets', {
        v1: [api.createType('XcmV1MultiAsset', {
          id: api.createType('XcmV1MultiassetAssetId', {
            concrete: api.createType('XcmV1MultiLocation', {
              parents: 0,
              interior: api.createType('XcmV1MultilocationJunctions', 'Here')
            })
          }),
          fun: api.createType('XcmV1MultiassetFungibility', {
            fungible: 5000000000000
          })
        })]}
      );

      // fee asset item = index of asset in array which pays fee
      const feeAssetItem = 0;

      // Manta runtime has a barrier called AllowTopLevelPaidExecutionFrom
      // which converts this "unlimited" to weight of 1 billion * 4 instructions = 4000000000
      const weightLimit = api.createType('XcmV2WeightLimit', {
        unlimited: true,
      });

      const tx = api.tx.xcmPallet.limitedReserveTransferAssets(dest, beneficiary, assets, feeAssetItem, weightLimit);
      try {
        console.log(externalAccountSigner, 'externalAccountSigner');
        await tx.signAndSend(externalAccountSigner, () => null);
        console.log('inbount tx sent');
      } catch (error) {
        console.error(error, 'inbound tx failed to send');
      }
    };

    tryXCMInbound();
    // tryXCMOutbound()
  }, [api, externalAccountSigner]);

  useEffect(() => {
    const xcm = async () => {
      console.log('api?', api);

      if (!api || !externalAccountSigner) return;
      await api.isReady;

      const address = 't6X8qpY26nsi6WDMkhbyaTz6cLtNBt7xfs4H9k94D3kM1Lm';
      const address2 = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      const hex = hexAddPrefix(u8aToHex(decodeAddress(address)));
      const hex1 = hexAddPrefix(u8aToHex(decodeAddress(address2)));

      const txResHandler = () => {
        console.log('tx sent');
      };

      console.log('doing transfer');

      // transferRocFromRococoToCalamari(
      //   api,
      //   externalAccountSigner,
      //   txResHandler,
      //   'dmyjURuBeJwFo4Nvf2GZ8f5E2Asz98JY2d7UcaDykqYm1zpoi',
      //   new BN(100000000000000)
      // )

      // transferRocFromCalamariToRococo(
      //   api,
      //   externalAccountSigner,
      //   txResHandler,
      //   'dmyjURuBeJwFo4Nvf2GZ8f5E2Asz98JY2d7UcaDykqYm1zpoi',
      //   new BN(50000000000000)
      // )

      transferKarFromKaruraToCalamari(
        api,
        externalAccountSigner,
        txResHandler,
        'dmyjURuBeJwFo4Nvf2GZ8f5E2Asz98JY2d7UcaDykqYm1zpoi',
        new BN(1000000000000000)
      );




    };
    // xcm()
  }, [api, externalAccountSigner]);


  const { signerVersion } = usePrivateWallet();
  const onMobile = userIsMobile();

  // let warningModal;
  // if (config.DOWNTIME) {
  //   warningModal = <DowntimeModal />;
  // } else if (onMobile) {
  //   warningModal = <MobileNotSupportedModal />;
  // } else if (signerIsOutOfDate(signerVersion)) {
  //   warningModal = <NewerSignerVersionRequiredModal />;
  // } else {
  //   warningModal = <MissingRequiredSoftwareModal />;
  // }

  document.title = config.PAGE_TITLE;

  return (
    <div className="main-app bg-primary flex">
      <Sidebar />
      {/* {warningModal} */}
      <Switch>
        <Route path="/" render={() => <Redirect to="/transact" />} exact />
        <Route path="/send" render={() => <Redirect to="/transact" />} exact />
        <Route path="/transact" component={SendPage} exact />
        <Route path="/bridge" component={BridgePage} exact />
      </Switch>
      <div className="p-4 hidden change-theme lg:block fixed right-0 bottom-0">
        <ThemeToggle />
      </div>
    </div>
  );
}

export default withRouter(MainApp);


