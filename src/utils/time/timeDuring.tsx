const giantSquidStartTimeStr =
  'Thu Mar 16 2023 00:00:00 GMT+0800 (中国标准时间)';
const giantSquidEndTimeStr = 'Fri Mar 31 2023 00:00:00 GMT+0800 (中国标准时间)';

const tradingIncentiveStartTimeStr = 'Apr 28 2023 12:00:00 UTC';
const tradingIncentiveEndTimeStr = 'Jun 02 2023 2:00:00 UTC';

const incentiveAllowStartTimeStr = 'Jul 10 2023 14:00:00 UTC';
const incentiveAllowEndTimeStr = 'Jul 17 2023 14:00:00 UTC';

export const getGiantSquidBannerIsActive = (): boolean => {
  return getTimeWindowIsActive(
    new Date(),
    new Date(giantSquidStartTimeStr),
    new Date(giantSquidEndTimeStr)
  );
};
export const getTradingIncentiveBannerIsActive = (): boolean => {
  return getTimeWindowIsActive(
    new Date(),
    new Date(tradingIncentiveStartTimeStr),
    new Date(tradingIncentiveEndTimeStr)
  );
};
export const getIncentiveAllowListBannerIsActive = (): boolean => {
  return getTimeWindowIsActive(
    new Date(),
    new Date(incentiveAllowStartTimeStr),
    new Date(incentiveAllowEndTimeStr)
  );
};
export const getTimeWindowIsActive = (
  time: Date,
  startTime: Date,
  endTime: Date
): boolean => {
  const targetTimeStamp = new Date(time.toUTCString()).getTime();
  const startTimeStamp = new Date(startTime.toUTCString()).getTime();
  const endTimeStamp = new Date(endTime.toUTCString()).getTime();
  if (targetTimeStamp <= endTimeStamp && targetTimeStamp >= startTimeStamp) {
    return true;
  }
  return false;
};
