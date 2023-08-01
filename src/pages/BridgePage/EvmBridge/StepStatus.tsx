// @ts-nocheck
import Icon, { IconName } from 'components/Icon';
import { useEffect, useState } from 'react';
import { getCaptcha } from 'utils/api/evmBridgeFaucet';

const failedColor = '#F9413E';
const successColor = '#2EE9A5';

const borderStyle = {
  borderBottomWidth: '1px',
  borderColor: 'rgba(255,255,255,0.2)'
};

type Step = {
  index: number;
  title: string;
  subtitle: string;
  status: number;
  subtitleWarning: boolean;
};

// Step steps
const StepStatus = ({
  steps,
  ethAddress,
  captcha,
  setCaptcha,
  currentButtonIndex
}: {
  steps: Array<Step>;
  ethAddress: string;
  captcha: string;
  setCaptcha: React.Dispatch<React.SetStateAction<string>>;
  currentButtonIndex: number;
}) => {
  const [captchaImg, setCaptchaImg] = useState('');

  const fetch = async () => {
    if (!ethAddress) return;
    const captchaRes = await getCaptcha(ethAddress);
    setCaptchaImg(captchaRes.data);
  };

  const handleInputChange = (e) => {
    setCaptcha(e.target.value);
  };

  useEffect(() => {
    fetch();
  }, [ethAddress]);

  return (
    <div className="flex items-center justify-center py-10">
      <div className="flex flex-col text-white">
        {steps.map((item, index) => {
          return (
            <div
              key={index}
              className="basis-1/3 flex flex-row items-center justify-content py-4"
              style={index < 2 ? borderStyle : {}}>
              <StepNumberIndicator currentStep={item} />

              <div className="pl-10">
                <p className="text-sm	font-semibold">{item.title}</p>
                <p
                  className={
                    item.subtitleWarning
                      ? 'text-sm text-white text-opacity-60 text-red-warning'
                      : 'text-sm text-white text-opacity-60'
                  }>
                  {item.subtitle}
                </p>
                {index === 1 && currentButtonIndex === 5 && (
                  <div className="mt-3">
                    <div
                      className="cursor-pointer h-10 rounded-lg inline-block"
                      onClick={fetch}
                      dangerouslySetInnerHTML={{ __html: captchaImg }}
                    />
                    <div className="block mb-2">
                      To continue, type the characters above:
                    </div>
                    <input
                      className="placeholder-gray-500 rounded bg-primary h-10 px-3"
                      placeholder="please type the captcha"
                      value={captcha}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Step number indicator
const StepNumberIndicator = ({ currentStep }: { currentStep: Step }) => {
  const containerStyle =
    'w-8 h-8 flex items-center justify-center rounded-full bg-white';
  const successStyle = { backgroundColor: successColor, border: 'none' };
  const failedStyle = { backgroundColor: failedColor, border: 'none' };
  const iconStyle = 'w-5 h-5 rounded-full';

  // status, 0 = default, 1 = success, 2 = failed, 3 = pending
  if (currentStep.status === 1) {
    // return success number indicator
    return (
      <div className={containerStyle} style={successStyle}>
        <Icon className={iconStyle} name={'successIcon' as IconName} />
      </div>
    );
  } else if (currentStep.status === 2) {
    // return failed number indicator
    return (
      <div className={containerStyle} style={failedStyle}>
        <Icon className={iconStyle} name={'failedIcon' as IconName} />
      </div>
    );
  } else if (currentStep.status === 3) {
    // return pending number indicator
    return (
      <div className={[containerStyle, ' bg-white']}>
        <div>
          <div
            style={{ borderTopColor: 'transparent' }}
            className="w-4 h-4 border-4 border-black border-dotted rounded-full animate-spin"
          />
        </div>
      </div>
    );
  }
  // return default number indicator
  return (
    <div className={[containerStyle, 'border-white border rounded-full']}>
      <p className="text-xl text-white">{currentStep.index}</p>
    </div>
  );
};

export default StepStatus;
