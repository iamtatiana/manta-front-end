// @ts-nocheck
import { useMantaWallet } from 'contexts/mantaWalletContext';
import SendToAddressForm from './SendToAddressForm';

const INTERNAL_ACCOUNT_LABEL = 'Private';

const toReactSelectOption = (address) => {
  return {
    value: { address },
    label: INTERNAL_ACCOUNT_LABEL
  };
};

const SendToPrivateAddressForm = () => {
  const { privateAddress } = useMantaWallet();
  const options = privateAddress ? [privateAddress] : [];

  return (
    <SendToAddressForm
      options={options}
      toReactSelectOption={toReactSelectOption}
      isPrivate={true}
    />
  );
};

export default SendToPrivateAddressForm;
