import Balance from 'types/Balance';

const getZkTransactBalanceText = (
  balance: Balance | null,
  apiIsDisconnected: boolean
) => {
  if (apiIsDisconnected) {
    return 'Connecting to network';
  }else if (balance) {
    return `Balance: ${balance.toString()}`;
  } else {
    return '';
  }
};

export default getZkTransactBalanceText;
