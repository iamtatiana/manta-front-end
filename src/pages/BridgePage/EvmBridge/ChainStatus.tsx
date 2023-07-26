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
    <div className="flex flex-row	text-white pt-6">
      {chainList.map((item: Chain, index: number) => {
        return (
          <div key={index} className="flex-1 flex justify-center items-center">
            <div
              className="px-2 py-1 flex flex-row border border-white border-opacity-40 rounded-2xl bg-white bg-opacity-20 bg-manta-blue"
              style={
                item.status > 0
                  ? item.status === 1
                    ? successChainName
                    : failedChainName
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
