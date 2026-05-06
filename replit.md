# Ultimate Tracker — Long-Term Academic Planning Dashboard

## Overview
A fullstack web application for tracking student academic tasks, habits, submissions, and progress toward a top US university. Built for a specific student (Avni, 7th grade → university) with admin, parent, and student roles.

## Architecture
- **Frontend**: React + Vite (port 5000)
- **Backend**: Express.js + Prisma ORM (port 8000)
- **Database**: PostgreSQL (Replit managed)

## Project Structure
```
/
├── client/          # React + Vite frontend
│   ├── src/
│   │   ├── pages/           # Full page components
│   │   ├── components/      # Shared UI + Layout.jsx
│   │   │   └── templates/   # 15 task submission templates
│   │   ├── utils/           # Auth context, API client, helpers
│   │   └── styles/index.css # Single design system stylesheet
│   └── vite.config.js       # host 0.0.0.0, port 5000, proxy /api -> :8000
├── server/          # Express.js backend
│   ├── src/
│   │   ├── index.js         # Entry point (port from PORT env or 8000)
│   │   ├── routes/          # auth, tasks, submissions, habits, ledger, feedback, quarters, weeks, admin, stats, user
│   │   ├── middleware/auth.js  # JWT authentication
│   │   └── config/roles.js  # Hardcoded allowed emails & roles
│   └── prisma/
│       ├── schema.prisma    # Database schema
│       ├── seed.js          # Database seeder (main orchestrator)
│       └── seeds/ap/        # AP expansion engine + course definitions
└── package.json     # Root - concurrently scripts
```

## Authorized Users (hardcoded in server/src/config/roles.js)
- **Admin**: arpituppal2@gmail.com
- **Parents**: suresh.uppal@gmail.com, priyankauppal15@gmail.com
- **Student**: 1074649@lammersvilleusd.net (default role for all other emails)

## Workflows
- **Start application** - `cd client && npm run dev` (port 5000, webview)
- **Backend API** - `cd server && npm run dev` (port 8000, console)

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection (Replit managed)
- `DIRECT_URL` - Direct DB connection for Prisma (same as DATABASE_URL)
- `JWT_SECRET` - JWT signing secret
- `PORT` - Backend server port (8000)

## Database
Run `cd server && npx prisma db push` to sync schema changes.
Run `cd server && npx prisma db seed` to re-seed all tasks (idempotent upserts).

---

## Template System — 15 Templates

All templates live in `client/src/components/templates/`. The TEMPLATE_MAP in `client/src/pages/TaskDetail.jsx` maps templateType strings to components.

| Template | Keys | Purpose |
|----------|------|---------|
| AmcTemplate | `amc`, `amc_topic` | AMC/AIME competition math |
| KhanTemplate | `khan`, `khan_math` | Khan Academy completion proof |
| WeeklyPreviewTemplate | `weekly_preview` | Weekly planning & review |
| ApLessonTemplate | `ap`, `ap_lesson`, `LESSON` | AP study sessions |
| ApFrqTemplate | `ap_frq` | AP free-response practice |
| TimedExamTemplate | `timed_exam` | Timed full-length exams |
| ReviewTemplate | `review`, `block_review` | Error analysis post-exam |
| LanguageTemplate | `language`, `language_track` | Michel Thomas audio sessions |
| ResearchTemplate | `research` | Career/college/academic deep dives |
| WritingTemplate | `writing` | Essays, personal statements, drafts |
| ActivityLogTemplate | `activity_log`, `career` | EC/volunteer/activity logs |
| ApplicationTemplate | `college`, `application` | College application tracking |
| **SATTemplate** | `sat`, `sat_prep` | SAT/ACT practice with section scores |
| **ReadingLogTemplate** | `reading_log`, `reading` | Book tracking + college connection |
| **InterviewPrepTemplate** | `interview`, `interview_prep` | College/program interview prep |

---

## Admin Panel (client/src/pages/AdminPanel.jsx)
Task Wizard supports 16 task types: AMC, Khan, AP Lesson, AP FRQ, Timed Exam, Error Review, SAT/ACT Prep, Career/EC, Reading Log, Writing, Research, College Prep, Interview Prep, Weekly, Quarter Review, General.

TEMPLATE_FIELDS and TEMPLATE_PREVIEW_SCHEMA are keyed by templateType and include all 16 types including the 3 new ones added May 2026.

---

## Database State (as of May 2026 — EXPANDED)
**Total tasks: 16,226**

