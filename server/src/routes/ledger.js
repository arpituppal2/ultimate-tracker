const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const { cents, getLedgerSummary } = require('../lib/ledgerSummary');
const {
  ACTIVE_TASK_STATUSES,
  buildTaskSelect,
  normalizeTask,
  startOfDay,
} = require('../lib/taskQueries');

const prisma = new PrismaClient();

async function resolveUserId(req) {
  if (req.user.role === 'student') return req.user.id;
  if (req.query.userId || req.body?.userId) return req.query.userId || req.body.userId;

  const firstStudent = await prisma.user.findFirst({
    where: { role: 'student' },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  return firstStudent?.id || req.user.id;
}

async function buildAnalyticsSummary(userId, { limit = 40 } = {}) {
  const todayStart = startOfDay(new Date());

  const [entries, statusRows, overdueTasks] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where: { userId },
      select: { amount: true, reason: true, createdAt: true, taskId: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.task.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.task.findMany({
      where: {
        dueDate: { lt: todayStart },
        status: { in: ACTIVE_TASK_STATUSES },
      },
      select: buildTaskSelect(),
      orderBy: [{ dueDate: 'asc' }, { title: 'asc' }],
      take: limit,
    }),
  ]);

  let balanceCents = 0;
  let totalEarnedCents = 0;
  let totalPenaltyCents = 0;
  let onTimeCount = 0;
  let lateCount = 0;
  let missedCount = 0;

  for (const entry of entries) {
    const amount = Number(entry.amount || 0);
    const reason = String(entry.reason || '').toLowerCase();

    balanceCents += amount;
    if (amount >= 0) {
      totalEarnedCents += amount;
    } else {
      totalPenaltyCents += Math.abs(amount);
    }

    if (reason.includes('miss')) {
      missedCount += 1;
    } else if (reason.includes('late')) {
      lateCount += 1;
    } else if (amount > 0) {
      onTimeCount += 1;
    }
  }

  const statusCounts = {};
  for (const row of statusRows) {
    statusCounts[row.status] = row._count?._all || 0;
  }

  return {
    balanceCents,
    totalEarnedCents,
    totalPenaltyCents,
    onTimeCount,
    lateCount,
    missedCount,
    statusCounts,
    overdueTasks: overdueTasks.map(task => ({
      ...normalizeTask(task),
      isOverdue: true,
    })),
  };
}

// GET /api/ledger
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const summary = await getLedgerSummary(prisma, userId, {
      limit: Number.parseInt(req.query.limit, 10) || 40,
    });
    res.json(summary);
  } catch (error) {
    console.error('Ledger GET error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ledger/balance
router.get('/balance', authenticate, async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const summary = await buildAnalyticsSummary(userId, { limit: 5 });
    res.json({
      balanceCents: summary.balanceCents,
      totalEarnedCents: summary.totalEarnedCents,
      totalPenaltyCents: summary.totalPenaltyCents,
      onTimeCount: summary.onTimeCount,
      lateCount: summary.lateCount,
      missedCount: summary.missedCount,
    });
  } catch (error) {
    console.error('Ledger balance error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ledger/summary
router.get('/summary', authenticate, async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const summary = await buildAnalyticsSummary(userId, {
      limit: Number.parseInt(req.query.limit, 10) || 40,
    });
    res.json(summary);
  } catch (error) {
    console.error('Ledger summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ledger
router.post('/', authenticate, requireRole('admin', 'parent'), async (req, res) => {
  try {
    const { userId, amount, reason, taskId } = req.body;
    if (!userId || amount === undefined || !reason) {
      return res.status(400).json({ error: 'userId, amount, and reason are required' });
    }

    const entry = await prisma.ledgerEntry.create({
      data: {
        userId,
        taskId: taskId || null,
        amount: cents(amount),
        reason: reason.trim(),
      },
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error('Ledger POST error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
