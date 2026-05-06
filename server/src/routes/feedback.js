const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const { cents, syncTaskOutcomeLedger } = require('../lib/ledgerSummary');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/feedback
router.get('/', authenticate, requireRole('admin', 'parent'), async (req, res) => {
  try {
    const feedbacks = await prisma.adminFeedback.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        submission: {
          include: {
            task: { select: { id: true, title: true, category: true, dueDate: true, status: true } },
            user: { select: { id: true, email: true, name: true, role: true } },
          },
        },
        reviewer: { select: { id: true, email: true, role: true, name: true } },
      },
    });
    res.json(feedbacks);
  } catch (error) {
    console.error('Feedback list error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/feedback/mine
router.get('/mine', authenticate, async (req, res) => {
  try {
    const feedbacks = await prisma.adminFeedback.findMany({
      where: { submission: { userId: req.user.id } },
      orderBy: { createdAt: 'desc' },
      include: {
        submission: {
          include: { task: { select: { id: true, title: true, category: true } } },
        },
        reviewer: { select: { id: true, email: true, role: true, name: true } },
      },
    });
    res.json(feedbacks);
  } catch (error) {
    console.error('My feedback error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/feedback
router.post('/', authenticate, requireRole('admin', 'parent'), async (req, res) => {
  try {
    let { submissionId, note, action, bonusCents } = req.body;

    if (!submissionId || !action) {
      return res.status(400).json({ error: 'submissionId and action are required' });
    }

    if (action === 'rejected') action = 'redo';

    const validActions = ['approved', 'needs_revision', 'redo', 'missing'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: `action must be one of: ${validActions.join(', ')}` });
    }

    const trimmedNote = (note || '').trim();
    if (['needs_revision', 'redo', 'missing'].includes(action) && !trimmedNote) {
      return res.status(400).json({ error: 'A note is required for this review action.' });
    }

    const submission = await prisma.taskSubmission.findUnique({
      where: { id: submissionId },
      include: { task: true, user: true },
    });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    const submissionStatus =
      action === 'approved'
        ? 'approved'
        : action === 'needs_revision'
          ? 'needs_revision'
          : action === 'missing'
            ? 'rejected'
            : 'rejected';

    const taskStatus =
      action === 'approved'
        ? 'done'
        : action === 'needs_revision'
          ? 'needs_revision'
          : action === 'missing'
            ? 'missing'
            : 'pending';

    const feedback = await prisma.$transaction(async (tx) => {
      const created = await tx.adminFeedback.create({
        data: {
          submissionId,
          reviewerId: req.user.id,
          note: trimmedNote || (action === 'approved' ? 'Approved.' : action),
          action,
        },
      });

      await tx.taskSubmission.update({
        where: { id: submissionId },
        data: { status: submissionStatus, reviewedAt: new Date() },
      });

      const updatedTask = await tx.task.update({
        where: { id: submission.taskId },
        data: { status: taskStatus },
      });

      await syncTaskOutcomeLedger(tx, {
        userId: submission.userId,
        task: updatedTask,
        status: taskStatus === 'done' || taskStatus === 'missing' ? taskStatus : 'pending',
        submittedAt: submission.submittedAt,
      });

      const bonus = Math.max(0, cents(bonusCents || 0));
      if (action === 'approved' && bonus > 0) {
        await tx.ledgerEntry.create({
          data: {
            userId: submission.userId,
            taskId: submission.taskId,
            amount: bonus,
            reason: `[manual-bonus] ${submission.task.title}`,
          },
        });
      }

      return created;
    });

    res.status(201).json({ ok: true, feedback });
  } catch (error) {
    console.error('Feedback create error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
