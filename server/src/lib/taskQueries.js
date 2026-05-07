const ACTIVE_TASK_STATUSES = ['pending', 'in_progress', 'pending_review', 'late', 'needs_revision'];
const COMPLETED_TASK_STATUSES = ['done', 'missing'];

function startOfDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function startOfWeekMonday(date = new Date()) {
  const next = startOfDay(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

function endOfWeekSunday(date = new Date()) {
  const next = startOfWeekMonday(date);
  next.setDate(next.getDate() + 6);
  next.setHours(23, 59, 59, 999);
  return next;
}

function buildTaskSelect({ includeSavedData = false, includeAdminChangelog = false, includeSubmissions = true } = {}) {
  return {
    id: true,
    title: true,
    category: true,
    status: true,
    dueDate: true,
    requiresProof: true,
    templateType: true,
    weekId: true,
    weekNum: true,
    quarterId: true,
    rewardCents: true,
    penaltyLateCents: true,
    penaltyMissCents: true,
    templatePrefill: true,
    description: true,
    resourceUrl: true,
    createdAt: true,
    updatedAt: true,
    ...(includeSavedData ? { savedData: true } : {}),
    ...(includeAdminChangelog ? { adminChangelog: true } : {}),
    week: {
      select: {
        id: true,
        label: true,
        weekNumber: true,
        focus: true,
        startDate: true,
        endDate: true,
      },
    },
    quarter: {
      select: {
        id: true,
        label: true,
        focus: true,
        description: true,
        startDate: true,
        endDate: true,
      },
    },
    ...(includeSubmissions
      ? {
          submissions: {
            orderBy: { submittedAt: 'desc' },
            select: {
              id: true,
              status: true,
              driveLinks: true,
              uploadUrls: true,
              templateData: true,
              notes: true,
              timeSpentSeconds: true,
              submittedAt: true,
              reviewedAt: true,
              updatedAt: true,
              userId: true,
              feedbacks: {
                orderBy: { createdAt: 'asc' },
                include: {
                  reviewer: { select: { id: true, email: true, role: true } },
                },
              },
            },
          },
        }
      : {}),
  };
}

function normalizeTask(task) {
  if (!task) return task;
  const today = startOfDay();
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  return {
    ...task,
    isOverdue:
      Boolean(dueDate) &&
      dueDate < today &&
      ACTIVE_TASK_STATUSES.includes(task.status),
  };
}

function buildCategoryFilter(category) {
  if (!category || category === 'all') return {};
  if (category === 'ap') {
    return {
      OR: [
        { category: 'ap' },
        { category: { startsWith: 'AP_' } },
      ],
    };
  }
  return { category };
}

module.exports = {
  ACTIVE_TASK_STATUSES,
  COMPLETED_TASK_STATUSES,
  startOfDay,
  endOfDay,
  startOfWeekMonday,
  endOfWeekSunday,
  buildTaskSelect,
  normalizeTask,
  buildCategoryFilter,
};
