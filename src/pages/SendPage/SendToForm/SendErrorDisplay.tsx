import { useConfig } from 'contexts/configContext';
import { useGlobal } from 'contexts/globalContexts';
import AssetType from 'types/AssetType';
import { useSend } from '../SendContext';

const SendErrorDisplay = () => {
  const config = useConfig();
  const nativeTokenTicker = AssetType.Native(config).ticker;

  const { txWouldDepleteSuggestedMinFeeBalance } = useSend();
  const { suggestedMinFeeBalance } = useGlobal();

  const shouldShowRetainFeeWarning = txWouldDepleteSuggestedMinFeeBalance();

  const shouldRetainFeeWarningText = `Please reserve some ${nativeTokenTicker} for future transaction fees. The current fee is about ${suggestedMinFeeBalance} ${nativeTokenTicker} per transaction.`;

  return (
    <>
      {shouldShowRetainFeeWarning ? (
        <div className="mt-4 send-error-display text-warning border-2 border-warning bg-light-warning pl-4 p-3 rounded-md text-sm">
          {shouldRetainFeeWarningText}
        </div>
      ) : null}
    </>
  );
};

export default SendErrorDisplay;
