// Master habit definitions — single source of truth across the entire app

export const DAILY_HABITS = [
  // ── Academic Hygiene (original 1–11) ───────────────────────────────────────
  { key: 'planner_check',    label: 'Planner Check',      emoji: '📓', category: 'academic', dueTime: 'night',   proofRequired: false, description: 'Check and update planner for tomorrow.' },
  { key: 'brush_teeth_am',   label: 'Brush Teeth (AM)',   emoji: '🦷', category: 'academic', dueTime: 'morning', proofRequired: false, description: 'Brush teeth in the morning.' },
  { key: 'brush_teeth_pm',   label: 'Brush Teeth (PM)',   emoji: '🦷', category: 'academic', dueTime: 'night',   proofRequired: false, description: 'Brush teeth before bed.' },
  { key: 'make_bed',         label: 'Make Bed',           emoji: '🛏', category: 'academic', dueTime: 'morning', proofRequired: false, description: 'Make your bed every morning.' },
  { key: 'room_tidy',        label: 'Room Tidy',          emoji: '🧹', category: 'academic', dueTime: 'night',   proofRequired: false, description: 'Pick up bedroom floor before bed.' },
  { key: 'no_phone_meals',   label: 'No Phone at Meals',  emoji: '📵', category: 'academic', dueTime: 'anytime', proofRequired: false, description: 'No phone during any meal.' },
  { key: 'read_30min',       label: 'Read 30 Min',        emoji: '📖', category: 'academic', dueTime: 'anytime', proofRequired: false, description: 'Read for at least 30 minutes.' },
  { key: 'exercise',         label: 'Exercise',           emoji: '🏃', category: 'academic', dueTime: 'anytime', proofRequired: false, description: 'Any physical activity.' },
  { key: 'water_8cups',      label: '8 Cups Water',       emoji: '💧', category: 'academic', dueTime: 'anytime', proofRequired: false, description: 'Drink 8 cups of water today.' },
  { key: 'gratitude_journal',label: 'Gratitude Journal',  emoji: '🙏', category: 'academic', dueTime: 'night',   proofRequired: false, description: 'Write 3 things you are grateful for.' },
  { key: 'lights_out_10pm',  label: 'Lights Out 10pm',   emoji: '🌙', category: 'academic', dueTime: 'night',   proofRequired: false, description: 'In bed with lights off by 10 PM school nights.' },

  // ── Physical Health & Wellness (new 12–17) ─────────────────────────────────
  {
    key: 'morning_routine',
    label: 'Morning Routine',
    emoji: '☀️',
    category: 'wellness',
    dueTime: 'morning',
    proofRequired: true,
    description: 'Wake by 6:30 AM (school) / 7:30 AM (weekend). Wash face, brush teeth, drink 8 oz water before any screen.',
    proof: 'Time-stamped selfie or Apple Health wake-time screenshot',
  },
  {
    key: 'twenty_min_move',
    label: '20-Min Move',
    emoji: '💪',
    category: 'physical',
    dueTime: 'anytime',
    proofRequired: true,
    description: '20+ min intentional physical activity: workout, yoga, dance, swim, bike, or stretch — logged by type.',
    proof: 'Screenshot of workout app / fitness ring / photo proof',
  },
  {
    key: 'screen_cap',
    label: 'Screen Cap',
    emoji: '📱',
    category: 'wellness',
    dueTime: 'night',
    proofRequired: true,
    description: 'Social media (TikTok, Instagram, Snapchat, YouTube Shorts) ≤ 45 min total.',
    proof: 'Screenshot of daily Screen Time report',
  },
  {
    key: 'eat_something_real',
    label: 'Eat Something Real',
    emoji: '🥗',
    category: 'physical',
    dueTime: 'anytime',
    proofRequired: true,
    description: 'At least one meal includes a fruit or vegetable. No skipping meals. Self-log what you ate.',
    proof: 'Text/photo of the meal logged in journal',
  },
  {
    key: 'creative_15',
    label: 'Creative 15',
    emoji: '🎨',
    category: 'creative',
    dueTime: 'anytime',
    proofRequired: true,
    description: '15 min of a non-academic creative hobby: drawing, painting, music, origami, crafting, poetry, or dance.',
    proof: 'Photo of the work / voice memo / screenshot',
  },
  {
    key: 'lights_out_prep',
    label: 'Lights-Out Prep',
    emoji: '🌛',
    category: 'wellness',
    dueTime: 'night',
    proofRequired: true,
    description: 'Phone on charger outside bedroom (or airplane mode) by 10:00 PM school nights, 11:00 PM weekends.',
    proof: 'Parent confirmation (text Arpit "lights out ✓") or photo of phone on station',
  },
];

