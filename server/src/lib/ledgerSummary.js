const TASK_OUTCOME_PREFIX = '[task-outcome]';

function cents(value) {
  return Number.isFinite(Number(value)) ? Math.round(Number(value)) : 0;
}

/**
 * Analytics scoring spec:
 *
 * Status                              | Base  | Late penalty (if submitted after dueDate)
 * ------------------------------------+-------+-------------------------------------------
 * pending / in_progress               | 0.00  | —
 * pending_review (submitted on/before)| +0.01 | —
 * pending_review (submitted after)    | +0.01 | −0.05  → net −0.04
 * done — approved (on time)           | +0.02 | —
 * done — approved (late)              | +0.02 | −0.05  → net −0.03
 * needs_revision (review needed)      | −0.01 | −0.05 if late → net −0.06
 * needs_revision (resubmission needed)| −0.03 | −0.05 if late → net −0.08
 * missing                             | −0.10 | —  (missing already implies not on time)
 *
 * All values stored as integer cents (100 cents = $1.00 display unit).
 * The caller passes task.rewardCents / task.penaltyLateCents / task.penaltyMissCents
 * from the DB row, so this function is pure and testable.
 *
 * "Resubmission needed" vs "review needed" is distinguished by whether a
 * prior submission exists on the task (submissions.length > 0 when the task
 * is set back to needs_revision for the second+ time). The caller may pass
 * `isResubmission: true` to trigger the −0.03 tier.
 */
function describeOutcome({ task, status, submittedAt, isResubmission = false }) {
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const effectiveSubmit = submittedAt ? new Date(submittedAt) : null;
  const isLate = Boolean(dueDate) && Boolean(effectiveSubmit) && effectiveSubmit > dueDate;
  const latePenalty = isLate ? Math.abs(cents(task.penaltyLateCents)) : 0;

  // Not started / in progress — nothing scored yet
  if (status === 'pending' || status === 'in_progress') {
    return {
      amount: 0,
      label: `${TASK_OUTCOME_PREFIX} Pending: ${task.title}`,
      outcome: 'pending',
    };
  }

  // Missing — did not submit on time
  if (status === 'missing') {
    return {
      amount: -Math.abs(cents(task.penaltyMissCents)),
      label: `${TASK_OUTCOME_PREFIX} Missed: ${task.title}`,
      outcome: 'missed',
    };
  }

  // Submitted for review (awaiting approval)
  if (status === 'pending_review') {
    const base = Math.abs(cents(task.rewardCents)) > 0
      ? Math.round(cents(task.rewardCents) * 0.01 / 0.02)  // scale: submitted = half reward
      : 1; // fallback: 1 cent = +0.01 display unit
    // Use a fixed 1-cent submitted signal so display always shows +0.01
    const submittedCents = 1;
    const amount = submittedCents - latePenalty;
    return {
      amount,
      label: isLate
        ? `${TASK_OUTCOME_PREFIX} Submitted late (pending review): ${task.title}`
        : `${TASK_OUTCOME_PREFIX} Submitted on time (pending review): ${task.title}`,
      outcome: isLate ? 'submitted_late' : 'submitted_on_time',
    };
  }

  // Approved
  if (status === 'done') {
    const rewardCents = Math.abs(cents(task.rewardCents));
    const amount = rewardCents - latePenalty;
    return {
      amount,
      label: isLate
        ? `${TASK_OUTCOME_PREFIX} Approved late: ${task.title}`
        : `${TASK_OUTCOME_PREFIX} Approved on time: ${task.title}`,
      outcome: isLate ? 'approved_late' : 'approved_on_time',
    };
  }

  // Needs revision — resubmission tier (−0.03) vs first review-needed tier (−0.01)
  if (status === 'needs_revision') {
    const basePenalty = isResubmission ? 3 : 1; // 3 cents or 1 cent
    const amount = -(basePenalty + latePenalty);
    return {
      amount,
      label: isResubmission
        ? `${TASK_OUTCOME_PREFIX} Resubmission needed: ${task.title}`
        : `${TASK_OUTCOME_PREFIX} Review needed: ${task.title}`,
      outcome: isResubmission ? 'resubmission_needed' : 'review_needed',
    };
  }

  // Fallback — treat anything else as pending
  return {
    amount: 0,
    label: `${TASK_OUTCOME_PREFIX} Pending: ${task.title}`,
    outcome: 'pending',
  };
}

async function syncTaskOutcomeLedger(prisma, { userId, task, status, submittedAt, isResubmission }) {
  const desired = describeOutcome({ task, status, submittedAt, isResubmission });
  const existing = await prisma.ledgerEntry.findMany({
    where: {
      userId,
      taskId: task.id,
      reason: { startsWith: TASK_OUTCOME_PREFIX },
    },
    orderBy: { createdAt: 'asc' },
  });

  const currentAmount = existing.reduce((sum, entry) => sum + cents(entry.amount), 0);
  const delta = desired.amount - currentAmount;

  if (delta === 0) {
    return { ...desired, delta: 0, currentAmount };
  }

  await prisma.ledgerEntry.create({
    data: {
      userId,
      taskId: task.id,
      amount: delta,
      reason: desired.label,
    },
  });

  return { ...desired, delta, currentAmount };
}

async function getLedgerSummary(prisma, userId) {
  const now = new Date();
  const overdueFloor = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [allEntries, recentEntries, statusGroups, overdueRaw, lateCount, missedCount, onTimeCount] =
    await Promise.all([
      prisma.ledgerEntry.findMany({
        where: { userId },
        select: { amount: true },
      }),

      prisma.ledgerEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 40,
        include: {
          task: { select: { id: true, title: true, category: true, status: true } },
        },
      }),

      prisma.task.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      prisma.task.findMany({
        where: {
          dueDate: { gte: overdueFloor, lte: now },
          status: { notIn: ['done', 'missing', 'pending_review'] },
        },
        select: { id: true, title: true, category: true, status: true, dueDate: true },
        orderBy: { dueDate: 'asc' },
        take: 20,
      }),

      prisma.task.count({
        where: {
          status: 'done',
          submissions: {
            some: { userId, submittedAt: { not: null } },
          },
        },
      }),

      prisma.task.count({ where: { status: 'missing' } }),

      prisma.task.count({ where: { status: 'done' } }),
    ]);

  const balanceCents = allEntries.reduce((sum, e) => sum + cents(e.amount), 0);
  const totalEarnedCents = allEntries
    .filter(e => cents(e.amount) > 0)
    .reduce((sum, e) => sum + cents(e.amount), 0);
  const totalPenaltyCents = Math.abs(
    allEntries
      .filter(e => cents(e.amount) < 0)
      .reduce((sum, e) => sum + cents(e.amount), 0)
  );

  const statusCounts = statusGroups.reduce((acc, row) => {
    acc[row.status] = row._count.status;
    return acc;
  }, {});

  const computedOnTime = Math.max(0, onTimeCount - lateCount);

  return {
    balanceCents,
    totalEarnedCents,
    totalPenaltyCents,
    onTimeCount: computedOnTime,
    lateCount,
    missedCount,
    statusCounts,
    entries: recentEntries,
    overdueTasks: overdueRaw,
  };
}

module.exports = {
  TASK_OUTCOME_PREFIX,
  cents,
  describeOutcome,
  syncTaskOutcomeLedger,
  getLedgerSummary,
};
