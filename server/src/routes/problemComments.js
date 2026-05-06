const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth.js');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/problem-comments/:problemId
router.get('/:problemId', authenticate, async (req, res) => {
  const { problemId } = req.params;
  try {
    const comments = await prisma.problemComment.findMany({
      where: { problemId },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
    res.json(comments);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/problem-comments/:problemId
router.post('/:problemId', authenticate, async (req, res) => {
  const { problemId } = req.params;
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required' });
  try {
    const comment = await prisma.problemComment.create({
      data: { content, problemId, authorId: req.user.id },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json(comment);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/problem-comments/:id
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const comment = await prisma.problemComment.findUnique({ where: { id } });
    if (!comment) return res.status(404).json({ error: 'Not found' });
    if (comment.authorId !== req.user.id && !req.user.isAdmin)
      return res.status(403).json({ error: 'Forbidden' });
    await prisma.problemComment.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
