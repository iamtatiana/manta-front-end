import React from 'react';
import { useConfig } from 'contexts/configContext';
import DowntimeModal from 'components/Modal/downtimeModal';
import MobileNotSupportedModal from 'components/Modal/mobileNotSupported';
import userIsMobile from 'utils/ui/userIsMobile';
import CalamariFooter from 'components/Footer';
import AccountDisplay from './AccountDisplay';
import StakingTable from './Tables/StakingTable';
import UnstaktingTable from './Tables/UnstakingTable';
import CollatorsTable from './Tables/CollatorsTable';

const StakePageContent = () => {
  const config = useConfig();

  document.title = config.PAGE_TITLE;

  let warningModal = <div />;
  if (config.DOWNTIME) {
    warningModal = <DowntimeModal />;
  } else if (userIsMobile()) {
    warningModal = <MobileNotSupportedModal />;
  }

  return (
    <div className="flex flex-col gap-6 items-center">
      <div className="mx-auto staking-table px-10 pt-2 pb-10 w-full">
        {warningModal}
        <AccountDisplay />
        <StakingTable />
        <UnstaktingTable />
        <CollatorsTable />
        <CalamariFooter />
      </div>
    </div>
  );
};

export default StakePageContent;
