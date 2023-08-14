// @ts-nocheck
import Icon, { IconName } from 'components/Icon';

type Chain = {
  name: string;
  logo: string;
  status: number;
};

// Source chain to destination chain
const ChainStatus = ({ chainList }: { chainList: Array }) => {
  const successChainName = {
    backgroundColor: 'rgba(0, 175, 165, 0.2)',
    borderColor: 'rgba(0, 175, 165, 0.4)'
  };

  const failedChainName = {
    backgroundColor: 'rgba(249, 65, 62, 0.2)',
    borderColor: 'rgba(249, 65, 62, 0.4)'
  };
  return (
    <div className="flex flex-row	text-white pt-4">
      {chainList.map((item: Chain, index: number) => {
        // status, 0 = default, 1 = success, 2 = failed, 3 = pending
        const status = item.status;
        return (
          <div key={index} className="flex-1 flex justify-center items-center">
            <div
              className="px-2 py-1 flex flex-row border border-white border-opacity-40 rounded-2xl bg-white bg-opacity-20 bg-manta-blue"
              style={
                status > 0 && status < 3
                  ? status === 2
                    ? failedChainName
                    : successChainName
                  : {}
              }>
              <Icon
                className="w-6 h-6 rounded-full"
                name={item.logo as IconName}
              />
              <p className="text-base	pl-2">{item.name}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChainStatus;
