# Manta Front End

Web app for interacting with Manta Network and Calamari Network, and Dolphin Testnet

## Getting started (for opensource development)

1. Clone the repo.

   `git clone git@github.com:Manta-Network/manta-front-end.git`
2. Change to the repo directory.

   `cd manta-front-end`

3. Install dependencies and start the dev server, waiting for hmr working.

   `yarn && yarn start`

4. Clone manta-signer repo.

   `git clone git@github.com:Manta-Network/manta-signer.git`

5. Change to the tauri-ui directory.

   `cd manta-signer/ui/src-tauri`

6. Install tauri and build manta-signer locally.

    ```bash
    cargo install tauri-cli

    cargo tauri build --features=unsafe-disable-cors
    ```

7. Open the local disable-cors version of manta-signer by following [guides](https://docs.manta.network/docs/guides/MantaSigner).

8. Follow [guides](https://docs.manta.network/docs/guides/DolphinPay) and try MantaPay on Dolphin Testnet.

9. Happy coding!

## Versioning

The first digit of the version (x in x.y.z) refers to exceptional massive changes across manta front end, other full stack repositories, and the runtime, such as the upgrade to testnet V2 (reusable addresses, major cryptographic changes).

The second digit of the version (y in x.y.z) refers to other changes that are coordinated across multiple full stack repositories, and perhaps also the runtime. For example, an upgraded `manta-wasm-wallet` syncing protocol requiring changes to `manta-front-end`, `manta-wasm-wallet` in sdk, and the runtime would fall under this category.

The third digit of the version (z in x.y.z) refers to changes that only affect the front end. A UI restyle would fall under this category.
