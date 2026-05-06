/**
 * scoring.js — Task-based score computation.
 *
 * Scoring table (all values in DOLLARS, shown as ¢ for clarity):
 *
 *   not yet due + not submitted      →   0¢  ($0.00)
 *   submitted on time (pending/done) →  +2¢  ($0.02)
 *   not submitted, past due          → -10¢  (-$0.10)
 *   submitted late                   →  -5¢  (-$0.05)
 *   needs_revision (redo required)   →  -3¢  (-$0.03)
 *   pending_review (in review)       →   0¢  ($0.00)  — awaiting judgment
 *   late status (admin marked)       → -10¢  (-$0.10)
 *   missing status (admin marked)    → -10¢  (-$0.10)
 *
 * NOTE: "Needs Review" (pending_review) = 0¢ because it replaced the old
 * due date — it's effectively a fresh assignment.
 * "Redo Needed" (needs_revision) = -3¢ same logic, reverts old submission penalty.
 */

/**
 * Returns the score in dollars for a single task.
 *
 * @param {{ status: string, dueDate: Date|string|null }} task
 * @param {Date|string|null} latestSubmittedAt  — submittedAt of the most recent submission, or null
 * @returns {number}  score in dollars (e.g. 0.02 = +2¢, -0.10 = -10¢)
 */
function scoreTask(task, latestSubmittedAt = null) {
  const now = new Date();
  const due = task.dueDate ? new Date(task.dueDate) : null;

  const isPastDue       = due !== null && due < now;
  const isSubmittedLate = due !== null && latestSubmittedAt !== null
                          && new Date(latestSubmittedAt) > due;

  switch (task.status) {
    // ── Not submitted states ──────────────────────────────────────────────────
    case 'pending':
      // Not yet due: 0¢.  Past due / admin-marked late: -10¢.
      return isPastDue ? -0.10 : 0;

    case 'late':
    case 'missing':
      // Explicitly admin-flagged as late or missing → always -10¢
      return -0.10;

    // ── Submitted states ──────────────────────────────────────────────────────
    case 'pending_review':
      // In review: 0¢ regardless of timing (new due date effectively assigned)
      return 0;

    case 'done':
      // On-time submission: +2¢.  Late submission: -5¢.
      return isSubmittedLate ? -0.05 : 0.02;

    case 'needs_revision':
      // Redo required: -3¢ (same "new due date" logic — reverts submission)
      return -0.03;

    case 'in_progress':
      // Saved progress, not yet submitted — treat like pending
      return isPastDue ? -0.10 : 0;

    default:
      return 0;
  }
}

/**
 * Queries ALL tasks and returns the aggregate score for a specific user.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} userId
 * @returns {Promise<{ taskScore: number, taskBreakdown: Array }>}
 */
async function computeTaskScore(prisma, userId) {
  const tasks = await prisma.task.findMany({
    select: {
      id:      true,
      title:   true,
      status:  true,
      dueDate: true,
      submissions: {
        where:   { userId },
        orderBy: { submittedAt: 'desc' },
        take:    1,
        select:  { submittedAt: true },
      },
    },
  });

  let raw = 0;
  const taskBreakdown = tasks.map(t => {
    const latestSubmittedAt = t.submissions[0]?.submittedAt ?? null;
    const score = scoreTask(t, latestSubmittedAt);
    raw += score;
    return { id: t.id, title: t.title, status: t.status, score };
  });

  const taskScore = Math.round(raw * 10000) / 10000;
  return { taskScore, taskBreakdown };
}

module.exports = { scoreTask, computeTaskScore };
