import {
  useZkAccountBalances,
  ZkAccount
} from 'contexts/zkAccountBalancesContext';
import { usePrivateWallet } from 'contexts/privateWalletContext';
import PrivateAssetItem from './PrivateAssetItem';

const PrivateAssetTableContent = () => {
  const { zkAccounts } = useZkAccountBalances();
  const { balancesAreStaleRef, isInitialSync } = usePrivateWallet();
  const nonzeroAccounts = zkAccounts?.filter(
    (account: ZkAccount) => account && !account.privateBalance.isZero()
  );

  if (nonzeroAccounts?.length) {
    return (
      <div className="divide-y divide-dashed divide-manta-gray-secondary">
        {nonzeroAccounts.map((zkAccount: ZkAccount) => (
          <PrivateAssetItem zkAccount={zkAccount} key={zkAccount.assetType.assetId} />
        ))}
      </div>
    );
  } else if (balancesAreStaleRef.current || isInitialSync.current) {
    return <div className="whitespace-nowrap text-center mt-6">Syncing...</div>;
  } else {
    return (
      <div className="whitespace-nowrap text-center mt-6">
        You have no zkAssets yet.
      </div>
    );
  }
};

export default PrivateAssetTableContent;
