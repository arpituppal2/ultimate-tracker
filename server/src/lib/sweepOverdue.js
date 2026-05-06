const { syncTaskOutcomeLedger } = require('./ledgerSummary');

/**
 * Marks every task whose dueDate has passed and is still in an
 * actionable status as `missing`, then writes the miss-penalty
 * ledger entry via syncTaskOutcomeLedger.
 *
 * Safe to call multiple times — syncTaskOutcomeLedger is idempotent.
 */
async function sweepOverdueTasks(prisma) {
  const now = new Date();

  // Find the canonical student user (first student by creation date)
  const student = await prisma.user.findFirst({
    where: { role: 'student' },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  if (!student) return { marked: 0 };

  const overdue = await prisma.task.findMany({
    where: {
      dueDate: { lt: now },
      status: { in: ['pending', 'in_progress'] },
    },
    select: {
      id: true,
      title: true,
      category: true,
      dueDate: true,
      rewardCents: true,
      penaltyLateCents: true,
      penaltyMissCents: true,
    },
  });

  if (overdue.length === 0) return { marked: 0 };

  // Bulk-update all to missing in one query
  await prisma.task.updateMany({
    where: { id: { in: overdue.map(t => t.id) } },
    data: { status: 'missing' },
  });

  // Write ledger entries one at a time (syncTaskOutcomeLedger is idempotent)
  for (const task of overdue) {
    await syncTaskOutcomeLedger(prisma, {
      userId: student.id,
      task: { ...task, status: 'missing' },
      status: 'missing',
    });
  }

  console.log(`[sweep] Marked ${overdue.length} overdue tasks as missing.`);
  return { marked: overdue.length };
}

module.exports = { sweepOverdueTasks };
