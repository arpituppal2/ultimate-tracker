'use strict';

// seed.js — Master Academic Plan (Monolithic Edition)
// Full replacement
// Structure:
//   Part 1  — Prisma bootstrap, helpers, quarter map, constants, task utilities
//   Part 2  — Core metadata seeders (quarters, weeks) + recurring framework
//   Part 3  — Khan Math execution tasks: arithmetic through 6th grade
//   Part 4  — Khan Math execution tasks: 7th, 8th, Algebra 1, Geometry
//   Part 5  — Khan Math execution tasks: Algebra 2, Trig/Precalc, Stats, Calc, SAT
//   Part 6  — AMC 8 execution tasks: foundations, drills, reviews, mocks
//   Part 7  — AMC 10 / AIME execution tasks
//   Part 8  — Language tracks: Spanish + Russian + writing / listening structures
//   Part 9  — AP engine (inlined) + shared AP helper logic
//   Part 10 — AP course definitions: 9th grade
//   Part 11 — AP course definitions: 10th grade
//   Part 12 — AP course definitions: 11th grade
//   Part 13 — AP course definitions: 12th grade
//   Part 14 — College research + applications + scholarships + interview prep
//   Part 15 — Extracurricular / leadership / project / competition architecture
//   Part 16 — Essay systems, recommendation systems, documentation systems
//   Part 17 — Full task assembly pipeline by category
//   Part 18 — Database upsert helpers + task normalization + validation
//   Part 19 — main() seeding orchestration
//   Part 20 — final export / invocation / cleanup notes

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ───────────────────────────────────────────────────────────────────────────────
// GLOBAL PROGRAM START
// Week 1 starts Monday, May 4, 2026.
// All week math in this file is 1-indexed.
// ───────────────────────────────────────────────────────────────────────────────

const PLAN_START = new Date('2026-05-04T00:00:00.000Z');
const MAX_WEEK = 247; // through 12th grade completion / AP wind-down / college transition

// ───────────────────────────────────────────────────────────────────────────────
// CATEGORY / TEMPLATE CONSTANTS
// Keep these centralized so later parts stay consistent.
// ───────────────────────────────────────────────────────────────────────────────

const CATEGORY = {
  KHAN_MATH: 'khan_math',
  AMC8: 'amc8',
  AMC10: 'amc10',
  AIME: 'aime',
  LANGUAGE: 'language',
  AP: 'ap',
  RECURRING: 'recurring',
  COLLEGE: 'college',
  APPLICATION: 'application',
  PROJECT: 'project',
  LEADERSHIP: 'leadership',
  WRITING: 'writing',
  RESEARCH: 'research',
  LIFE: 'life',
};

const TEMPLATE = {
  LESSON: 'ap_lesson',
  FRQ: 'ap_frq',
  TIMED_EXAM: 'timed_exam',
  REVIEW: 'review',
  KHAN: 'khan_exercise',
  MATH_PROOF: 'math_proof',
  MOCK_TEST: 'mock_test',
  LANGUAGE_PRACTICE: 'language_practice',
  COLLEGE_RESEARCH: 'college_research',
  APPLICATION: 'application',
  INTERVIEW: 'interview',
  ACTIVITY_LOG: 'activity_log',
  WRITING: 'writing',
  CHECKLIST: 'checklist',
  PROJECT: 'project',
  RECURRING: 'recurring',
};

const PROOF_DRIVE_URL =
  'https://drive.google.com/drive/u/0/folders/1fuER_9Jeh1DxkvhiDQbSicbD2COdyCJW';

// ───────────────────────────────────────────────────────────────────────────────
// BASIC DATE HELPERS
// ───────────────────────────────────────────────────────────────────────────────

function cloneDate(d) {
  return new Date(d.getTime());
}

function addDays(dateLike, n) {
  const d = typeof dateLike === 'string'
    ? new Date(`${dateLike}T00:00:00.000Z`)
    : cloneDate(dateLike);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function due(dateLike) {
  const dateStr = typeof dateLike === 'string' ? dateLike : isoDate(dateLike);
  return new Date(`${dateStr}T08:00:00.000Z`);
}

function weekdayDateForWeek(weekNum, dayIndex) {
  const monday = addDays(PLAN_START, (weekNum - 1) * 7);
  return addDays(monday, dayIndex);
}

function weekdaysInWeek(weekNum) {
  return [0, 1, 2, 3, 4].map(d => weekdayDateForWeek(weekNum, d));
}

function weekStartDate(weekNum) {
  return weekdayDateForWeek(weekNum, 0);
}

function weekEndDate(weekNum) {
  return addDays(weekStartDate(weekNum), 6);
}

function weekStart(weekNum) {
  return weekStartDate(weekNum);
}

function weekEnd(weekNum) {
  return weekEndDate(weekNum);
}

function weekId(weekNum) {
  return `W${String(weekNum).padStart(3, '0')}`;
}

// ───────────────────────────────────────────────────────────────────────────────
// STRING / ID HELPERS
// ───────────────────────────────────────────────────────────────────────────────

function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
}

function makeId(...parts) {
  return parts
    .map(part => slug(part))
    .filter(Boolean)
    .join('__')
    .slice(0, 190);
}

function taskId(...parts) {
  return makeId(...parts);
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function uniq(arr) {
  return [...new Set(arr)];
}

function range(a, b) {
  const out = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

function spreadWeeks(weekA, weekB, count) {
  if (count <= 0) return [];
  if (count === 1) return [Math.round((weekA + weekB) / 2)];
  const out = [];
  for (let i = 0; i < count; i++) {
    const frac = i / (count - 1);
    const wk = Math.round(weekA + frac * (weekB - weekA));
    out.push(clamp(wk, weekA, weekB));
  }
  return out;
}

function spreadDeadlines(weekA, weekB, count) {
  return spreadWeeks(weekA, weekB, count).map(wk => due(isoDate(weekEndDate(wk))));
}

// ───────────────────────────────────────────────────────────────────────────────
// QUARTERS
// Grade plan encoded directly here.
// 9th:  weeks 53–104
// 10th: weeks 105–156
// 11th: weeks 157–208
// 12th: weeks 209–247
// ───────────────────────────────────────────────────────────────────────────────

const QUARTERS = [
  {
    id: 'Q22026',
    label: 'Q2 2026',
    startDate: '2026-05-04',
    endDate: '2026-08-02',
    weekStart: 1,
    weekEnd: 13,
    grade: '7th',
    focus: 'Arithmetic cleanup, pre-algebra acceleration, AMC 8 foundations, daily habits',
  },
  {
    id: 'Q32026',
    label: 'Q3 2026',
    startDate: '2026-08-03',
    endDate: '2026-11-01',
    weekStart: 14,
    weekEnd: 26,
    grade: '7th',
    focus: '7th-grade math completion, AMC 8 topic coverage, language habit formation',
  },
  {
    id: 'Q42026',
    label: 'Q4 2026',
    startDate: '2026-11-02',
    endDate: '2027-01-31',
    weekStart: 27,
    weekEnd: 39,
    grade: '8th',
    focus: '8th-grade math, AMC 8 competition, geometry and algebra transition',
  },
  {
    id: 'Q12027',
    label: 'Q1 2027',
    startDate: '2027-02-01',
    endDate: '2027-05-02',
    weekStart: 40,
    weekEnd: 52,
    grade: '8th',
    focus: 'Algebra 1 and geometry completion, AMC 10 bridge, disciplined output systems',
  },
  {
    id: 'Q22027',
    label: 'Q2 2027',
    startDate: '2027-05-03',
    endDate: '2027-08-01',
    weekStart: 53,
    weekEnd: 65,
    grade: '9th',
    focus: 'AP 9th-grade launch, Algebra 2 base, writing, first serious extracurricular build',
  },
  {
    id: 'Q32027',
    label: 'Q3 2027',
    startDate: '2027-08-02',
    endDate: '2027-10-31',
    weekStart: 66,
    weekEnd: 78,
    grade: '9th',
    focus: 'AP 9th-grade continuation, competition depth, project portfolio foundations',
  },
  {
    id: 'Q42027',
    label: 'Q4 2027',
    startDate: '2027-11-01',
    endDate: '2028-01-30',
    weekStart: 79,
    weekEnd: 91,
    grade: '9th',
    focus: 'AP 9th-grade continuation, stronger writing, early summer strategy formation',
  },
  {
    id: 'Q12028',
    label: 'Q1 2028',
    startDate: '2028-01-31',
    endDate: '2028-04-30',
    weekStart: 92,
    weekEnd: 104,
    grade: '9th',
    focus: 'Finish 9th-grade AP set, exam readiness, transition to 10th-grade acceleration',
  },
  {
    id: 'Q22028',
    label: 'Q2 2028',
    startDate: '2028-05-01',
    endDate: '2028-07-30',
    weekStart: 105,
    weekEnd: 117,
    grade: '10th',
    focus: 'AP Calculus BC, AP Physics 1/2, AP Biology, AP CSA launch',
  },
  {
    id: 'Q32028',
    label: 'Q3 2028',
    startDate: '2028-07-31',
    endDate: '2028-10-29',
    weekStart: 118,
    weekEnd: 130,
    grade: '10th',
    focus: '10th-grade AP consolidation, SAT/PSAT ramp, research / project build',
  },
  {
    id: 'Q42028',
    label: 'Q4 2028',
    startDate: '2028-10-30',
    endDate: '2029-01-28',
    weekStart: 131,
    weekEnd: 143,
    grade: '10th',
    focus: '10th-grade AP continuity, deep technical project output, competition / distinction growth',
  },
  {
    id: 'Q12029',
    label: 'Q1 2029',
    startDate: '2029-01-29',
    endDate: '2029-04-29',
    weekStart: 144,
    weekEnd: 156,
    grade: '10th',
    focus: '10th-grade AP exams and transition to 11th-grade advanced STEM load',
  },
  {
    id: 'Q22029',
    label: 'Q2 2029',
    startDate: '2029-04-30',
    endDate: '2029-07-29',
    weekStart: 157,
    weekEnd: 169,
    grade: '11th',
    focus: 'AP Chemistry, AP Physics C: Mechanics, AP Statistics, leadership and distinction systems',
  },
  {
    id: 'Q32029',
    label: 'Q3 2029',
    startDate: '2029-07-30',
    endDate: '2029-10-28',
    weekStart: 170,
    weekEnd: 182,
    grade: '11th',
    focus: '11th-grade rigor, major project / publication / competition credibility, essay prework',
  },
  {
    id: 'Q42029',
    label: 'Q4 2029',
    startDate: '2029-10-29',
    endDate: '2030-01-27',
    weekStart: 183,
    weekEnd: 195,
    grade: '11th',
    focus: '11th-grade AP continuity, application narrative build, recommendation groundwork',
  },
  {
    id: 'Q12030',
    label: 'Q1 2030',
    startDate: '2030-01-28',
    endDate: '2030-04-28',
    weekStart: 196,
    weekEnd: 208,
    grade: '11th',
    focus: '11th-grade AP exams, summer application strategy, essay systems, college positioning',
  },
  {
    id: 'Q22030',
    label: 'Q2 2030',
    startDate: '2030-04-29',
    endDate: '2030-07-28',
    weekStart: 209,
    weekEnd: 221,
    grade: '12th',
    focus: 'AP Physics C: E&M and AP Spanish, full application execution, leadership continuity',
  },
  {
    id: 'Q32030',
    label: 'Q3 2030',
    startDate: '2030-07-29',
    endDate: '2030-10-27',
    weekStart: 222,
    weekEnd: 234,
    grade: '12th',
    focus: 'Common App, supplements, interview prep, final portfolio and recommendation management',
  },
  {
    id: 'Q42030',
    label: 'Q4 2030',
    startDate: '2030-10-28',
    endDate: '2031-01-26',
    weekStart: 235,
    weekEnd: 247,
    grade: '12th',
    focus: 'EA/RD/UC submission cycle, scholarship cleanup, final transition tasks',
  },
];

function quarterForWeek(weekNum) {
  const q = QUARTERS.find(q => weekNum >= q.weekStart && weekNum <= q.weekEnd);
  return q ? q.id : 'Q22026';
}

// ───────────────────────────────────────────────────────────────────────────────
// TASK BUILDERS
// These normalize all later task definitions into the Prisma shape.
// ───────────────────────────────────────────────────────────────────────────────

function baseTask({
  id,
  title,
  category,
  templateType,
  dueDate,
  weekId,
  quarterId,
  requiresProof = false,
  templatePrefill = {},
}) {
  return {
    id,
    title,
    category,
    templateType,
    dueDate,
    weekId,
    quarterId,
    requiresProof,
    templatePrefill,
  };
}

function weekTask({
  id,
  title,
  category,
  templateType,
  weekNum,
  requiresProof = false,
  templatePrefill = {},
}) {
  const wk = clamp(weekNum, 1, MAX_WEEK);
  return baseTask({
    id,
    title,
    category,
    templateType,
    dueDate: due(isoDate(weekEndDate(wk))),
    weekId: weekId(wk),
    quarterId: quarterForWeek(wk),
    requiresProof,
    templatePrefill,
  });
}

function weekdayTask({
  id,
  title,
  category,
  templateType,
  weekNum,
  dayIndex = 4,
  requiresProof = false,
  templatePrefill = {},
}) {
  const wk = clamp(weekNum, 1, MAX_WEEK);
  const safeDay = clamp(dayIndex, 0, 4);
  return baseTask({
    id,
    title,
    category,
    templateType,
    dueDate: due(isoDate(weekdayDateForWeek(wk, safeDay))),
    weekId: weekId(wk),
    quarterId: quarterForWeek(wk),
    requiresProof,
    templatePrefill,
  });
}

function buildExecutionBlock({
  prefix,
  category,
  templateType,
  unit,
  topic,
  weekA,
  weekB,
  requiresProof = false,
  includeReview = true,
  includeCheckpoint = true,
  includeTimed = false,
}) {
  const weeks = spreadWeeks(weekA, weekB, includeTimed ? 5 : 4);
  const tasks = [];

  tasks.push(
    weekTask({
      id: taskId(prefix, unit, topic, 'learn'),
      title: `${topic} — Learn Core Concepts`,
      category,
      templateType,
      weekNum: weeks[0],
      requiresProof,
      templatePrefill: {
        taskType: 'learn',
        unit,
        topic,
        summaryRequired: true,
        handwrittenNotesRequired: true,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );

  tasks.push(
    weekTask({
      id: taskId(prefix, unit, topic, 'drill'),
      title: `${topic} — Core Drill Set`,
      category,
      templateType,
      weekNum: weeks[1],
      requiresProof,
      templatePrefill: {
        taskType: 'drill',
        unit,
        topic,
        summaryRequired: true,
        handwrittenNotesRequired: true,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );

  tasks.push(
    weekTask({
      id: taskId(prefix, unit, topic, 'practice'),
      title: `${topic} — Mixed Practice`,
      category,
      templateType,
      weekNum: weeks[2],
      requiresProof,
      templatePrefill: {
        taskType: 'practice',
        unit,
        topic,
        summaryRequired: true,
        handwrittenNotesRequired: true,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );

  if (includeReview) {
    tasks.push(
      weekTask({
        id: taskId(prefix, unit, topic, 'review'),
        title: `${topic} — Error Review + Corrections`,
        category,
        templateType: TEMPLATE.REVIEW,
        weekNum: weeks[3],
        requiresProof,
        templatePrefill: {
          taskType: 'error_review',
          unit,
          topic,
          summaryRequired: true,
          handwrittenNotesRequired: true,
          proofUploadUrl: PROOF_DRIVE_URL,
        },
      })
    );
  }

  if (includeCheckpoint) {
    tasks.push(
      weekTask({
        id: taskId(prefix, unit, topic, 'checkpoint'),
        title: `${topic} — Mastery Checkpoint`,
        category,
        templateType: TEMPLATE.CHECKLIST,
        weekNum: weeks[Math.min(weeks.length - 1, 3)],
        requiresProof,
        templatePrefill: {
          taskType: 'checkpoint',
          unit,
          topic,
          proofUploadUrl: PROOF_DRIVE_URL,
        },
      })
    );
  }

  if (includeTimed) {
    tasks.push(
      weekTask({
        id: taskId(prefix, unit, topic, 'timed'),
        title: `${topic} — Timed Set`,
        category,
        templateType: TEMPLATE.TIMED_EXAM,
        weekNum: weeks[4],
        requiresProof: true,
        templatePrefill: {
          taskType: 'timed_set',
          unit,
          topic,
          proofUploadUrl: PROOF_DRIVE_URL,
        },
      })
    );
  }

  return tasks;
}

// ───────────────────────────────────────────────────────────────────────────────
// WEEK / QUARTER METADATA BUILDERS
// ───────────────────────────────────────────────────────────────────────────────

function buildQuarterRecords() {
  return QUARTERS.map(q => ({
    id: q.id,
    label: q.label,
    startDate: new Date(`${q.startDate}T00:00:00.000Z`),
    endDate: new Date(`${q.endDate}T00:00:00.000Z`),
    grade: q.grade,
    focus: q.focus,
  }));
}

function buildWeekRecords() {
  return range(1, MAX_WEEK).map(wk => ({
    id: weekId(wk),
    startDate: weekStartDate(wk),
    endDate: weekEndDate(wk),
    quarterId: quarterForWeek(wk),
    index: wk,
  }));
}

// ───────────────────────────────────────────────────────────────────────────────
// RECURRING SKELETON
// We will fill this out fully in Part 2.
// ───────────────────────────────────────────────────────────────────────────────

const DAILY_RECURRING_TRACKS = [
  {
    key: 'math_deep_work',
    title: 'Daily Math Deep Work',
    category: CATEGORY.RECURRING,
    templateType: TEMPLATE.RECURRING,
  },
  {
    key: 'reading_writing',
    title: 'Daily Reading / Writing Output',
    category: CATEGORY.RECURRING,
    templateType: TEMPLATE.RECURRING,
  },
  {
    key: 'language_training',
    title: 'Daily Language Training',
    category: CATEGORY.RECURRING,
    templateType: TEMPLATE.RECURRING,
  },
  {
    key: 'admin_reset',
    title: 'Daily Planning / Reset / Inbox Zero',
    category: CATEGORY.RECURRING,
    templateType: TEMPLATE.RECURRING,
  },
];

const WEEKLY_RECURRING_TRACKS = [
  {
    key: 'weekly_reflection',
    title: 'Weekly Reflection + Performance Audit',
    category: CATEGORY.RECURRING,
    templateType: TEMPLATE.REVIEW,
  },
  {
    key: 'weekly_portfolio',
    title: 'Weekly Portfolio / Artifact Upload',
    category: CATEGORY.RECURRING,
    templateType: TEMPLATE.PROJECT,
  },
  {
    key: 'weekly_long_problem',
    title: 'Weekly Long-Form Problem / Proof',
    category: CATEGORY.RECURRING,
    templateType: TEMPLATE.MATH_PROOF,
  },
];

function generateDailyRecurringTasks() {
  const tasks = [];

  for (let wk = 1; wk <= MAX_WEEK; wk++) {
    DAILY_RECURRING_TRACKS.forEach((track, i) => {
      const dayIndex = i % 5;
      tasks.push(
        weekdayTask({
          id: taskId('recurring', track.key, `week_${wk}`),
          title: `${track.title} — Week ${wk}`,
          category: track.category,
          templateType: track.templateType,
          weekNum: wk,
          dayIndex,
          requiresProof: false,
          templatePrefill: {
            taskType: track.key,
            weekNumber: wk,
            proofUploadUrl: PROOF_DRIVE_URL,
          },
        })
      );
    });
  }

  return tasks;
}

function generateWeeklyRecurringTasks() {
  const tasks = [];

  for (let wk = 1; wk <= MAX_WEEK; wk++) {
    WEEKLY_RECURRING_TRACKS.forEach(track => {
      tasks.push(
        weekTask({
          id: taskId('recurring', track.key, `week_${wk}`),
          title: `${track.title} — Week ${wk}`,
          category: track.category,
          templateType: track.templateType,
          weekNum: wk,
          requiresProof: false,
          templatePrefill: {
            taskType: track.key,
            weekNumber: wk,
            proofUploadUrl: PROOF_DRIVE_URL,
          },
        })
      );
    });
  }

  return tasks;
}

// ───────────────────────────────────────────────────────────────────────────────
// NORMALIZATION / VALIDATION
// ───────────────────────────────────────────────────────────────────────────────

function normalizeTask(task) {
  return {
    id: String(task.id),
    title: String(task.title),
    category: String(task.category),
    templateType: String(task.templateType),
    dueDate: task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate),
    requiresProof: Boolean(task.requiresProof),
    weekId: String(task.weekId),
    quarterId: String(task.quarterId),
    templatePrefill: task.templatePrefill ?? {},
  };
}

function assertTaskShape(task) {
  if (!task.id) throw new Error('Task missing id');
  if (!task.title) throw new Error(`Task ${task.id} missing title`);
  if (!task.category) throw new Error(`Task ${task.id} missing category`);
  if (!task.templateType) throw new Error(`Task ${task.id} missing templateType`);
  if (!task.weekId) throw new Error(`Task ${task.id} missing weekId`);
  if (!task.quarterId) throw new Error(`Task ${task.id} missing quarterId`);
  if (!(task.dueDate instanceof Date) || Number.isNaN(task.dueDate.getTime())) {
    throw new Error(`Task ${task.id} has invalid dueDate`);
  }
}

function finalizeTasks(tasks) {
  const normalized = tasks.map(normalizeTask);
  normalized.forEach(assertTaskShape);

  const seen = new Set();
  for (const task of normalized) {
    if (seen.has(task.id)) {
      throw new Error(`Duplicate task id detected: ${task.id}`);
    }
    seen.add(task.id);
  }

  return normalized.sort((a, b) => {
    const t = a.dueDate.getTime() - b.dueDate.getTime();
    if (t !== 0) return t;
    return a.id.localeCompare(b.id);
  });
}

// ───────────────────────────────────────────────────────────────────────────────
// DATABASE HELPERS
// ───────────────────────────────────────────────────────────────────────────────

async function batchUpsertTasks(tasks, chunkSize = 250) {
  let written = 0;

  for (let i = 0; i < tasks.length; i += chunkSize) {
    const chunk = tasks.slice(i, i + chunkSize);

    await Promise.all(
      chunk.map(task =>
        prisma.task.upsert({
          where: { id: task.id },
          update: {
            title: task.title,
            category: task.category,
            templateType: task.templateType,
            dueDate: task.dueDate,
            requiresProof: task.requiresProof,
            weekId: task.weekId,
            quarterId: task.quarterId,
            templatePrefill: task.templatePrefill ?? {},
          },
          create: {
            id: task.id,
            title: task.title,
            category: task.category,
            templateType: task.templateType,
            dueDate: task.dueDate,
            requiresProof: task.requiresProof,
            weekId: task.weekId,
            quarterId: task.quarterId,
            templatePrefill: task.templatePrefill ?? {},
          },
        })
      )
    );

    written += chunk.length;
    process.stdout.write(`\r${written}/${tasks.length} tasks written...`);
  }

  process.stdout.write('\n');
  return written;
}

async function seedQuarters() {
  const quarters = buildQuarterRecords();

  for (const q of quarters) {
    await prisma.quarter.upsert({
      where: { id: q.id },
      update: {
        label: q.label,
        startDate: q.startDate,
        endDate: q.endDate,
      },
      create: {
        id: q.id,
        label: q.label,
        startDate: q.startDate,
        endDate: q.endDate,
      },
    });
  }
}

async function seedWeeks() {
  const weeks = buildWeekRecords();

  for (const w of weeks) {
    await prisma.week.upsert({
      where: { id: w.id },
      update: {
        startDate: w.startDate,
        endDate: w.endDate,
        quarterId: w.quarterId,
      },
      create: {
        id: w.id,
        startDate: w.startDate,
        endDate: w.endDate,
        quarterId: w.quarterId,
      },
    });
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// PLACEHOLDERS FOR LATER PARTS
// ───────────────────────────────────────────────────────────────────────────────

const KHAN_MATH_TASKS = [];
const AMC8_TASKS = [];
const AMC10_TASKS = [];
const AIME_TASKS = [];
const LANGUAGE_TASKS = [];
const AP_COURSES = [];
const COLLEGE_TASKS = [];
const PROJECT_TASKS = [];
const WRITING_TASKS = [];
const LEADERSHIP_TASKS = [];
const RECURRING_TASKS = [];
const READING_TASKS = [];
const STEM_TASKS = [];
const HEALTH_TASKS = [];
const META_TASKS = [];
const AP_TASKS = [];
const COLD_EMAIL_TASKS = [];



// In later parts, AP engine helpers and generators will be defined here.
function generateExpandedAPTasks() {
  return [];
}

// In later parts, college generation will be fully inlined here.
function generateCollegePrepTasks() {
  return [];
}

// In later parts, structured build pipelines will populate these categories.
function assembleAllTasks() {
  return finalizeTasks([
    ...generateDailyRecurringTasks(),
    ...generateWeeklyRecurringTasks(),
    ...KHAN_MATH_TASKS,
    ...AMC8_TASKS,
    ...AMC10_TASKS,
    ...AIME_TASKS,
    ...LANGUAGE_TASKS,
    ...generateExpandedAPTasks(),
    ...COLLEGE_TASKS,
    ...generateCollegePrepTasks(),
    ...PROJECT_TASKS,
    ...WRITING_TASKS,
    ...LEADERSHIP_TASKS,
  ]);
}

// ───────────────────────────────────────────────────────────────────────────────
// PART 2 — RECURRING SYSTEMS (absorbed from recurring.js and upgraded)
// This replaces the old external recurring.js with a monolithic internal engine.
// Design goals:
//   • daily operating system from 7th grade to college apps
//   • phase-aware titles and expectations
//   • artifact-based reflection and output logging
//   • cold-email progression from learning -> daily sending
// ───────────────────────────────────────────────────────────────────────────────

// Phase map adapted from the old recurring.js structure, but extended to the
// monolithic 247-week plan in this file.
function getRecurringPhase(weekNum) {
  if (weekNum <= 26) return 0;   // 7th grade foundation
  if (weekNum <= 52) return 1;   // 8th grade buildout
  if (weekNum <= 104) return 2;  // 9th grade acceleration
  if (weekNum <= 156) return 3;  // 10th grade advanced
  if (weekNum <= 208) return 4;  // 11th grade application runway
  return 5;                      // 12th grade applications / transition
}

function gradeBandForWeek(weekNum) {
  if (weekNum <= 26) return '7th';
  if (weekNum <= 52) return '8th';
  if (weekNum <= 104) return '9th';
  if (weekNum <= 156) return '10th';
  if (weekNum <= 208) return '11th';
  return '12th';
}

// Daily slot structure borrowed from the user's recurring.js philosophy:
// 0 competition math
// 1 curriculum / Khan / mastery
// 2 AP / advanced academic study
// 3 language
// 4 reading
// 5 writing
// 6 STEM / coding / research
// 7 health / reflection / execution
// 8 cold email / outreach
const RECURRING_SLOTS = [
  {
    slot: 0,
    key: 'competition_math',
    category: CATEGORY.RECURRING,
    templateType: TEMPLATE.RECURRING,
    requiresProof: false,
  },
  {
    slot: 1,
    key: 'curriculum_mastery',
    category: CATEGORY.RECURRING,
    templateType: TEMPLATE.RECURRING,
    requiresProof: false,
  },
  {
    slot: 2,
    key: 'ap_advanced_study',
    category: CATEGORY.RECURRING,
    templateType: TEMPLATE.RECURRING,
    requiresProof: false,
  },
  {
    slot: 3,
    key: 'language_training',
    category: CATEGORY.RECURRING,
    templateType: TEMPLATE.LANGUAGE_PRACTICE,
    requiresProof: false,
  },
  {
    slot: 4,
    key: 'reading_training',
    category: CATEGORY.RECURRING,
    templateType: TEMPLATE.RECURRING,
    requiresProof: false,
  },
  {
    slot: 5,
    key: 'writing_training',
    category: CATEGORY.RECURRING,
    templateType: TEMPLATE.WRITING,
    requiresProof: false,
  },
  {
    slot: 6,
    key: 'stem_build',
    category: CATEGORY.RECURRING,
    templateType: TEMPLATE.PROJECT,
    requiresProof: false,
  },
  {
    slot: 7,
    key: 'health_reflection',
    category: CATEGORY.RECURRING,
    templateType: TEMPLATE.ACTIVITY_LOG,
    requiresProof: false,
  },
  {
    slot: 8,
    key: 'cold_email',
    category: CATEGORY.RECURRING,
    templateType: TEMPLATE.ACTIVITY_LOG,
    requiresProof: false,
  },
];

// Rotation pools: 12 titles per phase per slot.
// The old recurring.js used 12-title pools and rotated by week * 7 + dow;
// we keep that because it prevents repetitive same-title clusters. [file:20]
const RECURRING_TITLES = {
  competition_math: {
    0: [
      'Competition Math — AMC 8 Arithmetic and Number Sense Problem Set',
      'Competition Math — AMC 8 Geometry Drill: Angles, Area, Perimeter',
      'Competition Math — AMC 8 Counting and Probability Mixed Set',
      'Competition Math — AMC 8 Fractions, Ratios, and Percents Sprint',
      'Competition Math — AMC 8 Integer Properties and Divisibility Drill',
      'Competition Math — AMC 8 Algebra Foundations: Expressions and Equations',
      'Competition Math — AMC 8 Word Problems: Multi-Step Applied Math',
      'Competition Math — AMC 8 Data Analysis and Probability Practice',
      'Competition Math — AMC 8 Sequences, Patterns, and Logic Set',
      'Competition Math — AMC 8 Timed Mini-Set: 10 Problems in 25 Minutes',
      'Competition Math — AMC 8 Error Review and Corrections',
      'Competition Math — Mental Math Speed and Accuracy Round',
    ],
    1: [
      'Competition Math — AMC 8/10 Bridge: Linear and Quadratic Equations',
      'Competition Math — AMC 10 Number Theory: Primes, Factors, GCD/LCM',
      'Competition Math — AMC 10 Geometry: Triangles, Circles, Coordinates',
      'Competition Math — AMC 10 Counting and Probability Session',
      'Competition Math — AMC 10 Systems of Equations Drill',
      'Competition Math — AMC 10 Functions, Graphs, and Transformations',
      'Competition Math — AMC 10 Similarity, Pythagorean Theorem, Trig Intro',
      'Competition Math — AMC 10 Modular Arithmetic and Remainders',
      'Competition Math — AMC 10 Pigeonhole, Inclusion-Exclusion, Casework',
      'Competition Math — AMC 10 Timed Set: 15 Problems in 30 Minutes',
      'Competition Math — Error Log Review: Reconstruct Missed Problems',
      'Competition Math — Hard Problem Write-Up: Full Solution, Clean Logic',
    ],
    2: [
      'Competition Math — AMC 10 Polynomials and Rational Functions',
      'Competition Math — AMC 10/12 Trigonometry and Unit Circle Session',
      'Competition Math — AIME Intro: Clever Algebraic Manipulation',
      'Competition Math — Sequences and Series Competition Set',
      'Competition Math — AMC 12 Number Theory Extension',
      'Competition Math — AIME Geometry Intro: Coordinates, Cevians, Ratios',
      'Competition Math — AMC 12 Complex Numbers and Roots of Unity',
      'Competition Math — AIME Counting: Stars and Bars, Recurrence, Cases',
      'Competition Math — Logarithms and Exponentials Competition Drill',
      'Competition Math — Timed AIME-Style Session: 5 Problems in 60 Minutes',
      'Competition Math — AMC Mock Segment: 20 Problems in 40 Minutes',
      'Competition Math — Proof Writing Practice: Direct, Contradiction, Cases',
    ],
    3: [
      'Competition Math — AIME Number Theory: FLT, CRT, Orders, Remainders',
      'Competition Math — AIME Geometry: Power of a Point and Radical Axis',
      'Competition Math — AIME Combinatorics: Recursion and Advanced Counting',
      'Competition Math — AIME Algebra: Polynomials and Symmetric Relations',
      'Competition Math — AIME Trigonometry and Identity Manipulation',
      'Competition Math — AIME Full Timed Practice: 5 Problems in 60 Minutes',
      'Competition Math — AIME Error Deep Dive and Complete Rewrite',
      'Competition Math — Olympiad Bridge: One USA(J)MO-Style Attempt',
      'Competition Math — Recurrences, Sequences, and Characteristic Equations',
      'Competition Math — Inversion / Advanced Geometry Techniques Intro',
      'Competition Math — AMC 12 Full Mock: 30 Problems in 75 Minutes',
      'Competition Math — Strategy Lab: Casework, Symmetry, Invariants',
    ],
    4: [
      'Competition Math — Calculus / BC Enrichment Spiral Problem Set',
      'Competition Math — Statistics / Inference Advanced Practice Set',
      'Competition Math — AIME / Olympiad Weekly Hard Problem Attempt',
      'Competition Math — Multivariable Calculus Preview Session',
      'Competition Math — Series and Convergence Mixed Drill',
      'Competition Math — AIME Archive Problem Reconstruction',
      'Competition Math — Linear Algebra Preview: Matrices and Transformations',
      'Competition Math — Number Theory Advanced Mixed Applications',
      'Competition Math — Spiral Review Across All Major Math Domains',
      'Competition Math — Research a Theorem and Explain It Clearly',
      'Competition Math — Full AIME Timed Attempt',
      'Competition Math — Differential Equations Preview Practice',
    ],
    5: [
      'Competition Math — Maintenance Set: 3 Varied High-Level Problems',
      'Competition Math — Reflect on the Best Problem Solved This Week',
      'Competition Math — MIT OCW Calculus Reading + Problems',
      'Competition Math — AP Calculus BC Maintenance Review',
      'Competition Math — Explore an Open Mathematical Conjecture',
      'Competition Math — Statistics for College Readiness Practice',
      'Competition Math — Write a Legacy Solution for Future Reference',
      'Competition Math — Read an Olympiad Text Chapter',
      'Competition Math — Nostalgia Set: Old AMC 8/10 Problems',
      'Competition Math — Weekly Mixed Maintenance Set',
      'Competition Math — College Math Preview: Calculus III Intro',
      'Competition Math — Reflect on the Full Competition Journey',
    ],
  },

  curriculum_mastery: {
    0: [
      'Curriculum Mastery — Khan 7th Grade Ratios and Proportional Reasoning',
      'Curriculum Mastery — Khan 7th Grade Rational Number Operations',
      'Curriculum Mastery — Khan 7th Grade Expressions and Equations',
      'Curriculum Mastery — Khan 7th Grade Inequalities and Modeling',
      'Curriculum Mastery — Khan 7th Grade Geometry and Scale Drawings',
      'Curriculum Mastery — Khan 7th Grade Circle Geometry',
      'Curriculum Mastery — Khan 7th Grade Statistics and Probability',
      'Curriculum Mastery — Close Old Gaps: 6th Grade Mastery Catch-Up',
      'Curriculum Mastery — Arithmetic Fluency Verification Sprint',
      'Curriculum Mastery — Pre-Algebra Preview: Variables and Structure',
      'Curriculum Mastery — Basic Skills Diagnostic and Correction Pass',
      'Curriculum Mastery — Early Algebra Expression Building',
    ],
    1: [
      'Curriculum Mastery — Algebra 1 Linear Equations and Graphs',
      'Curriculum Mastery — Algebra 1 Quadratics and Factoring',
      'Curriculum Mastery — Geometry Congruence and Similarity',
      'Curriculum Mastery — Algebra 1 Systems and Modeling',
      'Curriculum Mastery — Geometry Circles, Arcs, and Inscribed Angles',
      'Curriculum Mastery — Algebra 1 Exponential Models',
      'Curriculum Mastery — Geometry Volume and Surface Area',
      'Curriculum Mastery — Algebra 1 Statistics and Regression',
      'Curriculum Mastery — Geometry Right Triangle Trigonometry',
      'Curriculum Mastery — Algebra 2 Preview: Polynomials Intro',
      'Curriculum Mastery — Algebra 1 Review Sprint',
      'Curriculum Mastery — Geometry Review Sprint',
    ],
    2: [
      'Curriculum Mastery — Algebra 2 Polynomial and Rational Functions',
      'Curriculum Mastery — Precalculus Trigonometric Functions',
      'Curriculum Mastery — Precalculus Limits and Continuity Preview',
      'Curriculum Mastery — Algebra 2 Logarithms and Exponential Models',
      'Curriculum Mastery — Statistics Normal Distributions and Sampling',
      'Curriculum Mastery — AP Calculus Preview: Derivatives Intro',
      'Curriculum Mastery — AP Statistics Preview: Design and Inference',
      'Curriculum Mastery — Trigonometry Identities and Unit Circle',
      'Curriculum Mastery — Vectors and Parametric Equations',
      'Curriculum Mastery — AP Calculus Preview: Integration Basics',
      'Curriculum Mastery — SAT Math Advanced Topics Drill',
      'Curriculum Mastery — Algebra 2 Full Review Sprint',
    ],
    3: [
      'Curriculum Mastery — AP Calculus BC Integration Techniques',
      'Curriculum Mastery — AP Statistics Inference for Means and Proportions',
      'Curriculum Mastery — AP Calculus BC Series and Convergence',
      'Curriculum Mastery — AP Statistics Chi-Square and Regression',
      'Curriculum Mastery — Linear Algebra Preview: Matrices and Systems',
      'Curriculum Mastery — AP Calculus BC Differential Equations',
      'Curriculum Mastery — AP Physics Review Bridge Session',
      'Curriculum Mastery — SAT Full-Length Math Timed Section',
      'Curriculum Mastery — Multivariable Calculus Preview',
      'Curriculum Mastery — AP Biology Review Sprint',
      'Curriculum Mastery — AP Chemistry Review Sprint',
      'Curriculum Mastery — AP Computer Science Structures and Complexity',
    ],
    4: [
      'Curriculum Mastery — AP Spanish Grammar and Vocabulary Review',
      'Curriculum Mastery — College Math Preview: Linear Algebra Concepts',
      'Curriculum Mastery — AP Statistics All-Unit Review',
      'Curriculum Mastery — AP Calculus BC Series / Sequences Review',
      'Curriculum Mastery — Organic Chemistry Preview',
      'Curriculum Mastery — AP Biology Evolution and Ecology Review',
      'Curriculum Mastery — AP Chemistry Kinetics / Electrochemistry Review',
      'Curriculum Mastery — Final SAT Sprint',
      'Curriculum Mastery — AP Calculus BC FRQ Type Review',
      'Curriculum Mastery — AP Physics Full Review',
      'Curriculum Mastery — SAT Reading / Writing Timed Section',
      'Curriculum Mastery — Score Maximization Weakness Drill',
    ],
    5: [
      'Curriculum Mastery — College Math Preview: Calculus III',
      'Curriculum Mastery — College Chemistry Preview',
      'Curriculum Mastery — College Biology Preview',
      'Curriculum Mastery — College CS Preview: Data Structures',
      'Curriculum Mastery — College Physics Preview: Electromagnetism',
      'Curriculum Mastery — Financial Literacy: Taxes, Budgeting, Investing',
      'Curriculum Mastery — Financial Math and Compound Interest',
      'Curriculum Mastery — College Academic Skills: Note-Taking and Study',
      'Curriculum Mastery — Financial Aid and FAFSA Literacy',
      'Curriculum Mastery — Career-Oriented Quantitative Literacy',
      'Curriculum Mastery — First-Year College Curriculum Simulation',
      'Curriculum Mastery — Intro Statistical Computing with Python',
    ],
  },

  ap_advanced_study: {
    0: [
      'Advanced Study — AP Biology Preview: Cells and Organelles',
      'Advanced Study — AP Chemistry Preview: Atomic Theory and Periodic Trends',
      'Advanced Study — AP Environmental Science Preview: Ecosystems',
      'Advanced Study — Science Method: Design an Experiment',
      'Advanced Study — AP Biology Preview: DNA, RNA, Central Dogma',
      'Advanced Study — AP Chemistry Preview: Bonding and Lewis Structures',
      'Advanced Study — Biology Reading: Mitosis vs. Meiosis',
      'Advanced Study — AP Environmental Science: Climate Systems',
      'Advanced Study — Chemistry Preview: Stoichiometry and Moles',
      'Advanced Study — Read a Science Article and Summarize',
      'Advanced Study — AP Biology Preview: Photosynthesis vs. Respiration',
      'Advanced Study — Science Notebook: Observe and Document a Phenomenon',
    ],
    1: [
      'Advanced Study — AP Biology Preview: Genetics Deep Read',
      'Advanced Study — AP Chemistry Preview: Gas Laws and Thermochemistry',
      'Advanced Study — AP Physics Preview: Newton’s Laws and Kinematics',
      'Advanced Study — AP Environmental Science: Policy and Ecosystems',
      'Advanced Study — AP Computer Science Preview: Algorithms and Structures',
      'Advanced Study — AP Biology Preview: Ecology and Populations',
      'Advanced Study — AP Chemistry Preview: Acids, Bases, Equilibrium',
      'Advanced Study — AP Physics Preview: Energy, Work, Power',
      'Advanced Study — AP Human Geography Preview: Population and Migration',
      'Advanced Study — AP Psychology Preview: Learning and Memory',
      'Advanced Study — Research a Recent Scientific Breakthrough',
      'Advanced Study — AP Environmental Policy Case Study',
    ],
    2: [
      'Advanced Study — AP Precalculus Current Unit Practice',
      'Advanced Study — AP Environmental Science Unit Review / FRQ',
      'Advanced Study — AP Human Geography Vocab + Case Studies',
      'Advanced Study — AP Psychology Key Terms and Application',
      'Advanced Study — AP Computer Science Principles Module Practice',
      'Advanced Study — AP Physics Preview: Circuits and Electromagnetism',
      'Advanced Study — AP Bio / Chem Cross-Reference Session',
      'Advanced Study — AP Psychology Research Methods / Stats',
      'Advanced Study — AP Human Geography Map Analysis',
      'Advanced Study — APES Free-Response Data Analysis',
      'Advanced Study — AP Precalculus FRQ Practice',
      'Advanced Study — AP CSP Create Task Planning',
    ],
    3: [
      'Advanced Study — AP Calculus BC Current Topic Drill',
      'Advanced Study — AP Biology Unit Review + FRQ',
      'Advanced Study — AP Chemistry Quantitative Problem Session',
      'Advanced Study — AP Statistics Inference Practice',
      'Advanced Study — AP Physics Current Unit Problem Set',
      'Advanced Study — AP CSA Coding Challenge',
      'Advanced Study — AP Biology Error Log Rebuild',
      'Advanced Study — AP Chemistry ICE / Equilibrium Practice',
      'Advanced Study — AP Calculus BC Series Mixed Set',
      'Advanced Study — AP Statistics FRQ Self-Score',
      'Advanced Study — AP Physics Experimental Design / Analysis',
      'Advanced Study — AP CSA Debugging and Optimization',
    ],
    4: [
      'Advanced Study — AP Calculus BC Full Spiral Review',
      'Advanced Study — AP Spanish Writing / Speaking Practice',
      'Advanced Study — AP Physics C E&M Derivation Review',
      'Advanced Study — AP Statistics Final Review: All Major Types',
      'Advanced Study — AP Biology Full FRQ Practice',
      'Advanced Study — AP Chemistry Final Review Session',
      'Advanced Study — AP CS Algorithms / DS Mock Interview',
      'Advanced Study — AP Spanish Grammar Intensive',
      'Advanced Study — AP Calculus BC Convergence Sprint',
      'Advanced Study — AP Physics C Mechanics FRQ Type Review',
      'Advanced Study — AP Language Rhetorical Analysis Practice',
      'Advanced Study — All-Subject Weakness Drill',
    ],
    5: [
      'Advanced Study — MIT OCW Physics Lecture Notes Session',
      'Advanced Study — MIT OCW Chemistry / Materials Reading',
      'Advanced Study — MIT OCW Biology Reading',
      'Advanced Study — Read a College Textbook Chapter',
      'Advanced Study — College Preview: CS Data Structures / Algorithms',
      'Advanced Study — Teach Aloud: Strongest Subject Review',
      'Advanced Study — Proof-Based Mathematics Intro',
      'Advanced Study — College Note-Taking and Reading Skills',
      'Advanced Study — Economics Foundations Preview',
      'Advanced Study — Read a Research Paper in Your Interest Area',
      'Advanced Study — Statistics / Computing Preview',
      'Advanced Study — Document Your Top Academic Achievements',
    ],
  },

  language_training: {
    0: [
      'Language — Spanish Michel Thomas Review and Reinforcement',
      'Language — Spanish Grammar Drill: Ser, Estar, Tener',
      'Language — Spanish Conversation Practice: Introductions and Routine',
      'Language — Spanish Vocabulary Review: 10 Academic Words',
      'Language — Spanish Listening: Podcast or Audiobook Segment',
      'Language — Spanish Writing: 5-Sentence Diary Entry',
      'Language — Spanish Grammar: Ser vs. Estar Exercises',
      'Language — Spanish Media: Clip + 5 New Words',
      'Language — Spanish Reading: Short Article + Summary',
      'Language — Spanish Pronunciation Recording',
      'Language — Spanish Vocabulary Cumulative Review',
      'Language — Spanish Speaking Monologue: 1 Minute',
    ],
    1: [
      'Language — Spanish Advanced Track Review',
      'Language — Spanish Grammar: Preterite vs. Imperfect',
      'Language — Spanish Conversation: Express 3 Opinions',
      'Language — Spanish Vocabulary in Context Sentences',
      'Language — Spanish Listening: News Podcast + Notes',
      'Language — Spanish Writing with Past Tenses',
      'Language — Spanish Grammar: Subjunctive Intro',
      'Language — Spanish Documentary Segment Notes',
      'Language — Spanish Current Events Reading',
      'Language — Spanish Speaking Summary of Today’s Work',
      'Language — Spanish Thematic Vocabulary Deck Review',
      'Language — Spanish Reflexive Verbs Drill',
    ],
    2: [
      'Language — Russian Michel Thomas Current Track Review',
      'Language — Russian Cyrillic Reading / Writing Drill',
      'Language — Russian Grammar: Cases Practice',
      'Language — Russian Vocabulary: 8 New Words',
      'Language — Russian Listening Segment + Comprehension',
      'Language — Spanish Maintenance Review',
      'Language — Russian Writing: Simple Sentences',
      'Language — Russian Verb Conjugation Drill',
      'Language — Russian Media Notes',
      'Language — Russian Reading and Translation',
      'Language — Compare Spanish and Russian Structures',
      'Language — Russian Speaking Script Recording',
    ],
    3: [
      'Language — Russian Verbal Aspect Drill',
      'Language — Russian Case Declension Full Review',
      'Language — Russian Academic Vocabulary Session',
      'Language — Russian Listening: News Segment',
      'Language — Russian Paragraph on an Academic Topic',
      'Language — Russian Complex Grammar / Clause Practice',
      'Language — Russian Film / Show Notes',
      'Language — Russian News Article Summary',
      'Language — Russian Speaking: Summarize Academic Work',
      'Language — Russian SRS / Anki Review',
      'Language — Russian Complex Sentences Drill',
      'Language — Russian Culture Context Research',
    ],
    4: [
      'Language — AP Spanish Email Reply Practice',
      'Language — AP Spanish Persuasive Essay Practice',
      'Language — AP Spanish Conversation Simulation',
      'Language — AP Spanish Cultural Comparison Outline',
      'Language — AP Spanish Listening Comprehension',
      'Language — AP Spanish Reading Literary Excerpt Analysis',
      'Language — AP Spanish Advanced Grammar Drill',
      'Language — AP Spanish Theme Vocabulary Context Practice',
      'Language — AP Spanish Full Timed Practice Task',
      'Language — AP Spanish Pronunciation and Fluency Recording',
      'Language — AP Spanish Authentic Media Analysis',
      'Language — AP Spanish Writing Error Review',
    ],
    5: [
      'Language — Spanish Maintenance Conversation Session',
      'Language — Russian Maintenance Reading / Vocabulary Review',
      'Language — Language Portfolio Update',
      'Language — Spanish Novel Chapter Reading',
      'Language — Russian Film Reaction Note',
      'Language — Reflect on Language Use in College',
      'Language — Spanish 2-Minute Speech Practice',
      'Language — Russian Anki Maintenance Session',
      'Language — Translation Practice: Meaningful Passage',
      'Language — Spanish Placement Exam Prep',
      'Language — Russian Self-Assessment',
      'Language — Write to Future Self in Another Language',
    ],
  },

  reading_training: {
    0: [
      'Reading — Current Book 30-Minute Session',
      'Reading — Nonfiction Article: 3-Sentence Summary',
      'Reading — Annotate 5 Interesting Lines',
      'Reading — Classic Novel or Biography Session',
      'Reading — Vocabulary Hunt: 5 Unknown Words',
      'Reading — Connect Reading to Future Goals',
      'Reading — Science Discovery Article Summary',
      'Reading — Free Reading Session',
      'Reading — Book Report Notes: Main Idea + Themes',
      'Reading — Author Background Research',
      'Reading — Update Reading Log and Ratings',
      'Reading — Academic Reading Session',
    ],
    1: [
      'Reading — Current Novel Progress Session',
      'Reading — Academic STEM Article Summary',
      'Reading — Annotate for Future Essay Connections',
      'Reading — Classics Session',
      'Reading — STEM Biography Session',
      'Reading — Deep Reading on Structure and Style',
      'Reading — Current Events in Science / Tech',
      'Reading — Prepare a Book Club Discussion Prompt',
      'Reading — History / Social Science Reading',
      'Reading — Literary Analysis: One Symbol',
      'Reading — Update Future Reading List',
      'Reading — Long Science Reading Session',
    ],
    2: [
      'Reading — Current Book Progress and Log',
      'Reading — Academic Journal Abstract + 3 Takeaways',
      'Reading — AP-Adjacent Literary Reading',
      'Reading — Nonfiction by a Serious Thinker',
      'Reading — Long-Form Magazine Article',
      'Reading — Annotate for Personal Essay Material',
      'Reading — Science Nonfiction Session',
      'Reading — Textbook / Structured Academic Reading',
      'Reading — Free Reading, Any Genre',
      'Reading — Literary Analysis Paragraph',
      'Reading — Add 3 Books to Future List',
      'Reading — Career / Major Connection Reflection',
    ],
    3: [
      'Reading — Current Book with Deep Annotation',
      'Reading — STEM Study Intro / Results Section',
      'Reading — Analyze Strong College Essays',
      'Reading — Serious Literary Reading Session',
      'Reading — STEM Book Session',
      'Reading — The Economist / Nature / NYT Reading',
      'Reading — Mark Hook Moments for Essays',
      'Reading — Explore a Dream College Syllabus',
      'Reading — Poetry / Stories / Graphic Narrative Session',
      'Reading — Nonfiction on Innovation / Society',
      'Reading — One-Paragraph Reading Response',
      'Reading — Citation Rabbit Hole: Follow 3 Links',
    ],
    4: [
      'Reading — Current Book Progress Log',
      'Reading — Analyze 2 Successful Essays',
      'Reading — Intro Reading for Intended Major',
      'Reading — Philosophy / Ethics Reading',
      'Reading — Personal Statement Advice Reading',
      'Reading — Global News Reflection',
      'Reading — Academic Paper Abstract in Intended Field',
      'Reading — Memoir / Narrative Nonfiction Session',
      'Reading — Annotate Favorite Book for Why School Essay',
      'Reading — Read Anything That Makes You Think',
      'Reading — Prepare a Book Recommendation for Interview',
      'Reading — Curiosity Log Entry',
    ],
    5: [
      'Reading — First-Year College Text Preview',
      'Reading — College Nonfiction Session',
      'Reading — Free Reading Session',
      'Reading — OCW / University Reading List Exploration',
      'Reading — Essays by a Favorite Writer',
      'Reading — Reflection on What Books Taught You',
      'Reading — Read a Voice Unlike Your Own',
      'Reading — Practice Explaining Complex Ideas Simply',
      'Reading — Student Success / College Habits Reading',
      'Reading — Final Annotated Reading List Update',
      'Reading — Revisit Favorite Book from the Journey',
      'Reading — Letter to College Self About Books',
    ],
  },

  writing_training: {
    0: [
      'Writing — Persuasive Paragraph: Claim / Evidence / Warrant',
      'Writing — Daily Journal: Challenges and Wins',
      'Writing — Academic Vocabulary Sentences',
      'Writing — Descriptive Paragraph: Ideal Study Day',
      'Writing — Task Completion Reflection',
      'Writing — Compare / Contrast Two Ideas from Today',
      'Writing — Summary of Today’s Reading',
      'Writing — Gratitude Entry with Specific Reasons',
      'Writing — Cause / Effect Paragraph',
      'Writing — Argument Outline',
      'Writing — Weekly Reflection and Next Steps',
      'Writing — Short Essay: Biggest Academic Goal',
    ],
    1: [
      'Writing — 5-Paragraph Essay Outline',
      'Writing — Intellectual Reflection Journal',
      'Writing — Argument Essay Partial Draft',
      'Writing — Source Credibility Evaluation',
      'Writing — Energy / Focus Log',
      'Writing — Compare / Contrast Essay',
      'Writing — Research Notes from 3 Sources',
      'Writing — Long-Term Goal Journal',
      'Writing — Expository Essay on a Math / Science Concept',
      'Writing — Counterargument Paragraph',
      'Writing — Identity Reflection Journal',
      'Writing — Short Essay: Why Math and Science Matter',
    ],
    2: [
      'Writing — AP Lang Rhetorical Analysis Paragraph',
      'Writing — Academic Reflection on Hardest Concept',
      'Writing — Brainstorm 10 Pivotal Life Moments',
      'Writing — Synthesis Practice with 3 Sources',
      'Writing — Research One Elite Student Profile and Analyze',
      'Writing — Timed AP Lang Argument Draft',
      'Writing — Research Paper Intro / Thesis Draft',
      'Writing — Curiosity Journal: Today’s Rabbit Hole',
      'Writing — Personal Narrative Draft',
      'Writing — Style Analysis of a Strong Passage',
      'Writing — Dream Acceptance Letter Exercise',
      'Writing — Short Essay: Most Important Extracurricular',
    ],
    3: [
      'Writing — Common App Draft Fragment (300 Words)',
      'Writing — Honest Competitive Self-Assessment',
      'Writing — AP Lang Full Timed Essay',
      'Writing — College Essay Revision Pass',
      'Writing — Profile Research: Someone You Admire',
      'Writing — Supplemental Essay Draft',
      'Writing — Research Paper Body Paragraph with Citation',
      'Writing — Activities Documentation Entry',
      'Writing — College Essay Feedback Iteration',
      'Writing — Lab Report Data / Analysis / Conclusion',
      'Writing — Letter to Future Self',
      'Writing — Scholarship Essay Draft',
    ],
    4: [
      'Writing — Common App Full Draft / Polish',
      'Writing — Application Progress Log',
      'Writing — Supplemental Drafts for Top Schools',
      'Writing — Scholarship Short Response',
      'Writing — Senior Year Vision Entry',
      'Writing — Activities Section Polish',
      'Writing — Recommendation Packet Review',
      'Writing — Intellectual Identity Reflection',
      'Writing — Interview Answer Drafts',
      'Writing — Final Proofread Read-Aloud Pass',
      'Writing — Anxiety Reframe Journal',
      'Writing — Private One-Page Why This Matters Letter',
    ],
    5: [
      'Writing — Decision Journal and Tradeoff Reflection',
      'Writing — Final-Year Reflection',
      'Writing — Thank-You Notes to Mentors',
      'Writing — College Transition Academic Plan',
      'Writing — Legacy Reflection',
      'Writing — Final Essay: Biggest Lesson',
      'Writing — Summer / Transition Plan',
      'Writing — Gratitude Retrospective',
      'Writing — Open Letter to 7th-Grade Self',
      'Writing — Archive and Organize All Essays',
      'Writing — Final Goal Review',
      'Writing — Vision Statement for College Self',
    ],
  },

  stem_build: {
    0: [
      'STEM Build — Python Basics Session',
      'STEM Build — Biology Exploration Session',
      'STEM Build — Scratch / Simple Interactive Build',
      'STEM Build — Spreadsheet Tracker for Scores and Study',
      'STEM Build — Neuroscience / Learning Science Reading',
      'STEM Build — Python Calculator / Arithmetic Program',
      'STEM Build — Chemistry Foundations Exploration',
      'STEM Build — HTML Basics Session',
      'STEM Build — Current Science Module Progress Session',
      'STEM Build — Watch and Note a Serious STEM Lecture',
      'STEM Build — Python if / else Drill',
      'STEM Build — Observe a Real-World Problem Worth Solving',
    ],
    1: [
      'STEM Build — Python Loops and Data Structures',
      'STEM Build — AP Physics Preview Session',
      'STEM Build — Python Functions and Abstraction',
      'STEM Build — Research a Technology You Actually Care About',
      'STEM Build — Science Reading on a Hard Topic',
      'STEM Build — JavaScript Basics and DOM',
      'STEM Build — Biology Deep Dive: Genetics / CRISPR',
      'STEM Build — Python File I/O and Processing',
      'STEM Build — Build a Script for a Real Math Need',
      'STEM Build — Climate Science Reading',
      'STEM Build — CSS / Flexbox Session',
      'STEM Build — Computer Science Module Progress',
    ],
    2: [
      'STEM Build — Python OOP Session',
      'STEM Build — AP CSP Current Project Progress',
      'STEM Build — Pandas / Data Analysis Intro',
      'STEM Build — OCW Physics / Chemistry Lecture Session',
      'STEM Build — JavaScript Async / Fetch Session',
      'STEM Build — Beginner Dataset Exploration',
      'STEM Build — Sorting Algorithms Session',
      'STEM Build — Math Visualization Session',
      'STEM Build — SQL Basics on Sample Data',
      'STEM Build — Read a CS / Bio / Math Abstract',
      'STEM Build — Recursion Practice',
      'STEM Build — Science Communicator Video + Notes',
    ],
    3: [
      'STEM Build — AP CSA Java Practice',
      'STEM Build — Portfolio Project Progress Sprint',
      'STEM Build — Java Data Structures Session',
      'STEM Build — Research Paper Intro / Conclusion Reading',
      'STEM Build — Trees / Graph Traversal Practice',
      'STEM Build — Competitive Programming Practice',
      'STEM Build — ML Intro Session',
      'STEM Build — Algorithms Lecture Session',
      'STEM Build — Recursion / Backtracking Practice',
      'STEM Build — Ship a Feature on a Real Project',
      'STEM Build — AP CSA FRQ Drill',
      'STEM Build — Read on AI / biotech / quantum / ethics',
    ],
    4: [
      'STEM Build — Portfolio Project for Applications',
      'STEM Build — Read a Paper in Intended Field',
      'STEM Build — Visualize a Dataset with Python',
      'STEM Build — Explore a Real Research Lab',
      'STEM Build — Build a Website / App Feature',
      'STEM Build — Find an Open Source Issue',
      'STEM Build — System Design Sketch',
      'STEM Build — Science / Society Talk and Reflection',
      'STEM Build — LeetCode Medium Session',
      'STEM Build — Research Competition / Publication Planning',
      'STEM Build — NLP / Data Tool Experiment',
      'STEM Build — Read a Preprint and Take Notes',
    ],
    5: [
      'STEM Build — College CS Preview Session',
      'STEM Build — Final Portfolio Polish',
      'STEM Build — README / Documentation Upgrade',
      'STEM Build — Explore Faculty and Labs at Dream Schools',
      'STEM Build — Data Structures / Algorithms Review',
      'STEM Build — Research / Internship Program Search',
      'STEM Build — Build Something Fun with No Rules',
      'STEM Build — STEM Career Reflection',
      'STEM Build — Review Best Projects for Interviews',
      'STEM Build — Write About the Impact You Want to Make',
      'STEM Build — Finalize and Publish a Best Project',
      'STEM Build — Department / Faculty / Course Deep Dive',
    ],
  },

  health_reflection: {
    0: [
      'Execution Review — Exercise, Hydration, and Recovery Log',
      'Execution Review — Sleep, Energy, and Mood Check',
      'Execution Review — Did You Complete Today’s Work?',
      'Execution Review — 5-Minute Breathing Reset',
      'Execution Review — 20 Minutes of Movement Log',
      'Execution Review — Screen-Time Audit',
      'Execution Review — What Worked Today / What Failed?',
      'Execution Review — Gratitude Entry',
      'Execution Review — Bedtime Routine Planning',
      'Execution Review — Name One Difficulty and Response',
      'Execution Review — Weekly Goals Check',
      'Execution Review — Self-Care and Basic Maintenance Log',
    ],
    1: [
      'Execution Review — Exercise / Nutrition / Hydration Snapshot',
      'Execution Review — Stress Check and Coping Action',
      'Execution Review — Performance Trend Reflection',
      'Execution Review — Guided Focus Reset',
      'Execution Review — Specific Workout / Activity Log',
      'Execution Review — Study Habits Audit',
      'Execution Review — Top 3 Things Learned Today',
      'Execution Review — Gratitude About the Journey',
      'Execution Review — Sleep Optimization Log',
      'Execution Review — Hardest Problem and Approach Used',
      'Execution Review — Weekly Accountability Check',
      'Execution Review — Compare Skills to Week 1',
    ],
    2: [
      'Execution Review — Exercise / Sleep / Nutrition Log',
      'Execution Review — Self-Grade Work Quality Today',
      'Execution Review — Competition Tracker Update',
      'Execution Review — Stressors and Action Plan',
      'Execution Review — Movement Session Log',
      'Execution Review — Alignment with Long-Term Goal',
      'Execution Review — Energy Curve and Focus Times',
      'Execution Review — Gratitude for Someone Who Helped',
      'Execution Review — Sleep Consistency Review',
      'Execution Review — Competition Progress Update',
      'Execution Review — Which Study Methods Are Actually Working?',
      'Execution Review — Big-Picture Alignment Check',
    ],
    3: [
      'Execution Review — Consistency in Health Basics',
      'Execution Review — Application / Testing / Resume Tracker',
      'Execution Review — Anxiety Audit and Evidence-Based Reframe',
      'Execution Review — 30-Minute Workout / Activity Log',
      'Execution Review — Learning vs. Mere Completion Check',
      'Execution Review — What Are You Proud of This Week?',
      'Execution Review — Gratitude Toward a Mentor / Parent / Teacher',
      'Execution Review — Test Prep Tracker',
      'Execution Review — Sleep Trend Review',
      'Execution Review — EC Documentation Update',
      'Execution Review — Who Are You Beyond Scores?',
      'Execution Review — Burnout Risk Assessment',
    ],
    4: [
      'Execution Review — Application Checklist Progress',
      'Execution Review — Protect Sleep / Exercise During Stress',
      'Execution Review — Process Anxiety Journal',
      'Execution Review — 20-Minute Reset Walk / Exercise',
      'Execution Review — One Interview Question Practice Log',
      'Execution Review — Activity / Hours / Impact Log',
      'Execution Review — Did You Move Applications Forward Today?',
      'Execution Review — Gratitude for Support System',
      'Execution Review — Sleep Protection During Application Season',
      'Execution Review — Scarcity vs. Abundance Reframe',
      'Execution Review — Note Every Milestone Submitted',
      'Execution Review — You Are More Than an Admit Result',
    ],
    5: [
      'Execution Review — Senior Health and Wellbeing Check-In',
      'Execution Review — Decision Processing Journal',
      'Execution Review — Legacy Reflection',
      'Execution Review — Health Habits Built Over Years',
      'Execution Review — Transition Plan Check',
      'Execution Review — Gratitude Letter Prompt',
      'Execution Review — Return to Week 1 Goals',
      'Execution Review — Top 5 Moments of the Journey',
      'Execution Review — What Are You Excited for in College?',
      'Execution Review — 50-Word Identity Statement',
      'Execution Review — Which Healthy Habits Continue Forward?',
      'Execution Review — Closing Journal Entry',
    ],
  },
};

const RECURRING_SLOT_KEYS = [
  'competition_math',    // slot 0
  'curriculum_mastery',  // slot 1
  'ap_advanced_study',   // slot 2
  'language_training',   // slot 3
  'reading_training',    // slot 4
  'writing_training',    // slot 5
  'stem_build',          // slot 6
  'health_reflection',   // slot 7
];

const ALL_TASK_COLLECTIONS = [
  KHAN_MATH_TASKS,
  AMC8_TASKS,
  AMC10_TASKS,
  AIME_TASKS,
  AP_TASKS,
  LANGUAGE_TASKS,
  RECURRING_TASKS,
  READING_TASKS,
  WRITING_TASKS,
  STEM_TASKS,
  HEALTH_TASKS,
  COLLEGE_TASKS,
  COLD_EMAIL_TASKS,
  META_TASKS,
];




// Week 1 cold-email curriculum was explicitly encoded in recurring.js.
// After week 1, cold-email turns into daily outreach. [file:20]
const COLD_EMAIL_WEEK_ONE = [
  'Cold Email — Day 1: What Cold Email Is and Why It Works',
  'Cold Email — Day 2: Research a Target Person Worth Writing To',
  'Cold Email — Day 3: Write 5 Subject Lines and Judge Them',
  'Cold Email — Day 4: Write 5 Opening Lines and Keep Only 1',
  'Cold Email — Day 5: Draft a Body That Is Short, Specific, Valuable',
  'Cold Email — Day 6: Practice a Clean Ask and Sign-Off',
  'Cold Email — Day 7: Send the First Real Cold Email',
];

function getColdEmailTitle(weekNum, dayIndex) {
  if (weekNum === 1) return COLD_EMAIL_WEEK_ONE[dayIndex];
  if (weekNum <= 12) return 'Cold Email — Send 2 Cold Emails and Log Results';
  if (weekNum <= 52) return 'Cold Email — Send 2 Outreach Emails and Track Replies';
  if (weekNum <= 104) return 'Cold Email — Send 2 Outreach Emails for Mentorship / Opportunities';
  if (weekNum <= 156) return 'Cold Email — Send 2 Outreach Emails for Research / Projects / Advice';
  if (weekNum <= 208) return 'Cold Email — Send 2 Outreach Emails for Research / Summer / Recs / Interviews';
  return 'Cold Email — Send 2 Strategic Outreach Emails and Log Outcomes';
}

function buildRecurringTemplatePrefill({
  slotKey,
  phase,
  weekNum,
  dayIndex,
  title,
}) {
  return {
    taskType: 'recurring',
    slotKey,
    phase,
    phaseLabel: ['foundation', 'buildout', 'acceleration', 'advanced', 'application', 'senior'][phase],
    weekNumber: weekNum,
    dayOfWeek: dayIndex,
    gradeBand: gradeBandForWeek(weekNum),
    titleSnapshot: title,
    proofUploadUrl: PROOF_DRIVE_URL,
  };
}

// Daily recurring generation, now properly integrated into seed.js.
// This absorbs the old recurring.js 9-slot model directly into the current file. [file:20]
function generateDailyRecurringTasks() {
  const tasks = [];

  for (let weekNum = 1; weekNum <= MAX_WEEK; weekNum++) {
    const phase = getRecurringPhase(weekNum);
    const qId = quarterForWeek(weekNum);
    const wId = weekId(weekNum);

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayDate = weekdayDateForWeek(weekNum, clamp(dayIndex, 0, 4));
      const dayDue = due(isoDate(dayDate));
      const rotationIndex = (weekNum * 7 + dayIndex) % 12;

      for (const slotMeta of RECURRING_SLOTS) {
        let title;

        if (slotMeta.key === 'cold_email') {
          title = getColdEmailTitle(weekNum, dayIndex);
        } else {
          title = RECURRING_TITLES[slotMeta.key][phase][rotationIndex];
        }

        tasks.push(
          baseTask({
            id: taskId('rec', `w${String(weekNum).padStart(3, '0')}`, `d${dayIndex}`, `s${slotMeta.slot}`),
            title,
            category: slotMeta.category,
            templateType: slotMeta.templateType,
            dueDate: dayDue,
            weekId: wId,
            quarterId: qId,
            requiresProof: slotMeta.requiresProof,
            templatePrefill: buildRecurringTemplatePrefill({
              slotKey: slotMeta.key,
              phase,
              weekNum,
              dayIndex,
              title,
            }),
          })
        );
      }
    }
  }

  return tasks;
}

// Weekly architecture beyond the daily slots.
// The old recurring.js emphasized density; here we convert that into higher-value
// weekly artifacts and planning loops so the system is not just busywork. [file:20]
const WEEKLY_OPERATING_SYSTEMS = [
  {
    key: 'weekly_reflection',
    title: 'Weekly Reflection + Scoreboard Audit',
    templateType: TEMPLATE.REVIEW,
    category: CATEGORY.RECURRING,
  },
  {
    key: 'weekly_portfolio_artifact',
    title: 'Weekly Portfolio Artifact Upload',
    templateType: TEMPLATE.PROJECT,
    category: CATEGORY.RECURRING,
  },
  {
    key: 'weekly_long_problem',
    title: 'Weekly Long-Form Math Problem / Proof',
    templateType: TEMPLATE.MATH_PROOF,
    category: CATEGORY.RECURRING,
  },
  {
    key: 'weekly_schedule_reset',
    title: 'Weekly Planning Reset and Calendar Build',
    templateType: TEMPLATE.CHECKLIST,
    category: CATEGORY.RECURRING,
  },
  {
    key: 'weekly_outreach_review',
    title: 'Weekly Outreach Review and Follow-Up Decisions',
    templateType: TEMPLATE.ACTIVITY_LOG,
    category: CATEGORY.RECURRING,
  },
  {
    key: 'weekly_reading_log',
    title: 'Weekly Reading Log and Intellectual Curiosity Update',
    templateType: TEMPLATE.REVIEW,
    category: CATEGORY.RECURRING,
  },
  {
    key: 'weekly_activity_ledger',
    title: 'Weekly Activities Ledger: Hours, Impact, Evidence',
    templateType: TEMPLATE.ACTIVITY_LOG,
    category: CATEGORY.RECURRING,
  },
];

function weeklyTheme(weekNum) {
  const phase = getRecurringPhase(weekNum);

  if (phase === 0) return 'build discipline and close foundational gaps';
  if (phase === 1) return 'accelerate coursework and establish a stronger edge';
  if (phase === 2) return 'stack serious rigor and begin visible distinction';
  if (phase === 3) return 'sustain elite-level output and technical depth';
  if (phase === 4) return 'convert achievement into a compelling application profile';
  return 'finish cleanly, document legacy, and prepare for transition';
}

function generateWeeklyRecurringTasks() {
  const tasks = [];

  for (let weekNum = 1; weekNum <= MAX_WEEK; weekNum++) {
    const phase = getRecurringPhase(weekNum);

    for (const item of WEEKLY_OPERATING_SYSTEMS) {
      tasks.push(
        weekTask({
          id: taskId('weekly', item.key, `week_${weekNum}`),
          title: `${item.title} — Week ${weekNum}`,
          category: item.category,
          templateType: item.templateType,
          weekNum,
          requiresProof: item.key === 'weekly_long_problem' || item.key === 'weekly_portfolio_artifact',
          templatePrefill: {
            taskType: item.key,
            weekNumber: weekNum,
            phase,
            gradeBand: gradeBandForWeek(weekNum),
            theme: weeklyTheme(weekNum),
            proofUploadUrl: PROOF_DRIVE_URL,
          },
        })
      );
    }
  }

  return tasks;
}

// Monthly / quarter cadence tasks.
// These make the recurring system strategic instead of purely operational.
function generateStrategicRecurringTasks() {
  const tasks = [];

  for (let weekNum = 1; weekNum <= MAX_WEEK; weekNum++) {
    const phase = getRecurringPhase(weekNum);

    if ((weekNum - 1) % 4 === 0) {
      tasks.push(
        weekTask({
          id: taskId('strategic', 'monthly_profile_audit', `week_${weekNum}`),
          title: `Monthly Profile Audit — Week ${weekNum}`,
          category: CATEGORY.RECURRING,
          templateType: TEMPLATE.REVIEW,
          weekNum,
          requiresProof: false,
          templatePrefill: {
            taskType: 'monthly_profile_audit',
            phase,
            gradeBand: gradeBandForWeek(weekNum),
            auditAreas: [
              'academics',
              'competition_math',
              'projects',
              'leadership',
              'writing',
              'reading',
              'language',
              'application_readiness',
            ],
            proofUploadUrl: PROOF_DRIVE_URL,
          },
        })
      );

      tasks.push(
        weekTask({
          id: taskId('strategic', 'monthly_brag_sheet_update', `week_${weekNum}`),
          title: `Monthly Brag Sheet / Resume Update — Week ${weekNum}`,
          category: CATEGORY.RECURRING,
          templateType: TEMPLATE.ACTIVITY_LOG,
          weekNum,
          requiresProof: false,
          templatePrefill: {
            taskType: 'monthly_brag_sheet_update',
            phase,
            gradeBand: gradeBandForWeek(weekNum),
            proofUploadUrl: PROOF_DRIVE_URL,
          },
        })
      );
    }

    if ((weekNum - 1) % 13 === 0) {
      tasks.push(
        weekTask({
          id: taskId('strategic', 'quarter_reset', `week_${weekNum}`),
          title: `Quarter Reset — Rebuild Targets, Systems, and Priorities`,
          category: CATEGORY.RECURRING,
          templateType: TEMPLATE.CHECKLIST,
          weekNum,
          requiresProof: false,
          templatePrefill: {
            taskType: 'quarter_reset',
            phase,
            gradeBand: gradeBandForWeek(weekNum),
            quarterId: quarterForWeek(weekNum),
            proofUploadUrl: PROOF_DRIVE_URL,
          },
        })
      );

      tasks.push(
        weekTask({
          id: taskId('strategic', 'quarterly_narrative_log', `week_${weekNum}`),
          title: `Quarter Narrative Log — What Changed, What Improved, What Matters`,
          category: CATEGORY.RECURRING,
          templateType: TEMPLATE.WRITING,
          weekNum,
          requiresProof: false,
          templatePrefill: {
            taskType: 'quarterly_narrative_log',
            phase,
            gradeBand: gradeBandForWeek(weekNum),
            quarterId: quarterForWeek(weekNum),
            proofUploadUrl: PROOF_DRIVE_URL,
          },
        })
      );
    }
  }

  return tasks;
}

// Replace Part 1's simpler assembleAllTasks behavior by expanding recurring systems.
// We redefine assembleAllTasks later again once all categories are loaded,
// but this version is already safe and more complete.
function assembleAllTasks() {
  return finalizeTasks([
    ...generateDailyRecurringTasks(),
    ...generateWeeklyRecurringTasks(),
    ...generateStrategicRecurringTasks(),
    ...KHAN_MATH_TASKS,
    ...AMC8_TASKS,
    ...AMC10_TASKS,
    ...AIME_TASKS,
    ...LANGUAGE_TASKS,
    ...generateExpandedAPTasks(),
    ...COLLEGE_TASKS,
    ...generateCollegePrepTasks(),
    ...PROJECT_TASKS,
    ...WRITING_TASKS,
    ...LEADERSHIP_TASKS,
  ]);
}

// ───────────────────────────────────────────────────────────────────────────────
// PART 3 — KHAN MATH EXECUTION TASKS: ARITHMETIC THROUGH 6TH GRADE
// This upgrades the old "one topic = one task" KHAN block into real execution
// blocks. The original file had early math, K, 1st, 2nd, 3rd, 4th, 5th, and
// 6th-grade topics represented as shallow dueWeek entries. [file:19]
// Here, each topic becomes 5 tasks:
//   learn -> drill -> mixed practice -> error review -> mastery checkpoint
// ───────────────────────────────────────────────────────────────────────────────

const KHAN_FOUNDATION_UNITS = [
  {
    unit: 'Early Math',
    prefix: 'khan_early_math',
    weekA: 1,
    weekB: 2,
    topics: [
      'Counting Small Numbers 1–10',
      'Counting Up to 20',
      'Counting Up to 100',
      'Comparing and Ordering Numbers to 20',
      'Addition Within 10',
      'Addition Within 20',
      'Subtraction Within 10',
      'Subtraction Within 20',
      'Place Value: Tens and Ones',
      'Basic Measurement and Shape Recognition',
    ],
  },
  {
    unit: 'Kindergarten',
    prefix: 'khan_kindergarten',
    weekA: 1,
    weekB: 3,
    topics: [
      'Counting and Cardinality 0–10',
      'Counting and Cardinality 11–20',
      'Operations: Addition Within 10',
      'Operations: Subtraction Within 10',
      'Shapes: 2D and 3D',
      'Measurement: Length, Weight, Capacity Comparisons',
    ],
  },
  {
    unit: '1st Grade',
    prefix: 'khan_grade_1',
    weekA: 2,
    weekB: 5,
    topics: [
      'Addition and Subtraction Within 20',
      'Place Value to 99',
      'Measurement Using Nonstandard Units',
      'Telling Time to the Half Hour',
      'Geometry: Defining and Non-Defining Attributes',
      'Data: Organizing and Representing Data',
    ],
  },
  {
    unit: '2nd Grade',
    prefix: 'khan_grade_2',
    weekA: 2,
    weekB: 6,
    topics: [
      'Addition and Subtraction Within 100',
      'Addition and Subtraction Within 1000',
      'Place Value: Hundreds, Tens, Ones',
      'Measurement in Standard Units',
      'Telling Time to the Nearest 5 Minutes',
      'Money: Dollars and Cents',
      'Geometry: Partitioning Shapes into Equal Parts',
    ],
  },
  {
    unit: '3rd Grade',
    prefix: 'khan_grade_3',
    weekA: 3,
    weekB: 8,
    topics: [
      'Introduction to Multiplication',
      'Introduction to Division',
      'Multiplication and Division Within 100',
      'Multi-Digit Addition and Subtraction Within 1000',
      'Fractions: Unit Fractions',
      'Fractions on the Number Line',
      'Area of Rectangles',
      'Perimeter and Problem Solving',
      'Quadrilaterals and Shape Categories',
      'Bar Graphs and Picture Graphs',
    ],
  },
  {
    unit: '4th Grade',
    prefix: 'khan_grade_4',
    weekA: 4,
    weekB: 10,
    topics: [
      'Multi-Digit Multiplication',
      'Multi-Digit Division',
      'Factors, Multiples, and Prime / Composite Numbers',
      'Equivalent Fractions and Fraction Comparison',
      'Adding and Subtracting Fractions',
      'Multiplying Fractions by Whole Numbers',
      'Decimals: Tenths and Hundredths',
      'Converting Measurement Units',
      'Lines, Angles, and 2D Geometry',
      'Line Plots with Fractions',
    ],
  },
  {
    unit: '5th Grade',
    prefix: 'khan_grade_5',
    weekA: 5,
    weekB: 12,
    topics: [
      'Multiplying and Dividing Fractions',
      'Decimal Operations',
      'Place Value and Powers of 10',
      'Expressions, Patterns, and the Coordinate Plane',
      'Volume of Rectangular Prisms',
      'Coordinate Plane and Shape Hierarchies',
      'Line Plots with Fractional Data',
    ],
  },
  {
    unit: '6th Grade',
    prefix: 'khan_grade_6',
    weekA: 6,
    weekB: 13,
    topics: [
      'Ratios and Proportional Reasoning',
      'Arithmetic with Fractions and Decimals',
      'Integers and the Coordinate Plane',
      'Algebraic Expressions and Substitution',
      'One-Step Equations and Inequalities',
      'Area of Triangles, Quadrilaterals, and Composite Figures',
      'Surface Area and Volume of 3D Figures',
      'Statistics: Mean, Median, Mode, Range, Distributions',
    ],
  },
];

// Topic metadata gives more structured templatePrefill and lets later parts
// infer progression more cleanly.
function inferKhanDomain(unit, topic) {
  const t = `${unit} ${topic}`.toLowerCase();

  if (t.includes('count') || t.includes('place value') || t.includes('money')) return 'number_sense';
  if (t.includes('addition') || t.includes('subtraction') || t.includes('multiplication') || t.includes('division')) return 'operations';
  if (t.includes('fraction') || t.includes('decimal') || t.includes('ratio') || t.includes('percent')) return 'fractions_decimals_ratios';
  if (t.includes('equation') || t.includes('expression') || t.includes('inequal') || t.includes('variable') || t.includes('pattern')) return 'algebra';
  if (t.includes('geometry') || t.includes('shape') || t.includes('angle') || t.includes('circle') || t.includes('area') || t.includes('perimeter') || t.includes('volume') || t.includes('surface area') || t.includes('coordinate')) return 'geometry';
  if (t.includes('graph') || t.includes('data') || t.includes('statistic') || t.includes('probability')) return 'data_statistics';
  if (t.includes('time') || t.includes('measurement')) return 'measurement';
  return 'general_math';
}

function inferKhanSkillLevel(unit) {
  const u = unit.toLowerCase();
  if (u.includes('early') || u.includes('kindergarten')) return 'foundational';
  if (u.includes('1st') || u.includes('2nd') || u.includes('3rd')) return 'elementary';
  if (u.includes('4th') || u.includes('5th')) return 'upper_elementary';
  if (u.includes('6th')) return 'pre_algebra';
  return 'general';
}

function buildKhanExecutionBlock({
  prefix,
  unit,
  topic,
  weekA,
  weekB,
}) {
  const domain = inferKhanDomain(unit, topic);
  const skillLevel = inferKhanSkillLevel(unit);

  return buildExecutionBlock({
    prefix,
    category: CATEGORY.KHAN_MATH,
    templateType: TEMPLATE.KHAN,
    unit,
    topic,
    weekA,
    weekB,
    requiresProof: false,
    includeReview: true,
    includeCheckpoint: true,
    includeTimed: false,
  }).map(task => ({
    ...task,
    templatePrefill: {
      ...task.templatePrefill,
      provider: 'Khan Academy',
      curriculumBand: 'foundation_to_prealgebra',
      domain,
      skillLevel,
      sourceUnit: unit,
      topicLabel: topic,
      recommendedSessionMinutes: unit === 'Early Math' || unit === 'Kindergarten' ? 20 : 30,
      masteryTarget: '90_percent_or_better',
      notesRequired: true,
      errorLogRequired: task.title.toLowerCase().includes('review'),
      checkpointRequired: task.title.toLowerCase().includes('mastery checkpoint'),
    },
  }));
}

function generateFoundationKhanTasks() {
  const tasks = [];

  for (const unitBlock of KHAN_FOUNDATION_UNITS) {
    const spread = spreadWeeks(unitBlock.weekA, unitBlock.weekB, unitBlock.topics.length);

    unitBlock.topics.forEach((topic, idx) => {
      const centerWeek = spread[idx];
      const topicWeekA = clamp(centerWeek - 1, unitBlock.weekA, unitBlock.weekB);
      const topicWeekB = clamp(centerWeek + 1, unitBlock.weekA, unitBlock.weekB);

      tasks.push(
        ...buildKhanExecutionBlock({
          prefix: unitBlock.prefix,
          unit: unitBlock.unit,
          topic,
          weekA: topicWeekA,
          weekB: topicWeekB,
        })
      );
    });
  }

  return tasks;
}

// Additional capstone tasks for early arithmetic fluency.
// These ensure the foundational sequence is not just topic coverage but actual
// readiness for later acceleration.
function generateFoundationKhanCapstones() {
  const capstones = [
    {
      id: 'khan_foundation_arithmetic_diagnostic_1',
      title: 'Khan Foundation Diagnostic — Arithmetic and Number Sense Baseline',
      weekNum: 1,
      unit: 'Foundation',
      domain: 'number_sense',
    },
    {
      id: 'khan_foundation_operations_checkpoint',
      title: 'Khan Foundation Checkpoint — Core Operations Fluency',
      weekNum: 4,
      unit: 'Foundation',
      domain: 'operations',
    },
    {
      id: 'khan_foundation_fraction_decimal_checkpoint',
      title: 'Khan Foundation Checkpoint — Fractions, Decimals, and Ratios',
      weekNum: 7,
      unit: 'Foundation',
      domain: 'fractions_decimals_ratios',
    },
    {
      id: 'khan_foundation_geometry_measurement_checkpoint',
      title: 'Khan Foundation Checkpoint — Geometry and Measurement',
      weekNum: 9,
      unit: 'Foundation',
      domain: 'geometry',
    },
    {
      id: 'khan_foundation_data_stats_checkpoint',
      title: 'Khan Foundation Checkpoint — Data and Statistics Basics',
      weekNum: 11,
      unit: 'Foundation',
      domain: 'data_statistics',
    },
    {
      id: 'khan_foundation_mastery_gate',
      title: 'Khan Foundation Mastery Gate — Ready for 7th Grade / Pre-Algebra',
      weekNum: 13,
      unit: 'Foundation',
      domain: 'comprehensive',
    },
  ];

  return capstones.map(item =>
    weekTask({
      id: item.id,
      title: item.title,
      category: CATEGORY.KHAN_MATH,
      templateType: TEMPLATE.MOCK_TEST,
      weekNum: item.weekNum,
      requiresProof: false,
      templatePrefill: {
        provider: 'Khan Academy',
        taskType: 'foundation_capstone',
        sourceUnit: item.unit,
        domain: item.domain,
        curriculumBand: 'foundation_to_prealgebra',
        recommendedSessionMinutes: 45,
        masteryTarget: '90_percent_or_better',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// Skill-maintenance spiral tasks.
// These create repeated cumulative review across the first 13 weeks so the old
// file's compressed early math schedule is actually survivable.
function generateFoundationSpiralReviewTasks() {
  const spiralSpecs = [
    {
      weekNum: 2,
      title: 'Foundation Spiral Review — Counting, Place Value, and Basic Operations',
      focus: ['number_sense', 'operations'],
    },
    {
      weekNum: 4,
      title: 'Foundation Spiral Review — Addition, Subtraction, and Early Fractions',
      focus: ['operations', 'fractions_decimals_ratios'],
    },
    {
      weekNum: 6,
      title: 'Foundation Spiral Review — Multiplication, Division, and Measurement',
      focus: ['operations', 'measurement'],
    },
    {
      weekNum: 8,
      title: 'Foundation Spiral Review — Fractions, Area, Perimeter, and Data',
      focus: ['fractions_decimals_ratios', 'geometry', 'data_statistics'],
    },
    {
      weekNum: 10,
      title: 'Foundation Spiral Review — Decimals, Graphs, and Multi-Step Problems',
      focus: ['fractions_decimals_ratios', 'data_statistics', 'algebra'],
    },
    {
      weekNum: 12,
      title: 'Foundation Spiral Review — Pre-Algebra Readiness Mixed Set',
      focus: ['algebra', 'geometry', 'number_sense'],
    },
    {
      weekNum: 13,
      title: 'Foundation Spiral Review — Final Cumulative Mixed Set',
      focus: ['comprehensive'],
    },
  ];

  return spiralSpecs.map(spec =>
    weekTask({
      id: taskId('khan_foundation', 'spiral_review', `week_${spec.weekNum}`),
      title: spec.title,
      category: CATEGORY.KHAN_MATH,
      templateType: TEMPLATE.REVIEW,
      weekNum: spec.weekNum,
      requiresProof: false,
      templatePrefill: {
        provider: 'Khan Academy',
        taskType: 'spiral_review',
        curriculumBand: 'foundation_to_prealgebra',
        focusDomains: spec.focus,
        recommendedSessionMinutes: 35,
        masteryTarget: '85_percent_or_better',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// Short writing / explanation tasks tied to the foundation math build.
// The idea is to force articulation, not just clicks.
function generateFoundationMathWritingTasks() {
  const prompts = [
    {
      weekNum: 3,
      title: 'Math Writing — Explain Place Value and Why It Matters',
      promptType: 'explanation',
    },
    {
      weekNum: 5,
      title: 'Math Writing — Explain Multiplication as Repeated Addition and Arrays',
      promptType: 'concept_explanation',
    },
    {
      weekNum: 7,
      title: 'Math Writing — Explain Equivalent Fractions in Your Own Words',
      promptType: 'concept_explanation',
    },
    {
      weekNum: 9,
      title: 'Math Writing — Explain Area vs. Perimeter with Examples',
      promptType: 'compare_contrast',
    },
    {
      weekNum: 11,
      title: 'Math Writing — Explain Mean, Median, and Mode to a Younger Student',
      promptType: 'teaching',
    },
    {
      weekNum: 13,
      title: 'Math Writing — What Foundational Math Weaknesses Did You Eliminate?',
      promptType: 'reflection',
    },
  ];

  return prompts.map(item =>
    weekTask({
      id: taskId('khan_foundation', 'writing', `week_${item.weekNum}`, item.promptType),
      title: item.title,
      category: CATEGORY.KHAN_MATH,
      templateType: TEMPLATE.WRITING,
      weekNum: item.weekNum,
      requiresProof: false,
      templatePrefill: {
        provider: 'Khan Academy',
        taskType: 'math_writing',
        promptType: item.promptType,
        curriculumBand: 'foundation_to_prealgebra',
        recommendedSessionMinutes: 20,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// Now actually populate the Part 1 placeholder array.
KHAN_MATH_TASKS.push(
  ...generateFoundationKhanTasks(),
  ...generateFoundationKhanCapstones(),
  ...generateFoundationSpiralReviewTasks(),
  ...generateFoundationMathWritingTasks()
);

// ───────────────────────────────────────────────────────────────────────────────
// PART 4 — KHAN MATH EXECUTION TASKS: 7TH, 8TH, ALGEBRA 1, GEOMETRY
// The original file had these as flat topic arrays with dueWeek values. [file:19]
// This part converts them into dense execution blocks and transition gates.
// ───────────────────────────────────────────────────────────────────────────────

const KHAN_MIDDLE_AND_HS_UNITS = [
  {
    unit: '7th Grade',
    prefix: 'khan_grade_7',
    weekA: 14,
    weekB: 26,
    topics: [
      'Proportional Relationships and Unit Rate',
      'Rational Number Operations: Add and Subtract',
      'Rational Number Operations: Multiply and Divide',
      'Negative Numbers, Absolute Value, and Ordering',
      'Algebraic Expressions and Combining Like Terms',
      'Two-Step Equations',
      'Inequalities and Graphing Solutions',
      'Scale Drawings and Similar Figures',
      'Area and Circumference of Circles',
      'Angles, Triangles, and Transversals',
      'Basic Probability and Complementary Events',
      'Sampling and Comparing Populations',
    ],
  },
  {
    unit: '8th Grade',
    prefix: 'khan_grade_8',
    weekA: 27,
    weekB: 39,
    topics: [
      'Linear Equations in One Variable',
      'Systems of Linear Equations',
      'Functions: Definition, Notation, and Linear Functions',
      'Slope and Slope-Intercept Form',
      'Integer Exponents and Scientific Notation',
      'Square Roots and Cube Roots',
      'Pythagorean Theorem and Applications',
      'Transformations: Rotations, Reflections, Translations, Dilations',
      'Congruence and Similarity',
      'Scatter Plots, Correlation, and Linear Models',
    ],
  },
  {
    unit: 'Algebra 1',
    prefix: 'khan_algebra_1',
    weekA: 40,
    weekB: 52,
    topics: [
      'Algebraic Properties and Order of Operations',
      'Linear Equations: Solving and Graphing',
      'Linear Inequalities: Solving and Graphing',
      'Functions: Domain, Range, and Function Notation',
      'Systems of Equations: Substitution and Elimination',
      'Polynomials: Operations and Factoring',
      'Quadratic Equations: Factoring, Completing the Square, Formula',
      'Quadratic Functions and Graphing',
      'Exponential Functions: Growth and Decay',
      'Data and Statistics Interpretation',
    ],
  },
  {
    unit: 'Geometry',
    prefix: 'khan_geometry',
    weekA: 40,
    weekB: 52,
    topics: [
      'Points, Lines, Planes, and Introductory Proofs',
      'Angle Relationships and Parallel Lines',
      'Triangle Congruence: SSS, SAS, ASA, AAS, HL',
      'Triangle Similarity and Proportionality',
      'Right Triangles and Special Right Triangles',
      'Trigonometric Ratios and Applications',
      'Quadrilaterals and Their Properties',
      'Circles: Arcs, Chords, Central and Inscribed Angles',
      'Circle Area, Arc Length, and Sector Area',
      'Coordinate Geometry: Distance, Midpoint, Slope, Equations',
      'Transformations and Dilations',
      'Surface Area and Volume of Solids',
      'Geometric Probability',
    ],
  },
];

function inferAdvancedKhanDomain(unit, topic) {
  const t = `${unit} ${topic}`.toLowerCase();

  if (
    t.includes('proportional') ||
    t.includes('ratio') ||
    t.includes('rational') ||
    t.includes('slope') ||
    t.includes('function') ||
    t.includes('equation') ||
    t.includes('inequal') ||
    t.includes('polynomial') ||
    t.includes('quadratic') ||
    t.includes('exponential')
  ) {
    return 'algebra';
  }

  if (
    t.includes('geometry') ||
    t.includes('circle') ||
    t.includes('triangle') ||
    t.includes('angle') ||
    t.includes('transversal') ||
    t.includes('transform') ||
    t.includes('congruence') ||
    t.includes('similarity') ||
    t.includes('trigonometric') ||
    t.includes('coordinate') ||
    t.includes('area') ||
    t.includes('volume') ||
    t.includes('surface area') ||
    t.includes('pythagorean')
  ) {
    return 'geometry';
  }

  if (
    t.includes('scatter') ||
    t.includes('correlation') ||
    t.includes('linear model') ||
    t.includes('statistics') ||
    t.includes('sampling') ||
    t.includes('probability') ||
    t.includes('data')
  ) {
    return 'data_statistics';
  }

  if (
    t.includes('scientific notation') ||
    t.includes('square roots') ||
    t.includes('cube roots') ||
    t.includes('exponents')
  ) {
    return 'number_sense';
  }

  return 'general_math';
}

function inferAdvancedSkillBand(unit) {
  const u = unit.toLowerCase();
  if (u.includes('7th')) return 'middle_school_foundation';
  if (u.includes('8th')) return 'middle_school_algebra_bridge';
  if (u.includes('algebra 1')) return 'high_school_core';
  if (u.includes('geometry')) return 'high_school_core';
  return 'general';
}

function buildAdvancedKhanExecutionBlock({
  prefix,
  unit,
  topic,
  weekA,
  weekB,
  includeTimed = true,
}) {
  const domain = inferAdvancedKhanDomain(unit, topic);
  const skillBand = inferAdvancedSkillBand(unit);

  return buildExecutionBlock({
    prefix,
    category: CATEGORY.KHAN_MATH,
    templateType: TEMPLATE.KHAN,
    unit,
    topic,
    weekA,
    weekB,
    requiresProof: false,
    includeReview: true,
    includeCheckpoint: true,
    includeTimed,
  }).map(task => ({
    ...task,
    templatePrefill: {
      ...task.templatePrefill,
      provider: 'Khan Academy',
      curriculumBand: 'middle_school_to_geometry',
      sourceUnit: unit,
      topicLabel: topic,
      domain,
      skillBand,
      recommendedSessionMinutes: task.templateType === TEMPLATE.TIMED_EXAM ? 45 : 35,
      masteryTarget:
        unit === '7th Grade' || unit === '8th Grade'
          ? '90_percent_or_better'
          : '93_percent_or_better',
      notesRequired: true,
      errorLogRequired:
        task.templateType === TEMPLATE.REVIEW || task.templateType === TEMPLATE.TIMED_EXAM,
      proofUploadUrl: PROOF_DRIVE_URL,
    },
  }));
}

function generateMiddleAndHsKhanTasks() {
  const tasks = [];

  for (const unitBlock of KHAN_MIDDLE_AND_HS_UNITS) {
    const spread = spreadWeeks(unitBlock.weekA, unitBlock.weekB, unitBlock.topics.length);

    unitBlock.topics.forEach((topic, idx) => {
      const centerWeek = spread[idx];

      const topicWeekA =
        unitBlock.unit === 'Geometry'
          ? clamp(centerWeek - 1, 40, 52)
          : clamp(centerWeek - 1, unitBlock.weekA, unitBlock.weekB);

      const topicWeekB =
        unitBlock.unit === 'Geometry'
          ? clamp(centerWeek + 1, 40, 52)
          : clamp(centerWeek + 1, unitBlock.weekA, unitBlock.weekB);

      tasks.push(
        ...buildAdvancedKhanExecutionBlock({
          prefix: unitBlock.prefix,
          unit: unitBlock.unit,
          topic,
          weekA: topicWeekA,
          weekB: topicWeekB,
          includeTimed: true,
        })
      );
    });
  }

  return tasks;
}

// ───────────────────────────────────────────────────────────────────────────────
// 7TH GRADE CAPSTONES / TRANSITIONS
// ───────────────────────────────────────────────────────────────────────────────

function generate7thGradeKhanCapstones() {
  const items = [
    {
      weekNum: 15,
      title: '7th Grade Diagnostic — Ratios, Integers, Expressions',
      focus: ['algebra', 'number_sense'],
    },
    {
      weekNum: 18,
      title: '7th Grade Checkpoint — Rational Number Fluency',
      focus: ['number_sense', 'algebra'],
    },
    {
      weekNum: 21,
      title: '7th Grade Checkpoint — Geometry, Circles, and Angles',
      focus: ['geometry'],
    },
    {
      weekNum: 24,
      title: '7th Grade Checkpoint — Probability and Data',
      focus: ['data_statistics'],
    },
    {
      weekNum: 26,
      title: '7th Grade Final Gate — Ready for 8th Grade / AMC 8 Peak',
      focus: ['comprehensive'],
    },
  ];

  return items.map(item =>
    weekTask({
      id: taskId('khan_grade_7', 'capstone', `week_${item.weekNum}`),
      title: item.title,
      category: CATEGORY.KHAN_MATH,
      templateType: TEMPLATE.MOCK_TEST,
      weekNum: item.weekNum,
      requiresProof: false,
      templatePrefill: {
        provider: 'Khan Academy',
        taskType: 'capstone',
        sourceUnit: '7th Grade',
        focusDomains: item.focus,
        curriculumBand: 'middle_school_to_geometry',
        recommendedSessionMinutes: 50,
        masteryTarget: '90_percent_or_better',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

function generate7thGradeSpiralTasks() {
  const weeks = [16, 19, 22, 25, 26];

  return weeks.map((weekNum, idx) =>
    weekTask({
      id: taskId('khan_grade_7', 'spiral', `week_${weekNum}`),
      title:
        idx === weeks.length - 1
          ? '7th Grade Spiral Review — Full Cumulative Mixed Set'
          : `7th Grade Spiral Review — Mixed Set ${idx + 1}`,
      category: CATEGORY.KHAN_MATH,
      templateType: TEMPLATE.REVIEW,
      weekNum,
      requiresProof: false,
      templatePrefill: {
        provider: 'Khan Academy',
        taskType: 'spiral_review',
        sourceUnit: '7th Grade',
        curriculumBand: 'middle_school_to_geometry',
        recommendedSessionMinutes: 35,
        focusDomains: ['algebra', 'geometry', 'data_statistics', 'number_sense'],
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// 8TH GRADE CAPSTONES / TRANSITIONS
// ───────────────────────────────────────────────────────────────────────────────

function generate8thGradeKhanCapstones() {
  const items = [
    {
      weekNum: 28,
      title: '8th Grade Diagnostic — Linear Equations and Functions',
      focus: ['algebra'],
    },
    {
      weekNum: 31,
      title: '8th Grade Checkpoint — Systems, Slope, and Graphs',
      focus: ['algebra'],
    },
    {
      weekNum: 34,
      title: '8th Grade Checkpoint — Exponents, Roots, Pythagorean Theorem',
      focus: ['number_sense', 'geometry'],
    },
    {
      weekNum: 37,
      title: '8th Grade Checkpoint — Transformations, Similarity, Models',
      focus: ['geometry', 'data_statistics'],
    },
    {
      weekNum: 39,
      title: '8th Grade Final Gate — Ready for Algebra 1 / AMC 10 Bridge',
      focus: ['comprehensive'],
    },
  ];

  return items.map(item =>
    weekTask({
      id: taskId('khan_grade_8', 'capstone', `week_${item.weekNum}`),
      title: item.title,
      category: CATEGORY.KHAN_MATH,
      templateType: TEMPLATE.MOCK_TEST,
      weekNum: item.weekNum,
      requiresProof: false,
      templatePrefill: {
        provider: 'Khan Academy',
        taskType: 'capstone',
        sourceUnit: '8th Grade',
        focusDomains: item.focus,
        curriculumBand: 'middle_school_to_geometry',
        recommendedSessionMinutes: 55,
        masteryTarget: '91_percent_or_better',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

function generate8thGradeSpiralTasks() {
  const weeks = [29, 32, 35, 38, 39];

  return weeks.map((weekNum, idx) =>
    weekTask({
      id: taskId('khan_grade_8', 'spiral', `week_${weekNum}`),
      title:
        idx === weeks.length - 1
          ? '8th Grade Spiral Review — Full Cumulative Mixed Set'
          : `8th Grade Spiral Review — Mixed Set ${idx + 1}`,
      category: CATEGORY.KHAN_MATH,
      templateType: TEMPLATE.REVIEW,
      weekNum,
      requiresProof: false,
      templatePrefill: {
        provider: 'Khan Academy',
        taskType: 'spiral_review',
        sourceUnit: '8th Grade',
        curriculumBand: 'middle_school_to_geometry',
        recommendedSessionMinutes: 40,
        focusDomains: ['algebra', 'geometry', 'data_statistics', 'number_sense'],
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// ALGEBRA 1 / GEOMETRY PARALLEL TRACK
// In the old file, Algebra 1 and Geometry both finished by week 52. [file:19]
// Here we explicitly build joint checks so both tracks stay alive together.
// ───────────────────────────────────────────────────────────────────────────────

function generateAlgebra1GeometryBridgeTasks() {
  const specs = [
    {
      weekNum: 41,
      title: 'Algebra 1 / Geometry Launch Diagnostic',
      type: 'diagnostic',
    },
    {
      weekNum: 44,
      title: 'Algebra 1 / Geometry Mixed Set — Equations, Graphs, Angles, Proof',
      type: 'mixed_set',
    },
    {
      weekNum: 47,
      title: 'Algebra 1 / Geometry Mixed Set — Quadratics, Similarity, Circles',
      type: 'mixed_set',
    },
    {
      weekNum: 50,
      title: 'Algebra 1 / Geometry Timed Check — Core Fluency Under Time',
      type: 'timed_check',
    },
    {
      weekNum: 52,
      title: 'Algebra 1 / Geometry Exit Gate — Ready for Algebra 2 and Higher Rigor',
      type: 'exit_gate',
    },
  ];

  return specs.map(spec =>
    weekTask({
      id: taskId('khan_alg1_geo', spec.type, `week_${spec.weekNum}`),
      title: spec.title,
      category: CATEGORY.KHAN_MATH,
      templateType:
        spec.type === 'timed_check' || spec.type === 'exit_gate'
          ? TEMPLATE.TIMED_EXAM
          : TEMPLATE.MOCK_TEST,
      weekNum: spec.weekNum,
      requiresProof: false,
      templatePrefill: {
        provider: 'Khan Academy',
        taskType: spec.type,
        sourceUnit: 'Algebra 1 + Geometry',
        curriculumBand: 'middle_school_to_geometry',
        recommendedSessionMinutes: spec.type === 'exit_gate' ? 70 : 55,
        masteryTarget: '93_percent_or_better',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

function generateAlgebra1WritingTasks() {
  const prompts = [
    {
      weekNum: 42,
      title: 'Math Writing — Explain Function Notation and Why It Matters',
      topic: 'functions',
    },
    {
      weekNum: 45,
      title: 'Math Writing — Explain Why Slope Measures Rate of Change',
      topic: 'slope_rate_of_change',
    },
    {
      weekNum: 48,
      title: 'Math Writing — Compare Linear vs. Quadratic Behavior',
      topic: 'linear_vs_quadratic',
    },
    {
      weekNum: 51,
      title: 'Math Writing — Explain Substitution vs. Elimination',
      topic: 'systems',
    },
  ];

  return prompts.map(item =>
    weekTask({
      id: taskId('khan_algebra_1', 'writing', `week_${item.weekNum}`, item.topic),
      title: item.title,
      category: CATEGORY.KHAN_MATH,
      templateType: TEMPLATE.WRITING,
      weekNum: item.weekNum,
      requiresProof: false,
      templatePrefill: {
        provider: 'Khan Academy',
        taskType: 'math_writing',
        sourceUnit: 'Algebra 1',
        topic: item.topic,
        recommendedSessionMinutes: 20,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

function generateGeometryWritingTasks() {
  const prompts = [
    {
      weekNum: 43,
      title: 'Math Writing — Explain Triangle Congruence Criteria Clearly',
      topic: 'triangle_congruence',
    },
    {
      weekNum: 46,
      title: 'Math Writing — Explain Similarity vs. Congruence',
      topic: 'similarity_vs_congruence',
    },
    {
      weekNum: 49,
      title: 'Math Writing — Explain Inscribed Angles and Arc Relationships',
      topic: 'circle_theorems',
    },
    {
      weekNum: 52,
      title: 'Math Writing — Which Geometry Ideas Feel Most Powerful and Why?',
      topic: 'reflection',
    },
  ];

  return prompts.map(item =>
    weekTask({
      id: taskId('khan_geometry', 'writing', `week_${item.weekNum}`, item.topic),
      title: item.title,
      category: CATEGORY.KHAN_MATH,
      templateType: TEMPLATE.WRITING,
      weekNum: item.weekNum,
      requiresProof: false,
      templatePrefill: {
        provider: 'Khan Academy',
        taskType: 'math_writing',
        sourceUnit: 'Geometry',
        topic: item.topic,
        recommendedSessionMinutes: 20,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// TRANSITION GATES INTO LATER PARTS
// These are important because the original file jumps from Geometry / Algebra 1
// into Algebra 2, trig / precalc, statistics, and AP-style work. [file:19]
// We make that jump explicit here.
// ───────────────────────────────────────────────────────────────────────────────

function generateTransitionGateTasks() {
  const specs = [
    {
      weekNum: 26,
      id: 'transition_7_to_8',
      title: 'Transition Gate — 7th Grade to 8th Grade Readiness Verification',
      source: '7th_to_8th',
    },
    {
      weekNum: 39,
      id: 'transition_8_to_alg1',
      title: 'Transition Gate — 8th Grade to Algebra 1 / Geometry Verification',
      source: '8th_to_alg1_geometry',
    },
    {
      weekNum: 52,
      id: 'transition_alg1_geo_to_alg2',
      title: 'Transition Gate — Algebra 1 / Geometry to Algebra 2 Readiness',
      source: 'alg1_geometry_to_alg2',
    },
  ];

  return specs.map(spec =>
    weekTask({
      id: spec.id,
      title: spec.title,
      category: CATEGORY.KHAN_MATH,
      templateType: TEMPLATE.CHECKLIST,
      weekNum: spec.weekNum,
      requiresProof: false,
      templatePrefill: {
        provider: 'Khan Academy',
        taskType: 'transition_gate',
        transitionType: spec.source,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// POPULATE KHAN_MATH_TASKS
// ───────────────────────────────────────────────────────────────────────────────

KHAN_MATH_TASKS.push(
  ...generateMiddleAndHsKhanTasks(),
  ...generate7thGradeKhanCapstones(),
  ...generate7thGradeSpiralTasks(),
  ...generate8thGradeKhanCapstones(),
  ...generate8thGradeSpiralTasks(),
  ...generateAlgebra1GeometryBridgeTasks(),
  ...generateAlgebra1WritingTasks(),
  ...generateGeometryWritingTasks(),
  ...generateTransitionGateTasks()
);

// ───────────────────────────────────────────────────────────────────────────────
// PART 5 — KHAN MATH EXECUTION TASKS: ALGEBRA 2, TRIG/PRECALC, STATS, CALC, SAT
// The original file included these as flat arrays with dueWeek targets. [file:19]
// This part converts them into execution blocks plus capstones and score gates.
// ───────────────────────────────────────────────────────────────────────────────

const KHAN_UPPER_MATH_UNITS = [
  {
    unit: 'Algebra 2',
    prefix: 'khan_algebra_2',
    weekA: 53,
    weekB: 65,
    topics: [
      'Polynomial Operations, Long Division, and Synthetic Division',
      'Polynomial Theorems: Remainder, Factor, Rational Root',
      'Complex Numbers and the Complex Plane',
      'Rational Expressions and Rational Equations',
      'Radical Expressions and Radical Equations',
      'Exponential and Logarithmic Functions',
      'Logarithm Properties and Solving Log / Exponential Equations',
      'Systems of Equations in Three Variables and Matrices',
      'Conic Sections: Parabolas, Ellipses, Hyperbolas, Circles',
      'Sequences and Series: Arithmetic, Geometric, Sigma Notation',
      'Permutations, Combinations, and the Binomial Theorem',
      'Normal Distributions and Regression Models',
    ],
  },
  {
    unit: 'Trigonometry',
    prefix: 'khan_trigonometry',
    weekA: 66,
    weekB: 78,
    topics: [
      'Unit Circle, Degrees, and Radians',
      'Graphs of Sine, Cosine, and Tangent',
      'Pythagorean, Reciprocal, and Quotient Identities',
      'Sum, Difference, Double-Angle, and Half-Angle Identities',
      'Solving Trigonometric Equations',
      'Inverse Trigonometric Functions',
      'Polar Coordinates and Polar Equations',
      'Complex Numbers in Polar Form and De Moivre’s Theorem',
      'Vectors: Magnitude, Direction, Dot Product, Cross Product',
      'Limits: Intuitive Introduction and Limit Notation',
    ],
  },
  {
    unit: 'Statistics and Probability',
    prefix: 'khan_statistics',
    weekA: 79,
    weekB: 91,
    topics: [
      'Displaying and Comparing Data: Histograms, Box Plots, Dot Plots',
      'Summarizing Quantitative Data: Mean, Median, IQR, Standard Deviation',
      'Scatter Plots, Correlation, and Regression Lines',
      'Basic Probability Rules',
      'Conditional Probability and Independence',
      'Random Variables: Expected Value and Variance',
      'Binomial and Geometric Distributions',
      'Normal Distributions and Z-Scores',
      'Sampling, Study Design, Bias, and Confounding',
      'Confidence Intervals for Means and Proportions',
      'Significance Testing and P-Values',
    ],
  },
  {
    unit: 'AP Calculus',
    prefix: 'khan_ap_calculus',
    weekA: 105,
    weekB: 117,
    topics: [
      'Limits: Algebraic Manipulation and Limit Laws',
      'Continuity and the Intermediate Value Theorem',
      'Derivatives: Definition and Basic Rules',
      'Chain Rule, Product Rule, and Quotient Rule',
      'Applications of Derivatives: Optimization and Related Rates',
      'Integrals, Riemann Sums, and the Fundamental Theorem of Calculus',
      'Integration Techniques: U-Substitution and Integration by Parts',
      'Differential Equations and Slope Fields',
      'Parametric Equations and Polar Calculus',
      'Series, Convergence Tests, and Taylor / Maclaurin Series',
    ],
  },
  {
    unit: 'SAT Math',
    prefix: 'khan_sat_math',
    weekA: 92,
    weekB: 104,
    topics: [
      'Heart of Algebra: Linear Equations and Systems',
      'Heart of Algebra: Inequalities and Absolute Value',
      'Problem Solving and Data Analysis: Ratios and Percentages',
      'Problem Solving and Data Analysis: Statistics and Probability',
      'Passport to Advanced Math: Quadratics and Polynomials',
      'Passport to Advanced Math: Rational and Radical Expressions',
      'Additional Topics: Geometry, Triangles, and Circles',
      'Additional Topics: Trigonometry and Complex Numbers',
      'Full Practice Tests 1 and 2',
      'Full Practice Tests 3 and 4',
      'Error Review and Targeted Skill Remediation',
    ],
  },
];

function inferUpperMathDomain(unit, topic) {
  const t = `${unit} ${topic}`.toLowerCase();

  if (
    t.includes('polynomial') ||
    t.includes('complex') ||
    t.includes('rational') ||
    t.includes('radical') ||
    t.includes('log') ||
    t.includes('exponential') ||
    t.includes('systems') ||
    t.includes('conic') ||
    t.includes('sequence') ||
    t.includes('series') ||
    t.includes('quadratic')
  ) {
    return 'advanced_algebra';
  }

  if (
    t.includes('unit circle') ||
    t.includes('sine') ||
    t.includes('cosine') ||
    t.includes('tangent') ||
    t.includes('identity') ||
    t.includes('polar') ||
    t.includes('vector') ||
    t.includes('trigonometric')
  ) {
    return 'trigonometry_precalculus';
  }

  if (
    t.includes('probability') ||
    t.includes('distribution') ||
    t.includes('regression') ||
    t.includes('confidence interval') ||
    t.includes('significance') ||
    t.includes('sampling') ||
    t.includes('z-score') ||
    t.includes('expected value') ||
    t.includes('statistics') ||
    t.includes('data')
  ) {
    return 'statistics_probability';
  }

  if (
    t.includes('limit') ||
    t.includes('continuity') ||
    t.includes('derivative') ||
    t.includes('integral') ||
    t.includes('differential equation') ||
    t.includes('parametric') ||
    t.includes('taylor') ||
    t.includes('maclaurin') ||
    t.includes('convergence')
  ) {
    return 'calculus';
  }

  if (
    t.includes('sat') ||
    t.includes('heart of algebra') ||
    t.includes('passport') ||
    t.includes('full practice')
  ) {
    return 'sat_math';
  }

  return 'upper_math_general';
}

function inferUpperMathBand(unit) {
  const u = unit.toLowerCase();
  if (u.includes('algebra 2')) return 'algebra_2';
  if (u.includes('trigonometry')) return 'precalculus';
  if (u.includes('statistics')) return 'statistics';
  if (u.includes('ap calculus')) return 'calculus_bc_prep';
  if (u.includes('sat')) return 'test_prep';
  return 'upper_math';
}

function buildUpperMathExecutionBlock({
  prefix,
  unit,
  topic,
  weekA,
  weekB,
  timed = true,
}) {
  const domain = inferUpperMathDomain(unit, topic);
  const skillBand = inferUpperMathBand(unit);

  return buildExecutionBlock({
    prefix,
    category: CATEGORY.KHAN_MATH,
    templateType: TEMPLATE.KHAN,
    unit,
    topic,
    weekA,
    weekB,
    requiresProof: false,
    includeReview: true,
    includeCheckpoint: true,
    includeTimed: timed,
  }).map(task => ({
    ...task,
    templatePrefill: {
      ...task.templatePrefill,
      provider: 'Khan Academy',
      curriculumBand: 'upper_math',
      sourceUnit: unit,
      topicLabel: topic,
      domain,
      skillBand,
      recommendedSessionMinutes:
        task.templateType === TEMPLATE.TIMED_EXAM ? 50 : 40,
      masteryTarget:
        unit === 'SAT Math' ? 'near_perfect' : '93_percent_or_better',
      notesRequired: true,
      errorLogRequired:
        task.templateType === TEMPLATE.REVIEW || task.templateType === TEMPLATE.TIMED_EXAM,
      proofUploadUrl: PROOF_DRIVE_URL,
    },
  }));
}

function generateUpperMathKhanTasks() {
  const tasks = [];

  for (const unitBlock of KHAN_UPPER_MATH_UNITS) {
    const spread = spreadWeeks(unitBlock.weekA, unitBlock.weekB, unitBlock.topics.length);

    unitBlock.topics.forEach((topic, idx) => {
      const centerWeek = spread[idx];
      const topicWeekA = clamp(centerWeek - 1, unitBlock.weekA, unitBlock.weekB);
      const topicWeekB = clamp(centerWeek + 1, unitBlock.weekA, unitBlock.weekB);

      tasks.push(
        ...buildUpperMathExecutionBlock({
          prefix: unitBlock.prefix,
          unit: unitBlock.unit,
          topic,
          weekA: topicWeekA,
          weekB: topicWeekB,
          timed: true,
        })
      );
    });
  }

  return tasks;
}

// ───────────────────────────────────────────────────────────────────────────────
// ALGEBRA 2 CAPSTONES
// ───────────────────────────────────────────────────────────────────────────────

function generateAlgebra2Capstones() {
  const items = [
    {
      weekNum: 54,
      title: 'Algebra 2 Diagnostic — Polynomials, Radicals, Complex Numbers',
      focus: ['advanced_algebra'],
    },
    {
      weekNum: 58,
      title: 'Algebra 2 Checkpoint — Rational / Radical / Logarithmic Fluency',
      focus: ['advanced_algebra'],
    },
    {
      weekNum: 62,
      title: 'Algebra 2 Checkpoint — Sequences, Series, and Counting',
      focus: ['advanced_algebra', 'statistics_probability'],
    },
    {
      weekNum: 65,
      title: 'Algebra 2 Final Gate — Ready for Trig / Precalculus',
      focus: ['comprehensive'],
    },
  ];

  return items.map(item =>
    weekTask({
      id: taskId('khan_algebra_2', 'capstone', `week_${item.weekNum}`),
      title: item.title,
      category: CATEGORY.KHAN_MATH,
      templateType: TEMPLATE.MOCK_TEST,
      weekNum: item.weekNum,
      requiresProof: false,
      templatePrefill: {
        provider: 'Khan Academy',
        taskType: 'capstone',
        sourceUnit: 'Algebra 2',
        focusDomains: item.focus,
        curriculumBand: 'upper_math',
        recommendedSessionMinutes: 60,
        masteryTarget: '93_percent_or_better',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

function generateAlgebra2Spirals() {
  const weeks = [55, 59, 63, 65];

  return weeks.map((weekNum, idx) =>
    weekTask({
      id: taskId('khan_algebra_2', 'spiral', `week_${weekNum}`),
      title:
        idx === weeks.length - 1
          ? 'Algebra 2 Spiral Review — Full Cumulative Set'
          : `Algebra 2 Spiral Review — Mixed Set ${idx + 1}`,
      category: CATEGORY.KHAN_MATH,
      templateType: TEMPLATE.REVIEW,
      weekNum,
      requiresProof: false,
      templatePrefill: {
        provider: 'Khan Academy',
        taskType: 'spiral_review',
        sourceUnit: 'Algebra 2',
        curriculumBand: 'upper_math',
        focusDomains: ['advanced_algebra', 'statistics_probability'],
        recommendedSessionMinutes: 45,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// TRIG / PRECALC CAPSTONES
// ───────────────────────────────────────────────────────────────────────────────

function generateTrigCapstones() {
  const items = [
    {
      weekNum: 67,
      title: 'Trigonometry Diagnostic — Unit Circle, Graphs, and Radians',
      focus: ['trigonometry_precalculus'],
    },
    {
      weekNum: 71,
      title: 'Trigonometry Checkpoint — Identities and Equations',
      focus: ['trigonometry_precalculus'],
    },
    {
      weekNum: 75,
      title: 'Trigonometry Checkpoint — Polar, Complex, and Vectors',
      focus: ['trigonometry_precalculus', 'advanced_algebra'],
    },
    {
      weekNum: 78,
      title: 'Trigonometry / Precalculus Final Gate — Ready for Calculus',
      focus: ['comprehensive'],
    },
  ];

  return items.map(item =>
    weekTask({
      id: taskId('khan_trigonometry', 'capstone', `week_${item.weekNum}`),
      title: item.title,
      category: CATEGORY.KHAN_MATH,
      templateType: TEMPLATE.MOCK_TEST,
      weekNum: item.weekNum,
      requiresProof: false,
      templatePrefill: {
        provider: 'Khan Academy',
        taskType: 'capstone',
        sourceUnit: 'Trigonometry',
        focusDomains: item.focus,
        curriculumBand: 'upper_math',
        recommendedSessionMinutes: 60,
        masteryTarget: '93_percent_or_better',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

function generateTrigWritingTasks() {
  const prompts = [
    {
      weekNum: 69,
      title: 'Math Writing — Explain Why the Unit Circle Organizes Trigonometry',
      topic: 'unit_circle',
    },
    {
      weekNum: 73,
      title: 'Math Writing — Explain a Trig Identity from First Principles',
      topic: 'identities',
    },
    {
      weekNum: 76,
      title: 'Math Writing — Explain Polar Form and Why It Is Powerful',
      topic: 'polar_form',
    },
    {
      weekNum: 78,
      title: 'Math Writing — Which Precalculus Ideas Best Prepare You for Calculus?',
      topic: 'precalc_reflection',
    },
  ];

  return prompts.map(item =>
    weekTask({
      id: taskId('khan_trigonometry', 'writing', `week_${item.weekNum}`, item.topic),
      title: item.title,
      category: CATEGORY.KHAN_MATH,
      templateType: TEMPLATE.WRITING,
      weekNum: item.weekNum,
      requiresProof: false,
      templatePrefill: {
        provider: 'Khan Academy',
        taskType: 'math_writing',
        sourceUnit: 'Trigonometry',
        topic: item.topic,
        recommendedSessionMinutes: 20,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// STATISTICS CAPSTONES
// ───────────────────────────────────────────────────────────────────────────────

function generateStatisticsCapstones() {
  const items = [
    {
      weekNum: 80,
      title: 'Statistics Diagnostic — Describing Data and Probability Basics',
      focus: ['statistics_probability'],
    },
    {
      weekNum: 84,
      title: 'Statistics Checkpoint — Regression, Random Variables, Distributions',
      focus: ['statistics_probability'],
    },
    {
      weekNum: 88,
      title: 'Statistics Checkpoint — Sampling, Bias, Confidence Intervals',
      focus: ['statistics_probability'],
    },
    {
      weekNum: 91,
      title: 'Statistics Final Gate — Inference and AP Stats Readiness',
      focus: ['statistics_probability'],
    },
  ];

  return items.map(item =>
    weekTask({
      id: taskId('khan_statistics', 'capstone', `week_${item.weekNum}`),
      title: item.title,
      category: CATEGORY.KHAN_MATH,
      templateType: TEMPLATE.MOCK_TEST,
      weekNum: item.weekNum,
      requiresProof: false,
      templatePrefill: {
        provider: 'Khan Academy',
        taskType: 'capstone',
        sourceUnit: 'Statistics and Probability',
        focusDomains: item.focus,
        curriculumBand: 'upper_math',
        recommendedSessionMinutes: 55,
        masteryTarget: '93_percent_or_better',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

function generateStatisticsWritingTasks() {
  const prompts = [
    {
      weekNum: 82,
      title: 'Math Writing — Explain Correlation vs. Causation',
      topic: 'correlation_vs_causation',
    },
    {
      weekNum: 86,
      title: 'Math Writing — Explain Why Bias Can Destroy a Study',
      topic: 'bias',
    },
    {
      weekNum: 89,
      title: 'Math Writing — Explain What a Confidence Interval Means',
      topic: 'confidence_intervals',
    },
    {
      weekNum: 91,
      title: 'Math Writing — Explain What a P-Value Does and Does Not Say',
      topic: 'p_values',
    },
  ];

  return prompts.map(item =>
    weekTask({
      id: taskId('khan_statistics', 'writing', `week_${item.weekNum}`, item.topic),
      title: item.title,
      category: CATEGORY.KHAN_MATH,
      templateType: TEMPLATE.WRITING,
      weekNum: item.weekNum,
      requiresProof: false,
      templatePrefill: {
        provider: 'Khan Academy',
        taskType: 'math_writing',
        sourceUnit: 'Statistics and Probability',
        topic: item.topic,
        recommendedSessionMinutes: 20,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// SAT MATH SCORE-MAX PHASE
// The old file had SAT Math by week 104 with practice tests and error review. [file:19]
// We make this more operational with timed sections and score checkpoints.
// ───────────────────────────────────────────────────────────────────────────────

function generateSatMathScoreTasks() {
  const specs = [
    {
      weekNum: 93,
      title: 'SAT Math Diagnostic — Baseline Timed Section',
      type: 'diagnostic',
    },
    {
      weekNum: 96,
      title: 'SAT Math Timed Section — Algebra and Advanced Math',
      type: 'timed_section',
    },
    {
      weekNum: 99,
      title: 'SAT Math Timed Section — Problem Solving and Geometry',
      type: 'timed_section',
    },
    {
      weekNum: 101,
      title: 'SAT Math Full Mock — First Near-Perfect Attempt',
      type: 'full_mock',
    },
    {
      weekNum: 103,
      title: 'SAT Math Full Mock — Second Near-Perfect Attempt',
      type: 'full_mock',
    },
    {
      weekNum: 104,
      title: 'SAT Math Exit Gate — Ready for Real Test / Max Score Push',
      type: 'exit_gate',
    },
  ];

  return specs.map(spec =>
    weekTask({
      id: taskId('khan_sat_math', spec.type, `week_${spec.weekNum}`),
      title: spec.title,
      category: CATEGORY.KHAN_MATH,
      templateType:
        spec.type === 'diagnostic' || spec.type === 'exit_gate' || spec.type === 'full_mock'
          ? TEMPLATE.MOCK_TEST
          : TEMPLATE.TIMED_EXAM,
      weekNum: spec.weekNum,
      requiresProof: false,
      templatePrefill: {
        provider: 'Khan Academy',
        taskType: spec.type,
        sourceUnit: 'SAT Math',
        curriculumBand: 'upper_math',
        scoreGoal: '790_to_800',
        recommendedSessionMinutes:
          spec.type === 'timed_section' ? 45 : 75,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

function generateSatMathReviewLoops() {
  const weeks = [94, 97, 100, 102, 104];

  return weeks.map((weekNum, idx) =>
    weekTask({
      id: taskId('khan_sat_math', 'error_loop', `week_${weekNum}`),
      title:
        idx === weeks.length - 1
          ? 'SAT Math Final Error Log Review — No Repeated Mistakes Allowed'
          : `SAT Math Error Log Review Cycle ${idx + 1}`,
      category: CATEGORY.KHAN_MATH,
      templateType: TEMPLATE.REVIEW,
      weekNum,
      requiresProof: false,
      templatePrefill: {
        provider: 'Khan Academy',
        taskType: 'error_review_loop',
        sourceUnit: 'SAT Math',
        curriculumBand: 'upper_math',
        scoreGoal: '790_to_800',
        recommendedSessionMinutes: 35,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// AP CALCULUS SUPPLEMENT GATES
// The old file explicitly had AP Calculus supplement due by week 117. [file:19]
// These gates make BC readiness measurable.
// ───────────────────────────────────────────────────────────────────────────────

function generateApCalculusSupplementCapstones() {
  const items = [
    {
      weekNum: 106,
      title: 'AP Calculus Supplement Diagnostic — Limits, Continuity, Derivatives',
      focus: ['calculus'],
    },
    {
      weekNum: 110,
      title: 'AP Calculus Supplement Checkpoint — Derivatives and Applications',
      focus: ['calculus'],
    },
    {
      weekNum: 113,
      title: 'AP Calculus Supplement Checkpoint — Integrals and Differential Equations',
      focus: ['calculus'],
    },
    {
      weekNum: 116,
      title: 'AP Calculus Supplement Checkpoint — Parametric, Polar, and Series',
      focus: ['calculus'],
    },
    {
      weekNum: 117,
      title: 'AP Calculus BC Readiness Gate — Supplemental Mastery Verified',
      focus: ['comprehensive'],
    },
  ];

  return items.map(item =>
    weekTask({
      id: taskId('khan_ap_calculus', 'capstone', `week_${item.weekNum}`),
      title: item.title,
      category: CATEGORY.KHAN_MATH,
      templateType: TEMPLATE.MOCK_TEST,
      weekNum: item.weekNum,
      requiresProof: false,
      templatePrefill: {
        provider: 'Khan Academy',
        taskType: 'capstone',
        sourceUnit: 'AP Calculus',
        focusDomains: item.focus,
        curriculumBand: 'upper_math',
        recommendedSessionMinutes: 70,
        masteryTarget: 'bc_ready',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

function generateApCalculusWritingTasks() {
  const prompts = [
    {
      weekNum: 108,
      title: 'Math Writing — Explain the Meaning of the Derivative',
      topic: 'derivative_meaning',
    },
    {
      weekNum: 111,
      title: 'Math Writing — Explain the Fundamental Theorem of Calculus Intuitively',
      topic: 'ftc',
    },
    {
      weekNum: 114,
      title: 'Math Writing — Explain Why Differential Equations Matter',
      topic: 'differential_equations',
    },
    {
      weekNum: 117,
      title: 'Math Writing — Which Calculus Idea Changed Your View of Math Most?',
      topic: 'calculus_reflection',
    },
  ];

  return prompts.map(item =>
    weekTask({
      id: taskId('khan_ap_calculus', 'writing', `week_${item.weekNum}`, item.topic),
      title: item.title,
      category: CATEGORY.KHAN_MATH,
      templateType: TEMPLATE.WRITING,
      weekNum: item.weekNum,
      requiresProof: false,
      templatePrefill: {
        provider: 'Khan Academy',
        taskType: 'math_writing',
        sourceUnit: 'AP Calculus',
        topic: item.topic,
        recommendedSessionMinutes: 20,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// UPPER-MATH TRANSITION GATES
// This keeps the later jump to AP-heavy years explicit and controlled.
// ───────────────────────────────────────────────────────────────────────────────

function generateUpperMathTransitionGates() {
  const specs = [
    {
      weekNum: 65,
      id: 'transition_alg2_to_trig',
      title: 'Transition Gate — Algebra 2 to Trig / Precalculus Readiness',
      transitionType: 'alg2_to_trig_precalc',
    },
    {
      weekNum: 78,
      id: 'transition_trig_to_calculus',
      title: 'Transition Gate — Trig / Precalculus to Calculus Readiness',
      transitionType: 'trig_precalc_to_calculus',
    },
    {
      weekNum: 91,
      id: 'transition_stats_to_ap_stats',
      title: 'Transition Gate — Statistics Foundations to AP Statistics Readiness',
      transitionType: 'stats_foundation_to_ap_stats',
    },
    {
      weekNum: 104,
      id: 'transition_sat_math_complete',
      title: 'Transition Gate — SAT Math Score-Max Preparation Complete',
      transitionType: 'sat_math_complete',
    },
    {
      weekNum: 117,
      id: 'transition_khan_calc_to_bc',
      title: 'Transition Gate — Khan AP Calculus Supplement to Full BC Work',
      transitionType: 'khan_calc_to_bc',
    },
  ];

  return specs.map(spec =>
    weekTask({
      id: spec.id,
      title: spec.title,
      category: CATEGORY.KHAN_MATH,
      templateType: TEMPLATE.CHECKLIST,
      weekNum: spec.weekNum,
      requiresProof: false,
      templatePrefill: {
        provider: 'Khan Academy',
        taskType: 'transition_gate',
        transitionType: spec.transitionType,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// POPULATE KHAN_MATH_TASKS
// ───────────────────────────────────────────────────────────────────────────────

KHAN_MATH_TASKS.push(
  ...generateUpperMathKhanTasks(),
  ...generateAlgebra2Capstones(),
  ...generateAlgebra2Spirals(),
  ...generateTrigCapstones(),
  ...generateTrigWritingTasks(),
  ...generateStatisticsCapstones(),
  ...generateStatisticsWritingTasks(),
  ...generateSatMathScoreTasks(),
  ...generateSatMathReviewLoops(),
  ...generateApCalculusSupplementCapstones(),
  ...generateApCalculusWritingTasks(),
  ...generateUpperMathTransitionGates()
);

// ───────────────────────────────────────────────────────────────────────────────
// PART 6 — AMC 8 EXECUTION TASKS
// The original file had AMC 8 topics grouped by geometry/combinatorics/number
// theory/algebra and intended to spread them across weeks. [file:19]
// This part converts that topic bank into a real training pipeline.
// Target window: weeks 1–39, with the strongest emphasis on weeks 1–26 and a
// competition / post-competition consolidation phase through week 39.
// ───────────────────────────────────────────────────────────────────────────────

const AMC8_TOPIC_GROUPS = [
  {
    domain: 'geometry',
    prefix: 'amc8_geometry',
    weekA: 1,
    weekB: 14,
    topics: [
      'Perimeter and Area of Polygons',
      'Circles: Circumference, Area, and Sectors',
      'Triangles: Area, Special Types, and Similarity',
      'Pythagorean Theorem and Right Triangles',
      'Quadrilaterals: Properties and Area Formulas',
      'Angle Relationships: Supplementary, Complementary, Vertical',
      'Parallel Lines and Transversals',
      'Coordinate Geometry: Distance and Midpoint',
      'Solid Geometry: Volume and Surface Area',
      'Geometric Counting and Configurations',
      'Proportional Reasoning in Geometry',
      'Inscribed and Circumscribed Figures',
      'Reflections, Rotations, and Symmetry',
      'Regular Polygons and Interior Angle Sums',
      'Composite Figures and Shaded Regions',
      'Spatial Visualization and Nets',
      'Triangle Inequality',
      'Equilateral and Isosceles Triangle Properties',
      'Diagonals and Symmetry in Polygons',
      'Geometric Sequences in Figures',
    ],
  },
  {
    domain: 'combinatorics',
    prefix: 'amc8_combinatorics',
    weekA: 4,
    weekB: 18,
    topics: [
      'Counting Principles: Addition and Multiplication',
      'Permutations and Ordered Arrangements',
      'Combinations and Choosing Without Order',
      'Complementary Counting',
      'Casework and Organized Lists',
      'Bijections and One-to-One Correspondence',
      'Grid Paths and Lattice Paths',
      'Probability: Basic Definition and Sample Spaces',
      'Probability: Complementary and Conditional',
      'Probability: Independent Events and Tree Diagrams',
      'Expected Value',
      'Pigeonhole Principle',
      'Stars and Bars',
      'Inclusion-Exclusion Principle',
      'Pascal’s Triangle and Binomial Coefficients',
      'Recursive Counting and Fibonacci Sequences',
    ],
  },
  {
    domain: 'number_theory',
    prefix: 'amc8_number_theory',
    weekA: 8,
    weekB: 22,
    topics: [
      'Divisibility Rules',
      'Prime Numbers and Prime Factorization',
      'GCD and LCM',
      'Factors and Number of Divisors',
      'Sum and Product of Divisors',
      'Modular Arithmetic Basics',
      'Remainders and Residues',
      'Base Representations',
      'Perfect Squares and Cubes',
      'Units Digit Cycles',
      'Consecutive Integer Problems',
      'Integer Equations and Diophantine Thinking',
      'Fractions and Rational Numbers in Number Theory Contexts',
      'Palindromes and Digit Sums',
      'Arithmetic Sequences in Number Theory',
      'Geometric Sequences and Ratios',
      'Square Root Estimation Techniques',
      'Euler Totient Function Intro',
      'Chinese Remainder Theorem Intro',
      'Fermat’s Little Theorem Intro',
    ],
  },
  {
    domain: 'algebra',
    prefix: 'amc8_algebra',
    weekA: 12,
    weekB: 26,
    topics: [
      'Word Problems: Age, Rate, Work, Mixture',
      'Ratios and Proportions',
      'Percent Problems',
      'Linear Equations in One Variable',
      'Systems of Two Linear Equations',
      'Inequalities and Absolute Value',
      'Quadratic Equations and Factoring',
      'Polynomial Expressions and Identities',
      'Functions: Domain, Range, and Composition',
      'Sequences: Arithmetic and Geometric',
      'Exponent Rules and Simplification',
      'Radicals and Operations',
      'Logarithms: Definition and Properties Intro',
      'Vieta’s Formulas Intro',
      'Completing the Square and Vertex Form',
      'AM-GM Intro',
      'Cauchy-Schwarz Intro',
      'Distance / Rate / Time Problems',
      'Functional Equations Intro',
      'Working Backwards and Guess-and-Check Strategy',
    ],
  },
];

function buildAmc8ExecutionBlock({
  prefix,
  domain,
  topic,
  weekA,
  weekB,
}) {
  const weeks = spreadWeeks(weekA, weekB, 5);

  return [
    weekTask({
      id: taskId(prefix, topic, 'learn'),
      title: `AMC 8 ${domain} — ${topic} — Learn Core Method`,
      category: CATEGORY.AMC8,
      templateType: TEMPLATE.RECURRING,
      weekNum: weeks[0],
      requiresProof: false,
      templatePrefill: {
        taskType: 'topic_learn',
        competition: 'AMC 8',
        domain,
        topic,
        recommendedSessionMinutes: 35,
        deliverable: 'notes_plus_3_examples',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    }),
    weekTask({
      id: taskId(prefix, topic, 'drill'),
      title: `AMC 8 ${domain} — ${topic} — Drill Set`,
      category: CATEGORY.AMC8,
      templateType: TEMPLATE.RECURRING,
      weekNum: weeks[1],
      requiresProof: false,
      templatePrefill: {
        taskType: 'topic_drill',
        competition: 'AMC 8',
        domain,
        topic,
        recommendedSessionMinutes: 35,
        deliverable: '8_to_12_targeted_problems',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    }),
    weekTask({
      id: taskId(prefix, topic, 'mixed'),
      title: `AMC 8 ${domain} — ${topic} — Mixed Application Set`,
      category: CATEGORY.AMC8,
      templateType: TEMPLATE.RECURRING,
      weekNum: weeks[2],
      requiresProof: false,
      templatePrefill: {
        taskType: 'mixed_application',
        competition: 'AMC 8',
        domain,
        topic,
        recommendedSessionMinutes: 40,
        deliverable: '6_to_10_mixed_problems',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    }),
    weekTask({
      id: taskId(prefix, topic, 'timed'),
      title: `AMC 8 ${domain} — ${topic} — Timed Mini-Set`,
      category: CATEGORY.AMC8,
      templateType: TEMPLATE.TIMED_EXAM,
      weekNum: weeks[3],
      requiresProof: false,
      templatePrefill: {
        taskType: 'timed_mini_set',
        competition: 'AMC 8',
        domain,
        topic,
        recommendedSessionMinutes: 25,
        deliverable: '5_to_8_timed_problems',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    }),
    weekTask({
      id: taskId(prefix, topic, 'review'),
      title: `AMC 8 ${domain} — ${topic} — Error Review and Mastery Check`,
      category: CATEGORY.AMC8,
      templateType: TEMPLATE.REVIEW,
      weekNum: weeks[4],
      requiresProof: false,
      templatePrefill: {
        taskType: 'error_review_checkpoint',
        competition: 'AMC 8',
        domain,
        topic,
        recommendedSessionMinutes: 30,
        deliverable: 'redo_all_missed_and_summarize_patterns',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    }),
  ];
}

function generateAmc8TopicTasks() {
  const tasks = [];

  for (const group of AMC8_TOPIC_GROUPS) {
    const spread = spreadWeeks(group.weekA, group.weekB, group.topics.length);

    group.topics.forEach((topic, idx) => {
      const centerWeek = spread[idx];
      const topicWeekA = clamp(centerWeek - 1, group.weekA, group.weekB);
      const topicWeekB = clamp(centerWeek + 1, group.weekA, group.weekB);

      tasks.push(
        ...buildAmc8ExecutionBlock({
          prefix: group.prefix,
          domain: group.domain,
          topic,
          weekA: topicWeekA,
          weekB: topicWeekB,
        })
      );
    });
  }

  return tasks;
}

// Domain spirals create cumulative retention instead of topic-by-topic forgetting.
function generateAmc8DomainSpirals() {
  const specs = [
    { weekNum: 6, title: 'AMC 8 Geometry Spiral Review I', domains: ['geometry'] },
    { weekNum: 10, title: 'AMC 8 Counting / Probability Spiral Review I', domains: ['combinatorics'] },
    { weekNum: 14, title: 'AMC 8 Number Theory Spiral Review I', domains: ['number_theory'] },
    { weekNum: 18, title: 'AMC 8 Algebra Spiral Review I', domains: ['algebra'] },
    { weekNum: 20, title: 'AMC 8 Mixed Spiral Review II', domains: ['geometry', 'combinatorics'] },
    { weekNum: 22, title: 'AMC 8 Mixed Spiral Review III', domains: ['number_theory', 'algebra'] },
    { weekNum: 24, title: 'AMC 8 Full-Spectrum Spiral Review IV', domains: ['geometry', 'combinatorics', 'number_theory', 'algebra'] },
    { weekNum: 26, title: 'AMC 8 Full-Spectrum Spiral Review V', domains: ['geometry', 'combinatorics', 'number_theory', 'algebra'] },
  ];

  return specs.map(spec =>
    weekTask({
      id: taskId('amc8', 'spiral_review', `week_${spec.weekNum}`),
      title: spec.title,
      category: CATEGORY.AMC8,
      templateType: TEMPLATE.REVIEW,
      weekNum: spec.weekNum,
      requiresProof: false,
      templatePrefill: {
        taskType: 'spiral_review',
        competition: 'AMC 8',
        domains: spec.domains,
        recommendedSessionMinutes: 45,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// Timed training cadence.
function generateAmc8TimedSets() {
  const weeks = [7, 11, 15, 19, 23, 25, 26, 30, 34, 38];

  return weeks.map((weekNum, idx) =>
    weekTask({
      id: taskId('amc8', 'timed_set', `week_${weekNum}`),
      title:
        weekNum <= 26
          ? `AMC 8 Timed Training Set ${idx + 1}`
          : `AMC 8 Maintenance Timed Set ${idx + 1}`,
      category: CATEGORY.AMC8,
      templateType: TEMPLATE.TIMED_EXAM,
      weekNum,
      requiresProof: false,
      templatePrefill: {
        taskType: 'timed_set',
        competition: 'AMC 8',
        recommendedSessionMinutes: weekNum <= 26 ? 25 : 30,
        problemCount: weekNum <= 26 ? '10_to_15' : '15_to_20',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// Full mocks and competition prep.
function generateAmc8MocksAndCompetitionTasks() {
  const specs = [
    {
      weekNum: 16,
      id: 'amc8_mock_1',
      title: 'AMC 8 Full Mock Exam I',
      type: 'full_mock',
    },
    {
      weekNum: 21,
      id: 'amc8_mock_2',
      title: 'AMC 8 Full Mock Exam II',
      type: 'full_mock',
    },
    {
      weekNum: 24,
      id: 'amc8_mock_3',
      title: 'AMC 8 Full Mock Exam III',
      type: 'full_mock',
    },
    {
      weekNum: 25,
      id: 'amc8_mock_4',
      title: 'AMC 8 Full Mock Exam IV',
      type: 'full_mock',
    },
    {
      weekNum: 26,
      id: 'amc8_final_taper',
      title: 'AMC 8 Final Taper — Error Log, Formulas, and Confidence Reset',
      type: 'taper',
    },
    {
      weekNum: 27,
      id: 'amc8_real_exam_window',
      title: 'AMC 8 Competition Window — Sit for Official AMC 8',
      type: 'official_exam',
    },
    {
      weekNum: 28,
      id: 'amc8_postmortem',
      title: 'AMC 8 Postmortem — Analyze Performance and Misses',
      type: 'postmortem',
    },
  ];

  return specs.map(spec =>
    weekTask({
      id: spec.id,
      title: spec.title,
      category: CATEGORY.AMC8,
      templateType:
        spec.type === 'full_mock' || spec.type === 'official_exam'
          ? TEMPLATE.MOCK_TEST
          : TEMPLATE.REVIEW,
      weekNum: spec.weekNum,
      requiresProof: false,
      templatePrefill: {
        taskType: spec.type,
        competition: 'AMC 8',
        recommendedSessionMinutes:
          spec.type === 'full_mock' || spec.type === 'official_exam' ? 45 : 30,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// Error log loops — competition math gets better only if errors are archived.
function generateAmc8ErrorLogLoops() {
  const weeks = [8, 12, 17, 20, 22, 24, 25, 28, 32, 36];

  return weeks.map((weekNum, idx) =>
    weekTask({
      id: taskId('amc8', 'error_log_loop', `week_${weekNum}`),
      title:
        weekNum <= 28
          ? `AMC 8 Error Log Review Cycle ${idx + 1}`
          : `AMC 8 Maintenance Error Log Cycle ${idx + 1}`,
      category: CATEGORY.AMC8,
      templateType: TEMPLATE.REVIEW,
      weekNum,
      requiresProof: false,
      templatePrefill: {
        taskType: 'error_log_review',
        competition: 'AMC 8',
        deliverable: 'redo_missed_problems_and_extract_patterns',
        recommendedSessionMinutes: 30,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// Strategy and metacognition tasks so the training is not only topic-based.
function generateAmc8StrategyTasks() {
  const specs = [
    {
      weekNum: 5,
      title: 'AMC 8 Strategy Lab — Guessing, Skipping, and Time Allocation',
      topic: 'time_management',
    },
    {
      weekNum: 9,
      title: 'AMC 8 Strategy Lab — Working Backwards and Plugging In',
      topic: 'heuristics',
    },
    {
      weekNum: 13,
      title: 'AMC 8 Strategy Lab — Diagramming, Symmetry, and Visualization',
      topic: 'visual_methods',
    },
    {
      weekNum: 18,
      title: 'AMC 8 Strategy Lab — Casework and Organized Counting',
      topic: 'casework',
    },
    {
      weekNum: 23,
      title: 'AMC 8 Strategy Lab — Error Patterns and How to Prevent Them',
      topic: 'error_patterns',
    },
    {
      weekNum: 28,
      title: 'AMC 8 Reflection — What Actually Improved Your Score?',
      topic: 'post_comp_reflection',
    },
  ];

  return specs.map(spec =>
    weekTask({
      id: taskId('amc8', 'strategy', `week_${spec.weekNum}`, spec.topic),
      title: spec.title,
      category: CATEGORY.AMC8,
      templateType: TEMPLATE.WRITING,
      weekNum: spec.weekNum,
      requiresProof: false,
      templatePrefill: {
        taskType: 'strategy_reflection',
        competition: 'AMC 8',
        topic: spec.topic,
        recommendedSessionMinutes: 20,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// Maintenance phase after the main AMC 8 window.
// Since the old file continues through week 39 before full Algebra 1/Geometry
// completion, we keep AMC sharp while bridging upward. [file:19]
function generateAmc8MaintenanceTasks() {
  const specs = [
    {
      weekNum: 29,
      title: 'AMC 8 Maintenance — Best Geometry / Counting Problems Revisited',
    },
    {
      weekNum: 31,
      title: 'AMC 8 Maintenance — Best Number Theory / Algebra Problems Revisited',
    },
    {
      weekNum: 33,
      title: 'AMC 8 Maintenance — Timed Mixed Set',
    },
    {
      weekNum: 35,
      title: 'AMC 8 Maintenance — Teach 5 Favorite Problems Clearly',
    },
    {
      weekNum: 37,
      title: 'AMC 8 Maintenance — Full Mixed Review Before AMC 10 Bridge',
    },
    {
      weekNum: 39,
      title: 'AMC 8 Exit Reflection — Archive Lessons Learned for AMC 10',
    },
  ];

  return specs.map((spec, idx) =>
    weekTask({
      id: taskId('amc8', 'maintenance', `week_${spec.weekNum}`, idx + 1),
      title: spec.title,
      category: CATEGORY.AMC8,
      templateType:
        spec.title.toLowerCase().includes('timed')
          ? TEMPLATE.TIMED_EXAM
          : spec.title.toLowerCase().includes('reflection')
            ? TEMPLATE.WRITING
            : TEMPLATE.REVIEW,
      weekNum: spec.weekNum,
      requiresProof: false,
      templatePrefill: {
        taskType: 'maintenance',
        competition: 'AMC 8',
        recommendedSessionMinutes: 30,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// Transition into AMC 10 work.
function generateAmc8TransitionGate() {
  return [
    weekTask({
      id: 'transition_amc8_to_amc10',
      title: 'Transition Gate — AMC 8 Cycle Complete, Begin AMC 10 Build',
      category: CATEGORY.AMC8,
      templateType: TEMPLATE.CHECKLIST,
      weekNum: 39,
      requiresProof: false,
      templatePrefill: {
        taskType: 'transition_gate',
        competition: 'AMC 8',
        transitionType: 'amc8_to_amc10',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    }),
  ];
}

// Populate AMC8 task array.
AMC8_TASKS.push(
  ...generateAmc8TopicTasks(),
  ...generateAmc8DomainSpirals(),
  ...generateAmc8TimedSets(),
  ...generateAmc8MocksAndCompetitionTasks(),
  ...generateAmc8ErrorLogLoops(),
  ...generateAmc8StrategyTasks(),
  ...generateAmc8MaintenanceTasks(),
  ...generateAmc8TransitionGate()
);

// ───────────────────────────────────────────────────────────────────────────────
// PART 7 — AMC 10 + AIME EXECUTION TASKS
// The original file contained AMC 10 topic arrays and AIME topic arrays, but
// they were still topic banks rather than a longitudinal training system. [file:19]
// This part creates that system.
// Main windows:
//   AMC 10 build: weeks 40–156
//   AIME bridge / serious training: weeks 92–208
// ───────────────────────────────────────────────────────────────────────────────

const AMC10_TOPIC_GROUPS = [
  {
    domain: 'geometry',
    prefix: 'amc10_geometry',
    weekA: 40,
    weekB: 78,
    topics: [
      'Advanced Triangle Properties: Ceva, Menelaus, Simson Intro',
      'Power of a Point and Radical Axis',
      'Cyclic Quadrilaterals and Ptolemy’s Theorem',
      'Trigonometric Geometry',
      'Coordinate Geometry with Conics and Transformations',
      'Vectors and Complex Numbers in Geometry Intro',
      'Area Methods, Mass Points, and Shoelace',
      'Three-Dimensional Geometry: Pyramids, Spheres, Solids',
    ],
  },
  {
    domain: 'combinatorics',
    prefix: 'amc10_combinatorics',
    weekA: 45,
    weekB: 91,
    topics: [
      'Advanced Counting and Multinomial Thinking',
      'Graph Theory: Trees, Paths, and Planarity Intro',
      'Combinatorial Game Theory Intro',
      'Generating Functions Intro',
      'Advanced Probability and Conditional Structures',
      'Recursion and Invariants',
      'Bijections and Clever Counting',
      'Inclusion-Exclusion in Harder Settings',
    ],
  },
  {
    domain: 'number_theory',
    prefix: 'amc10_number_theory',
    weekA: 50,
    weekB: 104,
    topics: [
      'Advanced Modular Arithmetic and CRT',
      'Number Bases and Representation Problems',
      'Quadratic Residues Intro',
      'Pell Equations and Continued Fractions Intro',
      'Multiplicative Functions Intro',
      'Orders, Primitive Roots Intro, and Residue Cycles',
      'Diophantine Equations Beyond Basics',
      'Prime Exponents and Valuations Intro',
    ],
  },
  {
    domain: 'algebra',
    prefix: 'amc10_algebra',
    weekA: 55,
    weekB: 117,
    topics: [
      'Polynomial Roots and Symmetric Functions',
      'Telescoping, Partial Fractions, and Sequence Tricks',
      'Optimization with AM-GM and Cauchy',
      'Functional Equations Intermediate',
      'Inequalities: SOS and Schur Intro',
      'Complex Numbers in Competition Algebra',
      'Recurrences and Closed Forms',
      'Substitution and Algebraic Manipulation Mastery',
    ],
  },
];

const AIME_TOPIC_GROUPS = [
  {
    domain: 'geometry',
    prefix: 'aime_geometry',
    weekA: 92,
    weekB: 170,
    topics: [
      'Advanced Trigonometric Geometry',
      'Three-Dimensional Geometry with Prisms, Pyramids, and Spheres',
      'Coordinate Bashing and Parametric Methods',
      'Radical Axes and Coaxial Circles',
      'Inversion Intro',
      'Projective-Flavored Geometry Intuition',
    ],
  },
  {
    domain: 'combinatorics',
    prefix: 'aime_combinatorics',
    weekA: 100,
    weekB: 182,
    topics: [
      'Generating Functions and Recurrences',
      'Inclusion-Exclusion on Permutations',
      'Burnside / Symmetry Counting Intro',
      'Markov Chains and State Models',
      'Advanced Casework and Constructive Counting',
      'Combinatorial Invariants',
    ],
  },
  {
    domain: 'number_theory',
    prefix: 'aime_number_theory',
    weekA: 108,
    weekB: 195,
    topics: [
      'p-adic Valuation and LTE Intro',
      'Quadratic Residues and Modular Squares',
      'Continued Fractions and Pell Equations',
      'Orders, Primitive Roots, and Exponent Cycles',
      'Advanced CRT and Remainder Systems',
      'Diophantine Methods with Bounding and Mod Arithmetic',
    ],
  },
  {
    domain: 'algebra',
    prefix: 'aime_algebra',
    weekA: 116,
    weekB: 208,
    topics: [
      'Symmetric Polynomials and Newton’s Identities Intro',
      'Roots of Unity and Complex Number Methods',
      'Functional Equations: AIME-Level Techniques',
      'Inequalities: SOS, UVW-Flavored Intuition, and Majorization Intro',
      'Recurrences and Polynomial Method Patterns',
      'Substitution, Parameter Bashing, and Structural Algebra',
    ],
  },
];

function buildCompetitionExecutionBlock({
  prefix,
  competition,
  domain,
  topic,
  weekA,
  weekB,
  minutes = 50,
}) {
  const weeks = spreadWeeks(weekA, weekB, 5);

  return [
    weekTask({
      id: taskId(prefix, topic, 'learn'),
      title: `${competition} ${domain} — ${topic} — Theory Build`,
      category: competition === 'AMC 10' ? CATEGORY.AMC10 : CATEGORY.AIME,
      templateType: TEMPLATE.RECURRING,
      weekNum: weeks[0],
      requiresProof: false,
      templatePrefill: {
        taskType: 'topic_learn',
        competition,
        domain,
        topic,
        recommendedSessionMinutes: minutes,
        deliverable: 'notes_plus_example_solutions',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    }),
    weekTask({
      id: taskId(prefix, topic, 'drill'),
      title: `${competition} ${domain} — ${topic} — Drill Set`,
      category: competition === 'AMC 10' ? CATEGORY.AMC10 : CATEGORY.AIME,
      templateType: TEMPLATE.RECURRING,
      weekNum: weeks[1],
      requiresProof: false,
      templatePrefill: {
        taskType: 'drill_set',
        competition,
        domain,
        topic,
        recommendedSessionMinutes: minutes,
        deliverable: '6_to_10_targeted_problems',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    }),
    weekTask({
      id: taskId(prefix, topic, 'mixed'),
      title: `${competition} ${domain} — ${topic} — Mixed Application Set`,
      category: competition === 'AMC 10' ? CATEGORY.AMC10 : CATEGORY.AIME,
      templateType: TEMPLATE.RECURRING,
      weekNum: weeks[2],
      requiresProof: false,
      templatePrefill: {
        taskType: 'mixed_application',
        competition,
        domain,
        topic,
        recommendedSessionMinutes: minutes,
        deliverable: 'mixed_archive_problems',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    }),
    weekTask({
      id: taskId(prefix, topic, 'timed'),
      title: `${competition} ${domain} — ${topic} — Timed Set`,
      category: competition === 'AMC 10' ? CATEGORY.AMC10 : CATEGORY.AIME,
      templateType: TEMPLATE.TIMED_EXAM,
      weekNum: weeks[3],
      requiresProof: false,
      templatePrefill: {
        taskType: 'timed_set',
        competition,
        domain,
        topic,
        recommendedSessionMinutes: competition === 'AMC 10' ? 35 : 60,
        deliverable: competition === 'AMC 10' ? '8_to_12_timed_problems' : '3_to_5_timed_problems',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    }),
    weekTask({
      id: taskId(prefix, topic, 'review'),
      title: `${competition} ${domain} — ${topic} — Error Review and Summary`,
      category: competition === 'AMC 10' ? CATEGORY.AMC10 : CATEGORY.AIME,
      templateType: TEMPLATE.REVIEW,
      weekNum: weeks[4],
      requiresProof: false,
      templatePrefill: {
        taskType: 'error_review',
        competition,
        domain,
        topic,
        recommendedSessionMinutes: 30,
        deliverable: 'redo_and_extract_generalizable_patterns',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    }),
  ];
}

function generateAmc10TopicTasks() {
  const tasks = [];

  for (const group of AMC10_TOPIC_GROUPS) {
    const spread = spreadWeeks(group.weekA, group.weekB, group.topics.length);

    group.topics.forEach((topic, idx) => {
      const centerWeek = spread[idx];
      const topicWeekA = clamp(centerWeek - 1, group.weekA, group.weekB);
      const topicWeekB = clamp(centerWeek + 1, group.weekA, group.weekB);

      tasks.push(
        ...buildCompetitionExecutionBlock({
          prefix: group.prefix,
          competition: 'AMC 10',
          domain: group.domain,
          topic,
          weekA: topicWeekA,
          weekB: topicWeekB,
          minutes: 45,
        })
      );
    });
  }

  return tasks;
}

function generateAimeTopicTasks() {
  const tasks = [];

  for (const group of AIME_TOPIC_GROUPS) {
    const spread = spreadWeeks(group.weekA, group.weekB, group.topics.length);

    group.topics.forEach((topic, idx) => {
      const centerWeek = spread[idx];
      const topicWeekA = clamp(centerWeek - 2, group.weekA, group.weekB);
      const topicWeekB = clamp(centerWeek + 2, group.weekA, group.weekB);

      tasks.push(
        ...buildCompetitionExecutionBlock({
          prefix: group.prefix,
          competition: 'AIME',
          domain: group.domain,
          topic,
          weekA: topicWeekA,
          weekB: topicWeekB,
          minutes: 55,
        })
      );
    });
  }

  return tasks;
}

// ───────────────────────────────────────────────────────────────────────────────
// AMC 10 SPIRALS, MOCKS, AND YEARLY PEAKS
// The original file implies repeated AMC 10 / AIME cycles across years. [file:19]
// We model that directly.
// ───────────────────────────────────────────────────────────────────────────────

function generateAmc10SpiralTasks() {
  const weeks = [
    44, 48, 52, 57, 61, 66, 71, 76,
    82, 87, 92, 97, 102, 107, 112, 117,
    123, 128, 133, 138, 143, 148, 153, 156,
  ];

  return weeks.map((weekNum, idx) =>
    weekTask({
      id: taskId('amc10', 'spiral', `week_${weekNum}`),
      title:
        idx === weeks.length - 1
          ? 'AMC 10 Spiral Review — Final Full-Cycle Mixed Set'
          : `AMC 10 Spiral Review — Mixed Set ${idx + 1}`,
      category: CATEGORY.AMC10,
      templateType: TEMPLATE.REVIEW,
      weekNum,
      requiresProof: false,
      templatePrefill: {
        taskType: 'spiral_review',
        competition: 'AMC 10',
        domains: ['geometry', 'combinatorics', 'number_theory', 'algebra'],
        recommendedSessionMinutes: 50,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

function generateAmc10TimedSetCadence() {
  const weeks = [
    43, 47, 51, 56, 60, 64, 69, 74,
    79, 84, 89, 94, 99, 104, 109, 114,
    119, 124, 129, 134, 139, 144, 149, 154,
  ];

  return weeks.map((weekNum, idx) =>
    weekTask({
      id: taskId('amc10', 'timed_set', `week_${weekNum}`),
      title: `AMC 10 Timed Set ${idx + 1}`,
      category: CATEGORY.AMC10,
      templateType: TEMPLATE.TIMED_EXAM,
      weekNum,
      requiresProof: false,
      templatePrefill: {
        taskType: 'timed_set',
        competition: 'AMC 10',
        recommendedSessionMinutes: 40,
        problemCount: '15_to_20',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

function generateAmc10MockCycles() {
  const specs = [
    // First cycle
    { weekNum: 49, id: 'amc10_mock_1', title: 'AMC 10 Full Mock I' },
    { weekNum: 58, id: 'amc10_mock_2', title: 'AMC 10 Full Mock II' },
    { weekNum: 67, id: 'amc10_mock_3', title: 'AMC 10 Full Mock III' },
    { weekNum: 76, id: 'amc10_mock_4', title: 'AMC 10 Full Mock IV' },

    // Second cycle
    { weekNum: 88, id: 'amc10_mock_5', title: 'AMC 10 Full Mock V' },
    { weekNum: 97, id: 'amc10_mock_6', title: 'AMC 10 Full Mock VI' },
    { weekNum: 106, id: 'amc10_mock_7', title: 'AMC 10 Full Mock VII' },
    { weekNum: 115, id: 'amc10_mock_8', title: 'AMC 10 Full Mock VIII' },

    // Third cycle / strongest phase
    { weekNum: 128, id: 'amc10_mock_9', title: 'AMC 10 Full Mock IX' },
    { weekNum: 137, id: 'amc10_mock_10', title: 'AMC 10 Full Mock X' },
    { weekNum: 146, id: 'amc10_mock_11', title: 'AMC 10 Full Mock XI' },
    { weekNum: 154, id: 'amc10_mock_12', title: 'AMC 10 Full Mock XII' },
  ];

  return specs.map(spec =>
    weekTask({
      id: spec.id,
      title: spec.title,
      category: CATEGORY.AMC10,
      templateType: TEMPLATE.MOCK_TEST,
      weekNum: spec.weekNum,
      requiresProof: false,
      templatePrefill: {
        taskType: 'full_mock',
        competition: 'AMC 10',
        recommendedSessionMinutes: 75,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

function generateAmc10CompetitionWindowTasks() {
  const specs = [
    { weekNum: 52, id: 'amc10_cycle1_taper', title: 'AMC 10 Cycle I Taper and Formula Compression', type: 'taper' },
    { weekNum: 53, id: 'amc10_cycle1_exam', title: 'AMC 10 Cycle I Official / Simulated Exam Window', type: 'official_exam' },
    { weekNum: 54, id: 'amc10_cycle1_postmortem', title: 'AMC 10 Cycle I Postmortem', type: 'postmortem' },

    { weekNum: 104, id: 'amc10_cycle2_taper', title: 'AMC 10 Cycle II Taper and Final Error Reduction', type: 'taper' },
    { weekNum: 105, id: 'amc10_cycle2_exam', title: 'AMC 10 Cycle II Official / Simulated Exam Window', type: 'official_exam' },
    { weekNum: 106, id: 'amc10_cycle2_postmortem', title: 'AMC 10 Cycle II Postmortem', type: 'postmortem' },

    { weekNum: 156, id: 'amc10_final_taper', title: 'AMC 10 Final Taper — Last Full Attempt Readiness', type: 'taper' },
    { weekNum: 157, id: 'amc10_final_exam_window', title: 'AMC 10 Final Official / Simulated Exam Window', type: 'official_exam' },
    { weekNum: 158, id: 'amc10_final_postmortem', title: 'AMC 10 Final Postmortem and Archive', type: 'postmortem' },
  ];

  return specs.map(spec =>
    weekTask({
      id: spec.id,
      title: spec.title,
      category: CATEGORY.AMC10,
      templateType:
        spec.type === 'official_exam'
          ? TEMPLATE.MOCK_TEST
          : TEMPLATE.REVIEW,
      weekNum: spec.weekNum,
      requiresProof: false,
      templatePrefill: {
        taskType: spec.type,
        competition: 'AMC 10',
        recommendedSessionMinutes:
          spec.type === 'official_exam' ? 75 : 35,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

function generateAmc10ErrorLoops() {
  const weeks = [
    46, 50, 55, 59, 63, 68, 73, 78,
    83, 88, 93, 98, 103, 108, 113, 118,
    123, 128, 133, 138, 143, 148, 153, 158,
  ];

  return weeks.map((weekNum, idx) =>
    weekTask({
      id: taskId('amc10', 'error_loop', `week_${weekNum}`),
      title: `AMC 10 Error Log Review Cycle ${idx + 1}`,
      category: CATEGORY.AMC10,
      templateType: TEMPLATE.REVIEW,
      weekNum,
      requiresProof: false,
      templatePrefill: {
        taskType: 'error_log_review',
        competition: 'AMC 10',
        deliverable: 'redo_misses_classify_error_types_build_rules',
        recommendedSessionMinutes: 35,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// AIME TRAINING STRUCTURE
// AIME is narrower and deeper. Fewer but harder problems, more reconstruction.
// ───────────────────────────────────────────────────────────────────────────────

function generateAimeBridgeTasks() {
  const specs = [
    { weekNum: 92, title: 'AIME Bridge — What Changes from AMC 10 to AIME?', topic: 'format_and_expectations' },
    { weekNum: 96, title: 'AIME Bridge — Writing Full Solutions, Not Just Answers', topic: 'full_solution_habit' },
    { weekNum: 101, title: 'AIME Bridge — Time Management for Hard Problems', topic: 'time_management' },
    { weekNum: 107, title: 'AIME Bridge — Pattern Recognition vs. Random Flailing', topic: 'pattern_recognition' },
  ];

  return specs.map(spec =>
    weekTask({
      id: taskId('aime', 'bridge', `week_${spec.weekNum}`, spec.topic),
      title: spec.title,
      category: CATEGORY.AIME,
      templateType: TEMPLATE.WRITING,
      weekNum: spec.weekNum,
      requiresProof: false,
      templatePrefill: {
        taskType: 'bridge_reflection',
        competition: 'AIME',
        topic: spec.topic,
        recommendedSessionMinutes: 20,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

function generateAimeSpirals() {
  const weeks = [
    104, 112, 120, 128, 136, 144, 152, 160,
    168, 176, 184, 192, 200, 208,
  ];

  return weeks.map((weekNum, idx) =>
    weekTask({
      id: taskId('aime', 'spiral', `week_${weekNum}`),
      title:
        idx === weeks.length - 1
          ? 'AIME Spiral Review — Final Full-Cycle Mixed Set'
          : `AIME Spiral Review — Mixed Set ${idx + 1}`,
      category: CATEGORY.AIME,
      templateType: TEMPLATE.REVIEW,
      weekNum,
      requiresProof: false,
      templatePrefill: {
        taskType: 'spiral_review',
        competition: 'AIME',
        domains: ['geometry', 'combinatorics', 'number_theory', 'algebra'],
        recommendedSessionMinutes: 60,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

function generateAimeTimedCadence() {
  const weeks = [
    106, 114, 122, 130, 138, 146, 154, 162,
    170, 178, 186, 194, 202, 208,
  ];

  return weeks.map((weekNum, idx) =>
    weekTask({
      id: taskId('aime', 'timed', `week_${weekNum}`),
      title: `AIME Timed Set ${idx + 1}`,
      category: CATEGORY.AIME,
      templateType: TEMPLATE.TIMED_EXAM,
      weekNum,
      requiresProof: false,
      templatePrefill: {
        taskType: 'timed_set',
        competition: 'AIME',
        problemCount: '3_to_5',
        recommendedSessionMinutes: 60,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

function generateAimeMockCycles() {
  const specs = [
    { weekNum: 118, id: 'aime_mock_1', title: 'AIME Mock I' },
    { weekNum: 134, id: 'aime_mock_2', title: 'AIME Mock II' },
    { weekNum: 150, id: 'aime_mock_3', title: 'AIME Mock III' },
    { weekNum: 166, id: 'aime_mock_4', title: 'AIME Mock IV' },
    { weekNum: 182, id: 'aime_mock_5', title: 'AIME Mock V' },
    { weekNum: 198, id: 'aime_mock_6', title: 'AIME Mock VI' },
    { weekNum: 208, id: 'aime_mock_7', title: 'AIME Mock VII' },
  ];

  return specs.map(spec =>
    weekTask({
      id: spec.id,
      title: spec.title,
      category: CATEGORY.AIME,
      templateType: TEMPLATE.MOCK_TEST,
      weekNum: spec.weekNum,
      requiresProof: false,
      templatePrefill: {
        taskType: 'full_mock',
        competition: 'AIME',
        recommendedSessionMinutes: 180,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

function generateAimeArchiveWork() {
  const weeks = [110, 126, 142, 158, 174, 190, 206];

  return weeks.map((weekNum, idx) =>
    weekTask({
      id: taskId('aime', 'archive_set', `week_${weekNum}`),
      title: `AIME Archive Set ${idx + 1} — Past Exam Reconstruction`,
      category: CATEGORY.AIME,
      templateType: TEMPLATE.REVIEW,
      weekNum,
      requiresProof: false,
      templatePrefill: {
        taskType: 'archive_reconstruction',
        competition: 'AIME',
        recommendedSessionMinutes: 75,
        deliverable: 'full_solutions_for_selected_archive_problems',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

function generateAimeProofWritingTasks() {
  const specs = [
    { weekNum: 108, topic: 'clean_full_solution', title: 'AIME Writing — Clean Full Solution with No Handwaving' },
    { weekNum: 132, topic: 'casework_clarity', title: 'AIME Writing — How to Present Casework Clearly' },
    { weekNum: 156, topic: 'salvage_partial_progress', title: 'AIME Writing — How to Salvage Progress When Stuck' },
    { weekNum: 180, topic: 'structural_pattern_recognition', title: 'AIME Writing — How to See Structure Faster' },
    { weekNum: 204, topic: 'final_reflection', title: 'AIME Reflection — Which Habits Actually Produce Progress?' },
  ];

  return specs.map(spec =>
    weekTask({
      id: taskId('aime', 'writing', `week_${spec.weekNum}`, spec.topic),
      title: spec.title,
      category: CATEGORY.AIME,
      templateType: TEMPLATE.WRITING,
      weekNum: spec.weekNum,
      requiresProof: false,
      templatePrefill: {
        taskType: 'reflection',
        competition: 'AIME',
        topic: spec.topic,
        recommendedSessionMinutes: 25,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

function generateAimeCompetitionWindowTasks() {
  const specs = [
    { weekNum: 131, id: 'aime_cycle1_taper', title: 'AIME Cycle I Taper and Final Review', type: 'taper' },
    { weekNum: 132, id: 'aime_cycle1_window', title: 'AIME Cycle I Official / Simulated Window', type: 'official_exam' },
    { weekNum: 133, id: 'aime_cycle1_postmortem', title: 'AIME Cycle I Postmortem', type: 'postmortem' },

    { weekNum: 183, id: 'aime_cycle2_taper', title: 'AIME Cycle II Taper and Final Review', type: 'taper' },
    { weekNum: 184, id: 'aime_cycle2_window', title: 'AIME Cycle II Official / Simulated Window', type: 'official_exam' },
    { weekNum: 185, id: 'aime_cycle2_postmortem', title: 'AIME Cycle II Postmortem', type: 'postmortem' },
  ];

  return specs.map(spec =>
    weekTask({
      id: spec.id,
      title: spec.title,
      category: CATEGORY.AIME,
      templateType:
        spec.type === 'official_exam'
          ? TEMPLATE.MOCK_TEST
          : TEMPLATE.REVIEW,
      weekNum: spec.weekNum,
      requiresProof: false,
      templatePrefill: {
        taskType: spec.type,
        competition: 'AIME',
        recommendedSessionMinutes:
          spec.type === 'official_exam' ? 180 : 35,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// Transition tasks so the math-competition arc has explicit milestones.
function generateCompetitionTransitionTasks() {
  const specs = [
    {
      weekNum: 52,
      id: 'transition_amc10_cycle1_to_harder_mocking',
      title: 'Transition Gate — AMC 10 Cycle I Complete, Raise Problem Difficulty',
      category: CATEGORY.AMC10,
      competition: 'AMC 10',
      transitionType: 'cycle1_complete',
    },
    {
      weekNum: 104,
      id: 'transition_amc10_to_aime_serious',
      title: 'Transition Gate — AMC 10 Strong Enough for Serious AIME Work',
      category: CATEGORY.AIME,
      competition: 'AIME',
      transitionType: 'amc10_to_aime_serious',
    },
    {
      weekNum: 156,
      id: 'transition_final_amc10_to_full_aime',
      title: 'Transition Gate — Final AMC 10 Phase Complete, AIME Becomes Main Track',
      category: CATEGORY.AIME,
      competition: 'AIME',
      transitionType: 'final_amc10_to_aime',
    },
    {
      weekNum: 208,
      id: 'transition_aime_to_upper_math_enrichment',
      title: 'Transition Gate — AIME Phase Archived into Long-Term Mathematical Identity',
      category: CATEGORY.AIME,
      competition: 'AIME',
      transitionType: 'aime_phase_complete',
    },
  ];

  return specs.map(spec =>
    weekTask({
      id: spec.id,
      title: spec.title,
      category: spec.category,
      templateType: TEMPLATE.CHECKLIST,
      weekNum: spec.weekNum,
      requiresProof: false,
      templatePrefill: {
        taskType: 'transition_gate',
        competition: spec.competition,
        transitionType: spec.transitionType,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// Populate arrays.
AMC10_TASKS.push(
  ...generateAmc10TopicTasks(),
  ...generateAmc10SpiralTasks(),
  ...generateAmc10TimedSetCadence(),
  ...generateAmc10MockCycles(),
  ...generateAmc10CompetitionWindowTasks(),
  ...generateAmc10ErrorLoops()
);

AIME_TASKS.push(
  ...generateAimeTopicTasks(),
  ...generateAimeBridgeTasks(),
  ...generateAimeSpirals(),
  ...generateAimeTimedCadence(),
  ...generateAimeMockCycles(),
  ...generateAimeArchiveWork(),
  ...generateAimeProofWritingTasks(),
  ...generateAimeCompetitionWindowTasks(),
  ...generateCompetitionTransitionTasks()
);

// ───────────────────────────────────────────────────────────────────────────────
// PART 8 — LANGUAGE TRACKS: SPANISH, RUSSIAN, AP-SPANISH TRANSITION
// The original file contained Michel Thomas Spanish and Russian track arrays,
// and the recurring file encoded Spanish early, Russian in the middle, and
// AP Spanish prep later. [file:19][file:20]
// This part converts that into explicit seeded language progression.
// ───────────────────────────────────────────────────────────────────────────────

const MICHEL_THOMAS_SPANISH_TRACKS = [
  { track: 1, title: 'Michel Thomas Spanish Foundation Track 1 — Cognates and Core Verbs' },
  { track: 2, title: 'Michel Thomas Spanish Foundation Track 2 — Want, Have, Can' },
  { track: 3, title: 'Michel Thomas Spanish Foundation Track 3 — Past Tense Intro' },
  { track: 4, title: 'Michel Thomas Spanish Foundation Track 4 — Future and Conditional' },
  { track: 5, title: 'Michel Thomas Spanish Advanced Track 5 — Subjunctive Intro' },
  { track: 6, title: 'Michel Thomas Spanish Advanced Track 6 — Object Pronouns' },
  { track: 7, title: 'Michel Thomas Spanish Advanced Track 7 — Reflexive Verbs' },
  { track: 8, title: 'Michel Thomas Spanish Advanced Track 8 — Relative Clauses' },
  { track: 9, title: 'Michel Thomas Spanish Total Track 9 — Imperfect vs. Preterite' },
  { track: 10, title: 'Michel Thomas Spanish Total Track 10 — Ser vs. Estar Deep Dive' },
  { track: 11, title: 'Michel Thomas Spanish Total Track 11 — Conditional Perfect' },
  { track: 12, title: 'Michel Thomas Spanish Total Track 12 — Subjunctive Triggers' },
  { track: 13, title: 'Michel Thomas Spanish Vocabulary Track 13 — Food and Travel' },
  { track: 14, title: 'Michel Thomas Spanish Vocabulary Track 14 — Health and Body' },
  { track: 15, title: 'Michel Thomas Spanish Vocabulary Track 15 — Work and Society' },
  { track: 16, title: 'Michel Thomas Spanish Mastery Track 16 — Complex Sentences' },
  { track: 17, title: 'Michel Thomas Spanish Mastery Track 17 — Academic Register' },
  { track: 18, title: 'Michel Thomas Spanish Mastery Track 18 — AP-Level Review' },
];

const MICHEL_THOMAS_RUSSIAN_TRACKS = [
  { track: 1, title: 'Michel Thomas Russian Foundation Track 1 — Cyrillic and Core Phrases' },
  { track: 2, title: 'Michel Thomas Russian Foundation Track 2 — Nouns and Gender' },
  { track: 3, title: 'Michel Thomas Russian Foundation Track 3 — Present-Tense Verbs' },
  { track: 4, title: 'Michel Thomas Russian Foundation Track 4 — Nominative and Accusative' },
  { track: 5, title: 'Michel Thomas Russian Foundation Track 5 — Genitive' },
  { track: 6, title: 'Michel Thomas Russian Foundation Track 6 — Dative and Instrumental' },
  { track: 7, title: 'Michel Thomas Russian Advanced Track 7 — Imperfective Aspect' },
  { track: 8, title: 'Michel Thomas Russian Advanced Track 8 — Perfective Aspect' },
  { track: 9, title: 'Michel Thomas Russian Advanced Track 9 — Past Tense' },
  { track: 10, title: 'Michel Thomas Russian Advanced Track 10 — Future Tense' },
  { track: 11, title: 'Michel Thomas Russian Advanced Track 11 — Pronouns and Agreement' },
  { track: 12, title: 'Michel Thomas Russian Advanced Track 12 — Reflexive Verbs' },
  { track: 13, title: 'Michel Thomas Russian Total Track 13 — Verbs of Motion' },
  { track: 14, title: 'Michel Thomas Russian Total Track 14 — Subordinate Clauses' },
  { track: 15, title: 'Michel Thomas Russian Total Track 15 — Conditional and Subjunctive' },
  { track: 16, title: 'Michel Thomas Russian Mastery Track 16 — Complex Grammar Review' },
  { track: 17, title: 'Michel Thomas Russian Mastery Track 17 — Academic and Formal Register' },
  { track: 18, title: 'Michel Thomas Russian Mastery Track 18 — Full Fluency Review' },
];

function buildLanguageTrackBlock({
  prefix,
  language,
  trackTitle,
  trackNum,
  weekA,
  weekB,
  phaseLabel,
}) {
  const weeks = spreadWeeks(weekA, weekB, 4);

  return [
    weekTask({
      id: taskId(prefix, `track_${trackNum}`, 'listen'),
      title: `${language} — ${trackTitle} — Core Listening Session`,
      category: CATEGORY.LANGUAGE,
      templateType: TEMPLATE.LANGUAGE_PRACTICE,
      weekNum: weeks[0],
      requiresProof: false,
      templatePrefill: {
        taskType: 'track_listen',
        language,
        track: trackNum,
        trackTitle,
        phaseLabel,
        recommendedSessionMinutes: 30,
        deliverable: 'notes_plus_key_phrases',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    }),
    weekTask({
      id: taskId(prefix, `track_${trackNum}`, 'vocab'),
      title: `${language} — ${trackTitle} — Vocabulary Reinforcement`,
      category: CATEGORY.LANGUAGE,
      templateType: TEMPLATE.LANGUAGE_PRACTICE,
      weekNum: weeks[1],
      requiresProof: false,
      templatePrefill: {
        taskType: 'track_vocab',
        language,
        track: trackNum,
        trackTitle,
        phaseLabel,
        recommendedSessionMinutes: 20,
        deliverable: 'flashcards_plus_sentences',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    }),
    weekTask({
      id: taskId(prefix, `track_${trackNum}`, 'output'),
      title: `${language} — ${trackTitle} — Speaking / Writing Output`,
      category: CATEGORY.LANGUAGE,
      templateType: TEMPLATE.LANGUAGE_PRACTICE,
      weekNum: weeks[2],
      requiresProof: false,
      templatePrefill: {
        taskType: 'track_output',
        language,
        track: trackNum,
        trackTitle,
        phaseLabel,
        recommendedSessionMinutes: 25,
        deliverable: 'recording_or_short_written_output',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    }),
    weekTask({
      id: taskId(prefix, `track_${trackNum}`, 'review'),
      title: `${language} — ${trackTitle} — Consolidation Review`,
      category: CATEGORY.LANGUAGE,
      templateType: TEMPLATE.REVIEW,
      weekNum: weeks[3],
      requiresProof: false,
      templatePrefill: {
        taskType: 'track_review',
        language,
        track: trackNum,
        trackTitle,
        phaseLabel,
        recommendedSessionMinutes: 20,
        deliverable: 'summary_of_patterns_and_errors',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    }),
  ];
}

// ───────────────────────────────────────────────────────────────────────────────
// SPANISH CORE TRACK
// Based on the old quarter logic and recurring.js:
// Spanish dominates the early phase and later returns as AP Spanish prep. [file:19][file:20]
// ───────────────────────────────────────────────────────────────────────────────

function generateSpanishTrackTasks() {
  const tasks = [];
  const spread = spreadWeeks(1, 39, MICHEL_THOMAS_SPANISH_TRACKS.length);

  MICHEL_THOMAS_SPANISH_TRACKS.forEach((track, idx) => {
    const centerWeek = spread[idx];
    const weekA = clamp(centerWeek - 1, 1, 39);
    const weekB = clamp(centerWeek + 1, 1, 39);

    tasks.push(
      ...buildLanguageTrackBlock({
        prefix: 'spanish_mt',
        language: 'Spanish',
        trackTitle: track.title,
        trackNum: track.track,
        weekA,
        weekB,
        phaseLabel: 'spanish_foundation',
      })
    );
  });

  return tasks;
}

function generateSpanishMaintenanceTasks() {
  const specs = [
    { weekNum: 12, title: 'Spanish Maintenance — Present-Tense Consolidation', focus: 'present_tense' },
    { weekNum: 18, title: 'Spanish Maintenance — Past-Tense Consolidation', focus: 'past_tense' },
    { weekNum: 24, title: 'Spanish Maintenance — Subjunctive and Pronouns Consolidation', focus: 'advanced_grammar' },
    { weekNum: 30, title: 'Spanish Maintenance — Listening and Fluency Check', focus: 'listening_fluency' },
    { weekNum: 36, title: 'Spanish Maintenance — Academic Register Check', focus: 'academic_register' },
    { weekNum: 39, title: 'Spanish Exit Gate — Early Track Completion Verified', focus: 'exit_gate' },

    { weekNum: 52, title: 'Spanish Maintenance — Keep the Language Alive I', focus: 'maintenance' },
    { weekNum: 78, title: 'Spanish Maintenance — Keep the Language Alive II', focus: 'maintenance' },
    { weekNum: 104, title: 'Spanish Maintenance — Keep the Language Alive III', focus: 'maintenance' },
    { weekNum: 130, title: 'Spanish Maintenance — Keep the Language Alive IV', focus: 'maintenance' },
    { weekNum: 156, title: 'Spanish Maintenance — Prepare to Convert into AP Spanish', focus: 'ap_bridge' },
  ];

  return specs.map(spec =>
    weekTask({
      id: taskId('spanish', 'maintenance', `week_${spec.weekNum}`, spec.focus),
      title: spec.title,
      category: CATEGORY.LANGUAGE,
      templateType:
        spec.focus === 'exit_gate' || spec.focus === 'ap_bridge'
          ? TEMPLATE.CHECKLIST
          : TEMPLATE.LANGUAGE_PRACTICE,
      weekNum: spec.weekNum,
      requiresProof: false,
      templatePrefill: {
        taskType: 'maintenance',
        language: 'Spanish',
        focus: spec.focus,
        recommendedSessionMinutes: spec.focus === 'maintenance' ? 20 : 30,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// RUSSIAN CORE TRACK
// The old recurring.js clearly shifted to Russian in the middle years. [file:20]
// ───────────────────────────────────────────────────────────────────────────────

function generateRussianTrackTasks() {
  const tasks = [];
  const spread = spreadWeeks(40, 156, MICHEL_THOMAS_RUSSIAN_TRACKS.length);

  MICHEL_THOMAS_RUSSIAN_TRACKS.forEach((track, idx) => {
    const centerWeek = spread[idx];
    const weekA = clamp(centerWeek - 2, 40, 156);
    const weekB = clamp(centerWeek + 2, 40, 156);

    tasks.push(
      ...buildLanguageTrackBlock({
        prefix: 'russian_mt',
        language: 'Russian',
        trackTitle: track.title,
        trackNum: track.track,
        weekA,
        weekB,
        phaseLabel: 'russian_buildout',
      })
    );
  });

  return tasks;
}

function generateRussianSupportTasks() {
  const specs = [
    { weekNum: 44, title: 'Russian Support — Cyrillic Speed and Accuracy Drill', focus: 'cyrillic' },
    { weekNum: 52, title: 'Russian Support — Case System I: Nominative / Accusative / Genitive', focus: 'cases_1' },
    { weekNum: 64, title: 'Russian Support — Case System II: Dative / Instrumental / Prepositional', focus: 'cases_2' },
    { weekNum: 76, title: 'Russian Support — Verb Aspect Foundations', focus: 'aspect' },
    { weekNum: 88, title: 'Russian Support — Past / Future Tense Accuracy', focus: 'tenses' },
    { weekNum: 100, title: 'Russian Support — Reading and Translation Sprint', focus: 'reading' },
    { weekNum: 112, title: 'Russian Support — Listening and Dictation Sprint', focus: 'listening' },
    { weekNum: 124, title: 'Russian Support — Paragraph Writing Accuracy', focus: 'writing' },
    { weekNum: 136, title: 'Russian Support — Academic Register and Formal Expression', focus: 'academic_register' },
    { weekNum: 148, title: 'Russian Support — Fluency Maintenance and Compression', focus: 'fluency' },
    { weekNum: 156, title: 'Russian Exit Gate — Middle-Phase Russian Program Archived', focus: 'exit_gate' },
  ];

  return specs.map(spec =>
    weekTask({
      id: taskId('russian', 'support', `week_${spec.weekNum}`, spec.focus),
      title: spec.title,
      category: CATEGORY.LANGUAGE,
      templateType:
        spec.focus === 'exit_gate'
          ? TEMPLATE.CHECKLIST
          : TEMPLATE.LANGUAGE_PRACTICE,
      weekNum: spec.weekNum,
      requiresProof: false,
      templatePrefill: {
        taskType: 'support',
        language: 'Russian',
        focus: spec.focus,
        recommendedSessionMinutes: 25,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// AP SPANISH PREP / AP SPANISH STYLE WORK
// The recurring file explicitly shifted to AP Spanish prep in the later phase. [file:20]
// This creates a structured path from week 157 onward.
// ───────────────────────────────────────────────────────────────────────────────

const AP_SPANISH_SKILLS = [
  {
    prefix: 'ap_spanish_email',
    skill: 'Formal Email Reply',
    weekA: 157,
    weekB: 170,
  },
  {
    prefix: 'ap_spanish_argument',
    skill: 'Persuasive Essay with Sources',
    weekA: 162,
    weekB: 176,
  },
  {
    prefix: 'ap_spanish_conversation',
    skill: 'Simulated Conversation',
    weekA: 167,
    weekB: 182,
  },
  {
    prefix: 'ap_spanish_cultural',
    skill: 'Cultural Comparison',
    weekA: 172,
    weekB: 186,
  },
  {
    prefix: 'ap_spanish_listening',
    skill: 'Listening Comprehension',
    weekA: 177,
    weekB: 190,
  },
  {
    prefix: 'ap_spanish_reading',
    skill: 'Reading Comprehension and Inference',
    weekA: 182,
    weekB: 195,
  },
  {
    prefix: 'ap_spanish_grammar',
    skill: 'Advanced Grammar and Register',
    weekA: 187,
    weekB: 200,
  },
  {
    prefix: 'ap_spanish_vocab',
    skill: 'Thematic AP Vocabulary and Precision',
    weekA: 192,
    weekB: 204,
  },
];

function buildApSpanishSkillBlock({
  prefix,
  skill,
  weekA,
  weekB,
}) {
  const weeks = spreadWeeks(weekA, weekB, 5);

  return [
    weekTask({
      id: taskId(prefix, 'learn'),
      title: `AP Spanish — ${skill} — Skill Build`,
      category: CATEGORY.LANGUAGE,
      templateType: TEMPLATE.LANGUAGE_PRACTICE,
      weekNum: weeks[0],
      requiresProof: false,
      templatePrefill: {
        taskType: 'ap_spanish_skill_build',
        language: 'Spanish',
        skill,
        recommendedSessionMinutes: 30,
        deliverable: 'notes_plus_modeled_examples',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    }),
    weekTask({
      id: taskId(prefix, 'practice'),
      title: `AP Spanish — ${skill} — Guided Practice`,
      category: CATEGORY.LANGUAGE,
      templateType: TEMPLATE.LANGUAGE_PRACTICE,
      weekNum: weeks[1],
      requiresProof: false,
      templatePrefill: {
        taskType: 'ap_spanish_guided_practice',
        language: 'Spanish',
        skill,
        recommendedSessionMinutes: 30,
        deliverable: '1_structured_attempt',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    }),
    weekTask({
      id: taskId(prefix, 'timed'),
      title: `AP Spanish — ${skill} — Timed Practice`,
      category: CATEGORY.LANGUAGE,
      templateType: TEMPLATE.TIMED_EXAM,
      weekNum: weeks[2],
      requiresProof: false,
      templatePrefill: {
        taskType: 'ap_spanish_timed_practice',
        language: 'Spanish',
        skill,
        recommendedSessionMinutes: 20,
        deliverable: 'timed_attempt',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    }),
    weekTask({
      id: taskId(prefix, 'feedback'),
      title: `AP Spanish — ${skill} — Self-Review and Correction`,
      category: CATEGORY.LANGUAGE,
      templateType: TEMPLATE.REVIEW,
      weekNum: weeks[3],
      requiresProof: false,
      templatePrefill: {
        taskType: 'ap_spanish_self_review',
        language: 'Spanish',
        skill,
        recommendedSessionMinutes: 20,
        deliverable: 'error_log_plus_rewrite',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    }),
    weekTask({
      id: taskId(prefix, 'checkpoint'),
      title: `AP Spanish — ${skill} — Mastery Check`,
      category: CATEGORY.LANGUAGE,
      templateType: TEMPLATE.CHECKLIST,
      weekNum: weeks[4],
      requiresProof: false,
      templatePrefill: {
        taskType: 'ap_spanish_checkpoint',
        language: 'Spanish',
        skill,
        recommendedSessionMinutes: 20,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    }),
  ];
}

function generateApSpanishSkillTasks() {
  const tasks = [];

  for (const skill of AP_SPANISH_SKILLS) {
    tasks.push(
      ...buildApSpanishSkillBlock(skill)
    );
  }

  return tasks;
}

function generateApSpanishMocks() {
  const specs = [
    { weekNum: 175, title: 'AP Spanish Mock I — Mixed Task Set', id: 'ap_spanish_mock_1' },
    { weekNum: 188, title: 'AP Spanish Mock II — Mixed Task Set', id: 'ap_spanish_mock_2' },
    { weekNum: 198, title: 'AP Spanish Mock III — Mixed Task Set', id: 'ap_spanish_mock_3' },
    { weekNum: 206, title: 'AP Spanish Mock IV — Final Pre-Exam Mixed Task Set', id: 'ap_spanish_mock_4' },
  ];

  return specs.map(spec =>
    weekTask({
      id: spec.id,
      title: spec.title,
      category: CATEGORY.LANGUAGE,
      templateType: TEMPLATE.MOCK_TEST,
      weekNum: spec.weekNum,
      requiresProof: false,
      templatePrefill: {
        taskType: 'ap_spanish_mock',
        language: 'Spanish',
        recommendedSessionMinutes: 60,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

function generateApSpanishPortfolioTasks() {
  const specs = [
    { weekNum: 164, title: 'Language Portfolio — Spanish Speaking Baseline Recording', focus: 'speaking_baseline' },
    { weekNum: 178, title: 'Language Portfolio — Spanish Writing Sample Archive', focus: 'writing_sample' },
    { weekNum: 192, title: 'Language Portfolio — Spanish Listening / Reading Evidence Archive', focus: 'receptive_archive' },
    { weekNum: 208, title: 'Language Portfolio — Spanish Mastery Summary and Reflection', focus: 'final_reflection' },
  ];

  return specs.map(spec =>
    weekTask({
      id: taskId('spanish_portfolio', `week_${spec.weekNum}`, spec.focus),
      title: spec.title,
      category: CATEGORY.LANGUAGE,
      templateType:
        spec.focus === 'final_reflection'
          ? TEMPLATE.WRITING
          : TEMPLATE.ACTIVITY_LOG,
      weekNum: spec.weekNum,
      requiresProof: false,
      templatePrefill: {
        taskType: 'language_portfolio',
        language: 'Spanish',
        focus: spec.focus,
        recommendedSessionMinutes: 20,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// GENERAL LANGUAGE READING / CULTURE / LONG-ARC REFLECTION
// This makes the language work less mechanical and more narrative-rich.
// ───────────────────────────────────────────────────────────────────────────────

function generateLanguageEnrichmentTasks() {
  const specs = [
    { weekNum: 20, language: 'Spanish', title: 'Language Enrichment — Read a Short Spanish Article and Reflect', focus: 'reading_reflection' },
    { weekNum: 34, language: 'Spanish', title: 'Language Enrichment — Watch Spanish Media and Extract 10 Useful Phrases', focus: 'media_extraction' },
    { weekNum: 72, language: 'Russian', title: 'Language Enrichment — Read a Simple Russian Text and Translate Carefully', focus: 'translation' },
    { weekNum: 96, language: 'Russian', title: 'Language Enrichment — Russian Cultural Concept Mini-Research', focus: 'culture' },
    { weekNum: 140, language: 'Russian', title: 'Language Enrichment — Russian News / Media Summary', focus: 'media_summary' },
    { weekNum: 170, language: 'Spanish', title: 'Language Enrichment — Explain a Personal Experience in Formal Spanish', focus: 'formal_expression' },
    { weekNum: 200, language: 'Spanish', title: 'Language Reflection — How Language Study Changed the Way You Think', focus: 'reflection' },
  ];

  return specs.map(spec =>
    weekTask({
      id: taskId('language_enrichment', spec.language, `week_${spec.weekNum}`, spec.focus),
      title: spec.title,
      category: CATEGORY.LANGUAGE,
      templateType:
        spec.focus === 'reflection'
          ? TEMPLATE.WRITING
          : TEMPLATE.LANGUAGE_PRACTICE,
      weekNum: spec.weekNum,
      requiresProof: false,
      templatePrefill: {
        taskType: 'language_enrichment',
        language: spec.language,
        focus: spec.focus,
        recommendedSessionMinutes: 25,
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// TRANSITION GATES
// ───────────────────────────────────────────────────────────────────────────────

function generateLanguageTransitionGates() {
  return [
    weekTask({
      id: 'transition_spanish_to_russian',
      title: 'Transition Gate — Spanish Foundation Built, Russian Program Begins',
      category: CATEGORY.LANGUAGE,
      templateType: TEMPLATE.CHECKLIST,
      weekNum: 40,
      requiresProof: false,
      templatePrefill: {
        taskType: 'transition_gate',
        transitionType: 'spanish_to_russian',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    }),
    weekTask({
      id: 'transition_russian_to_ap_spanish',
      title: 'Transition Gate — Russian Program Archived, AP Spanish Becomes Main Language Track',
      category: CATEGORY.LANGUAGE,
      templateType: TEMPLATE.CHECKLIST,
      weekNum: 157,
      requiresProof: false,
      templatePrefill: {
        taskType: 'transition_gate',
        transitionType: 'russian_to_ap_spanish',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    }),
    weekTask({
      id: 'transition_language_program_complete',
      title: 'Transition Gate — Language Program Consolidated into Long-Term Intellectual Identity',
      category: CATEGORY.LANGUAGE,
      templateType: TEMPLATE.CHECKLIST,
      weekNum: 208,
      requiresProof: false,
      templatePrefill: {
        taskType: 'transition_gate',
        transitionType: 'language_program_complete',
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    }),
  ];
}

// Populate language array.
LANGUAGE_TASKS.push(
  ...generateSpanishTrackTasks(),
  ...generateSpanishMaintenanceTasks(),
  ...generateRussianTrackTasks(),
  ...generateRussianSupportTasks(),
  ...generateApSpanishSkillTasks(),
  ...generateApSpanishMocks(),
  ...generateApSpanishPortfolioTasks(),
  ...generateLanguageEnrichmentTasks(),
  ...generateLanguageTransitionGates()
);

// ───────────────────────────────────────────────────────────────────────────────
// PART 9 — AP ENGINE + SHARED AP HELPERS
// ───────────────────────────────────────────────────────────────────────────────


const AP_CATEGORY = CATEGORY.AP;

const AP_TEMPLATE = {
  LESSON: TEMPLATE.AP_LESSON || TEMPLATE.APLESSON || TEMPLATE.RECURRING,
  REVIEW: TEMPLATE.REVIEW,
  TIMED: TEMPLATE.TIMED_EXAM,
  MOCK: TEMPLATE.MOCK_TEST,
  WRITING: TEMPLATE.WRITING,
  CHECKLIST: TEMPLATE.CHECKLIST,
  LAB: TEMPLATE.ACTIVITY_LOG,
};

const AP_EXAM_WEEK = {
  AP_PRECALCULUS: 117,
  AP_ENVIRONMENTAL_SCIENCE: 130,
  AP_HUMAN_GEOGRAPHY: 143,
  AP_PSYCHOLOGY: 156,
  AP_CALCULUS_BC: 184,
  AP_BIOLOGY: 184,
  AP_CHEMISTRY: 184,
  AP_STATISTICS: 184,
  AP_PHYSICS_1: 156,
  AP_PHYSICS_C_MECHANICS: 184,
  AP_PHYSICS_C_E_AND_M: 195,
  AP_COMPUTER_SCIENCE_A: 184,
  AP_SPANISH_LANGUAGE: 208,
};

function apTask({
  id,
  title,
  templateType,
  weekNum,
  requiresProof = false,
  courseCode,
  unit,
  topic,
  subtopic = null,
  taskType,
  recommendedSessionMinutes = 35,
  masteryTarget = null,
  notesRequired = true,
  errorLogRequired = false,
  examWeight = null,
  extra = {},
}) {
  return weekTask({
    id,
    title,
    category: AP_CATEGORY,
    templateType,
    weekNum,
    requiresProof,
    templatePrefill: {
      provider: 'AP Program',
      taskType,
      courseCode,
      unit,
      topic,
      subtopic,
      recommendedSessionMinutes,
      masteryTarget,
      notesRequired,
      errorLogRequired,
      examWeight,
      proofUploadUrl: PROOF_DRIVE_URL,
      ...extra,
    },
  });
}

function normalizeApSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function apCourseExamWeek(courseCode, fallbackWeekB) {
  return AP_EXAM_WEEK[courseCode] || fallbackWeekB;
}

function apPhaseForWeek(weekNum) {
  if (weekNum <= 39) return 'preview';
  if (weekNum <= 104) return 'buildout';
  if (weekNum <= 156) return 'active';
  if (weekNum <= 195) return 'heavy_review';
  return 'final_language_or_senior';
}

function makeApUnitCode(courseCode, unitTitle) {
  return `${courseCode}_${normalizeApSlug(unitTitle)}`;
}

function makeApTopicCode(courseCode, unitTitle, topicTitle) {
  return `${courseCode}_${normalizeApSlug(unitTitle)}_${normalizeApSlug(topicTitle)}`;
}

function inferApSessionMinutes(courseCode, taskType) {
  if (taskType === 'mock_exam') return 90;
  if (taskType === 'timed_frq' || taskType === 'timed_mcq') return 45;
  if (taskType === 'lab' || taskType === 'coding_lab') return 50;
  if (
    courseCode === 'AP_CALCULUS_BC' ||
    courseCode === 'AP_PHYSICS_C_MECHANICS' ||
    courseCode === 'AP_PHYSICS_C_E_AND_M' ||
    courseCode === 'AP_CHEMISTRY'
  ) return 45;
  return 35;
}

function inferApMasteryTarget(courseCode) {
  if (
    courseCode === 'AP_CALCULUS_BC' ||
    courseCode === 'AP_BIOLOGY' ||
    courseCode === 'AP_CHEMISTRY' ||
    courseCode === 'AP_STATISTICS' ||
    courseCode === 'AP_PHYSICS_C_MECHANICS' ||
    courseCode === 'AP_PHYSICS_C_E_AND_M'
  ) return 'ap_5_level';
  if (
    courseCode === 'AP_PRECALCULUS' ||
    courseCode === 'AP_ENVIRONMENTAL_SCIENCE' ||
    courseCode === 'AP_HUMAN_GEOGRAPHY' ||
    courseCode === 'AP_PSYCHOLOGY' ||
    courseCode === 'AP_PHYSICS_1' ||
    courseCode === 'AP_COMPUTER_SCIENCE_A'
  ) return 'strong_4_to_5';
  if (courseCode === 'AP_SPANISH_LANGUAGE') return 'advanced_language_mastery';
  return 'ap_mastery';
}

function apTopicExecutionBlock({
  courseCode,
  courseTitle,
  unitTitle,
  topicTitle,
  weekA,
  weekB,
  includeLab = false,
  includeWriting = false,
  includeTimed = true,
  includeCheckpoint = true,
  examWeight = null,
}) {
  const unitCode = makeApUnitCode(courseCode, unitTitle);
  const topicCode = makeApTopicCode(courseCode, unitTitle, topicTitle);
  const weeks = spreadWeeks(weekA, weekB, includeCheckpoint ? 5 : 4);
  const phase = apPhaseForWeek(weeks[0]);
  const masteryTarget = inferApMasteryTarget(courseCode);

  const tasks = [
    apTask({
      id: taskId('ap', courseCode, topicCode, 'learn'),
      title: `${courseTitle} — ${unitTitle} — ${topicTitle} — Learn Core Content`,
      templateType: AP_TEMPLATE.LESSON,
      weekNum: weeks[0],
      courseCode,
      unit: unitTitle,
      topic: topicTitle,
      taskType: 'content_learn',
      recommendedSessionMinutes: inferApSessionMinutes(courseCode, 'content_learn'),
      masteryTarget,
      examWeight,
      extra: {
        courseTitle,
        unitCode,
        topicCode,
        phase,
      },
    }),
    apTask({
      id: taskId('ap', courseCode, topicCode, 'practice'),
      title: `${courseTitle} — ${unitTitle} — ${topicTitle} — Guided Practice`,
      templateType: AP_TEMPLATE.LESSON,
      weekNum: weeks[1],
      courseCode,
      unit: unitTitle,
      topic: topicTitle,
      taskType: 'guided_practice',
      recommendedSessionMinutes: inferApSessionMinutes(courseCode, 'guided_practice'),
      masteryTarget,
      examWeight,
      extra: {
        courseTitle,
        unitCode,
        topicCode,
        phase,
      },
    }),
    apTask({
      id: taskId('ap', courseCode, topicCode, includeTimed ? 'timed' : 'review'),
      title: includeTimed
        ? `${courseTitle} — ${unitTitle} — ${topicTitle} — Timed Check`
        : `${courseTitle} — ${unitTitle} — ${topicTitle} — Review`,
      templateType: includeTimed ? AP_TEMPLATE.TIMED : AP_TEMPLATE.REVIEW,
      weekNum: weeks[2],
      courseCode,
      unit: unitTitle,
      topic: topicTitle,
      taskType: includeTimed ? 'timed_check' : 'review',
      recommendedSessionMinutes: inferApSessionMinutes(courseCode, includeTimed ? 'timed_mcq' : 'review'),
      masteryTarget,
      errorLogRequired: includeTimed,
      examWeight,
      extra: {
        courseTitle,
        unitCode,
        topicCode,
        phase,
      },
    }),
    apTask({
      id: taskId('ap', courseCode, topicCode, 'review'),
      title: `${courseTitle} — ${unitTitle} — ${topicTitle} — Error Review`,
      templateType: AP_TEMPLATE.REVIEW,
      weekNum: weeks[3],
      courseCode,
      unit: unitTitle,
      topic: topicTitle,
      taskType: 'error_review',
      recommendedSessionMinutes: inferApSessionMinutes(courseCode, 'review'),
      masteryTarget,
      errorLogRequired: true,
      examWeight,
      extra: {
        courseTitle,
        unitCode,
        topicCode,
        phase,
      },
    }),
  ];

  if (includeCheckpoint) {
    tasks.push(
      apTask({
        id: taskId('ap', courseCode, topicCode, 'checkpoint'),
        title: `${courseTitle} — ${unitTitle} — ${topicTitle} — Mastery Check`,
        templateType: AP_TEMPLATE.CHECKLIST,
        weekNum: weeks[4],
        courseCode,
        unit: unitTitle,
        topic: topicTitle,
        taskType: 'mastery_check',
        recommendedSessionMinutes: 20,
        masteryTarget,
        examWeight,
        extra: {
          courseTitle,
          unitCode,
          topicCode,
          phase,
        },
      })
    );
  }

  if (includeLab) {
    tasks.push(
      apTask({
        id: taskId('ap', courseCode, topicCode, 'lab'),
        title: `${courseTitle} — ${unitTitle} — ${topicTitle} — Lab / Investigation`,
        templateType: AP_TEMPLATE.LAB,
        weekNum: clamp(weeks[2], weekA, weekB),
        courseCode,
        unit: unitTitle,
        topic: topicTitle,
        taskType: 'lab',
        recommendedSessionMinutes: inferApSessionMinutes(courseCode, 'lab'),
        masteryTarget,
        examWeight,
        extra: {
          courseTitle,
          unitCode,
          topicCode,
          phase,
        },
      })
    );
  }

  if (includeWriting) {
    tasks.push(
      apTask({
        id: taskId('ap', courseCode, topicCode, 'writing'),
        title: `${courseTitle} — ${unitTitle} — ${topicTitle} — Explain It Clearly`,
        templateType: AP_TEMPLATE.WRITING,
        weekNum: clamp(weeks[3], weekA, weekB),
        courseCode,
        unit: unitTitle,
        topic: topicTitle,
        taskType: 'written_explanation',
        recommendedSessionMinutes: 20,
        masteryTarget,
        examWeight,
        extra: {
          courseTitle,
          unitCode,
          topicCode,
          phase,
        },
      })
    );
  }

  return tasks;
}

function buildApCourseFromDefinition(def) {
  const tasks = [];
  const courseCode = def.code;
  const courseTitle = def.title;
  const examWeek = apCourseExamWeek(courseCode, def.weekB);

  for (const unit of def.units) {
    const unitSpread = spreadWeeks(unit.weekA, unit.weekB, unit.topics.length);

    unit.topics.forEach((topic, idx) => {
      const centerWeek = unitSpread[idx];
      const topicWeekA = clamp(centerWeek - 1, unit.weekA, unit.weekB);
      const topicWeekB = clamp(centerWeek + 1, unit.weekA, unit.weekB);

      tasks.push(
        ...apTopicExecutionBlock({
          courseCode,
          courseTitle,
          unitTitle: unit.title,
          topicTitle: typeof topic === 'string' ? topic : topic.title,
          weekA: topicWeekA,
          weekB: topicWeekB,
          includeLab: Boolean(def.includeLab || unit.includeLab || (typeof topic === 'object' && topic.includeLab)),
          includeWriting: Boolean(def.includeWriting || unit.includeWriting || (typeof topic === 'object' && topic.includeWriting)),
          includeTimed: typeof topic === 'object' && topic.includeTimed === false ? false : true,
          includeCheckpoint: typeof topic === 'object' && topic.includeCheckpoint === false ? false : true,
          examWeight: typeof topic === 'object' ? topic.examWeight || null : null,
        })
      );
    });

    tasks.push(
      apTask({
        id: taskId('ap', courseCode, makeApUnitCode(courseCode, unit.title), 'unit_review'),
        title: `${courseTitle} — ${unit.title} — Unit Review`,
        templateType: AP_TEMPLATE.REVIEW,
        weekNum: clamp(unit.weekB, unit.weekA, examWeek),
        courseCode,
        unit: unit.title,
        topic: unit.title,
        taskType: 'unit_review',
        recommendedSessionMinutes: 40,
        masteryTarget: inferApMasteryTarget(courseCode),
        errorLogRequired: true,
        extra: {
          courseTitle,
          unitCode: makeApUnitCode(courseCode, unit.title),
          phase: apPhaseForWeek(unit.weekB),
        },
      }),
      apTask({
        id: taskId('ap', courseCode, makeApUnitCode(courseCode, unit.title), 'unit_timed'),
        title: `${courseTitle} — ${unit.title} — Timed Unit Check`,
        templateType: AP_TEMPLATE.TIMED,
        weekNum: clamp(unit.weekB, unit.weekA, examWeek),
        courseCode,
        unit: unit.title,
        topic: unit.title,
        taskType: 'unit_timed_check',
        recommendedSessionMinutes: 45,
        masteryTarget: inferApMasteryTarget(courseCode),
        errorLogRequired: true,
        extra: {
          courseTitle,
          unitCode: makeApUnitCode(courseCode, unit.title),
          phase: apPhaseForWeek(unit.weekB),
        },
      })
    );
  }

  const reviewWeeks = [
    clamp(examWeek - 8, def.weekA, examWeek),
    clamp(examWeek - 5, def.weekA, examWeek),
    clamp(examWeek - 3, def.weekA, examWeek),
    clamp(examWeek - 1, def.weekA, examWeek),
  ];

  reviewWeeks.forEach((weekNum, idx) => {
    tasks.push(
      apTask({
        id: taskId('ap', courseCode, 'spiral', `week_${weekNum}`),
        title:
          idx === reviewWeeks.length - 1
            ? `${courseTitle} — Final Spiral Review`
            : `${courseTitle} — Spiral Review ${idx + 1}`,
        templateType: AP_TEMPLATE.REVIEW,
        weekNum,
        courseCode,
        unit: 'Spiral Review',
        topic: 'Cumulative Review',
        taskType: 'spiral_review',
        recommendedSessionMinutes: 45,
        masteryTarget: inferApMasteryTarget(courseCode),
        errorLogRequired: true,
        extra: {
          courseTitle,
          phase: apPhaseForWeek(weekNum),
        },
      })
    );
  });

  const mockWeeks = [
    clamp(examWeek - 6, def.weekA, examWeek),
    clamp(examWeek - 2, def.weekA, examWeek),
  ];

  mockWeeks.forEach((weekNum, idx) => {
    tasks.push(
      apTask({
        id: taskId('ap', courseCode, 'mock', `week_${weekNum}`),
        title: `${courseTitle} — Full Mock ${idx + 1}`,
        templateType: AP_TEMPLATE.MOCK,
        weekNum,
        courseCode,
        unit: 'Exam Prep',
        topic: 'Full Mock',
        taskType: 'mock_exam',
        recommendedSessionMinutes: inferApSessionMinutes(courseCode, 'mock_exam'),
        masteryTarget: inferApMasteryTarget(courseCode),
        errorLogRequired: true,
        extra: {
          courseTitle,
          phase: apPhaseForWeek(weekNum),
        },
      }),
      apTask({
        id: taskId('ap', courseCode, 'mock_review', `week_${weekNum}`),
        title: `${courseTitle} — Mock ${idx + 1} Postmortem`,
        templateType: AP_TEMPLATE.REVIEW,
        weekNum: clamp(weekNum + 1, def.weekA, examWeek),
        courseCode,
        unit: 'Exam Prep',
        topic: 'Mock Review',
        taskType: 'mock_postmortem',
        recommendedSessionMinutes: 35,
        masteryTarget: inferApMasteryTarget(courseCode),
        errorLogRequired: true,
        extra: {
          courseTitle,
          phase: apPhaseForWeek(weekNum + 1),
        },
      })
    );
  });

  tasks.push(
    apTask({
      id: taskId('ap', courseCode, 'exam_window'),
      title: `${courseTitle} — Official Exam Window / Final Simulation`,
      templateType: AP_TEMPLATE.MOCK,
      weekNum: examWeek,
      courseCode,
      unit: 'Exam Week',
      topic: 'Official Exam Window',
      taskType: 'official_exam_window',
      recommendedSessionMinutes: inferApSessionMinutes(courseCode, 'mock_exam'),
      masteryTarget: inferApMasteryTarget(courseCode),
      errorLogRequired: false,
      extra: {
        courseTitle,
        phase: apPhaseForWeek(examWeek),
      },
    }),
    apTask({
      id: taskId('ap', courseCode, 'archive_reflection'),
      title: `${courseTitle} — Archive Reflection and Lessons Learned`,
      templateType: AP_TEMPLATE.WRITING,
      weekNum: clamp(examWeek + 1, def.weekA, 208),
      courseCode,
      unit: 'Archive',
      topic: 'Reflection',
      taskType: 'archive_reflection',
      recommendedSessionMinutes: 20,
      masteryTarget: inferApMasteryTarget(courseCode),
      extra: {
        courseTitle,
        phase: apPhaseForWeek(examWeek + 1),
      },
    })
  );

  return tasks;
}

const AP_COURSE_DEFS = [
  {
    code: 'AP_PRECALCULUS',
    title: 'AP Precalculus',
    weekA: 92,
    weekB: 117,
    includeWriting: true,
    units: [
      {
        title: 'Functions and Modeling',
        weekA: 92,
        weekB: 98,
        topics: [
          'Function Composition and Transformations',
          'Polynomial and Rational Functions',
          'Exponential and Logarithmic Models',
          'Inverse Functions and Structural Interpretation',
        ],
      },
      {
        title: 'Trigonometric and Periodic Phenomena',
        weekA: 99,
        weekB: 105,
        topics: [
          'Unit Circle and Angle Measure',
          'Graphs of Sine and Cosine',
          'Trigonometric Modeling',
          'Trig Identities and Equations Intro',
        ],
      },
      {
        title: 'Parametric, Polar, and Vectors',
        weekA: 106,
        weekB: 112,
        topics: [
          'Parametric Representations',
          'Polar Coordinates and Graphs',
          'Vectors and Vector Operations',
          'Complex Numbers in Polar Form',
        ],
      },
      {
        title: 'Review and AP Style Practice',
        weekA: 113,
        weekB: 117,
        topics: [
          'FRQ Style Modeling',
          'Mixed MCQ Practice',
          'Cumulative Function Analysis',
        ],
      },
    ],
  },
  {
    code: 'AP_ENVIRONMENTAL_SCIENCE',
    title: 'AP Environmental Science',
    weekA: 105,
    weekB: 130,
    includeLab: true,
    includeWriting: true,
    units: [
      {
        title: 'Earth Systems and Ecosystems',
        weekA: 105,
        weekB: 112,
        topics: [
          'Biogeochemical Cycles',
          'Energy Flow and Primary Productivity',
          'Population Dynamics and Carrying Capacity',
          'Biodiversity and Ecosystem Resilience',
        ],
      },
      {
        title: 'Land and Water Use',
        weekA: 113,
        weekB: 120,
        topics: [
          'Agriculture and Soil Systems',
          'Forestry and Rangelands',
          'Freshwater Resources',
          'Mining, Fishing, and Human Extraction',
        ],
      },
      {
        title: 'Pollution and Global Change',
        weekA: 121,
        weekB: 130,
        topics: [
          'Air and Water Pollution',
          'Solid Waste and Toxicology',
          'Climate Change and Energy Resources',
          'Policy, Mitigation, and FRQ Analysis',
        ],
      },
    ],
  },
  {
    code: 'AP_HUMAN_GEOGRAPHY',
    title: 'AP Human Geography',
    weekA: 118,
    weekB: 143,
    includeWriting: true,
    units: [
      {
        title: 'Thinking Geographically',
        weekA: 118,
        weekB: 124,
        topics: [
          'Maps, Scale, and Spatial Analysis',
          'Population and Migration',
          'Cultural Patterns and Diffusion',
        ],
      },
      {
        title: 'Political and Economic Geography',
        weekA: 125,
        weekB: 133,
        topics: [
          'Political Organization of Space',
          'Agriculture and Rural Land Use',
          'Industrialization and Economic Development',
        ],
      },
      {
        title: 'Cities and AP Exam Skills',
        weekA: 134,
        weekB: 143,
        topics: [
          'Urban Geography and Models',
          'Geographic Data Interpretation',
          'FRQ Writing and Evidence Use',
        ],
      },
    ],
  },
  {
    code: 'AP_PSYCHOLOGY',
    title: 'AP Psychology',
    weekA: 131,
    weekB: 156,
    includeWriting: true,
    units: [
      {
        title: 'Foundations of Psychology',
        weekA: 131,
        weekB: 137,
        topics: [
          'History, Perspectives, and Research Methods',
          'Biological Bases of Behavior',
          'Sensation and Perception',
        ],
      },
      {
        title: 'Cognition and Development',
        weekA: 138,
        weekB: 145,
        topics: [
          'Learning',
          'Memory',
          'Cognition, Language, and Intelligence',
          'Developmental Psychology',
        ],
      },
      {
        title: 'Personality and Social Psychology',
        weekA: 146,
        weekB: 156,
        topics: [
          'Motivation, Emotion, and Stress',
          'Personality',
          'Psychological Disorders and Treatment',
          'Social Psychology and FRQ Application',
        ],
      },
    ],
  },
  {
    code: 'AP_PHYSICS_1',
    title: 'AP Physics 1',
    weekA: 105,
    weekB: 156,
    includeLab: true,
    includeWriting: true,
    units: [
      {
        title: 'Kinematics and Dynamics',
        weekA: 105,
        weekB: 118,
        topics: [
          'One-Dimensional Motion',
          'Two-Dimensional Motion and Vectors',
          'Newton’s Laws and Free-Body Diagrams',
          'Forces, Friction, and Circular Motion',
        ],
      },
      {
        title: 'Energy and Momentum',
        weekA: 119,
        weekB: 132,
        topics: [
          'Work, Energy, and Power',
          'Momentum and Impulse',
          'Collisions and Conservation Laws',
        ],
      },
      {
        title: 'Rotation and Oscillations',
        weekA: 133,
        weekB: 145,
        topics: [
          'Torque and Rotational Dynamics',
          'Angular Momentum',
          'Simple Harmonic Motion',
        ],
      },
      {
        title: 'Waves and Circuits',
        weekA: 146,
        weekB: 156,
        topics: [
          'Mechanical Waves and Sound',
          'Basic Circuits and Electric Interactions',
          'Experimental Design and AP Physics Reasoning',
        ],
      },
    ],
  },
  {
    code: 'AP_CALCULUS_BC',
    title: 'AP Calculus BC',
    weekA: 157,
    weekB: 184,
    includeWriting: true,
    units: [
      {
        title: 'Limits and Derivatives',
        weekA: 157,
        weekB: 164,
        topics: [
          'Limit Laws and Continuity',
          'Derivative Definition and Basic Rules',
          'Chain, Product, and Quotient Rules',
          'Implicit Differentiation and Related Rates',
        ],
      },
      {
        title: 'Applications and Integrals',
        weekA: 165,
        weekB: 172,
        topics: [
          'Optimization and Motion',
          'Riemann Sums and Antiderivatives',
          'Definite Integrals and the FTC',
          'Differential Equations and Slope Fields',
        ],
      },
      {
        title: 'BC Extensions',
        weekA: 173,
        weekB: 180,
        topics: [
          'Integration Techniques',
          'Parametric, Polar, and Vector-Valued Functions',
          'Series and Convergence',
          'Taylor and Maclaurin Series',
        ],
      },
      {
        title: 'Exam Practice',
        weekA: 181,
        weekB: 184,
        topics: [
          'MCQ Mixed Set',
          'FRQ Mixed Set',
          'Error Compression and Formula Recall',
        ],
      },
    ],
  },
  {
    code: 'AP_BIOLOGY',
    title: 'AP Biology',
    weekA: 157,
    weekB: 184,
    includeLab: true,
    includeWriting: true,
    units: [
      {
        title: 'Chemistry of Life and Cells',
        weekA: 157,
        weekB: 164,
        topics: [
          'Water, Macromolecules, and Structure',
          'Cell Structure and Membranes',
          'Cellular Energetics',
        ],
      },
      {
        title: 'Genetics and Information Flow',
        weekA: 165,
        weekB: 172,
        topics: [
          'Cell Communication and Cell Cycle',
          'Heredity',
          'Gene Expression and Regulation',
          'Biotechnology',
        ],
      },
      {
        title: 'Evolution and Ecology',
        weekA: 173,
        weekB: 180,
        topics: [
          'Natural Selection',
          'Population Genetics',
          'Ecology and Energy Dynamics',
          'Responses to the Environment',
        ],
      },
      {
        title: 'Exam Practice',
        weekA: 181,
        weekB: 184,
        topics: [
          'Data-Based FRQ Practice',
          'Experimental Design and Graph Analysis',
          'Cumulative MCQ Review',
        ],
      },
    ],
  },
  {
    code: 'AP_CHEMISTRY',
    title: 'AP Chemistry',
    weekA: 157,
    weekB: 184,
    includeLab: true,
    includeWriting: true,
    units: [
      {
        title: 'Atomic Structure and Bonding',
        weekA: 157,
        weekB: 164,
        topics: [
          'Moles, Compounds, and Atomic Models',
          'Periodic Trends',
          'Bonding and Intermolecular Forces',
        ],
      },
      {
        title: 'Reactions and Thermodynamics',
        weekA: 165,
        weekB: 172,
        topics: [
          'Stoichiometry and Solution Chemistry',
          'Thermochemistry',
          'Kinetics',
        ],
      },
      {
        title: 'Equilibrium and Electrochemistry',
        weekA: 173,
        weekB: 180,
        topics: [
          'Equilibrium',
          'Acids and Bases',
          'Entropy, Free Energy, and Electrochemistry',
        ],
      },
      {
        title: 'Exam Practice',
        weekA: 181,
        weekB: 184,
        topics: [
          'Quantitative FRQ Practice',
          'Lab-Based Reasoning',
          'Cumulative MCQ Review',
        ],
      },
    ],
  },
  {
    code: 'AP_STATISTICS',
    title: 'AP Statistics',
    weekA: 157,
    weekB: 184,
    includeWriting: true,
    units: [
      {
        title: 'Exploring Data',
        weekA: 157,
        weekB: 164,
        topics: [
          'Displaying Distributions',
          'Summary Statistics',
          'Scatterplots and Regression',
        ],
      },
      {
        title: 'Probability and Sampling',
        weekA: 165,
        weekB: 172,
        topics: [
          'Probability Rules',
          'Random Variables and Distributions',
          'Sampling and Experimental Design',
        ],
      },
      {
        title: 'Inference',
        weekA: 173,
        weekB: 180,
        topics: [
          'Confidence Intervals',
          'Significance Tests',
          'Inference for Means, Proportions, and Regression',
        ],
      },
      {
        title: 'Exam Practice',
        weekA: 181,
        weekB: 184,
        topics: [
          'FRQ Interpretation Practice',
          'Investigative Task Style Practice',
          'Cumulative MCQ Review',
        ],
      },
    ],
  },
  {
    code: 'AP_COMPUTER_SCIENCE_A',
    title: 'AP Computer Science A',
    weekA: 157,
    weekB: 184,
    includeWriting: true,
    units: [
      {
        title: 'Java Foundations',
        weekA: 157,
        weekB: 164,
        topics: [
          'Variables, Control Flow, and Methods',
          'Objects and Classes',
          'Booleans and Conditionals',
        ],
      },
      {
        title: 'Core Data Structures',
        weekA: 165,
        weekB: 172,
        topics: [
          'Iteration',
          'Arrays and ArrayLists',
          '2D Arrays',
        ],
      },
      {
        title: 'Design and Analysis',
        weekA: 173,
        weekB: 180,
        topics: [
          'Inheritance and Polymorphism',
          'Recursion',
          'Algorithm Analysis and Debugging',
        ],
      },
      {
        title: 'Exam Practice',
        weekA: 181,
        weekB: 184,
        topics: [
          'FRQ Style Coding Prompts',
          'Code Tracing and Error Analysis',
          'Cumulative MCQ Review',
        ],
      },
    ],
  },
  {
    code: 'AP_PHYSICS_C_MECHANICS',
    title: 'AP Physics C: Mechanics',
    weekA: 157,
    weekB: 184,
    includeLab: true,
    includeWriting: true,
    units: [
      {
        title: 'Kinematics and Newtonian Mechanics',
        weekA: 157,
        weekB: 166,
        topics: [
          'Advanced Kinematics',
          'Newton’s Laws with Calculus',
          'Work, Energy, and Power',
        ],
      },
      {
        title: 'Momentum and Rotation',
        weekA: 167,
        weekB: 175,
        topics: [
          'Linear Momentum and Collisions',
          'Rotational Kinematics and Dynamics',
          'Angular Momentum',
        ],
      },
      {
        title: 'Oscillations, Gravitation, and FRQs',
        weekA: 176,
        weekB: 184,
        topics: [
          'Simple Harmonic Motion',
          'Gravitation',
          'Mechanics FRQ Practice',
        ],
      },
    ],
  },
  {
    code: 'AP_PHYSICS_C_E_AND_M',
    title: 'AP Physics C: Electricity and Magnetism',
    weekA: 185,
    weekB: 195,
    includeLab: true,
    includeWriting: true,
    units: [
      {
        title: 'Electrostatics and Conductors',
        weekA: 185,
        weekB: 188,
        topics: [
          'Electric Charge, Field, and Potential',
          'Gauss’s Law and Symmetry',
        ],
      },
      {
        title: 'Circuits and Magnetism',
        weekA: 189,
        weekB: 192,
        topics: [
          'Capacitance and RC Behavior',
          'Current, Resistance, and Circuits',
          'Magnetic Fields and Forces',
        ],
      },
      {
        title: 'Induction and Final Review',
        weekA: 193,
        weekB: 195,
        topics: [
          'Electromagnetic Induction',
          'Maxwell-Flavored Connections and FRQs',
        ],
      },
    ],
  },
];

function generateAllApCourseTasks() {
  return AP_COURSE_DEFS.flatMap(buildApCourseFromDefinition);
}

function generateApCrossCourseTasks() {
  const specs = [
    {
      weekNum: 104,
      id: 'ap_preview_gate',
      title: 'AP Transition Gate — Preview Phase Becomes Real Coursework',
      type: 'transition_gate',
    },
    {
      weekNum: 156,
      id: 'ap_mid_program_archive',
      title: 'AP Mid-Program Archive — Early AP Courses Closed and Lessons Captured',
      type: 'archive',
    },
    {
      weekNum: 184,
      id: 'ap_peak_exam_cluster',
      title: 'AP Peak Cluster — Major STEM AP Exams Complete',
      type: 'milestone',
    },
      {
      weekNum: 195,
      id: 'ap_physics_c_em_complete',
      title: 'AP Physics C E&M Complete — Final STEM AP Sequence Closed',
      type: 'milestone',
    },
    {
      weekNum: 208,
      id: 'ap_program_complete',
      title: 'AP Program Complete — Archive Mastery and Transition Forward',
      type: 'transition_gate',
    },
  ];

  return specs.map(spec =>
    apTask({
      id: spec.id,
      title: spec.title,
      templateType:
        spec.type === 'milestone'
          ? AP_TEMPLATE.REVIEW
          : AP_TEMPLATE.CHECKLIST,
      weekNum: spec.weekNum,
      courseCode: 'AP_PROGRAM',
      unit: 'Program-Level',
      topic: spec.type,
      taskType: spec.type,
      recommendedSessionMinutes: 20,
      masteryTarget: 'program_complete',
      extra: {
        phase: apPhaseForWeek(spec.weekNum),
      },
    })
  );
}

AP_TASKS.push(
  ...generateAllApCourseTasks(),
  ...generateApCrossCourseTasks()
);

// ───────────────────────────────────────────────────────────────────────────────
// PART 10 — AP COURSE-SPECIFIC OVERLAYS, CAPSTONES, FRQ/MCQ CADENCE
// ───────────────────────────────────────────────────────────────────────────────

function generateApPrecalculusOverlayTasks() {
  const specs = [
    { weekNum: 96, title: 'AP Precalculus — Function Family Comparison Sprint', type: 'concept_sprint' },
    { weekNum: 101, title: 'AP Precalculus — Trigonometric Modeling FRQ', type: 'timed_frq' },
    { weekNum: 107, title: 'AP Precalculus — Polar / Parametric Mixed Set', type: 'mixed_set' },
    { weekNum: 112, title: 'AP Precalculus — Explain a Model from Multiple Representations', type: 'writing' },
    { weekNum: 116, title: 'AP Precalculus — Final Formula Compression and Error Log Review', type: 'taper' },
    { weekNum: 117, title: 'AP Precalculus — Exam Week Checklist', type: 'exam_week' },
  ];

  return specs.map(spec =>
    apTask({
      id: taskId('ap_precalculus_overlay', `week_${spec.weekNum}`, spec.type),
      title: spec.title,
      templateType:
        spec.type === 'timed_frq'
          ? AP_TEMPLATE.TIMED
          : spec.type === 'writing'
            ? AP_TEMPLATE.WRITING
            : spec.type === 'exam_week'
              ? AP_TEMPLATE.CHECKLIST
              : AP_TEMPLATE.REVIEW,
      weekNum: spec.weekNum,
      courseCode: 'AP_PRECALCULUS',
      unit: 'Overlay',
      topic: spec.type,
      taskType: spec.type,
      recommendedSessionMinutes:
        spec.type === 'timed_frq' ? 45 : spec.type === 'writing' ? 20 : 30,
      masteryTarget: 'strong_4_to_5',
      errorLogRequired: spec.type === 'taper',
      extra: {
        courseTitle: 'AP Precalculus',
        phase: apPhaseForWeek(spec.weekNum),
      },
    })
  );
}

function generateApEnvironmentalScienceOverlayTasks() {
  const specs = [
    { weekNum: 110, title: 'AP Environmental Science — Data and Graph Interpretation Drill', type: 'timed_frq' },
    { weekNum: 116, title: 'AP Environmental Science — Policy Tradeoff Writing Drill', type: 'writing' },
    { weekNum: 122, title: 'AP Environmental Science — Lab Design and Variable Control Review', type: 'lab_skill' },
    { weekNum: 127, title: 'AP Environmental Science — Mixed FRQ Set', type: 'timed_frq' },
    { weekNum: 129, title: 'AP Environmental Science — Final Review Compression', type: 'taper' },
    { weekNum: 130, title: 'AP Environmental Science — Exam Week Checklist', type: 'exam_week' },
  ];

  return specs.map(spec =>
    apTask({
      id: taskId('ap_environmental_science_overlay', `week_${spec.weekNum}`, spec.type),
      title: spec.title,
      templateType:
        spec.type === 'timed_frq'
          ? AP_TEMPLATE.TIMED
          : spec.type === 'writing'
            ? AP_TEMPLATE.WRITING
            : spec.type === 'exam_week'
              ? AP_TEMPLATE.CHECKLIST
              : spec.type === 'lab_skill'
                ? AP_TEMPLATE.LAB
                : AP_TEMPLATE.REVIEW,
      weekNum: spec.weekNum,
      courseCode: 'AP_ENVIRONMENTAL_SCIENCE',
      unit: 'Overlay',
      topic: spec.type,
      taskType: spec.type,
      recommendedSessionMinutes:
        spec.type === 'timed_frq' ? 45 : spec.type === 'lab_skill' ? 40 : 25,
      masteryTarget: 'strong_4_to_5',
      errorLogRequired: spec.type === 'taper',
      extra: {
        courseTitle: 'AP Environmental Science',
        phase: apPhaseForWeek(spec.weekNum),
      },
    })
  );
}

function generateApHumanGeographyOverlayTasks() {
  const specs = [
    { weekNum: 121, title: 'AP Human Geography — Map Interpretation Sprint', type: 'timed_mcq' },
    { weekNum: 126, title: 'AP Human Geography — FRQ Evidence and Vocabulary Drill', type: 'timed_frq' },
    { weekNum: 132, title: 'AP Human Geography — Explain a Real-World Spatial Pattern', type: 'writing' },
    { weekNum: 139, title: 'AP Human Geography — Cumulative Models Review', type: 'mixed_set' },
    { weekNum: 142, title: 'AP Human Geography — Final Review Compression', type: 'taper' },
    { weekNum: 143, title: 'AP Human Geography — Exam Week Checklist', type: 'exam_week' },
  ];

  return specs.map(spec =>
    apTask({
      id: taskId('ap_human_geography_overlay', `week_${spec.weekNum}`, spec.type),
      title: spec.title,
      templateType:
        spec.type === 'writing'
          ? AP_TEMPLATE.WRITING
          : spec.type === 'exam_week'
            ? AP_TEMPLATE.CHECKLIST
            : spec.type === 'timed_frq' || spec.type === 'timed_mcq'
              ? AP_TEMPLATE.TIMED
              : AP_TEMPLATE.REVIEW,
      weekNum: spec.weekNum,
      courseCode: 'AP_HUMAN_GEOGRAPHY',
      unit: 'Overlay',
      topic: spec.type,
      taskType: spec.type,
      recommendedSessionMinutes:
        spec.type === 'writing' ? 20 : spec.type.startsWith('timed') ? 40 : 30,
      masteryTarget: 'strong_4_to_5',
      errorLogRequired: spec.type === 'taper',
      extra: {
        courseTitle: 'AP Human Geography',
        phase: apPhaseForWeek(spec.weekNum),
      },
    })
  );
}

function generateApPsychologyOverlayTasks() {
  const specs = [
    { weekNum: 134, title: 'AP Psychology — Research Methods and Experimental Design Drill', type: 'timed_frq' },
    { weekNum: 140, title: 'AP Psychology — Application of Terms to Scenarios Sprint', type: 'timed_mcq' },
    { weekNum: 146, title: 'AP Psychology — Explain a Memory / Learning Mechanism Clearly', type: 'writing' },
    { weekNum: 151, title: 'AP Psychology — Cumulative Terms and Theories Review', type: 'mixed_set' },
    { weekNum: 155, title: 'AP Psychology — Final Review Compression', type: 'taper' },
    { weekNum: 156, title: 'AP Psychology — Exam Week Checklist', type: 'exam_week' },
  ];

  return specs.map(spec =>
    apTask({
      id: taskId('ap_psychology_overlay', `week_${spec.weekNum}`, spec.type),
      title: spec.title,
      templateType:
        spec.type === 'writing'
          ? AP_TEMPLATE.WRITING
          : spec.type === 'exam_week'
            ? AP_TEMPLATE.CHECKLIST
            : spec.type === 'timed_frq' || spec.type === 'timed_mcq'
              ? AP_TEMPLATE.TIMED
              : AP_TEMPLATE.REVIEW,
      weekNum: spec.weekNum,
      courseCode: 'AP_PSYCHOLOGY',
      unit: 'Overlay',
      topic: spec.type,
      taskType: spec.type,
      recommendedSessionMinutes:
        spec.type === 'writing' ? 20 : spec.type.startsWith('timed') ? 40 : 30,
      masteryTarget: 'strong_4_to_5',
      errorLogRequired: spec.type === 'taper',
      extra: {
        courseTitle: 'AP Psychology',
        phase: apPhaseForWeek(spec.weekNum),
      },
    })
  );
}

function generateApPhysics1OverlayTasks() {
  const specs = [
    { weekNum: 112, title: 'AP Physics 1 — Motion Graphs and Representations Drill', type: 'timed_frq' },
    { weekNum: 120, title: 'AP Physics 1 — Energy / Momentum Qualitative Reasoning Set', type: 'mixed_set' },
    { weekNum: 128, title: 'AP Physics 1 — Experimental Design and Uncertainty Review', type: 'lab_skill' },
    { weekNum: 136, title: 'AP Physics 1 — Rotation and SHM FRQ', type: 'timed_frq' },
    { weekNum: 144, title: 'AP Physics 1 — Waves and Circuits Concept Compression', type: 'writing' },
    { weekNum: 152, title: 'AP Physics 1 — Full Cumulative FRQ Set', type: 'timed_frq' },
    { weekNum: 155, title: 'AP Physics 1 — Final Error Log Compression', type: 'taper' },
    { weekNum: 156, title: 'AP Physics 1 — Exam Week Checklist', type: 'exam_week' },
  ];

  return specs.map(spec =>
    apTask({
      id: taskId('ap_physics_1_overlay', `week_${spec.weekNum}`, spec.type),
      title: spec.title,
      templateType:
        spec.type === 'writing'
          ? AP_TEMPLATE.WRITING
          : spec.type === 'lab_skill'
            ? AP_TEMPLATE.LAB
            : spec.type === 'exam_week'
              ? AP_TEMPLATE.CHECKLIST
              : spec.type === 'timed_frq'
                ? AP_TEMPLATE.TIMED
                : AP_TEMPLATE.REVIEW,
      weekNum: spec.weekNum,
      courseCode: 'AP_PHYSICS_1',
      unit: 'Overlay',
      topic: spec.type,
      taskType: spec.type,
      recommendedSessionMinutes:
        spec.type === 'lab_skill' ? 45 :
        spec.type === 'timed_frq' ? 50 :
        spec.type === 'writing' ? 20 : 30,
      masteryTarget: 'strong_4_to_5',
      errorLogRequired: spec.type === 'taper',
      extra: {
        courseTitle: 'AP Physics 1',
        phase: apPhaseForWeek(spec.weekNum),
      },
    })
  );
}

function generateApCalculusBcOverlayTasks() {
  const specs = [
    { weekNum: 160, title: 'AP Calculus BC — Derivative Technique Compression Sprint', type: 'timed_mcq' },
    { weekNum: 166, title: 'AP Calculus BC — Related Rates and Optimization FRQ', type: 'timed_frq' },
    { weekNum: 171, title: 'AP Calculus BC — FTC and Differential Equations Interpretation', type: 'writing' },
    { weekNum: 176, title: 'AP Calculus BC — Parametric / Polar FRQ', type: 'timed_frq' },
    { weekNum: 179, title: 'AP Calculus BC — Series and Taylor Polynomial Compression', type: 'mixed_set' },
    { weekNum: 182, title: 'AP Calculus BC — Full Cumulative FRQ Set', type: 'timed_frq' },
    { weekNum: 183, title: 'AP Calculus BC — Final Formula / Error Compression', type: 'taper' },
    { weekNum: 184, title: 'AP Calculus BC — Exam Week Checklist', type: 'exam_week' },
  ];

  return specs.map(spec =>
    apTask({
      id: taskId('ap_calculus_bc_overlay', `week_${spec.weekNum}`, spec.type),
      title: spec.title,
      templateType:
        spec.type === 'writing'
          ? AP_TEMPLATE.WRITING
          : spec.type === 'exam_week'
            ? AP_TEMPLATE.CHECKLIST
            : spec.type === 'timed_frq' || spec.type === 'timed_mcq'
              ? AP_TEMPLATE.TIMED
              : AP_TEMPLATE.REVIEW,
      weekNum: spec.weekNum,
      courseCode: 'AP_CALCULUS_BC',
      unit: 'Overlay',
      topic: spec.type,
      taskType: spec.type,
      recommendedSessionMinutes:
        spec.type === 'writing' ? 20 :
        spec.type.startsWith('timed') ? 50 : 30,
      masteryTarget: 'ap_5_level',
      errorLogRequired: spec.type === 'taper',
      extra: {
        courseTitle: 'AP Calculus BC',
        phase: apPhaseForWeek(spec.weekNum),
      },
    })
  );
}

function generateApBiologyOverlayTasks() {
  const specs = [
    { weekNum: 160, title: 'AP Biology — Experimental Design and Data Interpretation Drill', type: 'lab_skill' },
    { weekNum: 166, title: 'AP Biology — Cellular Energetics FRQ', type: 'timed_frq' },
    { weekNum: 171, title: 'AP Biology — Genetics and Gene Expression Concept Compression', type: 'mixed_set' },
    { weekNum: 176, title: 'AP Biology — Evolution / Ecology FRQ', type: 'timed_frq' },
    { weekNum: 180, title: 'AP Biology — Explain a Biological Process Across Scales', type: 'writing' },
    { weekNum: 182, title: 'AP Biology — Full Cumulative FRQ Set', type: 'timed_frq' },
    { weekNum: 183, title: 'AP Biology — Final Error Log Compression', type: 'taper' },
    { weekNum: 184, title: 'AP Biology — Exam Week Checklist', type: 'exam_week' },
  ];

  return specs.map(spec =>
    apTask({
      id: taskId('ap_biology_overlay', `week_${spec.weekNum}`, spec.type),
      title: spec.title,
      templateType:
        spec.type === 'lab_skill'
          ? AP_TEMPLATE.LAB
          : spec.type === 'writing'
            ? AP_TEMPLATE.WRITING
            : spec.type === 'exam_week'
              ? AP_TEMPLATE.CHECKLIST
              : spec.type === 'timed_frq'
                ? AP_TEMPLATE.TIMED
                : AP_TEMPLATE.REVIEW,
      weekNum: spec.weekNum,
      courseCode: 'AP_BIOLOGY',
      unit: 'Overlay',
      topic: spec.type,
      taskType: spec.type,
      recommendedSessionMinutes:
        spec.type === 'lab_skill' ? 45 :
        spec.type === 'writing' ? 20 :
        spec.type === 'timed_frq' ? 50 : 30,
      masteryTarget: 'ap_5_level',
      errorLogRequired: spec.type === 'taper',
      extra: {
        courseTitle: 'AP Biology',
        phase: apPhaseForWeek(spec.weekNum),
      },
    })
  );
}

function generateApChemistryOverlayTasks() {
  const specs = [
    { weekNum: 160, title: 'AP Chemistry — Stoichiometry and Solution Setup Compression', type: 'timed_mcq' },
    { weekNum: 166, title: 'AP Chemistry — Thermochemistry / Kinetics FRQ', type: 'timed_frq' },
    { weekNum: 171, title: 'AP Chemistry — Lab Reasoning and Experimental Design Review', type: 'lab_skill' },
    { weekNum: 176, title: 'AP Chemistry — Equilibrium / Acids-Bases FRQ', type: 'timed_frq' },
    { weekNum: 180, title: 'AP Chemistry — Explain a Chemical System with Multiple Representations', type: 'writing' },
    { weekNum: 182, title: 'AP Chemistry — Full Cumulative FRQ Set', type: 'timed_frq' },
    { weekNum: 183, title: 'AP Chemistry — Final Equation Sheet / Error Compression', type: 'taper' },
    { weekNum: 184, title: 'AP Chemistry — Exam Week Checklist', type: 'exam_week' },
  ];

  return specs.map(spec =>
    apTask({
      id: taskId('ap_chemistry_overlay', `week_${spec.weekNum}`, spec.type),
      title: spec.title,
      templateType:
        spec.type === 'lab_skill'
          ? AP_TEMPLATE.LAB
          : spec.type === 'writing'
            ? AP_TEMPLATE.WRITING
            : spec.type === 'exam_week'
              ? AP_TEMPLATE.CHECKLIST
              : spec.type === 'timed_frq' || spec.type === 'timed_mcq'
                ? AP_TEMPLATE.TIMED
                : AP_TEMPLATE.REVIEW,
      weekNum: spec.weekNum,
      courseCode: 'AP_CHEMISTRY',
      unit: 'Overlay',
      topic: spec.type,
      taskType: spec.type,
      recommendedSessionMinutes:
        spec.type === 'lab_skill' ? 50 :
        spec.type === 'writing' ? 20 :
        spec.type.startsWith('timed') ? 50 : 30,
      masteryTarget: 'ap_5_level',
      errorLogRequired: spec.type === 'taper',
      extra: {
        courseTitle: 'AP Chemistry',
        phase: apPhaseForWeek(spec.weekNum),
      },
    })
  );
}

function generateApStatisticsOverlayTasks() {
  const specs = [
    { weekNum: 160, title: 'AP Statistics — Distribution and Sampling Compression', type: 'timed_mcq' },
    { weekNum: 166, title: 'AP Statistics — Confidence Interval FRQ', type: 'timed_frq' },
    { weekNum: 171, title: 'AP Statistics — Explain Inference Logic in Plain Language', type: 'writing' },
    { weekNum: 176, title: 'AP Statistics — Significance Testing FRQ', type: 'timed_frq' },
    { weekNum: 180, title: 'AP Statistics — Investigative Task Structure Review', type: 'mixed_set' },
    { weekNum: 182, title: 'AP Statistics — Full Cumulative FRQ Set', type: 'timed_frq' },
    { weekNum: 183, title: 'AP Statistics — Final Error Compression', type: 'taper' },
    { weekNum: 184, title: 'AP Statistics — Exam Week Checklist', type: 'exam_week' },
  ];

  return specs.map(spec =>
    apTask({
      id: taskId('ap_statistics_overlay', `week_${spec.weekNum}`, spec.type),
      title: spec.title,
      templateType:
        spec.type === 'writing'
          ? AP_TEMPLATE.WRITING
          : spec.type === 'exam_week'
            ? AP_TEMPLATE.CHECKLIST
            : spec.type === 'timed_frq' || spec.type === 'timed_mcq'
              ? AP_TEMPLATE.TIMED
              : AP_TEMPLATE.REVIEW,
      weekNum: spec.weekNum,
      courseCode: 'AP_STATISTICS',
      unit: 'Overlay',
      topic: spec.type,
      taskType: spec.type,
      recommendedSessionMinutes:
        spec.type === 'writing' ? 20 :
        spec.type.startsWith('timed') ? 45 : 30,
      masteryTarget: 'ap_5_level',
      errorLogRequired: spec.type === 'taper',
      extra: {
        courseTitle: 'AP Statistics',
        phase: apPhaseForWeek(spec.weekNum),
      },
    })
  );
}

function generateApCsaOverlayTasks() {
  const specs = [
    { weekNum: 160, title: 'AP CSA — Code Tracing Compression Sprint', type: 'timed_mcq' },
    { weekNum: 166, title: 'AP CSA — Methods and Classes FRQ', type: 'timed_frq' },
    { weekNum: 171, title: 'AP CSA — Arrays / ArrayLists FRQ', type: 'timed_frq' },
    { weekNum: 176, title: 'AP CSA — Inheritance and Recursion Explanation Drill', type: 'writing' },
    { weekNum: 180, title: 'AP CSA — Debugging and Runtime Behavior Mixed Set', type: 'coding_lab' },
    { weekNum: 182, title: 'AP CSA — Full Cumulative FRQ Set', type: 'timed_frq' },
    { weekNum: 183, title: 'AP CSA — Final Error Compression', type: 'taper' },
    { weekNum: 184, title: 'AP CSA — Exam Week Checklist', type: 'exam_week' },
  ];

  return specs.map(spec =>
    apTask({
      id: taskId('ap_csa_overlay', `week_${spec.weekNum}`, spec.type),
      title: spec.title,
      templateType:
        spec.type === 'writing'
          ? AP_TEMPLATE.WRITING
          : spec.type === 'exam_week'
            ? AP_TEMPLATE.CHECKLIST
            : spec.type === 'coding_lab'
              ? AP_TEMPLATE.LAB
              : spec.type === 'timed_frq' || spec.type === 'timed_mcq'
                ? AP_TEMPLATE.TIMED
                : AP_TEMPLATE.REVIEW,
      weekNum: spec.weekNum,
      courseCode: 'AP_COMPUTER_SCIENCE_A',
      unit: 'Overlay',
      topic: spec.type,
      taskType: spec.type,
      recommendedSessionMinutes:
        spec.type === 'coding_lab' ? 50 :
        spec.type === 'writing' ? 20 :
        spec.type.startsWith('timed') ? 45 : 30,
      masteryTarget: 'ap_5_level',
      errorLogRequired: spec.type === 'taper',
      extra: {
        courseTitle: 'AP Computer Science A',
        phase: apPhaseForWeek(spec.weekNum),
      },
    })
  );
}

function generateApPhysicsCMechanicsOverlayTasks() {
  const specs = [
    { weekNum: 162, title: 'AP Physics C: Mechanics — Calculus-Based Kinematics Compression', type: 'timed_frq' },
    { weekNum: 168, title: 'AP Physics C: Mechanics — Energy / Momentum FRQ', type: 'timed_frq' },
    { weekNum: 173, title: 'AP Physics C: Mechanics — Rotation and Angular Momentum FRQ', type: 'timed_frq' },
    { weekNum: 178, title: 'AP Physics C: Mechanics — Experimental Design and Modeling Review', type: 'lab_skill' },
    { weekNum: 181, title: 'AP Physics C: Mechanics — Explain a Full Mechanics Chain of Reasoning', type: 'writing' },
    { weekNum: 183, title: 'AP Physics C: Mechanics — Final Error Compression', type: 'taper' },
    { weekNum: 184, title: 'AP Physics C: Mechanics — Exam Week Checklist', type: 'exam_week' },
  ];

  return specs.map(spec =>
    apTask({
      id: taskId('ap_physics_c_mechanics_overlay', `week_${spec.weekNum}`, spec.type),
      title: spec.title,
      templateType:
        spec.type === 'lab_skill'
          ? AP_TEMPLATE.LAB
          : spec.type === 'writing'
            ? AP_TEMPLATE.WRITING
            : spec.type === 'exam_week'
              ? AP_TEMPLATE.CHECKLIST
              : spec.type === 'timed_frq'
                ? AP_TEMPLATE.TIMED
                : AP_TEMPLATE.REVIEW,
      weekNum: spec.weekNum,
      courseCode: 'AP_PHYSICS_C_MECHANICS',
      unit: 'Overlay',
      topic: spec.type,
      taskType: spec.type,
      recommendedSessionMinutes:
        spec.type === 'lab_skill' ? 50 :
        spec.type === 'writing' ? 20 :
        spec.type === 'timed_frq' ? 50 : 30,
      masteryTarget: 'ap_5_level',
      errorLogRequired: spec.type === 'taper',
      extra: {
        courseTitle: 'AP Physics C: Mechanics',
        phase: apPhaseForWeek(spec.weekNum),
      },
    })
  );
}

function generateApPhysicsCEmOverlayTasks() {
  const specs = [
    { weekNum: 187, title: 'AP Physics C: E&M — Electrostatics and Potential Compression', type: 'timed_frq' },
    { weekNum: 190, title: 'AP Physics C: E&M — Gauss / Circuits FRQ', type: 'timed_frq' },
    { weekNum: 192, title: 'AP Physics C: E&M — Magnetic Force and Induction Mixed Set', type: 'mixed_set' },
    { weekNum: 193, title: 'AP Physics C: E&M — Explain a Field-Based System Clearly', type: 'writing' },
    { weekNum: 194, title: 'AP Physics C: E&M — Final Error Compression', type: 'taper' },
    { weekNum: 195, title: 'AP Physics C: E&M — Exam Week Checklist', type: 'exam_week' },
  ];

  return specs.map(spec =>
    apTask({
      id: taskId('ap_physics_c_em_overlay', `week_${spec.weekNum}`, spec.type),
      title: spec.title,
      templateType:
        spec.type === 'writing'
          ? AP_TEMPLATE.WRITING
          : spec.type === 'exam_week'
            ? AP_TEMPLATE.CHECKLIST
            : spec.type === 'timed_frq'
              ? AP_TEMPLATE.TIMED
              : AP_TEMPLATE.REVIEW,
      weekNum: spec.weekNum,
      courseCode: 'AP_PHYSICS_C_E_AND_M',
      unit: 'Overlay',
      topic: spec.type,
      taskType: spec.type,
      recommendedSessionMinutes:
        spec.type === 'writing' ? 20 :
        spec.type === 'timed_frq' ? 50 : 30,
      masteryTarget: 'ap_5_level',
      errorLogRequired: spec.type === 'taper',
      extra: {
        courseTitle: 'AP Physics C: Electricity and Magnetism',
        phase: apPhaseForWeek(spec.weekNum),
      },
    })
  );
}

function generateApSpanishLanguageOverlayTasks() {
  const specs = [
    { weekNum: 164, title: 'AP Spanish Language — Formal Email Timed Practice', type: 'timed_task' },
    { weekNum: 172, title: 'AP Spanish Language — Persuasive Essay with Sources', type: 'timed_task' },
    { weekNum: 180, title: 'AP Spanish Language — Simulated Conversation Drill', type: 'timed_task' },
    { weekNum: 188, title: 'AP Spanish Language — Cultural Comparison Recording', type: 'timed_task' },
    { weekNum: 196, title: 'AP Spanish Language — Listening / Reading Integration Review', type: 'mixed_set' },
    { weekNum: 204, title: 'AP Spanish Language — Full Mock Mixed Task Set', type: 'mock_exam' },
    { weekNum: 207, title: 'AP Spanish Language — Final Error Compression', type: 'taper' },
    { weekNum: 208, title: 'AP Spanish Language — Exam Week Checklist', type: 'exam_week' },
  ];

  return specs.map(spec =>
    apTask({
      id: taskId('ap_spanish_language_overlay', `week_${spec.weekNum}`, spec.type),
      title: spec.title,
      templateType:
        spec.type === 'mock_exam'
          ? AP_TEMPLATE.MOCK
          : spec.type === 'exam_week'
            ? AP_TEMPLATE.CHECKLIST
            : spec.type === 'timed_task'
              ? AP_TEMPLATE.TIMED
              : AP_TEMPLATE.REVIEW,
      weekNum: spec.weekNum,
      courseCode: 'AP_SPANISH_LANGUAGE',
      unit: 'Overlay',
      topic: spec.type,
      taskType: spec.type,
      recommendedSessionMinutes:
        spec.type === 'mock_exam' ? 60 :
        spec.type === 'timed_task' ? 25 : 30,
      masteryTarget: 'advanced_language_mastery',
      errorLogRequired: spec.type === 'taper',
      extra: {
        courseTitle: 'AP Spanish Language',
        phase: apPhaseForWeek(spec.weekNum),
      },
    })
  );
}

function generateApCrossCourseFrqCadence() {
  const specs = [
    { weekNum: 160, title: 'AP STEM FRQ Cadence I — Choose Weakest FRQ Type and Attack It', focus: 'weakest_frq' },
    { weekNum: 168, title: 'AP STEM FRQ Cadence II — Mixed Quantitative Explanation Set', focus: 'mixed_quant' },
    { weekNum: 176, title: 'AP STEM FRQ Cadence III — Timed Multi-Subject Pressure Set', focus: 'pressure_set' },
    { weekNum: 182, title: 'AP STEM FRQ Cadence IV — Final Cross-Subject FRQ Push', focus: 'final_push' },
  ];

  return specs.map(spec =>
    apTask({
      id: taskId('ap_cross_course_frq', `week_${spec.weekNum}`, spec.focus),
      title: spec.title,
      templateType: AP_TEMPLATE.TIMED,
      weekNum: spec.weekNum,
      courseCode: 'AP_STEM_CLUSTER',
      unit: 'Cross-Course FRQ',
      topic: spec.focus,
      taskType: 'cross_course_frq',
      recommendedSessionMinutes: 60,
      masteryTarget: 'ap_5_level',
      errorLogRequired: true,
      extra: {
        phase: apPhaseForWeek(spec.weekNum),
      },
    })
  );
}

function generateApCrossCourseMcqCadence() {
  const specs = [
    { weekNum: 158, title: 'AP STEM MCQ Sprint I — Accuracy Under Pace', focus: 'accuracy' },
    { weekNum: 166, title: 'AP STEM MCQ Sprint II — Endurance and Pattern Recognition', focus: 'endurance' },
    { weekNum: 174, title: 'AP STEM MCQ Sprint III — Mixed Trap Review', focus: 'traps' },
    { weekNum: 181, title: 'AP STEM MCQ Sprint IV — Final Pre-Exam Compression', focus: 'final_compression' },
  ];

  return specs.map(spec =>
    apTask({
      id: taskId('ap_cross_course_mcq', `week_${spec.weekNum}`, spec.focus),
      title: spec.title,
      templateType: AP_TEMPLATE.TIMED,
      weekNum: spec.weekNum,
      courseCode: 'AP_STEM_CLUSTER',
      unit: 'Cross-Course MCQ',
      topic: spec.focus,
      taskType: 'cross_course_mcq',
      recommendedSessionMinutes: 45,
      masteryTarget: 'ap_5_level',
      errorLogRequired: true,
      extra: {
        phase: apPhaseForWeek(spec.weekNum),
      },
    })
  );
}

function generateApCourseSpecificOverlays() {
  return [
    ...generateApPrecalculusOverlayTasks(),
    ...generateApEnvironmentalScienceOverlayTasks(),
    ...generateApHumanGeographyOverlayTasks(),
    ...generateApPsychologyOverlayTasks(),
    ...generateApPhysics1OverlayTasks(),
    ...generateApCalculusBcOverlayTasks(),
    ...generateApBiologyOverlayTasks(),
    ...generateApChemistryOverlayTasks(),
    ...generateApStatisticsOverlayTasks(),
    ...generateApCsaOverlayTasks(),
    ...generateApPhysicsCMechanicsOverlayTasks(),
    ...generateApPhysicsCEmOverlayTasks(),
    ...generateApSpanishLanguageOverlayTasks(),
    ...generateApCrossCourseFrqCadence(),
    ...generateApCrossCourseMcqCadence(),
  ];
}

AP_TASKS.push(
  ...generateApCourseSpecificOverlays()
);

// ───────────────────────────────────────────────────────────────────────────────
// PART 11 — RECURRING SYSTEM ABSORBED INTO SEED.JS
// ───────────────────────────────────────────────────────────────────────────────


function getRecurringPhase(weekNum) {
  if (weekNum <= 26) return 0;
  if (weekNum <= 52) return 1;
  if (weekNum <= 104) return 2;
  if (weekNum <= 156) return 3;
  if (weekNum <= 195) return 4;
  return 5;
}

const RECURRING_SLOT_META = [
  // slot 0 — competition_math
  { category: CATEGORY.RECURRING, templateType: TEMPLATE.RECURRING, requiresProof: false },
  // slot 1 — curriculum_mastery
  { category: CATEGORY.RECURRING, templateType: TEMPLATE.KHAN, requiresProof: false },
  // slot 2 — ap_advanced_study
  { category: CATEGORY.RECURRING, templateType: TEMPLATE.LESSON, requiresProof: false },
  // slot 3 — language_training
  { category: CATEGORY.RECURRING, templateType: TEMPLATE.LANGUAGE_PRACTICE, requiresProof: false },
  // slot 4 — reading_training
  { category: CATEGORY.RECURRING, templateType: TEMPLATE.ACTIVITY_LOG, requiresProof: false },
  // slot 5 — writing_training
  { category: CATEGORY.RECURRING, templateType: TEMPLATE.WRITING, requiresProof: false },
  // slot 6 — stem_build
  { category: CATEGORY.RECURRING, templateType: TEMPLATE.PROJECT, requiresProof: false },
  // slot 7 — health_reflection
  { category: CATEGORY.RECURRING, templateType: TEMPLATE.ACTIVITY_LOG, requiresProof: false },
  // slot 8 — cold_email
  { category: CATEGORY.RECURRING, templateType: TEMPLATE.ACTIVITY_LOG, requiresProof: false },
];

function recurringTemplatePrefill({ weekNum, dayOfWeek, slot, phase, title }) {
  return {
    recurring: true,
    recurringSystem: 'daily_9_slot',
    recurringPhase: phase,
    weekNum,
    dayOfWeek,
    slot,
    titleSource: 'absorbed_recurring_js',
    proofUploadUrl: PROOF_DRIVE_URL,
    originalTitle: title,
  };
}

function generateDailyRecurringTasks() {
  const tasks = [];

for (let weekNum = 1; weekNum <= MAX_WEEK; weekNum += 1) {
    const phase = getRecurringPhase(weekNum);

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek += 1) {
      const rotation = (weekNum * 7 + dayOfWeek) % 12;

      for (let slot = 0; slot < 8; slot += 1) {
        const meta = RECURRING_SLOT_META[slot];
        const pool = RECURRING_TITLES[RECURRING_SLOT_KEYS[slot]][phase];
        const title = pool[rotation % pool.length];

        tasks.push(
          weekTask({
            id: `recw${String(weekNum).padStart(3, '0')}d${dayOfWeek}s${slot}`,
            title,
            category: meta.category,
            templateType: meta.templateType,
            requiresProof: meta.requiresProof,
            weekNum,
            templatePrefill: {
              ...recurringTemplatePrefill({
                weekNum,
                dayOfWeek,
                slot,
                phase,
                title,
              }),
            },
          })
        );
      }

      const coldEmailTitle = getColdEmailTitle(weekNum, dayOfWeek);
      const coldMeta = RECURRING_SLOT_META[8];

      tasks.push(
        weekTask({
          id: `recw${String(weekNum).padStart(3, '0')}d${dayOfWeek}s8`,
          title: coldEmailTitle,
          category: coldMeta.category,
          templateType: coldMeta.templateType,
          requiresProof: coldMeta.requiresProof,
          weekNum,
          templatePrefill: {
            ...recurringTemplatePrefill({
              weekNum,
              dayOfWeek,
              slot: 8,
              phase,
              title: coldEmailTitle,
            }),
            coldEmailMode:
              weekNum === 1 ? 'curriculum' :
              weekNum === 2 ? 'send_two_per_day' :
              'send_and_follow_up',
          },
        })
      );
    }
  }

  return tasks;
}

RECURRING_TASKS.push(
  ...generateDailyRecurringTasks()
);

// ───────────────────────────────────────────────────────────────────────────────
// PART 12 — READING, WRITING, STEM, HEALTH, COLLEGE, COLD EMAIL STRUCTURED ARCS
// ───────────────────────────────────────────────────────────────────────────────


function genericTask({
  id,
  title,
  category,
  templateType,
  weekNum,
  requiresProof = false,
  payload = {},
}) {
  return weekTask({
    id,
    title,
    category,
    templateType,
    weekNum,
    requiresProof,
    templatePrefill: {
      proofUploadUrl: PROOF_DRIVE_URL,
      ...payload,
    },
  });
}

// ───────────────────────────────────────────────────────────────────────────────
// READING ARC
// ───────────────────────────────────────────────────────────────────────────────

function generateReadingMilestones() {
  const specs = [
    { weekNum: 13, title: 'Reading Milestone — Build the Habit and Log 5 Finished Texts', focus: 'habit_build' },
    { weekNum: 26, title: 'Reading Milestone — First-Year Intellectual Taste Snapshot', focus: 'taste_snapshot' },
    { weekNum: 52, title: 'Reading Milestone — Move from Casual Reading to Analytical Reading', focus: 'analysis_bridge' },
    { weekNum: 104, title: 'Reading Milestone — Reading Log Strong Enough for Essays / Interviews', focus: 'essay_bridge' },
    { weekNum: 156, title: 'Reading Milestone — Academic Identity Through Reading', focus: 'identity' },
    { weekNum: 208, title: 'Reading Milestone — Final Annotated Intellectual Journey Archive', focus: 'final_archive' },
  ];

  return specs.map(spec =>
    genericTask({
      id: taskId('reading', 'milestone', `week_${spec.weekNum}`, spec.focus),
      title: spec.title,
      category: CATEGORY.COLLEGE,
      templateType: spec.focus === 'final_archive' ? TEMPLATE.WRITING : TEMPLATE.READING_LOG || TEMPLATE.READINGLOG || TEMPLATE.ACTIVITY_LOG,
      weekNum: spec.weekNum,
      payload: {
        taskType: 'reading_milestone',
        focus: spec.focus,
        recommendedSessionMinutes: 25,
      },
    })
  );
}

function generateReadingDeepDives() {
  const specs = [
    { weekNum: 18, title: 'Reading Deep Dive — Science Biography / Role Model Reflection', focus: 'role_model' },
    { weekNum: 34, title: 'Reading Deep Dive — Classic Literature and Theme Notes', focus: 'classic_lit' },
    { weekNum: 60, title: 'Reading Deep Dive — Popular Science Book Analysis', focus: 'popular_science' },
    { weekNum: 88, title: 'Reading Deep Dive — Journalistic Longform and Argument Mapping', focus: 'longform_argument' },
    { weekNum: 120, title: 'Reading Deep Dive — Read a Research Abstract Trail', focus: 'research_abstracts' },
    { weekNum: 148, title: 'Reading Deep Dive — College-Level Syllabus and Reading Preview', focus: 'college_syllabus' },
    { weekNum: 176, title: 'Reading Deep Dive — Intended Major Foundational Text', focus: 'major_foundation' },
    { weekNum: 200, title: 'Reading Reflection — Which Books Actually Changed You?', focus: 'final_reflection' },
  ];

  return specs.map(spec =>
    genericTask({
      id: taskId('reading', 'deep_dive', `week_${spec.weekNum}`, spec.focus),
      title: spec.title,
      category: CATEGORY.COLLEGE,
      templateType:
        spec.focus === 'final_reflection'
          ? TEMPLATE.WRITING
          : TEMPLATE.READING_LOG || TEMPLATE.READINGLOG || TEMPLATE.ACTIVITY_LOG,
      weekNum: spec.weekNum,
      payload: {
        taskType: 'reading_deep_dive',
        focus: spec.focus,
        recommendedSessionMinutes: 35,
      },
    })
  );
}

READING_TASKS.push(
  ...generateReadingMilestones(),
  ...generateReadingDeepDives()
);

// ───────────────────────────────────────────────────────────────────────────────
// WRITING ARC
// ───────────────────────────────────────────────────────────────────────────────

function generateWritingMilestones() {
  const specs = [
    { weekNum: 20, title: 'Writing Milestone — Clear Paragraph and Argument Basics', focus: 'foundation' },
    { weekNum: 39, title: 'Writing Milestone — First Strong Analytical Paragraph Set', focus: 'analysis' },
    { weekNum: 78, title: 'Writing Milestone — AP / Academic Writing Readiness', focus: 'ap_readiness' },
    { weekNum: 117, title: 'Writing Milestone — Personal Narrative Bank Built', focus: 'narrative_bank' },
    { weekNum: 156, title: 'Writing Milestone — Common App / Supplement Draft Muscle', focus: 'college_essay_ready' },
    { weekNum: 195, title: 'Writing Milestone — Application Writing Complete', focus: 'application_complete' },
    { weekNum: 208, title: 'Writing Milestone — Archive the Best Pages You Wrote', focus: 'final_archive' },
  ];

  return specs.map(spec =>
    genericTask({
      id: taskId('writing', 'milestone', `week_${spec.weekNum}`, spec.focus),
      title: spec.title,
      category: CATEGORY.COLLEGE,
      templateType: TEMPLATE.WRITING,
      weekNum: spec.weekNum,
      payload: {
        taskType: 'writing_milestone',
        focus: spec.focus,
        recommendedSessionMinutes: 30,
      },
    })
  );
}

function generateEssayInfrastructureTasks() {
  const specs = [
    { weekNum: 84, title: 'Essay Infrastructure — List 25 Possible Story Seeds', focus: 'story_seed_bank' },
    { weekNum: 96, title: 'Essay Infrastructure — Build Activities Impact Notes', focus: 'activities_bank' },
    { weekNum: 108, title: 'Essay Infrastructure — Build Values / Themes Matrix', focus: 'values_matrix' },
    { weekNum: 132, title: 'Essay Infrastructure — Draft 5 Why Major Paragraphs', focus: 'why_major' },
    { weekNum: 144, title: 'Essay Infrastructure — Draft 5 Why School Paragraphs', focus: 'why_school' },
    { weekNum: 168, title: 'Essay Infrastructure — Final Common App Topic Selection', focus: 'topic_selection' },
    { weekNum: 180, title: 'Essay Infrastructure — Supplemental Architecture Plan', focus: 'supplement_plan' },
  ];

  return specs.map(spec =>
    genericTask({
      id: taskId('writing', 'infrastructure', `week_${spec.weekNum}`, spec.focus),
      title: spec.title,
      category: CATEGORY.COLLEGE,
      templateType: TEMPLATE.WRITING,
      weekNum: spec.weekNum,
      payload: {
        taskType: 'essay_infrastructure',
        focus: spec.focus,
        recommendedSessionMinutes: 30,
      },
    })
  );
}

WRITING_TASKS.push(
  ...generateWritingMilestones(),
  ...generateEssayInfrastructureTasks()
);

// ───────────────────────────────────────────────────────────────────────────────
// STEM ARC
// ───────────────────────────────────────────────────────────────────────────────

function generateStemMilestones() {
  const specs = [
    { weekNum: 26, title: 'STEM Milestone — Basic Coding and Exploration Habit Established', focus: 'foundation' },
    { weekNum: 52, title: 'STEM Milestone — First Meaningful Script / Small Project Archived', focus: 'first_project' },
    { weekNum: 91, title: 'STEM Milestone — Data / Algorithms / Tooling Comfort Check', focus: 'tooling' },
    { weekNum: 130, title: 'STEM Milestone — Project Portfolio Worth Showing Someone', focus: 'portfolio' },
    { weekNum: 170, title: 'STEM Milestone — Intended-Focus Technical Depth Emerging', focus: 'specialization' },
    { weekNum: 208, title: 'STEM Milestone — Final Technical Identity Archive', focus: 'final_archive' },
  ];

  return specs.map(spec =>
    genericTask({
      id: taskId('stem', 'milestone', `week_${spec.weekNum}`, spec.focus),
      title: spec.title,
      category: CATEGORY.LIFE,
      templateType: TEMPLATE.ACTIVITY_LOG,
      weekNum: spec.weekNum,
      payload: {
        taskType: 'stem_milestone',
        focus: spec.focus,
        recommendedSessionMinutes: 35,
      },
    })
  );
}

function generateStemProjectPushes() {
  const specs = [
    { weekNum: 40, title: 'STEM Project Push — Build Something Small but Real', focus: 'small_real_project' },
    { weekNum: 68, title: 'STEM Project Push — Data Analysis Mini Project', focus: 'data_project' },
    { weekNum: 96, title: 'STEM Project Push — Algorithmic / Problem-Solving Tool', focus: 'algo_tool' },
    { weekNum: 124, title: 'STEM Project Push — Website / Portfolio Improvement', focus: 'portfolio_site' },
    { weekNum: 152, title: 'STEM Project Push — Strongest Project Deepening Sprint', focus: 'flagship_project' },
    { weekNum: 182, title: 'STEM Project Push — Package Work for Applications', focus: 'application_packaging' },
    { weekNum: 204, title: 'STEM Reflection — Which Technical Work Actually Matters to You?', focus: 'final_reflection' },
  ];

  return specs.map(spec =>
    genericTask({
      id: taskId('stem', 'project_push', `week_${spec.weekNum}`, spec.focus),
      title: spec.title,
      category: CATEGORY.LIFE,
      templateType:
        spec.focus === 'final_reflection'
          ? TEMPLATE.WRITING
          : TEMPLATE.ACTIVITY_LOG,
      weekNum: spec.weekNum,
      payload: {
        taskType: 'stem_project_push',
        focus: spec.focus,
        recommendedSessionMinutes: 45,
      },
    })
  );
}

STEM_TASKS.push(
  ...generateStemMilestones(),
  ...generateStemProjectPushes()
);

// ───────────────────────────────────────────────────────────────────────────────
// HEALTH / REFLECTION ARC
// ───────────────────────────────────────────────────────────────────────────────

function generateHealthMilestones() {
  const specs = [
    { weekNum: 13, title: 'Health Milestone — Basic Sleep / Exercise Logging Habit', focus: 'habit' },
    { weekNum: 39, title: 'Health Milestone — Productivity and Energy Patterns Noticed', focus: 'energy_patterns' },
    { weekNum: 78, title: 'Health Milestone — Competitive Stress Managed Better Than Before', focus: 'stress_management' },
    { weekNum: 117, title: 'Health Milestone — Sustainable Work Rhythm Check', focus: 'sustainability' },
    { weekNum: 156, title: 'Health Milestone — High Performance Without Total Self-Destruction', focus: 'high_performance' },
    { weekNum: 195, title: 'Health Milestone — Application Season Balance Check', focus: 'application_balance' },
    { weekNum: 208, title: 'Health Reflection — Which Habits Will You Keep for College?', focus: 'final_reflection' },
  ];

  return specs.map(spec =>
    genericTask({
      id: taskId('health', 'milestone', `week_${spec.weekNum}`, spec.focus),
      title: spec.title,
      category: CATEGORY.LIFE,
      templateType:
        spec.focus === 'final_reflection'
          ? TEMPLATE.WRITING
          : TEMPLATE.ACTIVITY_LOG,
      weekNum: spec.weekNum,
      payload: {
        taskType: 'health_milestone',
        focus: spec.focus,
        recommendedSessionMinutes: 20,
      },
    })
  );
}

HEALTH_TASKS.push(
  ...generateHealthMilestones()
);

// ───────────────────────────────────────────────────────────────────────────────
// COLLEGE / CAREER ARC
// ───────────────────────────────────────────────────────────────────────────────

function generateCollegeMilestones() {
  const specs = [
    { weekNum: 52, title: 'College Milestone — Start Translating Work into a Profile', focus: 'profile_awareness' },
    { weekNum: 104, title: 'College Milestone — Build a Stronger Narrative than Random Achievement Stacking', focus: 'narrative_build' },
    { weekNum: 130, title: 'College Milestone — Early School List and Fit Thinking', focus: 'school_list' },
    { weekNum: 156, title: 'College Milestone — Activity List / Positioning Readiness', focus: 'positioning' },
    { weekNum: 176, title: 'College Milestone — Recommendation / Essays / Activities Infrastructure Ready', focus: 'application_infra' },
    { weekNum: 195, title: 'College Milestone — Main Application Work Submitted', focus: 'submission' },
    { weekNum: 208, title: 'College Reflection — What Kind of Student Are You Actually Becoming?', focus: 'final_reflection' },
  ];

  return specs.map(spec =>
    genericTask({
      id: taskId('college', 'milestone', `week_${spec.weekNum}`, spec.focus),
      title: spec.title,
      category: CATEGORY.COLLEGE,
      templateType:
        spec.focus === 'final_reflection'
          ? TEMPLATE.WRITING
          : TEMPLATE.ACTIVITY_LOG,
      weekNum: spec.weekNum,
      payload: {
        taskType: 'college_milestone',
        focus: spec.focus,
        recommendedSessionMinutes: 30,
      },
    })
  );
}

function generateCollegeResearchTasks() {
  const specs = [
    { weekNum: 118, title: 'College Research — What Do Different School Archetypes Actually Offer?', focus: 'school_archetypes' },
    { weekNum: 136, title: 'College Research — Intended Major Pathways Across Schools', focus: 'major_fit' },
    { weekNum: 150, title: 'College Research — Build a Serious School List Draft', focus: 'list_build' },
    { weekNum: 166, title: 'College Research — Why School Notes Bank', focus: 'why_school_bank' },
    { weekNum: 182, title: 'College Research — Interview / Conversation Preparation Notes', focus: 'interview_prep' },
    { weekNum: 198, title: 'College Research — Decision / Comparison Framework', focus: 'decision_framework' },
  ];

  return specs.map(spec =>
    genericTask({
      id: taskId('college', 'research', `week_${spec.weekNum}`, spec.focus),
      title: spec.title,
      category: CATEGORY.COLLEGE,
      templateType: TEMPLATE.ACTIVITY_LOG,
      weekNum: spec.weekNum,
      payload: {
        taskType: 'college_research',
        focus: spec.focus,
        recommendedSessionMinutes: 30,
      },
    })
  );
}

COLLEGE_TASKS.push(
  ...generateCollegeMilestones(),
  ...generateCollegeResearchTasks()
);

// ───────────────────────────────────────────────────────────────────────────────
// COLD EMAIL ARC
// ───────────────────────────────────────────────────────────────────────────────

function generateColdEmailMilestones() {
  const specs = [
    { weekNum: 2, title: 'Cold Email Milestone — First 14 Emails Sent', focus: 'first_send' },
    { weekNum: 13, title: 'Cold Email Milestone — Basic Outreach Muscle Built', focus: 'habit_built' },
    { weekNum: 39, title: 'Cold Email Milestone — Better Targets, Better Writing, Better Responses', focus: 'quality_upgrade' },
    { weekNum: 78, title: 'Cold Email Milestone — Outreach Tied to Real Interests', focus: 'interest_alignment' },
    { weekNum: 130, title: 'Cold Email Milestone — Stronger Relationship / Opportunity Pipeline', focus: 'pipeline' },
    { weekNum: 176, title: 'Cold Email Milestone — Mature Professional Communication', focus: 'professionalism' },
    { weekNum: 208, title: 'Cold Email Reflection — Which Outreach Actually Led Somewhere?', focus: 'final_reflection' },
  ];

  return specs.map(spec =>
    genericTask({
      id: taskId('coldemail', 'milestone', `week_${spec.weekNum}`, spec.focus),
      title: spec.title,
      category: CATEGORY.LIFE,
      templateType:
        spec.focus === 'final_reflection'
          ? TEMPLATE.WRITING
          : TEMPLATE.ACTIVITY_LOG,
      weekNum: spec.weekNum,
      payload: {
        taskType: 'cold_email_milestone',
        focus: spec.focus,
        recommendedSessionMinutes: 20,
      },
    })
  );
}

function generateColdEmailInfrastructureTasks() {
  const specs = [
    { weekNum: 4, title: 'Cold Email Infrastructure — Build Lead Tracking Sheet', focus: 'tracking_sheet' },
    { weekNum: 10, title: 'Cold Email Infrastructure — Write 3 Reusable Templates', focus: 'templates' },
    { weekNum: 24, title: 'Cold Email Infrastructure — Build Better Target Research Process', focus: 'target_research' },
    { weekNum: 52, title: 'Cold Email Infrastructure — Follow-Up System and Cadence', focus: 'followups' },
    { weekNum: 104, title: 'Cold Email Infrastructure — Align Outreach with Projects / Research', focus: 'alignment' },
    { weekNum: 156, title: 'Cold Email Infrastructure — Professional Positioning Upgrade', focus: 'positioning' },
  ];

  return specs.map(spec =>
    genericTask({
      id: taskId('coldemail', 'infrastructure', `week_${spec.weekNum}`, spec.focus),
      title: spec.title,
      category: CATEGORY.LIFE,
      templateType: TEMPLATE.ACTIVITY_LOG,
      weekNum: spec.weekNum,
      payload: {
        taskType: 'cold_email_infrastructure',
        focus: spec.focus,
        recommendedSessionMinutes: 25,
      },
    })
  );
}

COLD_EMAIL_TASKS.push(
  ...generateColdEmailMilestones(),
  ...generateColdEmailInfrastructureTasks()
);

// ───────────────────────────────────────────────────────────────────────────────
// PART 13 — QUARTER SYSTEM, WEEK METADATA, PHASE CHECKPOINTS, FINAL AGGREGATION
// ───────────────────────────────────────────────────────────────────────────────


function quarterForWeekNumber(weekNum) {
  return Math.ceil(weekNum / 13);
}

function phaseLabelForWeek(weekNum) {
  if (weekNum <= 26) return 'foundation';
  if (weekNum <= 52) return 'buildout';
  if (weekNum <= 104) return 'acceleration';
  if (weekNum <= 156) return 'advanced';
  if (weekNum <= 195) return 'application';
  return 'senior_transition';
}

function yearBandForWeek(weekNum) {
  if (weekNum <= 39) return '7th_grade';
  if (weekNum <= 78) return '8th_grade';
  if (weekNum <= 117) return '9th_grade';
  if (weekNum <= 156) return '10th_grade';
  if (weekNum <= 195) return '11th_grade';
  return '12th_grade';
}

function seasonForWeek(weekNum) {
  const q = quarterForWeekNumber(weekNum);
  const mod = ((q - 1) % 4) + 1;
  if (mod === 1) return 'fall';
  if (mod === 2) return 'winter';
  if (mod === 3) return 'spring';
  return 'summer';
}

function weekMetaTask(weekNum, title, payload = {}) {
  return weekTask({
    id: `meta_week_${String(weekNum).padStart(3, '0')}`,
    title,
    category: CATEGORY.LIFE,
    templateType: TEMPLATE.CHECKLIST,
    requiresProof: false,
    weekNum,
    templatePrefill: {
      taskType: 'week_meta',
      weekNum,
      quarterNumber: quarterForWeekNumber(weekNum),
      phaseLabel: phaseLabelForWeek(weekNum),
      yearBand: yearBandForWeek(weekNum),
      season: seasonForWeek(weekNum),
      proofUploadUrl: PROOF_DRIVE_URL,
      ...payload,
    },
  });
}

function quarterMetaTask(quarterNum, weekNum, title, payload = {}) {
  return weekTask({
    id: `meta_quarter_${String(quarterNum).padStart(2, '0')}`,
    title,
    category: CATEGORY.LIFE,
    templateType: TEMPLATE.CHECKLIST,
    requiresProof: false,
    weekNum,
    templatePrefill: {
      taskType: 'quarter_meta',
      quarterNumber: quarterNum,
      phaseLabel: phaseLabelForWeek(weekNum),
      yearBand: yearBandForWeek(weekNum),
      season: seasonForWeek(weekNum),
      proofUploadUrl: PROOF_DRIVE_URL,
      ...payload,
    },
  });
}

function generateWeeklyMetaTasks() {
  const tasks = [];

  for (let weekNum = 1; weekNum <= 231; weekNum += 1) {
    tasks.push(
      weekMetaTask(
        weekNum,
        `Week ${weekNum} Setup — Priorities, Tracking, and Execution Check`,
        {
          kind: 'week_setup',
        }
      )
    );
  }

  return tasks;
}

function generateQuarterMetaTasks() {
  const tasks = [];

  for (let quarterNum = 1; quarterNum <= Math.ceil(231 / 13); quarterNum += 1) {
    const weekNum = (quarterNum - 1) * 13 + 1;
    tasks.push(
      quarterMetaTask(
        quarterNum,
        weekNum,
        `Quarter ${quarterNum} Launch — Reset Goals and Standards`,
        {
          kind: 'quarter_launch',
        }
      ),
      quarterMetaTask(
        quarterNum,
        clamp(weekNum + 12, weekNum, 231),
        `Quarter ${quarterNum} Close — Archive Results and Lessons`,
        {
          kind: 'quarter_close',
        }
      )
    );
  }

  return tasks;
}

function generatePhaseCheckpointTasks() {
  const specs = [
    {
      weekNum: 26,
      title: 'Phase Checkpoint — Foundation Phase Complete',
      phase: 'foundation',
    },
    {
      weekNum: 52,
      title: 'Phase Checkpoint — Buildout Phase Complete',
      phase: 'buildout',
    },
    {
      weekNum: 104,
      title: 'Phase Checkpoint — Acceleration Phase Complete',
      phase: 'acceleration',
    },
    {
      weekNum: 156,
      title: 'Phase Checkpoint — Advanced Phase Complete',
      phase: 'advanced',
    },
    {
      weekNum: 195,
      title: 'Phase Checkpoint — Application Phase Complete',
      phase: 'application',
    },
    {
      weekNum: 231,
      title: 'Phase Checkpoint — Senior Transition Phase Complete',
      phase: 'senior_transition',
    },
  ];

  return specs.map(spec =>
    weekTask({
      id: `phase_checkpoint_${spec.phase}`,
      title: spec.title,
      category: CATEGORY.LIFE,
      templateType: TEMPLATE.CHECKLIST,
      requiresProof: false,
      weekNum: spec.weekNum,
      templatePrefill: {
        taskType: 'phase_checkpoint',
        phase: spec.phase,
        quarterNumber: quarterForWeekNumber(spec.weekNum),
        yearBand: yearBandForWeek(spec.weekNum),
        season: seasonForWeek(spec.weekNum),
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

function generateYearBandCheckpointTasks() {
  const specs = [
    { weekNum: 39, label: '7th Grade', key: '7th_grade' },
    { weekNum: 78, label: '8th Grade', key: '8th_grade' },
    { weekNum: 117, label: '9th Grade', key: '9th_grade' },
    { weekNum: 156, label: '10th Grade', key: '10th_grade' },
    { weekNum: 195, label: '11th Grade', key: '11th_grade' },
    { weekNum: 231, label: '12th Grade', key: '12th_grade' },
  ];

  return specs.map(spec =>
    weekTask({
      id: `yearband_checkpoint_${spec.key}`,
      title: `${spec.label} Closeout — Archive the Year`,
      category: CATEGORY.LIFE,
      templateType: TEMPLATE.WRITING,
      requiresProof: false,
      weekNum: spec.weekNum,
      templatePrefill: {
        taskType: 'yearband_checkpoint',
        yearBand: spec.key,
        quarterNumber: quarterForWeekNumber(spec.weekNum),
        phaseLabel: phaseLabelForWeek(spec.weekNum),
        proofUploadUrl: PROOF_DRIVE_URL,
      },
    })
  );
}

META_TASKS.push(
  ...generateWeeklyMetaTasks(),
  ...generateQuarterMetaTasks(),
  ...generatePhaseCheckpointTasks(),
  ...generateYearBandCheckpointTasks()
);

function rotate(list, weekNum, offset = 0) {
  return list[(weekNum + offset) % list.length];
}

function competitionTrackForWeek(weekNum) {
  if (weekNum <= 52) {
    return {
      category: CATEGORY.AMC8,
      examLabel: rotate(['AMC 8 2020', 'AMC 8 2021', 'AMC 8 2022', 'AMC 8 2023'], weekNum),
      longProblem: 17 + ((weekNum - 1) % 8),
      timedRange: '17-25',
    };
  }

  if (weekNum <= 156) {
    return {
      category: CATEGORY.AMC10,
      examLabel: rotate(['AMC 10A 2020', 'AMC 10B 2021', 'AMC 10A 2022', 'AMC 10B 2023'], weekNum),
      longProblem: 16 + ((weekNum - 1) % 9),
      timedRange: '16-25',
    };
  }

  return {
    category: CATEGORY.AIME,
    examLabel: rotate(['AIME I 2020', 'AIME II 2021', 'AIME I 2022', 'AIME II 2023'], weekNum),
    longProblem: 4 + ((weekNum - 1) % 7),
    timedRange: '6-12',
  };
}

function curriculumTopicForWeek(weekNum) {
  const phase = phaseLabelForWeek(weekNum);
  const topicsByPhase = {
    foundation: ['Fractions', 'Decimals', 'Ratios', 'Percents', 'Integers', 'Expressions'],
    buildout: ['Linear Equations', 'Inequalities', 'Functions', 'Geometry', 'Probability', 'Systems'],
    acceleration: ['Algebra 1', 'Geometry', 'Polynomials', 'Quadratics', 'Coordinate Geometry', 'Proofs'],
    advanced: ['Precalculus', 'Trigonometry', 'Functions', 'Statistics', 'Calculus Readiness', 'Data Analysis'],
    application: ['Advanced Algebra', 'Functions', 'Sequences', 'Statistics', 'Modeling', 'Problem Solving'],
    senior_transition: ['Calculus Review', 'Statistics Review', 'Proof Review', 'Modeling', 'Data Interpretation', 'College Math'],
  };

  return rotate(topicsByPhase[phase] || topicsByPhase.foundation, weekNum);
}

function apSubjectsForWeek(weekNum) {
  if (weekNum <= 52) return ['AP Human Geography', 'AP Environmental Science'];
  if (weekNum <= 104) return ['AP Precalculus', 'AP Psychology'];
  if (weekNum <= 156) return ['AP Calculus BC', 'AP Biology'];
  if (weekNum <= 208) return ['AP Chemistry', 'AP Physics C Mechanics'];
  return ['AP Physics C E&M', 'AP Spanish Language'];
}

function satFocusForWeek(weekNum) {
  return rotate(
    [
      'Words in Context + Rhetorical Synthesis',
      'Transitions + Boundaries',
      'Linear Equations + Systems',
      'Quadratics + Functions',
      'Advanced Math + Exponents',
      'Geometry + Trigonometry',
    ],
    weekNum
  );
}

function languageTrackForWeek(weekNum) {
  return rotate(['Russian', 'Spanish'], weekNum);
}

function readingTextForWeek(weekNum) {
  return rotate(
    [
      'editorial article',
      'science feature',
      'history chapter',
      'essay collection',
      'short story',
      'research summary',
    ],
    weekNum
  );
}

function writingModeForWeek(weekNum) {
  return rotate(
    [
      'analysis paragraph',
      'argument paragraph',
      'narrative scene',
      'technical explanation',
      'source-based response',
      'revision pass',
    ],
    weekNum
  );
}

function stemTrackForWeek(weekNum) {
  return rotate(
    [
      'Python data task',
      'web build task',
      'spreadsheet model',
      'notebook experiment',
      'automation script',
      'engineering note',
    ],
    weekNum
  );
}

function collegeTrackForWeek(weekNum) {
  return rotate(
    [
      'College Report',
      'Career Report',
      'AP Class Review',
      'Math Competition Studies',
    ],
    weekNum
  );
}

function weeklyPacketTask({
  id,
  title,
  category,
  templateType,
  weekNum,
  requiresProof = true,
  assignment,
  instructions,
  checklist,
  payload = {},
}) {
  return weekTask({
    id,
    title,
    category,
    templateType,
    weekNum,
    requiresProof,
    templatePrefill: {
      proofUploadUrl: PROOF_DRIVE_URL,
      assignment,
      instructions,
      checklist,
      packetType: 'weekly_execution',
      ...payload,
    },
  });
}

function generateWeeklyExecutionPackets() {
  const tasks = [];

  for (let weekNum = 1; weekNum <= MAX_WEEK; weekNum += 1) {
    const competition = competitionTrackForWeek(weekNum);
    const curriculumTopic = curriculumTopicForWeek(weekNum);
    const [apSubjectA, apSubjectB] = apSubjectsForWeek(weekNum);
    const satFocus = satFocusForWeek(weekNum);
    const language = languageTrackForWeek(weekNum);
    const readingText = readingTextForWeek(weekNum);
    const writingMode = writingModeForWeek(weekNum);
    const stemTrack = stemTrackForWeek(weekNum);
    const collegeTrack = collegeTrackForWeek(weekNum);

    tasks.push(
      weeklyPacketTask({
        id: taskId('weekly_packet', 'competition', weekNum, 'set_a'),
        title: `${competition.examLabel} — Problems 1-8`,
        category: competition.category,
        templateType: TEMPLATE.MATH_PROOF,
        weekNum,
        assignment: `Work ${competition.examLabel} problems 1-8 with no substitutions.`,
        instructions: 'Record attempted and correct counts. Upload scratch work. Log every miss.',
        checklist: ['Finish all 8 problems', 'Score the set', 'Update the error log'],
        payload: { categoryKey: 'competition_math', problemSet: `${competition.examLabel} 1-8` },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'competition', weekNum, 'set_b'),
        title: `${competition.examLabel} — Problems 9-16`,
        category: competition.category,
        templateType: TEMPLATE.MATH_PROOF,
        weekNum,
        assignment: `Work ${competition.examLabel} problems 9-16 with full written steps.`,
        instructions: 'Check answers immediately after the set. Mark every miss that needs review.',
        checklist: ['Finish all 8 problems', 'Score the set', 'Mark weak topics'],
        payload: { categoryKey: 'competition_math', problemSet: `${competition.examLabel} 9-16` },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'competition', weekNum, 'corrections'),
        title: `${competition.examLabel} — Corrections for 3 Misses`,
        category: competition.category,
        templateType: TEMPLATE.REVIEW,
        weekNum,
        assignment: `Redo 3 missed problems from ${competition.examLabel} without notes, then write the corrected method.`,
        instructions: 'Each corrected solution must show the main mistake and the clean final path.',
        checklist: ['Redo 3 misses', 'Name the mistake on each', 'Update the error log'],
        payload: { categoryKey: 'competition_math', problemSet: `${competition.examLabel} corrections` },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'competition', weekNum, 'polished_solution'),
        title: `${competition.examLabel} — Polished Solution for Problem ${competition.longProblem}`,
        category: competition.category,
        templateType: TEMPLATE.MATH_PROOF,
        weekNum,
        assignment: `Write one polished solution for ${competition.examLabel} problem ${competition.longProblem}.`,
        instructions: 'Use complete sentences where needed. Make the final solution clean enough to archive.',
        checklist: ['Write one clean solution', 'Upload the final version'],
        payload: { categoryKey: 'competition_math', problemSet: `${competition.examLabel} problem ${competition.longProblem}` },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'competition', weekNum, 'timed'),
        title: `${competition.examLabel} — Timed Set ${competition.timedRange}`,
        category: competition.category,
        templateType: TEMPLATE.TIMED_EXAM,
        weekNum,
        assignment: `Run a timed set on ${competition.examLabel} problems ${competition.timedRange}.`,
        instructions: 'Use one sitting. Record the time. Correct every miss after the timer ends.',
        checklist: ['Run the timer', 'Score the set', 'Correct every miss'],
        payload: { categoryKey: 'competition_math', problemSet: `${competition.examLabel} timed ${competition.timedRange}` },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'competition', weekNum, 'pattern_notes'),
        title: `${competition.examLabel} — Pattern Notes`,
        category: competition.category,
        templateType: TEMPLATE.REVIEW,
        weekNum,
        requiresProof: false,
        assignment: `Write 5 pattern notes from this week's ${competition.examLabel} work.`,
        instructions: 'Each note should name a trigger and the method that unlocked it.',
        checklist: ['Write 5 notes', 'Include one example problem'],
        payload: { categoryKey: 'competition_math', problemSet: `${competition.examLabel} notes` },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'curriculum', weekNum, 'block_1'),
        title: `${curriculumTopic} — Khan Block 1`,
        category: CATEGORY.KHAN_MATH,
        templateType: TEMPLATE.KHAN,
        weekNum,
        assignment: `Finish the first ${curriculumTopic} practice block for this week.`,
        instructions: 'Work until the block is complete. Use hints only after a full first attempt.',
        checklist: ['Finish the block', 'Record the score'],
        payload: { categoryKey: 'curriculum_math', platform: 'Khan Academy', moduleName: `${curriculumTopic} block 1` },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'curriculum', weekNum, 'block_2'),
        title: `${curriculumTopic} — Khan Block 2`,
        category: CATEGORY.KHAN_MATH,
        templateType: TEMPLATE.KHAN,
        weekNum,
        assignment: `Finish the second ${curriculumTopic} practice block for this week.`,
        instructions: 'Keep scratch work for every missed problem.',
        checklist: ['Finish the block', 'Save scratch work'],
        payload: { categoryKey: 'curriculum_math', platform: 'Khan Academy', moduleName: `${curriculumTopic} block 2` },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'curriculum', weekNum, 'block_3'),
        title: `${curriculumTopic} — Khan Block 3`,
        category: CATEGORY.KHAN_MATH,
        templateType: TEMPLATE.KHAN,
        weekNum,
        assignment: `Finish the third ${curriculumTopic} practice block for this week.`,
        instructions: 'Do not move on until every missed item is corrected.',
        checklist: ['Finish the block', 'Correct misses'],
        payload: { categoryKey: 'curriculum_math', platform: 'Khan Academy', moduleName: `${curriculumTopic} block 3` },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'curriculum', weekNum, 'mastery'),
        title: `${curriculumTopic} — Mastery Check`,
        category: CATEGORY.KHAN_MATH,
        templateType: TEMPLATE.CHECKLIST,
        weekNum,
        assignment: `Complete one ${curriculumTopic} mastery check.`,
        instructions: 'Record the result and the skills that still need another pass.',
        checklist: ['Finish the mastery check', 'List misses'],
        payload: { categoryKey: 'curriculum_math', platform: 'Khan Academy', moduleName: `${curriculumTopic} mastery check` },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'curriculum', weekNum, 'video'),
        title: `${curriculumTopic} — Video Notes`,
        category: CATEGORY.KHAN_MATH,
        templateType: TEMPLATE.KHAN,
        weekNum,
        requiresProof: false,
        assignment: `Watch one ${curriculumTopic} lesson video and take 8 lines of notes.`,
        instructions: 'The notes should include one worked example and one question you still have.',
        checklist: ['Watch the lesson', 'Take notes'],
        payload: { categoryKey: 'curriculum_math', platform: 'Khan Academy', moduleName: `${curriculumTopic} video` },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'curriculum', weekNum, 'corrections'),
        title: `${curriculumTopic} — Corrections`,
        category: CATEGORY.KHAN_MATH,
        templateType: TEMPLATE.REVIEW,
        weekNum,
        assignment: `Correct 5 misses from this week's ${curriculumTopic} work.`,
        instructions: 'For each miss, write the wrong move and the corrected move.',
        checklist: ['Correct 5 misses', 'Write the reason for each'],
        payload: { categoryKey: 'curriculum_math', platform: 'Khan Academy', moduleName: `${curriculumTopic} corrections` },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'ap', weekNum, 'subject_a_mcq'),
        title: `${apSubjectA} — 20 MCQs`,
        category: CATEGORY.AP,
        templateType: TEMPLATE.LESSON,
        weekNum,
        assignment: `Complete 20 multiple-choice questions for ${apSubjectA}.`,
        instructions: 'Score the set and note the 3 biggest misses.',
        checklist: ['Finish 20 MCQs', 'Score the set', 'List 3 misses'],
        payload: { categoryKey: 'ap', unit: `${apSubjectA} weekly set`, source: apSubjectA },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'ap', weekNum, 'subject_a_frq'),
        title: `${apSubjectA} — 1 FRQ Outline`,
        category: CATEGORY.AP,
        templateType: TEMPLATE.FRQ,
        weekNum,
        assignment: `Outline one FRQ for ${apSubjectA} using full evidence or steps.`,
        instructions: 'Write the outline in a way that could be expanded into a full response.',
        checklist: ['Complete one FRQ outline'],
        payload: { categoryKey: 'ap', unit: `${apSubjectA} FRQ`, source: apSubjectA },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'ap', weekNum, 'subject_a_notes'),
        title: `${apSubjectA} — Notes Cleanup`,
        category: CATEGORY.AP,
        templateType: TEMPLATE.REVIEW,
        weekNum,
        requiresProof: false,
        assignment: `Clean up one page of notes for ${apSubjectA}.`,
        instructions: 'The page should include one key idea, one worked example, and one mistake to avoid.',
        checklist: ['Write the page cleanly'],
        payload: { categoryKey: 'ap', unit: `${apSubjectA} notes`, source: apSubjectA },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'ap', weekNum, 'subject_a_corrections'),
        title: `${apSubjectA} — Corrections`,
        category: CATEGORY.AP,
        templateType: TEMPLATE.REVIEW,
        weekNum,
        assignment: `Correct 3 misses from this week's ${apSubjectA} work.`,
        instructions: 'State what caused each miss and the corrected answer path.',
        checklist: ['Correct 3 misses'],
        payload: { categoryKey: 'ap', unit: `${apSubjectA} corrections`, source: apSubjectA },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'ap', weekNum, 'subject_b_mcq'),
        title: `${apSubjectB} — 20 MCQs`,
        category: CATEGORY.AP,
        templateType: TEMPLATE.LESSON,
        weekNum,
        assignment: `Complete 20 multiple-choice questions for ${apSubjectB}.`,
        instructions: 'Score the set and mark weak content areas.',
        checklist: ['Finish 20 MCQs', 'Score the set'],
        payload: { categoryKey: 'ap', unit: `${apSubjectB} weekly set`, source: apSubjectB },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'ap', weekNum, 'subject_b_frq'),
        title: `${apSubjectB} — 1 FRQ Outline`,
        category: CATEGORY.AP,
        templateType: TEMPLATE.FRQ,
        weekNum,
        assignment: `Outline one FRQ for ${apSubjectB}.`,
        instructions: 'Use the official prompt or the classroom-equivalent prompt for the week.',
        checklist: ['Complete one FRQ outline'],
        payload: { categoryKey: 'ap', unit: `${apSubjectB} FRQ`, source: apSubjectB },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'ap', weekNum, 'subject_b_notes'),
        title: `${apSubjectB} — Notes Cleanup`,
        category: CATEGORY.AP,
        templateType: TEMPLATE.REVIEW,
        weekNum,
        requiresProof: false,
        assignment: `Rewrite one page of notes for ${apSubjectB}.`,
        instructions: 'Keep only the core definitions, examples, and formulas.',
        checklist: ['Rewrite the page'],
        payload: { categoryKey: 'ap', unit: `${apSubjectB} notes`, source: apSubjectB },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'ap', weekNum, 'subject_b_corrections'),
        title: `${apSubjectB} — Corrections`,
        category: CATEGORY.AP,
        templateType: TEMPLATE.REVIEW,
        weekNum,
        assignment: `Correct 3 misses from this week's ${apSubjectB} work.`,
        instructions: 'Write the corrected answer and the reason the first answer failed.',
        checklist: ['Correct 3 misses'],
        payload: { categoryKey: 'ap', unit: `${apSubjectB} corrections`, source: apSubjectB },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'sat', weekNum, 'math'),
        title: `SAT Math — ${satFocus}`,
        category: 'sat',
        templateType: 'sat_module',
        weekNum,
        assignment: `Run one SAT math module focused on ${satFocus}.`,
        instructions: 'Complete 14 questions, record misses, and correct every wrong answer.',
        checklist: ['Finish 14 questions', 'Correct every miss'],
        payload: { categoryKey: 'sat', moduleName: `SAT Math ${satFocus}` },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'sat', weekNum, 'reading'),
        title: `SAT Reading/Writing — ${satFocus}`,
        category: 'sat',
        templateType: 'sat_module',
        weekNum,
        assignment: `Run one SAT reading/writing module focused on ${satFocus}.`,
        instructions: 'Complete 14 questions and record the exact rules or patterns missed.',
        checklist: ['Finish 14 questions', 'List the missed rules'],
        payload: { categoryKey: 'sat', moduleName: `SAT RW ${satFocus}` },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'sat', weekNum, 'review'),
        title: `SAT Review — Correct This Week's Misses`,
        category: 'sat',
        templateType: 'sat_review',
        weekNum,
        assignment: 'Correct every miss from this week\'s SAT modules.',
        instructions: 'The correction note should include the wrong move and the right move.',
        checklist: ['Correct every miss'],
        payload: { categoryKey: 'sat', moduleName: 'SAT review' },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'sat', weekNum, 'timed_mix'),
        title: 'SAT Mixed Timed Set — 18 Questions',
        category: 'sat',
        templateType: 'sat_module',
        weekNum,
        assignment: 'Run one 18-question mixed SAT set in one sitting.',
        instructions: 'Record the timer and list the first 3 questions that slowed you down.',
        checklist: ['Run the timer', 'List 3 slow questions'],
        payload: { categoryKey: 'sat', moduleName: 'SAT mixed timed set' },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'language', weekNum, 'vocab'),
        title: `${language} Vocab — 20 Words + 10 Sentences`,
        category: CATEGORY.LANGUAGE,
        templateType: TEMPLATE.LANGUAGE_PRACTICE,
        weekNum,
        assignment: `Learn 20 new ${language} words and use 10 of them in full sentences.`,
        instructions: 'The sentences should be original, not copied from a textbook.',
        checklist: ['Log 20 words', 'Write 10 sentences'],
        payload: { categoryKey: 'language', track: language },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'language', weekNum, 'listening'),
        title: `${language} Listening — 12 Minutes + Transcript Notes`,
        category: CATEGORY.LANGUAGE,
        templateType: TEMPLATE.LANGUAGE_PRACTICE,
        weekNum,
        assignment: `Do 12 minutes of ${language} listening and take transcript notes.`,
        instructions: 'Write down unfamiliar words and one sentence you can now understand.',
        checklist: ['Finish 12 minutes', 'Take notes'],
        payload: { categoryKey: 'language', track: language },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'language', weekNum, 'grammar'),
        title: `${language} Grammar — 12 Sentence Rewrite`,
        category: CATEGORY.LANGUAGE,
        templateType: TEMPLATE.LANGUAGE_PRACTICE,
        weekNum,
        assignment: `Rewrite 12 sentences in ${language} using this week's grammar focus.`,
        instructions: 'Keep the sentences short and correct. Fix every marked error.',
        checklist: ['Rewrite 12 sentences'],
        payload: { categoryKey: 'language', track: language },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'language', weekNum, 'writing'),
        title: `${language} Writing — 150-Word Response`,
        category: CATEGORY.LANGUAGE,
        templateType: TEMPLATE.LANGUAGE_PRACTICE,
        weekNum,
        assignment: `Write a 150-word response in ${language}.`,
        instructions: 'Use at least 5 words from the vocab task.',
        checklist: ['Write 150 words'],
        payload: { categoryKey: 'language', track: language },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'reading', weekNum, 'part_a'),
        title: `Reading Annotation — ${readingText} Pages 1-12`,
        category: CATEGORY.RESEARCH,
        templateType: 'reading_log',
        weekNum,
        assignment: `Annotate pages 1-12 of this week's ${readingText}.`,
        instructions: 'Mark the main claim, one supporting move, and one question.',
        checklist: ['Annotate 12 pages'],
        payload: { categoryKey: 'reading', textTitle: readingText },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'reading', weekNum, 'part_b'),
        title: `Reading Annotation — ${readingText} Pages 13-24`,
        category: CATEGORY.RESEARCH,
        templateType: 'reading_log',
        weekNum,
        assignment: `Annotate pages 13-24 of this week's ${readingText}.`,
        instructions: 'Continue the same text. Flag at least 3 lines worth revisiting.',
        checklist: ['Annotate 12 pages'],
        payload: { categoryKey: 'reading', textTitle: readingText },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'reading', weekNum, 'notes'),
        title: `Reading Notes — 3 Claims + 3 Quotes`,
        category: CATEGORY.RESEARCH,
        templateType: 'reading_log',
        weekNum,
        requiresProof: false,
        assignment: 'Pull out 3 claims and 3 quotes from this week\'s reading.',
        instructions: 'Each quote should connect to one claim.',
        checklist: ['Write 3 claims', 'Add 3 quotes'],
        payload: { categoryKey: 'reading', textTitle: readingText },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'reading', weekNum, 'response'),
        title: 'Reading Response — 250 Words',
        category: CATEGORY.RESEARCH,
        templateType: TEMPLATE.WRITING,
        weekNum,
        assignment: 'Write a 250-word response to this week\'s reading.',
        instructions: 'Focus on one claim. Use at least one direct quote.',
        checklist: ['Write 250 words'],
        payload: { categoryKey: 'reading', textTitle: readingText },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'writing', weekNum, 'draft'),
        title: `Writing Draft — ${writingMode}`,
        category: CATEGORY.WRITING,
        templateType: TEMPLATE.WRITING,
        weekNum,
        assignment: `Write one ${writingMode} draft.`,
        instructions: 'The draft should be complete, not bullet points.',
        checklist: ['Write the full draft'],
        payload: { categoryKey: 'writing', draftType: writingMode },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'writing', weekNum, 'revision'),
        title: 'Writing Revision — Line Edit 250 Words',
        category: CATEGORY.WRITING,
        templateType: TEMPLATE.WRITING,
        weekNum,
        assignment: 'Line edit 250 words from this week\'s writing draft.',
        instructions: 'Tighten wording, cut repetition, and fix sentence boundaries.',
        checklist: ['Edit 250 words'],
        payload: { categoryKey: 'writing', draftType: 'line edit' },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'writing', weekNum, 'imitation'),
        title: 'Writing Imitation — Rewrite 1 Strong Paragraph',
        category: CATEGORY.WRITING,
        templateType: TEMPLATE.WRITING,
        weekNum,
        assignment: 'Choose one strong paragraph and rewrite it in your own content.',
        instructions: 'Keep the structure. Change the ideas.',
        checklist: ['Rewrite 1 paragraph'],
        payload: { categoryKey: 'writing', draftType: 'imitation' },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'writing', weekNum, 'reflection'),
        title: 'Writing Reflection — 3 Craft Notes',
        category: CATEGORY.WRITING,
        templateType: TEMPLATE.REVIEW,
        weekNum,
        requiresProof: false,
        assignment: 'Write 3 craft notes from this week\'s writing.',
        instructions: 'Each note should identify one habit to keep or fix.',
        checklist: ['Write 3 notes'],
        payload: { categoryKey: 'writing', draftType: 'reflection' },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'stem', weekNum, 'build'),
        title: `STEM Build — ${stemTrack}`,
        category: CATEGORY.PROJECT,
        templateType: TEMPLATE.PROJECT,
        weekNum,
        assignment: `Complete one concrete ${stemTrack} build step.`,
        instructions: 'The result must produce an artifact: code, notebook output, or screenshot.',
        checklist: ['Finish one build step', 'Save one artifact'],
        payload: { categoryKey: 'stem_project', projectName: stemTrack },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'stem', weekNum, 'test'),
        title: `STEM Test — ${stemTrack}`,
        category: CATEGORY.PROJECT,
        templateType: TEMPLATE.PROJECT,
        weekNum,
        assignment: `Run 3 checks on this week's ${stemTrack} work.`,
        instructions: 'Log what passed, what failed, and what changed next.',
        checklist: ['Run 3 checks', 'Log the results'],
        payload: { categoryKey: 'stem_project', projectName: stemTrack },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'stem', weekNum, 'artifact'),
        title: `STEM Artifact — ${stemTrack}`,
        category: CATEGORY.PROJECT,
        templateType: TEMPLATE.PROJECT,
        weekNum,
        assignment: `Upload one artifact from this week's ${stemTrack} work.`,
        instructions: 'Use a screenshot, notebook, code diff, or short demo clip.',
        checklist: ['Upload one artifact'],
        payload: { categoryKey: 'stem_project', projectName: stemTrack },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'stem', weekNum, 'summary'),
        title: `STEM Summary — ${stemTrack}`,
        category: CATEGORY.PROJECT,
        templateType: TEMPLATE.PROJECT,
        weekNum,
        requiresProof: false,
        assignment: `Write a short summary for this week's ${stemTrack} work.`,
        instructions: 'State what shipped, what failed, and the next step.',
        checklist: ['Write the summary'],
        payload: { categoryKey: 'stem_project', projectName: stemTrack },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'leadership', weekNum, 'outreach'),
        title: 'Leadership Outreach — 2 Updates or Requests',
        category: CATEGORY.LEADERSHIP,
        templateType: TEMPLATE.ACTIVITY_LOG,
        weekNum,
        assignment: 'Send 2 concrete updates or requests tied to current activities or leadership work.',
        instructions: 'Each message should ask for one clear next step or share one concrete progress point.',
        checklist: ['Send 2 messages', 'Log who received them'],
        payload: { categoryKey: 'leadership', activityName: 'leadership outreach' },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'leadership', weekNum, 'log'),
        title: 'Leadership Log — Impact and Next Step',
        category: CATEGORY.LEADERSHIP,
        templateType: TEMPLATE.ACTIVITY_LOG,
        weekNum,
        requiresProof: false,
        assignment: 'Log one measurable impact point and one next step for leadership work.',
        instructions: 'Use numbers when possible.',
        checklist: ['Write one impact point', 'Write one next step'],
        payload: { categoryKey: 'leadership', activityName: 'leadership log' },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'health', weekNum, 'baseline'),
        title: 'Health Baseline — 7 Sleep Entries + 3 Workouts',
        category: CATEGORY.LIFE,
        templateType: TEMPLATE.ACTIVITY_LOG,
        weekNum,
        requiresProof: false,
        assignment: 'Log 7 sleep entries and 3 workouts for the week.',
        instructions: 'Record the actual numbers, not estimates.',
        checklist: ['Log 7 sleep entries', 'Log 3 workouts'],
        payload: { categoryKey: 'health' },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'health', weekNum, 'reset'),
        title: 'Health Reset — 1 Workout + Weekly Check',
        category: CATEGORY.LIFE,
        templateType: TEMPLATE.ACTIVITY_LOG,
        weekNum,
        requiresProof: false,
        assignment: 'Complete one deliberate workout and one weekly health check.',
        instructions: 'Record sleep, exercise, and energy honestly.',
        checklist: ['Complete the workout', 'Fill out the health check'],
        payload: { categoryKey: 'health' },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'college', weekNum, 'report'),
        title: `${collegeTrack} — Guided Report`,
        category: CATEGORY.COLLEGE,
        templateType: TEMPLATE.COLLEGE_RESEARCH,
        weekNum,
        assignment: `Complete one ${collegeTrack} using the matching report template.`,
        instructions: 'Fill every section with concrete evidence. No placeholders.',
        checklist: ['Complete every section', 'List sources used'],
        payload: { categoryKey: 'college', schoolName: collegeTrack },
      }),
      weeklyPacketTask({
        id: taskId('weekly_packet', 'college', weekNum, 'revision'),
        title: `${collegeTrack} — Revision Pass`,
        category: CATEGORY.COLLEGE,
        templateType: TEMPLATE.COLLEGE_RESEARCH,
        weekNum,
        requiresProof: false,
        assignment: `Revise one earlier ${collegeTrack} so the final version is clean and specific.`,
        instructions: 'Tighten vague claims, fix sourcing, and remove filler.',
        checklist: ['Revise one prior report'],
        payload: { categoryKey: 'college', schoolName: `${collegeTrack} revision` },
      })
    );
  }

  return tasks;
}

// ───────────────────────────────────────────────────────────────────────────────
// FINAL AGGREGATION
// ───────────────────────────────────────────────────────────────────────────────


function flattenAllTaskCollections() {
  return [
    ...ALL_TASK_COLLECTIONS.flat(),
    ...generateWeeklyExecutionPackets(),
  ];
}

const SEEDED_TASKS = flattenAllTaskCollections();

// ───────────────────────────────────────────────────────────────────────────────
// PART 14 — NORMALIZATION, VALIDATION, DEDUPING, SORTING, SANITY CHECKS
// ───────────────────────────────────────────────────────────────────────────────

function normalizeString(value) {
  return String(value == null ? '' : value).trim();
}

function normalizeTaskTitle(title) {
  return normalizeString(title).replace(/\s+/g, ' ');
}

function normalizeTemplatePrefill(prefill) {
  if (!prefill || typeof prefill !== 'object') return {};
  return Object.fromEntries(
    Object.entries(prefill).filter(([, value]) => value !== undefined)
  );
}

function normalizeTaskRecord(task) {
  return {
    ...task,
    id: normalizeString(task.id),
    title: normalizeTaskTitle(task.title),
    category: normalizeString(task.category),
    templateType: normalizeString(task.templateType),
    requiresProof: Boolean(task.requiresProof),
    weekNum: Number.isFinite(Number(task.weekNum)) ? Number(task.weekNum) : parseInt(String(task.weekId ?? "").replace("W", ""), 10),
    templatePrefill: normalizeTemplatePrefill(task.templatePrefill),
  };
}

function sortTasksStable(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.weekNum !== b.weekNum) return a.weekNum - b.weekNum;
    if (String(a.category) !== String(b.category)) {
      return String(a.category).localeCompare(String(b.category));
    }
    if (String(a.title) !== String(b.title)) {
      return String(a.title).localeCompare(String(b.title));
    }
    return String(a.id).localeCompare(String(b.id));
  });
}

function dedupeTasksById(tasks) {
  const seen = new Map();

  for (const rawTask of tasks) {
    const task = normalizeTaskRecord(rawTask);
    if (!task.id) {
      throw new Error(`Encountered task with empty id: ${JSON.stringify(rawTask)}`);
    }
    seen.set(task.id, task);
  }

  return Array.from(seen.values());
}

  function validateTaskShape(task) {
    if (!task.id) throw new Error(`Task missing id: ${JSON.stringify(task)}`);
    if (!task.title) throw new Error(`Task missing title: ${task.id}`);
    if (!task.category) throw new Error(`Task missing category: ${task.id}`);
    if (!task.templateType) throw new Error(`Task missing templateType: ${task.id}`);
    const weekNum = task.weekNum;
    if (!Number.isInteger(weekNum) || weekNum < 1 || weekNum > MAX_WEEK) {
      throw new Error(`Task has invalid weekNum (${weekNum}): ${task.id}`);
    }
    if (typeof task.requiresProof !== 'boolean') {
      throw new Error(`Task requiresProof must be boolean: ${task.id}`);
    }
    if (!task.templatePrefill || typeof task.templatePrefill !== 'object') {
      throw new Error(`Task templatePrefill missing/object invalid: ${task.id}`);
    }
  }

function validateAllTasks(tasks) {
  for (const task of tasks) {
    validateTaskShape(task);
  }
  return tasks;
}

function assertNoDuplicateIds(tasks) {
  const seen = new Set();

  for (const task of tasks) {
    if (seen.has(task.id)) {
      throw new Error(`Duplicate task id detected: ${task.id}`);
    }
    seen.add(task.id);
  }
}

function assertWeekCoverage(tasks) {
  const weekSet = new Set(tasks.map(task => task.weekNum));

  for (let weekNum = 1; weekNum <= MAX_WEEK; weekNum += 1) {
    if (!weekSet.has(weekNum)) {
      throw new Error(`No tasks found for week ${weekNum}`);
    }
  }
}

function assertCategoryCoverage(tasks) {
  const categorySet = new Set(tasks.map(task => task.category));

  const requiredCategories = [
    CATEGORY.KHAN_MATH,
    CATEGORY.LANGUAGE,
    CATEGORY.AP,
    CATEGORY.RECURRING,
  ].filter(Boolean);

  for (const category of requiredCategories) {
    if (!categorySet.has(category)) {
      throw new Error(`Missing required category coverage: ${category}`);
    }
  }
}

function buildWeekHistogram(tasks) {
  const map = new Map();

  for (let weekNum = 1; weekNum <= MAX_WEEK; weekNum += 1) {
    map.set(weekNum, 0);
  }

  for (const task of tasks) {
    map.set(task.weekNum, (map.get(task.weekNum) || 0) + 1);
  }

  return map;
}

function assertNoEmptyWeeksAndReasonableDensity(tasks) {
  const histogram = buildWeekHistogram(tasks);

  for (const [weekNum, count] of histogram.entries()) {
    if (count <= 0) {
      throw new Error(`Week ${weekNum} has zero tasks`);
    }
    if (count < 10) {
      throw new Error(`Week ${weekNum} has suspiciously low density: ${count} tasks`);
    }
  }
}

function summarizeByCategory(tasks) {
  const counts = new Map();

  for (const task of tasks) {
    counts.set(task.category, (counts.get(task.category) || 0) + 1);
  }

  return Object.fromEntries(
    Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  );
}

function summarizeByTemplateType(tasks) {
  const counts = new Map();

  for (const task of tasks) {
    counts.set(task.templateType, (counts.get(task.templateType) || 0) + 1);
  }

  return Object.fromEntries(
    Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  );
}

function summarizeByPhase(tasks) {
  const counts = new Map();

  for (const task of tasks) {
    const phase =
      task.templatePrefill?.phase ||
      task.templatePrefill?.phaseLabel ||
      phaseLabelForWeek(task.weekNum);

    counts.set(phase, (counts.get(phase) || 0) + 1);
  }

  return Object.fromEntries(
    Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  );
}

function summarizeByYearBand(tasks) {
  const counts = new Map();

  for (const task of tasks) {
    const yearBand =
      task.templatePrefill?.yearBand ||
      yearBandForWeek(task.weekNum);

    counts.set(yearBand, (counts.get(yearBand) || 0) + 1);
  }

  return Object.fromEntries(
    Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  );
}

function summarizeByQuarter(tasks) {
  const counts = new Map();

  for (const task of tasks) {
    const quarter =
      task.templatePrefill?.quarterNumber ||
      quarterForWeekNumber(task.weekNum);

    counts.set(quarter, (counts.get(quarter) || 0) + 1);
  }

  return Object.fromEntries(
    Array.from(counts.entries()).sort((a, b) => Number(a[0]) - Number(b[0]))
  );
}

function buildValidatedTaskSet(rawTasks) {
  const deduped = dedupeTasksById(rawTasks);
  const validated = validateAllTasks(deduped);
  const sorted = sortTasksStable(validated);

  assertNoDuplicateIds(sorted);
  assertWeekCoverage(sorted);
  assertCategoryCoverage(sorted);
  assertNoEmptyWeeksAndReasonableDensity(sorted);

  return sorted;
}

// ───────────────────────────────────────────────────────────────────────────────
// PART 15 — PRISMA WRITEBACK, UPSERT PIPELINE, DB TRANSACTION EXECUTION
// ───────────────────────────────────────────────────────────────────────────────

const DEFAULT_STUDENT_EMAIL = '1074649@lammersvilleusd.net';
const DEFAULT_STUDENT_PASSWORD = 'Loveypants.5000';

function actualDateForWeekDay(weekNum, dayOfWeek) {
  const monday = addDays(PLAN_START, (weekNum - 1) * 7);
  return due(isoDate(addDays(monday, clamp(dayOfWeek, 0, 6))));
}

function categoryKeyForSeedTask(task) {
  const explicit = normalizeString(task.templatePrefill?.categoryKey);
  if (explicit) return explicit;

  if (task.templatePrefill?.recurringSystem === 'daily_9_slot') {
    const slot = Number(task.templatePrefill?.slot);
    if (slot === 0) return 'competition_math';
    if (slot === 1) return 'curriculum_math';
    if (slot === 2) return 'ap';
    if (slot === 3) return 'language';
    if (slot === 4) return 'reading';
    if (slot === 5) return 'writing';
    if (slot === 6) return 'stem_project';
    if (slot === 7) return 'health';
    if (slot === 8) return 'leadership';
  }

  const category = normalizeString(task.category).toLowerCase();
  const templateType = normalizeString(task.templateType).toLowerCase();
  const title = normalizeTaskTitle(task.title).toLowerCase();

  if (['amc8', 'amc10', 'aime'].includes(category)) return 'competition_math';
  if (category === 'khan_math') return 'curriculum_math';
  if (category === 'ap' || templateType.includes('ap_') || templateType === 'timed_exam') return 'ap';
  if (category === 'sat' || templateType.includes('sat')) return 'sat';
  if (category === 'language') return 'language';
  if (category === 'writing') return 'writing';
  if (category === 'project') return 'stem_project';
  if (category === 'leadership') return 'leadership';
  if (category === 'college' || category === 'application') return 'college';
  if (category === 'life' && title.includes('health')) return 'health';
  if (category === 'research' || title.includes('reading')) return 'reading';
  if (title.includes('cold email') || title.includes('outreach')) return 'leadership';
  return 'generic';
}

function dueDateForSeedTask(task) {
  if (task.templatePrefill?.recurringSystem === 'daily_9_slot') {
    const weekNum = Number(task.weekNum);
    const slot = Number(task.templatePrefill?.slot);
    const dayOfWeek = Number(task.templatePrefill?.dayOfWeek || 0);

    if (slot >= 7) {
      return due(isoDate(weekEndDate(weekNum)));
    }

    return actualDateForWeekDay(weekNum, dayOfWeek);
  }

  if (task.dueDate instanceof Date) return task.dueDate;
  return due(isoDate(weekEndDate(task.weekNum)));
}

function moneyProfileForSeedTask(task) {
  const kind = categoryKeyForSeedTask(task);
  const isDailyRecurring = task.templatePrefill?.recurringSystem === 'daily_9_slot' && Number(task.templatePrefill?.slot) <= 6;
  const isWeeklyRecurring = task.templatePrefill?.recurringSystem === 'daily_9_slot' && Number(task.templatePrefill?.slot) >= 7;
  const isTimed = String(task.templateType).toLowerCase().includes('timed');
  const isReview = String(task.templateType).toLowerCase() === 'review';

  if (isDailyRecurring) {
    return { rewardCents: 125, penaltyLateCents: 325, penaltyMissCents: 800 };
  }

  if (isWeeklyRecurring) {
    return { rewardCents: 200, penaltyLateCents: 500, penaltyMissCents: 1200 };
  }

  if (['competition_math', 'ap', 'sat', 'stem_project', 'college'].includes(kind)) {
    return {
      rewardCents: isTimed ? 700 : 500,
      penaltyLateCents: isTimed ? 1600 : 1400,
      penaltyMissCents: isTimed ? 3200 : 2800,
    };
  }

  if (['curriculum_math', 'language', 'reading', 'writing'].includes(kind)) {
    return {
      rewardCents: isReview ? 250 : 350,
      penaltyLateCents: isReview ? 700 : 900,
      penaltyMissCents: isReview ? 1400 : 1800,
    };
  }

  if (['leadership', 'health'].includes(kind)) {
    return { rewardCents: 225, penaltyLateCents: 600, penaltyMissCents: 1500 };
  }

  return { rewardCents: 250, penaltyLateCents: 700, penaltyMissCents: 1600 };
}

function defaultAssignmentForSeedTask(task, kind) {
  const title = normalizeTaskTitle(task.title);
  const unit = task.templatePrefill?.unit || task.templatePrefill?.topic || task.templatePrefill?.moduleName;
  const track = task.templatePrefill?.track || task.templatePrefill?.projectName;

  if (kind === 'competition_math') return `Complete the exact set named in the title. No substitutions.`;
  if (kind === 'curriculum_math') return `Finish the exact ${unit || 'curriculum'} block named in the title.`;
  if (kind === 'ap') return `Complete the exact AP assignment named in the title.`;
  if (kind === 'sat') return `Complete the exact SAT module named in the title.`;
  if (kind === 'language') return `Complete the exact ${track || 'language'} assignment named in the title.`;
  if (kind === 'reading') return `Finish the reading task named in the title and keep clear notes.`;
  if (kind === 'writing') return `Finish the writing task named in the title as a complete draft.`;
  if (kind === 'stem_project') return `Complete the exact ${track || 'project'} step named in the title.`;
  if (kind === 'leadership') return `Complete the leadership task named in the title with one concrete deliverable.`;
  if (kind === 'health') return `Complete the health task named in the title and record the actual numbers.`;
  if (kind === 'college') return `Complete the exact report or strategy task named in the title.`;
  return title;
}

function defaultInstructionsForSeedTask(task, kind) {
  if (kind === 'competition_math') return 'Record attempted and correct counts. Update the error log. Submit proof through the form.';
  if (kind === 'curriculum_math') return 'Record blocks completed, mastery checks, and one short reflection.';
  if (kind === 'ap') return 'Record the source, question counts, and written FRQ or notes where required.';
  if (kind === 'sat') return 'Record the module, timed status, question counts, and every corrected miss.';
  if (kind === 'language') return 'Log new vocabulary, grammar work, and one piece of proof.';
  if (kind === 'reading') return 'Capture the text, page range, and the main idea or response.';
  if (kind === 'writing') return 'Submit the draft link and the next revision step.';
  if (kind === 'stem_project') return 'Upload one artifact and note the next blocker or next step.';
  if (kind === 'leadership') return 'Log the actual outreach, impact, and follow-up.';
  if (kind === 'health') return 'Use real sleep, exercise, and energy numbers.';
  if (kind === 'college') return 'Fill every section with concrete evidence and sources.';
  return 'Complete the task exactly as assigned and submit structured proof.';
}

function buildSeedTaskTemplatePrefill(task) {
  const kind = categoryKeyForSeedTask(task);
  return {
    ...normalizeTemplatePrefill(task.templatePrefill),
    categoryKey: kind,
    assignment: task.templatePrefill?.assignment || defaultAssignmentForSeedTask(task, kind),
    instructions: task.templatePrefill?.instructions || defaultInstructionsForSeedTask(task, kind),
    proofUploadUrl: task.templatePrefill?.proofUploadUrl || PROOF_DRIVE_URL,
    weekNum: task.weekNum,
  };
}

function buildSeedTaskDescription(task) {
  if (task.description) return task.description;
  const kind = categoryKeyForSeedTask(task);
  const labelMap = {
    competition_math: 'Competition Math',
    curriculum_math: 'Curriculum Math',
    ap: 'AP Study',
    sat: 'SAT Prep',
    language: 'Language',
    reading: 'Reading',
    writing: 'Writing',
    stem_project: 'STEM Project',
    leadership: 'Leadership',
    health: 'Health',
    college: 'College Strategy',
    generic: 'Task',
  };
  return `${labelMap[kind] || 'Task'} · Week ${task.weekNum}`;
}

function buildQuarterSeedRecords() {
  return QUARTERS.map(quarter => ({
    id: quarter.id,
    label: quarter.label,
    startDate: new Date(`${quarter.startDate}T00:00:00.000Z`),
    endDate: new Date(`${quarter.endDate}T23:59:59.999Z`),
    weekStart: quarter.weekStart,
    weekEnd: quarter.weekEnd,
    grade: quarter.grade,
    focus: quarter.focus,
    description: quarter.focus,
  }));
}

function buildPlanWeekSeedRecords() {
  return range(1, MAX_WEEK).map(weekNum => {
    const quarter = QUARTERS.find(item => weekNum >= item.weekStart && weekNum <= item.weekEnd) || QUARTERS[0];
    const [apSubject] = apSubjectsForWeek(weekNum);

    return {
      id: weekId(weekNum),
      weekNumber: weekNum,
      label: `Week ${weekNum}`,
      startDate: weekStartDate(weekNum),
      endDate: weekEndDate(weekNum),
      quarterId: quarter.id,
      focus: quarter.focus,
      amcTopic: competitionTrackForWeek(weekNum).examLabel,
      khanLevel: curriculumTopicForWeek(weekNum),
      apSubject,
      creativeProject: stemTrackForWeek(weekNum),
    };
  });
}

async function seedReferenceData(prismaClient) {
  for (const quarter of buildQuarterSeedRecords()) {
    await prismaClient.quarter.upsert({
      where: { id: quarter.id },
      update: quarter,
      create: quarter,
    });
  }

  for (const week of buildPlanWeekSeedRecords()) {
    await prismaClient.planWeek.upsert({
      where: { id: week.id },
      update: week,
      create: week,
    });
  }
}

async function seedDefaultUsers(prismaClient) {
  const passwordHash = await bcrypt.hash(DEFAULT_STUDENT_PASSWORD, 10);

  await prismaClient.user.upsert({
    where: { email: DEFAULT_STUDENT_EMAIL },
    update: {
      password: passwordHash,
      role: 'student',
      name: 'Student',
      isActive: true,
      disabled: false,
    },
    create: {
      email: DEFAULT_STUDENT_EMAIL,
      password: passwordHash,
      role: 'student',
      name: 'Student',
      isActive: true,
      disabled: false,
    },
  });
}

function buildPrismaTaskData(task) {
  const templatePrefill = buildSeedTaskTemplatePrefill(task);
  const dueDate = dueDateForSeedTask(task);
  const economics = moneyProfileForSeedTask(task);

  return {
    id: task.id,
    title: task.title,
    category: task.category,
    templateType: task.templateType,
    dueDate,
    requiresProof: task.requiresProof,
    status: 'pending',
    rewardCents: economics.rewardCents,
    penaltyLateCents: economics.penaltyLateCents,
    penaltyMissCents: economics.penaltyMissCents,
    quarterId: task.quarterId || quarterForWeek(task.weekNum),
    weekNum: task.weekNum,
    weekId: task.weekId || weekId(task.weekNum),
    templatePrefill,
    description: buildSeedTaskDescription(task),
    resourceUrl: task.resourceUrl || null,
  };
}

function buildPrismaUpsertArgs(task) {
  const data = buildPrismaTaskData(task);

  return {
    where: { id: task.id },
    update: {
      title: data.title,
      category: data.category,
      templateType: data.templateType,
      dueDate: data.dueDate,
      requiresProof: data.requiresProof,
      rewardCents: data.rewardCents,
      penaltyLateCents: data.penaltyLateCents,
      penaltyMissCents: data.penaltyMissCents,
      quarterId: data.quarterId,
      weekNum: data.weekNum,
      weekId: data.weekId,
      templatePrefill: data.templatePrefill,
      description: data.description,
      resourceUrl: data.resourceUrl,
    },
    create: data,
  };
}

function chunkArray(values, chunkSize) {
  const chunks = [];

  for (let i = 0; i < values.length; i += chunkSize) {
    chunks.push(values.slice(i, i + chunkSize));
  }

  return chunks;
}

async function upsertSingleTask(tx, task) {
  return tx.task.upsert(buildPrismaUpsertArgs(task));
}

async function upsertTaskBatch(tx, tasks) {
  return Promise.all(tasks.map(task => upsertSingleTask(tx, task)));
}

async function writeTasksInChunks(tx, tasks, chunkSize = 250) {
  const chunks = chunkArray(tasks, chunkSize);
  const results = [];

  for (const chunk of chunks) {
    const batchResults = await upsertTaskBatch(tx, chunk);
    results.push(...batchResults);
  }

  return results;
}

async function clearLegacyGeneratedTasks(tx) {
  return tx.task.deleteMany({
    where: {
      OR: [
        { id: { startsWith: 'khan_' } },
        { id: { startsWith: 'amc8_' } },
        { id: { startsWith: 'amc10_' } },
        { id: { startsWith: 'aime_' } },
        { id: { startsWith: 'lang_' } },
        { id: { startsWith: 'ap_' } },
        { id: { startsWith: 'recw' } },
        { id: { startsWith: 'reading_' } },
        { id: { startsWith: 'writing_' } },
        { id: { startsWith: 'stem_' } },
        { id: { startsWith: 'health_' } },
        { id: { startsWith: 'college_' } },
        { id: { startsWith: 'coldemail_' } },
        { id: { startsWith: 'meta_' } },
        { id: { startsWith: 'phase_checkpoint_' } },
        { id: { startsWith: 'yearband_checkpoint_' } },
      ],
    },
  });
}

async function seedTasksToDatabase(prismaClient, tasks, options = {}) {
  const {
    chunkSize = 250,
    clearLegacy = false,
  } = options;

  let cleared = null;

  if (clearLegacy) {
    cleared = await clearLegacyGeneratedTasks(prismaClient);
  }

  const written = await writeTasksInChunks(prismaClient, tasks, chunkSize);

  return {
    cleared,
    writtenCount: written.length,
    firstTaskId: written[0]?.id || null,
    lastTaskId: written[written.length - 1]?.id || null,
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// PART 16 — FINAL TASK BUILD, LOGGING, ENTRYPOINT, EXPORTS
// ───────────────────────────────────────────────────────────────────────────────

function formatJson(value) {
  return JSON.stringify(value, null, 2);
}

// SEEDED_TASKS must already be defined above from Parts 1–13/17 as the raw union.
const FINAL_TASKS = buildValidatedTaskSet(SEEDED_TASKS);

const TASK_SUMMARY = {
  totalTasks: FINAL_TASKS.length,
  byCategory: summarizeByCategory(FINAL_TASKS),
  byTemplateType: summarizeByTemplateType(FINAL_TASKS),
  byPhase: summarizeByPhase(FINAL_TASKS),
  byYearBand: summarizeByYearBand(FINAL_TASKS),
  byQuarter: summarizeByQuarter(FINAL_TASKS),
};

function logSeedSummary() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Massive seed.js summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total tasks: ${TASK_SUMMARY.totalTasks}`);
  console.log('By category:');
  console.log(formatJson(TASK_SUMMARY.byCategory));
  console.log('By templateType:');
  console.log(formatJson(TASK_SUMMARY.byTemplateType));
  console.log('By phase:');
  console.log(formatJson(TASK_SUMMARY.byPhase));
  console.log('By yearBand:');
  console.log(formatJson(TASK_SUMMARY.byYearBand));
  console.log('By quarter:');
  console.log(formatJson(TASK_SUMMARY.byQuarter));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

function logSeedResult(result) {
  console.log('Seed writeback result:');
  console.log(formatJson(result));
}

function logSeedError(error) {
  console.error('Seed failed.');
  console.error(error);
}

async function runTaskSeed(prismaClient, options = {}) {
  return seedTasksToDatabase(prismaClient, FINAL_TASKS, options);
}

async function main() {
  logSeedSummary();
  await seedReferenceData(prisma);
  await seedDefaultUsers(prisma);

  const result = await runTaskSeed(prisma, {
    chunkSize: 250,
    clearLegacy: false,
  });

  logSeedResult(result);
}

if (require.main === module) {
  main()
    .catch(error => {
      logSeedError(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = {
  PLAN_START,
  PROOF_DRIVE_URL,
  CATEGORY,
  TEMPLATE,
  KHAN_MATH_TASKS,
  AMC8_TASKS,
  AMC10_TASKS,
  AIME_TASKS,
  LANGUAGE_TASKS,
  AP_TASKS,
  RECURRING_TASKS,
  READING_TASKS,
  WRITING_TASKS,
  STEM_TASKS,
  HEALTH_TASKS,
  COLLEGE_TASKS,
  COLD_EMAIL_TASKS,
  META_TASKS,
  SEEDED_TASKS,
  FINAL_TASKS,
  TASK_SUMMARY,
  quarterForWeekNumber,
  phaseLabelForWeek,
  yearBandForWeek,
  seasonForWeek,
  buildValidatedTaskSet,
  buildPrismaTaskData,
  buildPrismaUpsertArgs,
  seedTasksToDatabase,
  runTaskSeed,
  main,
};
