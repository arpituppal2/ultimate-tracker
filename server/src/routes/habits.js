const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const { todayStrPST } = require('../lib/dates');

const prisma = new PrismaClient();

// Updated habit list — matches client DAILY_HABITS_META keys
const DAILY_HABITS = [
  'planner_check',
  'backpack_reset',
  'reading_15min',
  'duolingo',
  'inbox_zero',
  'steps_6k',
  'bedroom_floor',
  'desk_tidy',
  'device_charge',
  'outfit_prep',
  'daily_journal',
];

// GET /api/habits/daily?date=YYYY-MM-DD
router.get('/daily', authenticate, async (req, res) => {
  const date = req.query.date || todayStrPST();
  const userId = req.user.role === 'student' ? req.user.id : (req.query.userId || req.user.id);

  const logs = await prisma.habitLog.findMany({
    where: { userId, date: new Date(date) }
  });

  const result = {};
  for (const h of DAILY_HABITS) {
    const log = logs.find(l => l.habitKey === h);
    result[h] = log
      ? { checked: log.checked, checkedAt: log.checkedAt }
      : { checked: false, checkedAt: null };
  }
  res.json({ date, habits: result });
});

// POST /api/habits/daily/toggle
// Body: { habitKey, date, checked, proofNote?, confirmName? }
// Note: proofNote and confirmName are accepted but not yet persisted —
// add a proofNote column to HabitLog in a future migration to store them.
router.post('/daily/toggle', authenticate, async (req, res) => {
  const { habitKey, date, checked } = req.body;
  if (!DAILY_HABITS.includes(habitKey))
    return res.status(400).json({ error: 'Invalid habitKey' });

  const dateStr = date || todayStrPST();
  const userId  = req.user.id;

  const existing = await prisma.habitLog.findFirst({
    where: { userId, habitKey, date: new Date(dateStr) }
  });

  let log;
  if (existing) {
    log = await prisma.habitLog.update({
      where: { id: existing.id },
      data: { checked, checkedAt: checked ? new Date() : null }
    });
  } else {
    log = await prisma.habitLog.create({
      data: {
        userId, habitKey,
        date: new Date(dateStr),
        checked,
        checkedAt: checked ? new Date() : null,
      }
    });
  }

  await recalcStreak(userId);
  res.json(log);
});

// GET /api/habits/weekly?weekId=
router.get('/weekly', authenticate, async (req, res) => {
  const { weekId } = req.query;
  const userId = req.user.role === 'student' ? req.user.id : (req.query.userId || req.user.id);
  const where  = { userId };
  if (weekId) where.planWeekId = weekId;
  const habits = await prisma.weeklyHabit.findMany({ where, orderBy: { createdAt: 'asc' } });
  res.json(habits);
});

// POST /api/habits/weekly
router.post('/weekly', authenticate, async (req, res) => {
  const { planWeekId, habitKey, proofLink, parentApproved } = req.body;
  const habit = await prisma.weeklyHabit.create({
    data: {
      userId: req.user.id,
      planWeekId, habitKey,
      proofLink:      proofLink      || '',
      parentApproved: parentApproved || false,
    }
  });
  res.json(habit);
});

// PATCH /api/habits/weekly/:id
router.patch('/weekly/:id', authenticate, async (req, res) => {
  const { proofLink, parentApproved, completed } = req.body;
  if (parentApproved !== undefined && req.user.role === 'student')
    return res.status(403).json({ error: 'Only parent/admin can approve' });

  const habit = await prisma.weeklyHabit.update({
    where: { id: req.params.id },
    data: {
      ...(proofLink      !== undefined && { proofLink }),
      ...(parentApproved !== undefined && { parentApproved }),
      ...(completed      !== undefined && { completed }),
    }
  });
  res.json(habit);
});

// GET /api/habits/streak
router.get('/streak', authenticate, async (req, res) => {
  const userId = req.user.role === 'student' ? req.user.id : (req.query.userId || req.user.id);
  const streak = await prisma.streak.findUnique({ where: { userId } });
  res.json(streak || { current: 0, longest: 0 });
});

async function recalcStreak(userId) {
  const today = todayStrPST();
  const logs  = await prisma.habitLog.findMany({
    where: { userId, date: new Date(today) }
  });
  const allChecked = DAILY_HABITS.every(h => logs.find(l => l.habitKey === h && l.checked));

  const todayTasks = await prisma.task.findMany({
    where: { assignedTo: userId, dueDate: new Date(today), category: { not: 'daily' } }
  });
  const allTasksDone = todayTasks.every(t => t.status === 'done');

  const existing = await prisma.streak.findUnique({ where: { userId } });

  if (allChecked && allTasksDone) {
    const newCurrent = (existing?.current || 0) + 1;
    await prisma.streak.upsert({
      where:  { userId },
      update: { current: newCurrent, longest: Math.max(newCurrent, existing?.longest || 0), lastUpdated: new Date() },
      create: { userId, current: 1, longest: 1, lastUpdated: new Date() },
    });
  } else {
    await prisma.streak.upsert({
      where:  { userId },
      update: { current: 0, lastUpdated: new Date() },
      create: { userId, current: 0, longest: 0, lastUpdated: new Date() },
    });
  }
}

module.exports = router;
