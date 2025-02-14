import React from 'react';
import Icon from 'components/Icon';
import { IbannnerProps } from './index';
const IncentiveAllowBanner: React.FC<IbannnerProps> = (props) => {
  return (
    <div
      className={props.className + ' bg-trading-whitelist-banner'}
      onClick={() =>
        window.open(
          'https://activity.manta.network/the-manta-shield/extended-week'
        )
      }>
      <div className="mr-4 font-red-hat-mono text-white">
        Enjoy the extend week! Earn 20000% of your gas fee paid!
      </div>
      <div className="mr-4 font-red-hat-mono text-white">
        Find more details here
      </div>
      <Icon className="w-6 h-6 cursor-pointer" name="activityRightArrow" />
    </div>
  );
};
export default IncentiveAllowBanner;