// Grouped for UI rendering
export const DAILY_HABIT_GROUPS = [
  { id: 'academic', label: 'Academic Hygiene',     keys: ['planner_check','brush_teeth_am','brush_teeth_pm','make_bed','room_tidy','no_phone_meals','read_30min','exercise','water_8cups','gratitude_journal','lights_out_10pm'] },
  { id: 'wellness', label: 'Morning & Sleep',       keys: ['morning_routine','screen_cap','lights_out_prep'] },
  { id: 'physical', label: 'Body & Food',           keys: ['twenty_min_move','eat_something_real'] },
  { id: 'creative', label: 'Creative Expression',   keys: ['creative_15'] },
];

export const WEEKLY_HABITS = [
  // ── Academic (original 1–4) ────────────────────────────────────────────────
  { key: 'weekly_preview',     label: 'Weekly Preview',      emoji: '📅', category: 'academic', dueDay: 'Sunday',      proofRequired: false, description: 'Preview all tasks, deadlines, and plan the week.' },
  { key: 'deep_room_clean',    label: 'Deep Room Clean',     emoji: '🧹', category: 'academic', dueDay: 'Sunday',      proofRequired: false, description: 'Full deep clean of bedroom.' },
  { key: 'laundry_cycle',      label: 'Laundry Cycle',       emoji: '👕', category: 'academic', dueDay: 'Sunday',      proofRequired: false, description: 'Wash, dry, fold, and put away laundry.' },
  { key: 'device_purge',       label: 'Device Purge',        emoji: '🗑', category: 'academic', dueDay: 'Sunday',      proofRequired: false, description: 'Clear downloads, screenshots, and organize device storage.' },

  // ── Life Habits (new 5–8) ─────────────────────────────────────────────────
  {
    key: 'social_time',
    label: 'Social Time',
    emoji: '👯',
    category: 'social',
    dueDay: 'Any weekday',
    proofRequired: true,
    description: 'Spend 30+ min with a friend (in-person, FaceTime, or real phone call — not texting).',
    proof: 'Name of friend + screenshot of call log or selfie',
  },
  {
    key: 'family_contribution',
    label: 'Family Contribution',
    emoji: '🍳',
    category: 'social',
    dueDay: 'Any day',
    proofRequired: true,
    description: 'Cook or help cook one full meal for the family. Not just setting the table.',
    proof: 'Before/after photo of food made',
  },
  {
    key: 'hobby_project',
    label: 'Hobby Project Block',
    emoji: '🎸',
    category: 'creative',
    dueDay: 'Saturday',
    proofRequired: true,
    description: '45+ min on one ongoing non-academic project (art piece, music track, book, game, etc.). Same project tracked quarter-over-quarter.',
    proof: 'Photo/recording of progress',
  },
  {
    key: 'kindness_log',
    label: 'Kindness Log',
    emoji: '💛',
    category: 'social',
    dueDay: 'Sunday',
    proofRequired: true,
    description: 'Do one concrete kind thing for someone outside your immediate family. Write 2 sentences about it.',
    proof: 'Written in journal / proof doc',
  },
];

// Grouped for UI rendering (mirrors DAILY_HABIT_GROUPS pattern)
export const WEEKLY_HABIT_CATEGORIES = [
  { id: 'academic', label: 'Academic Hygiene', keys: ['weekly_preview', 'deep_room_clean', 'laundry_cycle', 'device_purge'] },
  { id: 'social',   label: 'Social & Family',  keys: ['social_time', 'family_contribution', 'kindness_log'] },
  { id: 'creative', label: 'Creative',          keys: ['hobby_project'] },
];

export const QUARTERLY_HABITS = [
  // ── Original 1–2 ──────────────────────────────────────────────────────────
  {
    key: 'closet_refresh',
    label: 'Closet Refresh',
    emoji: '👔',
    proofRequired: false,
    description: 'With parent permission: go through closet, donate or discard what no longer fits or is unused.',
    dueWhen: 'Week 13 (end of quarter)',
    hasSelfGrade: false,
  },
  {
    key: 'binder_overhaul',
    label: 'Binder / Digital Folder Overhaul',
    emoji: '📂',
    proofRequired: false,
    description: 'Organize all binders and digital folders. Archive old material, prep fresh structure for next quarter.',
    dueWhen: 'Final Sunday of quarter',
    hasSelfGrade: false,
  },

  // ── New 3–4 ───────────────────────────────────────────────────────────────
  {
    key: 'personal_goal_setting',
    label: 'Personal Goal Setting',
    emoji: '🎯',
    proofRequired: true,
    proof: 'Written doc submitted in tracker',
    description: 'Start of quarter: write 3 personal (non-academic) goals. End of quarter: grade yourself A/B/C on each.',
    dueWhen: 'Start of quarter (goals) + End of quarter (grades)',
    hasSelfGrade: true,
  },
  {
    key: 'acts_of_service',
    label: 'Acts of Service Project',
    emoji: '🤝',
    proofRequired: true,
    proof: 'Confirmation from org, parent, or teacher',
    description: 'Complete one community service activity per quarter: tutoring, volunteering, donation drive, etc. Min 2 hours.',
    dueWhen: 'Any time during quarter',
    hasSelfGrade: false,
  },
];

