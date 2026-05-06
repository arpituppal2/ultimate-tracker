const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

// All review routes require admin or parent.
// Write actions (approve / request-changes) live in POST /api/feedback.

// GET /api/reviews/pending — submissions awaiting review, oldest first
router.get('/pending', authenticate, requireRole('admin', 'parent'), async (req, res) => {
  try {
    const subs = await prisma.taskSubmission.findMany({
      where: { status: 'pending_review' },
      include: {
        task:      true,
        user:      { select: { id: true, email: true } },
        feedbacks: { orderBy: { createdAt: 'desc' }, take: 1, include: { reviewer: { select: { id: true, email: true } } } },
      },
      orderBy: { submittedAt: 'asc' },
    });
    res.json(subs);
  } catch (e) {
    console.error('Reviews pending error:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/reviews/all?status= — all submissions, optional status filter
router.get('/all', authenticate, requireRole('admin', 'parent'), async (req, res) => {
  try {
    const { status } = req.query;
    const subs = await prisma.taskSubmission.findMany({
      where: status ? { status } : {},
      include: {
        task:      true,
        user:      { select: { id: true, email: true } },
        feedbacks: { orderBy: { createdAt: 'desc' }, include: { reviewer: { select: { id: true, email: true } } } },
      },
      orderBy: { submittedAt: 'desc' },
    });
    res.json(subs);
  } catch (e) {
    console.error('Reviews all error:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/reviews/:submissionId — single submission detail (full feedback thread)
router.get('/:submissionId', authenticate, requireRole('admin', 'parent'), async (req, res) => {
  try {
    const sub = await prisma.taskSubmission.findUnique({
      where: { id: req.params.submissionId },
      include: {
        task:      true,
        user:      { select: { id: true, email: true } },
        feedbacks: { orderBy: { createdAt: 'asc' }, include: { reviewer: { select: { id: true, email: true } } } },
      },
    });
    if (!sub) return res.status(404).json({ error: 'Not found' });
    res.json(sub);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/reviews/:submissionId — admin hard delete
router.delete('/:submissionId', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await prisma.taskSubmission.delete({ where: { id: req.params.submissionId } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
