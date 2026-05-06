const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/admin/deleted-batches — list non-expired, non-restored batches
router.get('/deleted-batches', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const now = new Date();
    const batches = await prisma.deletedBatch.findMany({
      where: {
        restoredAt: null,
        expiresAt:  { gt: now },
      },
      orderBy: { deletedAt: 'desc' },
    });
    // Return lightweight version: don't send full task JSON to list view
    res.json(batches.map(b => ({
      id:        b.id,
      label:     b.label,
      count:     Array.isArray(b.tasks) ? b.tasks.length : 0,
      deletedAt: b.deletedAt,
      expiresAt: b.expiresAt,
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/deleted-batches/:id/restore — re-create all tasks in a batch
router.post('/deleted-batches/:id/restore', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const batch = await prisma.deletedBatch.findUnique({ where: { id: req.params.id } });
    if (!batch)           return res.status(404).json({ error: 'Batch not found' });
    if (batch.restoredAt) return res.status(409).json({ error: 'Already restored' });
    if (new Date() > batch.expiresAt) return res.status(410).json({ error: 'Restore window expired' });

    const tasks = Array.isArray(batch.tasks) ? batch.tasks : [];

    // Re-create each task, stripping the old id so Prisma auto-generates a new one
    await Promise.all(tasks.map(t => {
      const { id: _oldId, createdAt: _c, ...data } = t;
      return prisma.task.create({
        data: {
          ...data,
          dueDate:  new Date(data.dueDate),
          // weekId / quarterId may reference rows that still exist
        },
      });
    }));

    await prisma.deletedBatch.update({
      where: { id: batch.id },
      data:  { restoredAt: new Date() },
    });

    res.json({ ok: true, restored: tasks.length });
  } catch (e) {
    console.error('Restore error:', e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/admin/deleted-batches/:id — permanently purge a batch before TTL
router.delete('/deleted-batches/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await prisma.deletedBatch.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
