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

async function getLedgerSummary(prisma, userId, { limit = 40 } = {}) {
  const [entries, tasks] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
          },
        },
      },
    }),
    prisma.task.findMany({
      orderBy: [{ dueDate: 'asc' }, { title: 'asc' }],
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        dueDate: true,
        rewardCents: true,
        penaltyLateCents: true,
        penaltyMissCents: true,
        submissions: {
          where: { userId },
          orderBy: { submittedAt: 'desc' },
          take: 1,
          select: { submittedAt: true, status: true },
        },
      },
    }),
  ]);

  const allEntries = await prisma.ledgerEntry.findMany({ where: { userId } });
  const balanceCents = allEntries.reduce((sum, entry) => sum + cents(entry.amount), 0);
  const totalEarnedCents = allEntries
    .filter(entry => cents(entry.amount) > 0)
    .reduce((sum, entry) => sum + cents(entry.amount), 0);
  const totalPenaltyCents = Math.abs(
    allEntries
      .filter(entry => cents(entry.amount) < 0)
      .reduce((sum, entry) => sum + cents(entry.amount), 0)
  );

  const entrySumsByTask = new Map();
  for (const entry of allEntries) {
    if (!entry.taskId) continue;
    entrySumsByTask.set(entry.taskId, (entrySumsByTask.get(entry.taskId) || 0) + cents(entry.amount));
  }

  let onTimeCount = 0;
  let lateCount = 0;
  let missedCount = 0;

  const taskBreakdown = tasks.map(task => {
    const actualCents = entrySumsByTask.get(task.id) || 0;
    const latestSubmission = task.submissions[0] || null;
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const submittedLate = Boolean(
      dueDate &&
      latestSubmission?.submittedAt &&
      new Date(latestSubmission.submittedAt) > dueDate
    );

    if (task.status === 'missing') {
      missedCount += 1;
    } else if (task.status === 'done' && submittedLate) {
      lateCount += 1;
    } else if (task.status === 'done') {
      onTimeCount += 1;
    }

    return {
      taskId: task.id,
      title: task.title,
      category: task.category,
      status: task.status,
      potentialRewardCents: cents(task.rewardCents),
      actualCents,
      actualEarnedCents: Math.max(0, actualCents),
      penaltiesAppliedCents:
        actualCents < 0
          ? Math.abs(actualCents)
          : Math.max(0, cents(task.rewardCents) - actualCents),
    };
  });

  const statusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  const overdueTasks = tasks
    .filter(task => task.dueDate && new Date(task.dueDate) < new Date() && !['done', 'missing', 'pending_review'].includes(task.status))
    .slice(0, 20)
    .map(task => ({
      id: task.id,
      title: task.title,
      category: task.category,
      status: task.status,
      dueDate: task.dueDate,
    }));

  return {
    balanceCents,
    totalEarnedCents,
    totalPenaltyCents,
    onTimeCount,
    lateCount,
    missedCount,
    statusCounts,
    entries,
    taskBreakdown,
    overdueTasks,
  };
}

module.exports = {
  TASK_OUTCOME_PREFIX,
  cents,
  describeOutcome,
  syncTaskOutcomeLedger,
  getLedgerSummary,
};
