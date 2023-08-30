import { xTokenContractAddressList, xTokenContractAddressListType } from './EthXCM';

export const transferMRLAssetsFromMantaToMoonbeam = async (originChainAPI: any, mantaAccount: any, moonbeamAddress: string, token: keyof xTokenContractAddressListType, amount: string, handleTxRes: any) => {
  
  // Create the transferMultiasset extrinsic
  const transferMultiassets = originChainAPI.tx.xTokens.transferMultiassets(
    {
      V1: [
        {
          // xcDEV
          id: {
            Concrete: {
              parents: 1,
              interior: {
                X2: [
                  { Parachain: 2004 }, // Parachain ID
                  { PalletInstance: 10 }, // Index of the Balances Pallet
                ],
              },
            },
          },
          fun: {
            Fungible: '56362740000000000', // GLMR as an estimation for XCM and EVM transaction fee
          },
        },
        {
          // Local XC-20 token
          id: {
            Concrete: {
              parents: 1,
              interior: {
                X3: [
                  { Parachain: 2004 }, // Parachain ID
                  { PalletInstance: 110 }, // Index of the ERC-20 XCM Bridge Pallet
                  {
                    AccountKey20: {
                      key: xTokenContractAddressList[token],
                    },
                  },
                ],
              },
            },
          },
          fun: {
            Fungible: amount,
          },
        },
      ],
    },
    0,
    {
      V1: {
        parents: 1,
        interior: {
          X2: [
            { Parachain: 2004 },
            { AccountKey20: { key: moonbeamAddress } },
          ],
        },
      },
    },
    'Unlimited'
  ); 

  await transferMultiassets.signAndSend(mantaAccount.address, { nonce: -1, signer: mantaAccount.signer }, handleTxRes);
};