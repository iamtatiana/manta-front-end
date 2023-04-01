import React from 'react';
import Icon from 'components/Icon';

const GiantSquidBanner: React.FC<object> = () => {
  return (
    <div
      className={
        'flex h-68 cursor-pointer items-center justify-center bg-giant-squid font-red-hat-mono text-sm font-semibold leading-19 text-banner'
      }
      onClick={() =>
        window.open('https://galxe.com/mantanetwork/campaigns')
      }>
      <div className="mr-4">
        KMA holders can participate in the Giant Squid Program on Galxe.com now!
      </div>
      <div className="mr-4">Find more details here</div>
      <Icon className="w-6 h-6 cursor-pointer" name="activityRightArrow" />
    </div>
  );
};
export default GiantSquidBanner;
