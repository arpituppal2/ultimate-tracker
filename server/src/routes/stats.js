const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { ACTIVE_TASK_STATUSES, buildCategoryFilter, startOfDay } = require('../lib/taskQueries');
const { getLedgerSummary } = require('../lib/ledgerSummary');

const router = express.Router();
const prisma = new PrismaClient();

async function resolveDashboardUserId(req) {
  if (req.user.role === 'student') return req.user.id;

  const firstStudent = await prisma.user.findFirst({
    where: { role: 'student' },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  return firstStudent?.id || req.user.id;
}

// GET /api/stats/summary
router.get('/summary', authenticate, async (req, res) => {
  try {
    const today = startOfDay();
    const userId = await resolveDashboardUserId(req);

    const [statusGroups, habitsToday, streak, ledger] = await Promise.all([
      prisma.task.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.habitLog.count({ where: { userId, date: today, completed: true } }),
      prisma.streak.findUnique({ where: { userId } }),
      getLedgerSummary(prisma, userId, { limit: 5 }),
    ]);

    const statusCounts = statusGroups.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {});

    res.json({
      statusCounts,
      balanceCents: ledger.balanceCents,
      totalEarnedCents: ledger.totalEarnedCents,
      totalPenaltyCents: ledger.totalPenaltyCents,
      habitsToday,
      streakDays: streak?.current || 0,
    });
  } catch (error) {
    console.error('Stats summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats/progress
router.get('/progress', authenticate, async (req, res) => {
  try {
    const today = startOfDay();
    const statusGroups = await prisma.task.groupBy({ by: ['status'], _count: { id: true } });
    const statusMap = statusGroups.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {});

    const overdue = await prisma.task.count({
      where: {
        dueDate: { lt: today },
        status: { in: ACTIVE_TASK_STATUSES },
      },
    });

    const categories = ['competition_math', 'curriculum_math', 'sat', 'ap', 'language', 'leadership', 'college', 'writing', 'health'];
    const catCounts = await Promise.all(
      categories.map(async (category) => {
        const where = buildCategoryFilter(category);
        const [total, active, overdueCount] = await Promise.all([
          prisma.task.count({ where }),
          prisma.task.count({ where: { AND: [where, { status: { in: ACTIVE_TASK_STATUSES } }] } }),
          prisma.task.count({
            where: {
              AND: [
                where,
                { dueDate: { lt: today } },
                { status: { in: ACTIVE_TASK_STATUSES } },
              ],
            },
          }),
        ]);
        return { category, total, active, overdue: overdueCount };
      })
    );

    res.json({ overdue, statusMap, catCounts });
  } catch (error) {
    console.error('Stats progress error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