// Weekly totals
export const HABIT_TOTALS = {
  dailyPerWeek:    17 * 7,    // 119
  weeklyPerWeek:   8,
  quarterlyCount:  4,
  weeksPerQuarter: 13,
  tasksPerWeek:    '~170–180',
};

// Day-of-week master schedule template (repeating skeleton every week)
export const WEEKLY_SCHEDULE_TEMPLATE = {
  timeBlocks: [
    { id: '630am',    label: '6:30 AM',       short: '6:30a'   },
    { id: '3to5pm',   label: '3–5 PM',         short: '3–5p'    },
    { id: '5to6pm',   label: '5–6 PM',         short: '5–6p'    },
    { id: '6to7pm',   label: '6–7 PM',         short: '6–7p'    },
    { id: '7to8pm',   label: '7–8 PM',         short: '7–8p'    },
    { id: '8to830',   label: '8–8:30 PM',      short: '8–8:30p' },
    { id: '830to9',   label: '8:30–9 PM',      short: '8:30–9p' },
    { id: '9to930',   label: '9–9:30 PM',      short: '9–9:30p' },
    { id: '930to950', label: '9:30–9:50 PM',   short: '9:30p'   },
    { id: '950pm',    label: '9:50 PM',         short: '9:50p'   },
    { id: '10pm',     label: '10 PM',           short: '10p'     },
  ],
  days: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
  cells: {
    '630am':    { Monday:'Morning Routine ✓',Tuesday:'Morning Routine ✓',Wednesday:'Morning Routine ✓',Thursday:'Morning Routine ✓',Friday:'Morning Routine ✓',Saturday:'Morning Routine ✓',Sunday:'Morning Routine ✓', _cat:'wellness' },
    '3to5pm':   { Monday:'AMC Topic A (study + explain)',Tuesday:'AMC Topic B (study + explain)',Wednesday:'AMC Topic C (study + explain)',Thursday:'Khan Academy Block 1 (2–3 lessons)',Friday:'Khan Academy Block 2 (2–3 lessons)',Saturday:'AMC Practice (3–5 problems)',Sunday:'Weekly Preview ✓', _catMap:{ Monday:'amc',Tuesday:'amc',Wednesday:'amc',Thursday:'khan',Friday:'khan',Saturday:'amc',Sunday:'habit' } },
    '5to6pm':   { Monday:'Khan Academy Block 1',Tuesday:'Science coursework task',Wednesday:'Career Deep-Dive #1 — Research',Thursday:'Science coursework task',Friday:'English coursework task',Saturday:'Career Deep-Dive #2 — Write-up',Sunday:'Deep Room Clean ✓', _catMap:{ Monday:'khan',Tuesday:'science',Wednesday:'career',Thursday:'science',Friday:'english',Saturday:'career',Sunday:'habit' } },
    '6to7pm':   { Monday:'20-Min Move ✓',Tuesday:'20-Min Move ✓',Wednesday:'20-Min Move ✓',Thursday:'20-Min Move ✓',Friday:'20-Min Move ✓',Saturday:'Social Time ✓ / Hobby Project',Sunday:'Laundry Cycle ✓', _catMap:{ Monday:'wellness',Tuesday:'wellness',Wednesday:'wellness',Thursday:'wellness',Friday:'wellness',Saturday:'social',Sunday:'habit' } },
    '7to8pm':   { Monday:'English coursework task',Tuesday:'Career Deep-Dive #1 — Write-up',Wednesday:'AP Exploration — Research + write',Thursday:'Khan Academy Block 3',Friday:'Redemption task (optional)',Saturday:'Khan Academy catch-up',Sunday:'Family Contribution ✓', _catMap:{ Monday:'english',Tuesday:'career',Wednesday:'ap',Thursday:'khan',Friday:'redemption',Saturday:'khan',Sunday:'social' } },
    '8to830':   { Monday:'Eat Something Real ✓',Tuesday:'Eat Something Real ✓',Wednesday:'Eat Something Real ✓',Thursday:'Eat Something Real ✓',Friday:'Eat Something Real ✓',Saturday:'Eat Something Real ✓',Sunday:'Eat Something Real ✓', _cat:'physical' },
    '830to9':   { Monday:'Creative 15 ✓',Tuesday:'Creative 15 ✓',Wednesday:'Creative 15 ✓',Thursday:'Creative 15 ✓',Friday:'Creative 15 ✓',Saturday:'Hobby Project Block (45 min) ✓',Sunday:'Kindness Log ✓', _catMap:{ Monday:'creative',Tuesday:'creative',Wednesday:'creative',Thursday:'creative',Friday:'creative',Saturday:'creative',Sunday:'social' } },
    '9to930':   { Monday:'Duolingo · Inbox Zero · Planner Check · Backpack Reset · Outfit Prep',Tuesday:'Duolingo · Inbox Zero · Planner Check · Backpack Reset · Outfit Prep',Wednesday:'Duolingo · Inbox Zero · Planner Check · Backpack Reset · Outfit Prep',Thursday:'Duolingo · Inbox Zero · Planner Check · Backpack Reset · Outfit Prep',Friday:'Duolingo · Inbox Zero · Planner Check · Backpack Reset · Outfit Prep',Saturday:'Duolingo · Planner Check',Sunday:'Device Purge ✓', _cat:'habit' },
    '930to950': { Monday:'Daily Journal ✓',Tuesday:'Daily Journal ✓',Wednesday:'Daily Journal ✓',Thursday:'Daily Journal ✓',Friday:'Daily Journal ✓',Saturday:'Daily Journal ✓',Sunday:'Daily Journal ✓', _cat:'habit' },
    '950pm':    { Monday:'Bedroom Floor · Desk Tidy · Device Charge · Screen Cap screenshot',Tuesday:'Bedroom Floor · Desk Tidy · Device Charge · Screen Cap screenshot',Wednesday:'Bedroom Floor · Desk Tidy · Device Charge · Screen Cap screenshot',Thursday:'Bedroom Floor · Desk Tidy · Device Charge · Screen Cap screenshot',Friday:'Bedroom Floor · Desk Tidy · Device Charge · Screen Cap screenshot',Saturday:'Bedroom Floor · Desk Tidy · Device Charge · Screen Cap screenshot',Sunday:'Bedroom Floor · Desk Tidy · Device Charge · Screen Cap screenshot', _cat:'wellness' },
    '10pm':     { Monday:'Lights-Out Prep ✓ → sleep',Tuesday:'Lights-Out Prep ✓ → sleep',Wednesday:'Lights-Out Prep ✓ → sleep',Thursday:'Lights-Out Prep ✓ → sleep',Friday:'Lights-Out Prep ✓ → sleep',Saturday:'11:00 PM cutoff',Sunday:'11:00 PM cutoff', _cat:'wellness' },
  },
};

