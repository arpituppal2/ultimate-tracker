const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/weeks?quarterId=
router.get('/', authenticate, async (req, res) => {
  const { quarterId } = req.query;
  const weeks = await prisma.planWeek.findMany({
    where: quarterId ? { quarterId } : {},
    orderBy: { weekNumber: 'asc' }
  });
  res.json(weeks);
});

// GET /api/weeks/current
router.get('/current', authenticate, async (req, res) => {
  const now = new Date();
  const week = await prisma.planWeek.findFirst({
    where: { startDate: { lte: now }, endDate: { gte: now } }
  });
  res.json(week || null);
});

// GET /api/weeks/:id
router.get('/:id', authenticate, async (req, res) => {
  const week = await prisma.planWeek.findUnique({
    where: { id: req.params.id },
    include: { tasks: { orderBy: { dueDate: 'asc' } } }
  });
  if (!week) return res.status(404).json({ error: 'Not found' });
  res.json(week);
});

module.exports = router;
