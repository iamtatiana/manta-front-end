// @ts-nocheck
import configCommon from './common.json';
import configCalamari from './calamari.json';
import configManta from './manta.json';

// Using `require` as `import` does not support dynamic loading (yet).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const configEnv = require(`./${process.env.NODE_ENV}.json`);

// Accepting React env vars and aggregating them into `config` object.
const envVarNames = [];
const envVars = envVarNames.reduce((mem, n) => {
  // Remove the `REACT_APP_` prefix
  if (process.env[n] !== undefined) mem[n.slice(10)] = process.env[n];
  return mem;
}, {});

export const calamariConfig = { ...configCommon, ...configCalamari, ...configEnv, ...envVars };
calamariConfig.PROVIDER_SOCKET = calamariConfig.CALAMARI_SOCKET;

export const mantaConfig = { ...configCommon, ...configManta, ...configEnv, ...envVars };
mantaConfig.PROVIDER_SOCKET = mantaConfig.MANTA_SOCKET;
