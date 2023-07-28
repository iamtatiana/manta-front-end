// @ts-nocheck

const failedColor = '#F9413E';
const successColor = '#2EE9A5';

type Chain = {
  name: string;
  logo: string;
  status: number;
};

// Indicator
const Indicator = ({ chainList }: { chainList: Array<Chain> }) => {
  const indicator = ['dot', 'dot', 'dot'];
  const successIndicator = { backgroundColor: successColor };
  const failedIndicator = { backgroundColor: failedColor };
  return (
    <div className="flex flex-row pt-6 justify-center items-center">
      {indicator.map((item, index) => {
        const status = chainList[index].status;
        return (
          <div key={index} className="flex flex-row">
            <div className="px-4 flex items-center justify-center">
              <div
                className="w-2 h-2 rounded-full bg-white "
                style={
                  status > 0
                    ? status === 2
                      ? failedIndicator
                      : successIndicator
                    : {}
                }
              />
            </div>
            {index + 1 < indicator.length && (
              <div className="px-4 flex items-center justify-center	">
                <div
                  className="w-30 h-px bg-white bg-opacity-70"
                  style={status === 1 ? successIndicator : {}}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Indicator;
