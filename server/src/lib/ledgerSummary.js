const TASK_OUTCOME_PREFIX = '[task-outcome]';

function cents(value) {
  return Number.isFinite(Number(value)) ? Math.round(Number(value)) : 0;
}

function describeOutcome({ task, status, submittedAt }) {
  if (status === 'missing') {
    return {
      amount: -Math.abs(cents(task.penaltyMissCents)),
      label: `${TASK_OUTCOME_PREFIX} Missed: ${task.title}`,
      outcome: 'missed',
    };
  }

  if (status !== 'done') {
    return {
      amount: 0,
      label: `${TASK_OUTCOME_PREFIX} Pending: ${task.title}`,
      outcome: 'pending',
    };
  }

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const effectiveCompletion = submittedAt ? new Date(submittedAt) : new Date();
  const isLate = Boolean(dueDate) && effectiveCompletion > dueDate;

  if (isLate) {
    return {
      amount: cents(task.rewardCents) - Math.abs(cents(task.penaltyLateCents)),
      label: `${TASK_OUTCOME_PREFIX} Approved late: ${task.title}`,
      outcome: 'late',
    };
  }

  return {
    amount: cents(task.rewardCents),
    label: `${TASK_OUTCOME_PREFIX} Approved on time: ${task.title}`,
    outcome: 'on_time',
  };
}

async function syncTaskOutcomeLedger(prisma, { userId, task, status, submittedAt }) {
  const desired = describeOutcome({ task, status, submittedAt });
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

  // All ledger math — single table, no task join needed
  const [allEntries, recentEntries, statusGroups, overdueRaw, lateCount, missedCount, onTimeCount] =
    await Promise.all([
      // Balance / earned / penalty totals
      prisma.ledgerEntry.findMany({
        where: { userId },
        select: { amount: true },
      }),

      // Recent entries feed for the page
      prisma.ledgerEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 40,
        include: {
          task: { select: { id: true, title: true, category: true, status: true } },
        },
      }),

      // Status counts via groupBy — never loads task rows
      prisma.task.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Overdue tasks — capped 14-day window, max 20 rows
      prisma.task.findMany({
        where: {
          dueDate: { gte: overdueFloor, lte: now },
          status: { notIn: ['done', 'missing', 'pending_review'] },
        },
        select: { id: true, title: true, category: true, status: true, dueDate: true },
        orderBy: { dueDate: 'asc' },
        take: 20,
      }),

      // Late approved count
      prisma.task.count({
        where: {
          status: 'done',
          submissions: {
            some: {
              userId,
              submittedAt: { not: null },
            },
          },
        },
      }),

      // Missed count
      prisma.task.count({ where: { status: 'missing' } }),

      // On-time count (done - late)
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

  // onTimeCount = done total minus late (approximation without full scan)
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
