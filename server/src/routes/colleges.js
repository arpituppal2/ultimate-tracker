const router  = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticate, requireRole } = require('../middleware/auth');

const requireAdmin = [authenticate, requireRole('admin', 'parent')];

// ── GET /api/colleges  ─────────────────────────────────────────
router.get('/', authenticate, async (_req, res) => {
  try {
    const colleges = await prisma.college.findMany({
      include: { tasks: { orderBy: { createdAt: 'asc' } } },
      orderBy: { name: 'asc' },
    });
    res.json(colleges);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load colleges.' });
  }
});

// ── POST /api/colleges  ────────────────────────────────────────
router.post('/', requireAdmin, async (req, res) => {
  const { name, shortName, status, notes } = req.body;
  if (!name || !shortName) return res.status(400).json({ error: 'name and shortName are required.' });
  try {
    const college = await prisma.college.create({
      data: { name, shortName, status: status || 'exploring', notes: notes || null },
      include: { tasks: true },
    });
    res.status(201).json(college);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create college.' });
  }
});

// ── PATCH /api/colleges/:id  ────────────────────────────────────
router.patch('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, shortName, status, notes, explorationTaskId } = req.body;
  try {
    const college = await prisma.college.update({
      where: { id },
      data: {
        ...(name              !== undefined && { name }),
        ...(shortName         !== undefined && { shortName }),
        ...(status            !== undefined && { status }),
        ...(notes             !== undefined && { notes }),
        ...(explorationTaskId !== undefined && { explorationTaskId }),
      },
      include: { tasks: { orderBy: { createdAt: 'asc' } } },
    });
    res.json(college);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'College not found.' });
    console.error(err);
    res.status(500).json({ error: 'Failed to update college.' });
  }
});

// ── DELETE /api/colleges/:id  ───────────────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.college.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'College not found.' });
    console.error(err);
    res.status(500).json({ error: 'Failed to delete college.' });
  }
});

// ── POST /api/colleges/:id/tasks  ──────────────────────────────
router.post('/:id/tasks', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, type, status, dueDate, notes } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required.' });
  try {
    const task = await prisma.collegeTask.create({
      data: {
        collegeId: id,
        title,
        type:    type    || 'general',
        status:  status  || 'pending',
        dueDate: dueDate || null,
        notes:   notes   || null,
      },
    });
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

// ── PATCH /api/colleges/:id/tasks/:taskId  ─────────────────────
router.patch('/:id/tasks/:taskId', requireAdmin, async (req, res) => {
  const { taskId } = req.params;
  const { title, type, status, dueDate, notes } = req.body;
  try {
    const task = await prisma.collegeTask.update({
      where: { id: taskId },
      data: {
        ...(title   !== undefined && { title }),
        ...(type    !== undefined && { type }),
        ...(status  !== undefined && { status }),
        ...(dueDate !== undefined && { dueDate }),
        ...(notes   !== undefined && { notes }),
      },
    });
    res.json(task);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Task not found.' });
    console.error(err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

// ── DELETE /api/colleges/:id/tasks/:taskId  ────────────────────
router.delete('/:id/tasks/:taskId', requireAdmin, async (req, res) => {
  const { taskId } = req.params;
  try {
    await prisma.collegeTask.delete({ where: { id: taskId } });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Task not found.' });
    console.error(err);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

module.exports = router;