// Creative project phase timeline (used in CreativeProjectTracker)
export const CREATIVE_PHASES = [
  { id: 'exploration', label: 'Exploration', quarters: ['Q2_2026','Q3_2026'], description: 'Try drawing, music, poetry, origami, cooking — pick one to carry forward.' },
  { id: 'commitment',  label: 'Commitment',  quarters: ['Q4_2026','Q1_2027','Q2_2027','Q3_2027','Q4_2027','Q1_2028','Q2_2028','Q3_2028','Q4_2028'], description: 'One ongoing creative project per quarter. Must produce something tangible (sketchbook, song, written piece).' },
  { id: 'portfolio',   label: 'Portfolio',   quarters: ['Q1_2029','Q2_2029','Q3_2029','Q1_2030','Q2_2030','Q3_2030'], description: 'Creative work can be referenced in college essays as authentic interest. Documented output = usable.' },
];

// Category chip colors (maps to CSS vars in index.css)
export const CATEGORY_COLORS = {
  academic:    { bg: 'var(--color-surface-offset)',   text: 'var(--color-text-muted)'       },
  wellness:    { bg: 'rgba(79,152,163,0.12)',          text: 'var(--color-primary)'           },
  physical:    { bg: 'rgba(109,170,69,0.12)',           text: 'var(--color-success)'          },
  creative:    { bg: 'rgba(122,57,187,0.12)',           text: 'var(--color-purple)'           },
  social:      { bg: 'rgba(218,113,1,0.12)',            text: 'var(--color-orange)'           },
  amc:         { bg: 'rgba(0,100,148,0.12)',            text: 'var(--color-blue)'             },
  khan:        { bg: 'rgba(67,122,34,0.12)',            text: 'var(--color-success)'          },
  career:      { bg: 'rgba(161,44,123,0.12)',           text: 'var(--color-error)'            },
  ap:          { bg: 'rgba(209,153,0,0.12)',            text: 'var(--color-gold)'             },
  science:     { bg: 'rgba(0,100,148,0.12)',            text: 'var(--color-blue)'             },
  english:     { bg: 'rgba(218,113,1,0.12)',            text: 'var(--color-orange)'           },
  habit:       { bg: 'var(--color-surface-dynamic)',    text: 'var(--color-text-faint)'       },
  redemption:  { bg: 'rgba(161,53,68,0.12)',            text: 'var(--color-notification)'     },
};
