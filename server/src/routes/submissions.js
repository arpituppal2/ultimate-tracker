const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

function hasStructuredSubmission(templateData) {
  return Boolean(
    templateData &&
    typeof templateData === 'object' &&
    Object.keys(templateData).length > 0
  );
}

// POST /api/submissions
router.post('/', authenticate, requireRole('student'), async (req, res) => {
  try {
    const { taskId, driveLinks, uploadUrls, templateData, notes, timeSpentSeconds } = req.body;
    if (!taskId) return res.status(400).json({ error: 'taskId is required' });

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        templateType: true,
        status: true,
        dueDate: true,
        requiresProof: true,
      },
    });

    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.templateType !== 'simple' && !hasStructuredSubmission(templateData)) {
      return res.status(400).json({ error: 'Structured task data is required for this task.' });
    }
    if (task.requiresProof && !(driveLinks?.length || uploadUrls?.length || hasStructuredSubmission(templateData))) {
      return res.status(400).json({ error: 'Proof is required for this task.' });
    }

    const submission = await prisma.taskSubmission.create({
      data: {
        taskId,
        userId: req.user.id,
        driveLinks: Array.isArray(driveLinks) ? driveLinks.filter(Boolean) : [],
        uploadUrls: Array.isArray(uploadUrls) ? uploadUrls.filter(Boolean) : [],
        templateData: templateData || {},
        notes: notes?.trim() || null,
        timeSpentSeconds: Number.isFinite(Number(timeSpentSeconds))
          ? Math.max(0, Math.round(Number(timeSpentSeconds)))
          : null,
        status: 'pending_review',
      },
      include: {
        task: true,
        feedbacks: {
          orderBy: { createdAt: 'asc' },
          include: { reviewer: { select: { id: true, email: true, role: true } } },
        },
      },
    });

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'pending_review',
        savedData: {},
      },
    });

    res.status(201).json(submission);
  } catch (error) {
    console.error('Submission create error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/submissions/:id/resubmit
router.post('/:id/resubmit', authenticate, requireRole('student'), async (req, res) => {
  try {
    const original = await prisma.taskSubmission.findUnique({
      where: { id: req.params.id },
      include: { task: true },
    });

    if (!original) return res.status(404).json({ error: 'Submission not found' });
    if (original.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const reflection = req.body.reflection?.trim();
    if (!reflection) return res.status(400).json({ error: 'reflection is required' });

    const submission = await prisma.taskSubmission.create({
      data: {
        taskId: original.taskId,
        userId: req.user.id,
        driveLinks: original.driveLinks,
        uploadUrls: original.uploadUrls,
        templateData: original.templateData,
        notes: reflection,
        status: 'pending_review',
      },
    });

    await prisma.task.update({
      where: { id: original.taskId },
      data: { status: 'pending_review' },
    });

    res.status(201).json(submission);
  } catch (error) {
    console.error('Submission resubmit error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/submissions
router.get('/', authenticate, async (req, res) => {
  try {
    const { taskId, userId, status } = req.query;
    const where = {};
    if (taskId) where.taskId = taskId;
    if (status && status !== 'all') where.status = status;

    if (req.user.role === 'student') {
      where.userId = req.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    const submissions = await prisma.taskSubmission.findMany({
      where,
      include: {
        task: {
          include: {
            week: { select: { id: true, label: true, weekNumber: true } },
            quarter: { select: { id: true, label: true } },
          },
        },
        user: { select: { id: true, email: true, role: true, name: true } },
        feedbacks: {
          orderBy: { createdAt: 'desc' },
          include: { reviewer: { select: { id: true, email: true, role: true } } },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    res.json(submissions);
  } catch (error) {
    console.error('Submission list error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/submissions/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const submission = await prisma.taskSubmission.findUnique({
      where: { id: req.params.id },
      include: {
        task: {
          include: {
            week: { select: { id: true, label: true, weekNumber: true, focus: true } },
            quarter: { select: { id: true, label: true, focus: true, description: true } },
          },
        },
        user: { select: { id: true, email: true, role: true, name: true } },
        feedbacks: {
          orderBy: { createdAt: 'asc' },
          include: { reviewer: { select: { id: true, email: true, role: true } } },
        },
      },
    });

    if (!submission) return res.status(404).json({ error: 'Not found' });
    if (req.user.role === 'student' && submission.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Submission detail error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/submissions/:id
router.delete('/:id', authenticate, requireRole('admin', 'parent'), async (req, res) => {
  try {
    await prisma.taskSubmission.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (error) {
    console.error('Submission delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
