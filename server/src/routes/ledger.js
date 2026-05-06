const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const { cents, getLedgerSummary } = require('../lib/ledgerSummary');

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
    const summary = await getLedgerSummary(prisma, userId, { limit: 5 });
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
    const summary = await getLedgerSummary(prisma, userId, {
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