### Task Breakdown by Category
| Category | Count | Notes |
|----------|-------|-------|
| career | 3,240 | STEM/coding + writing (daily recurring) |
| college | 1,965 | Reading sessions + college prep tasks |
| daily | 1,617 | Health & reflection (daily recurring) |
| language | 1,617 | Spanish/Russian daily practice |
| khan | 1,617 | Khan Academy curriculum (daily recurring) |
| amc | 1,617 | Competition math daily drills |
| ap | 1,617 | AP content study (daily recurring) |
| KHAN_MATH | 232 | Khan curriculum milestone tasks |
| AP_CALC_BC | 198 | AP course tasks |
| AP_BIO | 195 | AP course tasks |
| AP_CHEM | 188 | AP course tasks |
| AP_CSA | 171 | AP course tasks |
| AP_PSYCH | 170 | AP course tasks |
| AP_PHYS1 | 169 | AP course tasks |
| AP_APES | 168 | AP course tasks |
| AP_CSP | 163 | AP course tasks |
| AP_SPANISH | 163 | AP course tasks |
| AP_HUGEO | 159 | AP course tasks |
| AP_PRECALC | 158 | AP course tasks |
| AP_STATS | 157 | AP course tasks |
| AP_PHYS2 | 157 | AP course tasks |
| AP_PHYS_C | 155 | AP course tasks |
| AP_PHYS_EM | 154 | AP course tasks |
| AMC_10 | 49 | AMC 10 milestone topics |
| AMC_8 | 48 | AMC 8 milestone topics |
| MICHEL_THOMAS | 30 | Language track milestones |
| AIME | 25 | AIME milestone topics |
| weekly | 13 | Weekly planning tasks |

---

## Seeding System (v3 — EXPANDED)
- **Entry point**: `server/prisma/seed.js` — main() runs 11 steps
- **AP Engine**: `server/prisma/seeds/ap/engine.js` — `expandCourse(courseDef, helpers)`
  - Generates archetypes: `ap_lesson`, `ap_frq`, `timed_exam`, `review`
  - Phase scheduling: early (<40%) = no MCQ/FRQ; middle (40–75%) + final (>75%) = full suite
- **AP Courses**: `server/prisma/seeds/ap/courses.js` — 15 AP course definitions
- **Daily Recurring**: `server/prisma/seeds/recurring.js` — `generateDailyRecurringTasks(helpers)`
  - 8 slots × 7 days × 231 weeks = **12,936 tasks**
  - Phase-aware (6 phases): content adapts from AMC 8/Spanish → AIME/AP Spanish/college essays
  - Slot categories: amc, khan, ap, language, college, career, career, daily
- **College Prep**: `server/prisma/seeds/college_prep.js` — `generateCollegePrepTasks(helpers)`
  - 30 schools × 8 tasks = 240 school research tasks
  - 55 Common App + essay tasks
  - 20 scholarship tasks
  - 21 interview prep tasks
  - 20 EC/activities documentation tasks
- **Batch upsert**: `batchUpsertTasks(tasks, chunkSize=300)` in seed.js — parallel chunks for speed

**IMPORTANT**: Seeds non-AP tasks (Khan, AMC, Michel Thomas) with templateType="LESSON" (bug in seed). The DB has been patched via SQL to correct these to `khan`, `amc`, `language`. If seed is re-run, run the patch again:
```sql
UPDATE "Task" SET "templateType" = 'khan' WHERE category = 'KHAN_MATH' AND "templateType" = 'LESSON';
UPDATE "Task" SET "templateType" = 'amc' WHERE category IN ('AMC_8', 'AMC_10', 'AIME') AND "templateType" = 'LESSON';
UPDATE "Task" SET "templateType" = 'language' WHERE category = 'MICHEL_THOMAS' AND "templateType" = 'LESSON';
```

---

## Navigation (client/src/components/Layout.jsx)
Sidebar sections — **major UX overhaul May 2026**:
- **Main (no label)**: Today, Overview, Quarters, **Progress** (new), **Calendar** (new)
- **Manage**: Tasks, Balance, **Reviews** (renamed from Feedback)
- **Admin** (visible to `admin` and `parent` roles): /admin

### Sidebar badge counts (auto-fetched on mount):
- Today link: red badge showing overdue task count
- Reviews link (admin/parent only): red badge showing pending submission count
- User name + role pill shown at top of sidebar

