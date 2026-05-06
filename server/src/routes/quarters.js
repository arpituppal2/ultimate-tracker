const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/quarters
router.get('/', authenticate, async (req, res) => {
  const quarters = await prisma.quarter.findMany({ orderBy: { startDate: 'asc' } });
  res.json(quarters);
});

// GET /api/quarters/current
router.get('/current', authenticate, async (req, res) => {
  const now = new Date();
  const quarter = await prisma.quarter.findFirst({
    where: { startDate: { lte: now }, endDate: { gte: now } }
  });
  res.json(quarter || null);
});

// GET /api/quarters/:id
router.get('/:id', authenticate, async (req, res) => {
  const quarter = await prisma.quarter.findUnique({
    where: { id: req.params.id },
    include: { weeks: { orderBy: { weekNumber: 'asc' } } }
  });
  if (!quarter) return res.status(404).json({ error: 'Not found' });
  res.json(quarter);
});

module.exports = router;
