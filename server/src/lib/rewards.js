// Reward/penalty amounts — all in CENTS (integers)
// Task.rewardCents / penaltyLateCents / penaltyMissCents are the per-task
// overrides; these constants are the system defaults.
const REWARD_ONTIME_CENTS  =   2;  // +$0.02
const PENALTY_LATE_CENTS   =  -5;  // -$0.05
const PENALTY_MISS_CENTS   = -10;  // -$0.10

/**
 * Returns the default cent amount for a given completion status.
 * For tasks with custom reward values use task.rewardCents directly.
 */
function calcRewardCents(status) {
  if (status === 'done')    return REWARD_ONTIME_CENTS;
  if (status === 'late')    return PENALTY_LATE_CENTS;
  if (status === 'missing') return PENALTY_MISS_CENTS;
  return 0;
}

function formatCents(cents) {
  const abs = Math.abs(cents);
  const sign = cents < 0 ? '-' : '+';
  return `${sign}$${(abs / 100).toFixed(2)}`;
}

function describeReward(status) {
  if (status === 'done')    return `${formatCents(REWARD_ONTIME_CENTS)} (on-time)`;
  if (status === 'late')    return `${formatCents(PENALTY_LATE_CENTS)} (late)`;
  if (status === 'missing') return `${formatCents(PENALTY_MISS_CENTS)} (missing)`;
  return '$0.00';
}

module.exports = {
  calcRewardCents,
  formatCents,
  describeReward,
  REWARD_ONTIME_CENTS,
  PENALTY_LATE_CENTS,
  PENALTY_MISS_CENTS,
};
