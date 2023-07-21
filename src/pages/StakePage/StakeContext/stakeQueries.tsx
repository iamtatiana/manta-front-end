// @ts-nocheck
import Decimal from 'decimal.js';
import * as axios from 'axios';
import Balance from 'types/Balance';
import BN from 'bn.js';
import Delegation from 'types/Delegation';
import {
  MAX_DELEGATIONS,
  POINTS_PER_BLOCK,
  SECONDS_PER_BLOCK
} from '../StakeConstants';

// Get the proportion of delegated rewards paid to colators
export const getCollatorComission = async (api) => {
  const collatorComissionRaw =
    await api.query.parachainStaking.collatorCommission();
  return new Decimal(collatorComissionRaw.toHuman().slice(0, -1)).div(
    new Decimal(100)
  );
};

// Gets total native token issuance across all accounts
const _getTotalIssuance = async (api, config) => {
  const totalIssuanceRaw = await api.query.balances.totalIssuance();
  return Balance.Native(config, new BN(totalIssuanceRaw.toString()));
};

// Gets approximate amount of the new native token generated yearly
export const getAnnualInflation = async (api, config) => {
  const totalIssuance = await _getTotalIssuance(api, config);
  const inflationConfig = await api.query.parachainStaking.inflationConfig();
  const annualInflationPercent = new Decimal(
    inflationConfig.annual.ideal.toHuman().slice(0, -1)
  );
  const annualInflationRatio = annualInflationPercent.div(100);
  const totalIssuanceAtomicUnits = new Decimal(
    totalIssuance.valueAtomicUnits.toString()
  );
  const annualInflationAtomicUnits =
    totalIssuanceAtomicUnits.mul(annualInflationRatio);
  return Balance.Native(
    config,
    new BN(annualInflationAtomicUnits.round().toFixed())
  );
};

// Gets active status for a list of collator addresses
export const getCollatorsAreActive = async (api, collatorAddresses) => {
  const activeCollators = (
    await api.query.parachainStaking.selectedCandidates()
  ).map((collator) => collator.toString());
  return collatorAddresses.map((address) => activeCollators.includes(address));
};

// Gets various collator info provided by the candidateInfo query
export const getCollatorCandidateInfo = async (
  api,
  config,
  collatorAddresses
) => {
  const statsListRaw = await api.query.parachainStaking.candidateInfo.multi(
    collatorAddresses
  );
  return statsListRaw
    .filter((candidateInfo) => !candidateInfo.isNone)
    .map((candidateInfo) => {
      return {
        balanceSelfBonded: Balance.Native(
          config,
          new BN(candidateInfo.value.bond.toString())
        ),
        balanceEffectiveBonded: Balance.Native(
          config,
          new BN(candidateInfo.value.totalCounted.toString())
        ),
        delegationCount: candidateInfo.value.delegationCount.toNumber(),
        lowestTopDelegationAmount: Balance.Native(
          config,
          new BN(candidateInfo.value.lowestTopDelegationAmount.toString())
        )
      };
    });
};

// Gets all delegations for the given address
export const getDelegations = async (api, config, userAddress) => {
  const delegatorState = await api.query.parachainStaking.delegatorState(
    userAddress
  );
  const delegationsRaw = delegatorState.isSome
    ? delegatorState.value.delegations
    : [];
  return delegationsRaw.map((delegationRaw) => {
    const delegatedBalance = Balance.Native(
      config,
      new BN(delegationRaw.amount.toString())
    );
    return new Delegation(delegationRaw.owner.toString(), delegatedBalance);
  });
};

// Gets the number of blocks that this collator authored during the previous round
export const getBlocksPreviousRound = async (api, round, collatorAddresses) => {
  if (round.current === 0) {
    return 0;
  }
  const args = collatorAddresses.map((address) => [round.current - 1, address]);
  const pointsPreviousRoundRaw =
    await api.query.parachainStaking.awardedPts.multi(args);
  return pointsPreviousRoundRaw.map(
    (pointsRaw) => pointsRaw.toNumber() / POINTS_PER_BLOCK
  );
};

// Gets the user's total rewards across all delegations for the past round
// and time since reward payout
export const getUserTotalRecentRewards = async (api, config, userAddress) => {
  const round = await api.query.parachainStaking.round();
  const currentBlockNumber = (await api.query.system.number()).toString();
  const startBlockNumber = round.first.toString();
  const blockRangeQueryString = `${startBlockNumber}-${currentBlockNumber}`;
  const res = await axios.post(
    'https://calamari.api.subscan.io/api/scan/account/reward_slash',
    {
      block_range: blockRangeQueryString,
      row: MAX_DELEGATIONS,
      page: 0,
      address: userAddress,
      category: 'Reward'
    }
  );
  const userTotalRecentRewardsRaw = res.data.data.list || [];
  const userTotalRecentRewards = userTotalRecentRewardsRaw
    .map((raw) => Balance.Native(config, new BN(raw.amount)))
    .reduce(
      (partialSum, reward) => reward.add(partialSum),
      Balance.Native(config, new BN(0))
    );
  const secondsSinceReward =
    (currentBlockNumber - round.first.toNumber()) * SECONDS_PER_BLOCK;

  return {
    userTotalRecentRewards,
    secondsSinceReward
  };
};
