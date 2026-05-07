const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const {
  ACTIVE_TASK_STATUSES,
  buildCategoryFilter,
  buildTaskSelect,
  endOfDay,
  normalizeTask,
  startOfDay,
} = require('../lib/taskQueries');
const { syncTaskOutcomeLedger, cents } = require('../lib/ledgerSummary');

const prisma = new PrismaClient();
const BATCH_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_PAGE_SIZE = 200;
const MAX_PAGE_SIZE = 500;

function parsePagination(query) {
  const take = Math.min(parseInt(query.take, 10) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const skip = parseInt(query.skip, 10) || 0;
  return { take, skip };
}

function baseWhereFromQuery(query = {}) {
  const { category, weekNumber, status, quarterId, date, dateFrom, dateTo, q, search } = query;
  const where = {};
  const and = [];

  const categoryWhere = buildCategoryFilter(category);
  if (Object.keys(categoryWhere).length > 0) and.push(categoryWhere);

  if (status && status !== 'all') where.status = status;
  if (quarterId) where.quarterId = quarterId;
  if (weekNumber) {
    and.push({
      OR: [
        { weekNum: parseInt(weekNumber, 10) },
        { week: { weekNumber: parseInt(weekNumber, 10) } },
      ],
    });
  }

  if (date) {
    where.dueDate = { gte: startOfDay(new Date(date)), lte: endOfDay(new Date(date)) };
  } else if (dateFrom || dateTo) {
    const range = {};
    if (dateFrom) range.gte = startOfDay(new Date(dateFrom));
    if (dateTo) range.lte = endOfDay(new Date(dateTo));
    where.dueDate = range;
  }

  const searchText = String(q || search || '').trim();
  if (searchText) {
    and.push({
      OR: [
        { title: { contains: searchText, mode: 'insensitive' } },
        { description: { contains: searchText, mode: 'insensitive' } },
        { category: { contains: searchText, mode: 'insensitive' } },
        { templateType: { contains: searchText, mode: 'insensitive' } },
      ],
    });
  }

  if (and.length > 0) where.AND = and;

  return where;
}

async function getCurrentWeekAndQuarter(now = new Date()) {
  const [week, quarter] = await Promise.all([
    prisma.planWeek.findFirst({
      where: { startDate: { lte: now }, endDate: { gte: now } },
      select: {
        id: true,
        label: true,
        weekNumber: true,
        focus: true,
        startDate: true,
        endDate: true,
      },
    }),
    prisma.quarter.findFirst({
      where: { startDate: { lte: now }, endDate: { gte: now } },
      select: {
        id: true,
        label: true,
        focus: true,
        description: true,
        startDate: true,
        endDate: true,
      },
    }),
  ]);

  return { week, quarter };
}

async function resolveStudentUserId(taskId) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      submissions: {
        orderBy: { submittedAt: 'desc' },
        take: 1,
        select: { userId: true, submittedAt: true },
      },
    },
  });

  const fromSubmission = task?.submissions?.[0]?.userId;
  if (fromSubmission) return fromSubmission;

  const student = await prisma.user.findFirst({
    where: { role: 'student' },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  return student?.id || null;
}

function ledgerStatus(status) {
  if (status === 'done' || status === 'missing') return status;
  return 'pending';
}

// GET /api/tasks
router.get('/', authenticate, async (req, res) => {
  try {
    const where = baseWhereFromQuery(req.query);
    const { take, skip } = parsePagination(req.query);
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        select: buildTaskSelect(),
        orderBy: [{ dueDate: 'asc' }, { title: 'asc' }],
        take,
        skip,
      }),
      prisma.task.count({ where }),
    ]);
    res.json({ tasks: tasks.map(normalizeTask), total, take, skip });
  } catch (error) {
    console.error('Task list error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tasks/today
router.get('/today', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const { week, quarter } = await getCurrentWeekAndQuarter(now);
    // Only load overdue from last 14 days to cap result size
    const overdueFloor = new Date(todayStart.getTime() - 14 * 24 * 60 * 60 * 1000);
    const where = {
      ...buildCategoryFilter(req.query.category),
      dueDate: { gte: overdueFloor, lte: todayEnd },
      status: { in: ACTIVE_TASK_STATUSES },
    };
    const { take, skip } = parsePagination(req.query);

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        select: buildTaskSelect(),
        orderBy: [{ category: 'asc' }, { dueDate: 'asc' }, { title: 'asc' }],
        take,
        skip,
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      week,
      quarter,
      focusLine: week?.focus || quarter?.description || quarter?.focus || '',
      total,
      take,
      skip,
      tasks: tasks.map(task => ({
        ...normalizeTask(task),
        isOverdue: Boolean(task.dueDate && new Date(task.dueDate) < todayStart),
      })),
    });
  } catch (error) {
    console.error('Task today error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tasks/week
router.get('/week', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const weekStart = startOfDay(now);
    const weekEnd = endOfDay(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));
    const { week, quarter } = await getCurrentWeekAndQuarter(now);
    const { take, skip } = parsePagination(req.query);

    const where = {
      ...buildCategoryFilter(req.query.category),
      dueDate: { gte: weekStart, lte: weekEnd },
      status: { in: ACTIVE_TASK_STATUSES },
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        select: buildTaskSelect(),
        orderBy: [{ dueDate: 'asc' }, { category: 'asc' }, { title: 'asc' }],
        take,
        skip,
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      week,
      quarter,
      focusLine: week?.focus || quarter?.description || quarter?.focus || '',
      range: { start: weekStart, end: weekEnd },
      total,
      take,
      skip,
      tasks: tasks.map(normalizeTask),
    });
  } catch (error) {
    console.error('Task week error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/tasks/bulk — bulk status update (admin/parent only)
router.patch('/bulk', authenticate, requireRole('admin', 'parent'), async (req, res) => {
  try {
    const { ids, status } = req.body;
    const validStatuses = ['done', 'late', 'missing', 'pending', 'in_progress', 'needs_revision'];
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required and must not be empty' });
    }
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const snapshots = await prisma.task.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true },
    });

    for (const id of ids) {
      await prisma.task.update({
        where: { id },
        data: { status },
      });

      const studentUserId = await resolveStudentUserId(id);
      if (studentUserId && ['done', 'missing', 'pending', 'late', 'needs_revision', 'in_progress'].includes(status)) {
        const task = await prisma.task.findUnique({ where: { id } });
        await syncTaskOutcomeLedger(prisma, {
          userId: studentUserId,
          task,
          status: ledgerStatus(status),
        });
      }
    }

    res.json({ ok: true, count: ids.length, snapshots });
  } catch (error) {
    console.error('Bulk status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/tasks/bulk/undo
router.patch('/bulk/undo', authenticate, requireRole('admin', 'parent'), async (req, res) => {
  try {
    const { snapshots } = req.body;
    if (!Array.isArray(snapshots) || snapshots.length === 0) {
      return res.status(400).json({ error: 'snapshots array is required and must not be empty' });
    }

    await Promise.all(
      snapshots.map(({ id, status }) =>
        prisma.task.update({ where: { id }, data: { status } })
      )
    );

    res.json({ ok: true, restored: snapshots.length });
  } catch (error) {
    console.error('Bulk undo error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      select: buildTaskSelect({ includeSavedData: true, includeAdminChangelog: true }),
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    res.json(normalizeTask(task));
  } catch (error) {
    console.error('Task detail error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tasks
router.post('/', authenticate, requireRole('admin', 'parent'), async (req, res) => {
  try {
    const {
      title,
      category,
      templateType,
      dueDate,
      requiresProof,
      weekId,
      weekNum,
      quarterId,
      rewardCents,
      penaltyLateCents,
      penaltyMissCents,
      templatePrefill,
      description,
      resourceUrl,
    } = req.body;

    if (!title || !category || !dueDate) {
      return res.status(400).json({ error: 'title, category, and dueDate are required' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        category,
        templateType: templateType || 'simple',
        dueDate: new Date(dueDate),
        requiresProof: Boolean(requiresProof),
        weekId: weekId || null,
        weekNum: weekNum ? Number(weekNum) : null,
        quarterId: quarterId || null,
        rewardCents: cents(rewardCents || 0),
        penaltyLateCents: Math.abs(cents(penaltyLateCents || 0)),
        penaltyMissCents: Math.abs(cents(penaltyMissCents || 0)),
        templatePrefill: templatePrefill || {},
        description: description || null,
        resourceUrl: resourceUrl || null,
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Task create error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/tasks/:id/save
router.patch('/:id/save', authenticate, async (req, res) => {
  try {
    const { savedData } = req.body;
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        savedData: savedData || {},
        status: 'in_progress',
      },
    });
    res.json(task);
  } catch (error) {
    console.error('Task save error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/tasks/:id
router.patch('/:id', authenticate, requireRole('admin', 'parent'), async (req, res) => {
  try {
    const {
      status,
      title,
      dueDate,
      rewardCents,
      penaltyLateCents,
      penaltyMissCents,
      templatePrefill,
      description,
      resourceUrl,
    } = req.body;

    const existing = await prisma.task.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        rewardCents: true,
        penaltyLateCents: true,
        penaltyMissCents: true,
        adminChangelog: true,
        submissions: {
          orderBy: { submittedAt: 'desc' },
          take: 1,
          select: { userId: true, submittedAt: true },
        },
      },
    });

    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const changelog = Array.isArray(existing.adminChangelog) ? [...existing.adminChangelog] : [];
    const nowIso = new Date().toISOString();
    const trackChange = (field, from, to) => {
      if (from === to) return;
      changelog.push({ at: nowIso, field, from, to, adminId: req.user.id });
    };

    trackChange('status', existing.status, status ?? existing.status);
    trackChange('title', existing.title, title ?? existing.title);
    if (dueDate) {
      trackChange(
        'dueDate',
        existing.dueDate ? new Date(existing.dueDate).toISOString() : null,
        new Date(dueDate).toISOString()
      );
    }
    if (rewardCents !== undefined) trackChange('rewardCents', existing.rewardCents, cents(rewardCents));
    if (penaltyLateCents !== undefined) trackChange('penaltyLateCents', existing.penaltyLateCents, Math.abs(cents(penaltyLateCents)));
    if (penaltyMissCents !== undefined) trackChange('penaltyMissCents', existing.penaltyMissCents, Math.abs(cents(penaltyMissCents)));

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(title !== undefined ? { title } : {}),
        ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
        ...(rewardCents !== undefined ? { rewardCents: cents(rewardCents) } : {}),
        ...(penaltyLateCents !== undefined ? { penaltyLateCents: Math.abs(cents(penaltyLateCents)) } : {}),
        ...(penaltyMissCents !== undefined ? { penaltyMissCents: Math.abs(cents(penaltyMissCents)) } : {}),
        ...(templatePrefill !== undefined ? { templatePrefill } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(resourceUrl !== undefined ? { resourceUrl } : {}),
        adminChangelog: changelog,
      },
    });

    if (status !== undefined) {
      const studentUserId = existing.submissions[0]?.userId || (await resolveStudentUserId(req.params.id));
      if (studentUserId) {
        await syncTaskOutcomeLedger(prisma, {
          userId: studentUserId,
          task,
          status: ledgerStatus(status),
          submittedAt: existing.submissions[0]?.submittedAt,
        });
      }
    }

    res.json(task);
  } catch (error) {
    console.error('Task patch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/tasks/bulk
router.delete('/bulk', authenticate, requireRole('admin', 'parent'), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required and must not be empty' });
    }
    await prisma.adminFeedback.deleteMany({ where: { submission: { taskId: { in: ids } } } });
    await prisma.taskSubmission.deleteMany({ where: { taskId: { in: ids } } });
    await prisma.ledgerEntry.deleteMany({ where: { taskId: { in: ids } } });
    await prisma.task.deleteMany({ where: { id: { in: ids } } });
    res.json({ ok: true, deleted: ids.length });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/tasks
router.delete('/', authenticate, requireRole('admin', 'parent'), async (req, res) => {
  try {
    const { category, quarterId, status, weekId } = req.query;
    const where = {};
    if (category) Object.assign(where, buildCategoryFilter(category));
    if (quarterId) where.quarterId = quarterId;
    if (status) where.status = status;
    if (weekId) where.weekId = weekId;

    if (Object.keys(where).length === 0) {
      return res.status(400).json({ error: 'At least one filter is required for bulk delete.' });
    }

    const toDelete = await prisma.task.findMany({
      where,
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        dueDate: true,
        templateType: true,
        requiresProof: true,
        rewardCents: true,
        penaltyLateCents: true,
        penaltyMissCents: true,
        weekId: true,
        weekNum: true,
        quarterId: true,
        templatePrefill: true,
        description: true,
        resourceUrl: true,
      },
    });

    if (toDelete.length === 0) return res.json({ ok: true, deleted: 0, batchId: null });

    const labelParts = [
      category && category,
      status && `status:${status}`,
      quarterId && `quarter:${quarterId}`,
      weekId && `week:${weekId}`,
    ].filter(Boolean);

    const label = `${labelParts.join(' · ')} · ${toDelete.length} task${toDelete.length === 1 ? '' : 's'}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + BATCH_TTL_MS);
    const batch = await prisma.deletedBatch.create({
      data: { label, tasks: toDelete, deletedAt: now, expiresAt },
    });
    const ids = toDelete.map(task => task.id);
    await prisma.adminFeedback.deleteMany({ where: { submission: { taskId: { in: ids } } } });
    await prisma.taskSubmission.deleteMany({ where: { taskId: { in: ids } } });
    await prisma.ledgerEntry.deleteMany({ where: { taskId: { in: ids } } });
    await prisma.task.deleteMany({ where: { id: { in: ids } } });
    res.json({ ok: true, deleted: toDelete.length, batchId: batch.id, expiresAt });
  } catch (error) {
    console.error('Filter delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticate, requireRole('admin', 'parent'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.adminFeedback.deleteMany({ where: { submission: { taskId: id } } });
    await prisma.taskSubmission.deleteMany({ where: { taskId: id } });
    await prisma.ledgerEntry.deleteMany({ where: { taskId: id } });
    await prisma.task.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) {
    console.error('Task delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