## Pages (client/src/pages/)
| Page | Route | Purpose |
|------|-------|---------|
| Today.jsx | /today | **Full-width two-column dashboard** — overdue/today/week tasks + right panel with week snapshot, stats, balance, category bars, quarter progress |
| Overview.jsx | /overview | Q2 week accordion with 7-day grids + live task status |
| QuarterView.jsx | /quarters | Quarter selector, week plan, quarterly habits, all tasks |
| **Progress.jsx** | /progress | **NEW** — Parent-facing stats page: Q2 progress bar, subject cards (Khan/AMC/AP/Career/Language/College), task status breakdown, recent activity feed |
| **CalendarView.jsx** | /calendar | **NEW** — Month calendar grid, tasks as colored dots per day, click day to see task list panel, month navigation |
| TaskInventory.jsx | /inventory | Filterable task list with bulk actions. Category URL param support: `/inventory?category=khan` |
| Balance.jsx | /balance | Financial ledger + chart. Balance shown as hero number in header |
| FeedbackPage.jsx | /feedback | **Renamed to "Review Queue"** — submission review with pending count badge, feedback history, approve/revision flow |
| AdminPanel.jsx | /admin | Task wizard (20 types), ledger management (admin/parent only) |
| TaskDetail.jsx | /tasks/:id | Template rendering (20 templateTypes), submission upload |

---

## CSS Design System (client/src/styles/index.css)
Single stylesheet structured in sections:
- **Design tokens** in `:root` — UCLA Blue/Gold palette, spacing (4px base), type scale, motion, `--font-mono`
- **Theming** — `[data-theme="light"]` and `[data-theme="dark"]` override semantic tokens; dark sidebar = `#0E1520`, light sidebar = UCLA Blue `#2774AE`
- **Layout rule**: `Layout.jsx` applies `paddingInline: 3%` and `paddingTop: 1%`. Pages must NOT add their own horizontal padding. Every page root `<div>` must have `paddingTop: var(--space-6)`.
- **No boxed layouts**: no `maxWidth + margin: auto` wrappers. Exceptions: TaskDetail (860px), Today (680px via `--content-narrow`).
- **Sidebar**: `position: relative; flex-shrink: 0` (NOT fixed). Outer flex container `h-screen overflow-hidden` + sidebar + `<main flex-1 overflow-y-auto>` is the working pattern.

### Button class conventions
- `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`, `.btn-outline`, `.btn-cta`, `.btn-tab`, `.btn-filter`
- `.btn-tab` / `.btn-filter` active: both `.active` and `--active` BEM suffix work
- `.btn-tab__count` — pill counter inside tab buttons

---

## Backend Routes Summary
All routes mounted under `/api`:
- `/api/auth` — register, login, /me
- `/api/tasks` — CRUD + bulk ops (admin creates, student/parent can read)
  - Query params: `category`, `status`, `date` (single day), `dateFrom`/`dateTo` (range), `weekNumber`, `quarterId`
- `/api/submissions` — student submits, admin reviews
- `/api/feedback` — POST (admin/parent only), GET /mine (student)
- `/api/habits` — daily/weekly habit tracking
- `/api/ledger` — financial rewards/penalties
- `/api/reviews` — pending/all review queue (admin/parent)
- `/api/quarters` — quarter metadata
- `/api/weeks` — week metadata
- `/api/admin` — deleted-batch management
- `/api/stats/summary` — summary statistics
- `/api/stats/progress` — **NEW** per-category task counts + global overdue; used by Progress.jsx and Layout.jsx to avoid loading all 16K tasks

## Backend Category Filter Fix (server/src/routes/tasks.js)
`category=ap` resolves to `OR [{category:'ap'}, {category:{startsWith:'AP_'}}]` so Task Inventory shows all AP tasks.

## UI/UX Overhaul (May 2026)
Fixes applied to prevent the 16K-task full-load on every page:
- **TaskDetail.jsx**: `canSubmit` is now student-only (was incorrectly including admin). Status change uses a single `<select>` dropdown instead of 4 separate buttons.
- **Progress.jsx**: Uses `GET /api/stats/progress` (aggregated DB queries) instead of fetching all 16K tasks. AP category normalization (`AP_CALC_BC` etc.) handled server-side.
- **Today.jsx**: Fetches only tasks from Q2 start to end of current week (`?dateFrom=&dateTo=`) — ~80 tasks instead of 16K. AP category normalized to `ap` for display bars.
- **Layout.jsx**: Sidebar overdue badge uses `GET /api/stats/progress` count instead of loading all tasks.

## Template Aliases (server/src/lib/templateFields.js)
Legacy aliases map old type names: `ap→ap_lesson`, `block_review→review`, `career→activity_log`, `college→application`.
