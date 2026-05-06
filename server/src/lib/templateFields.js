/**
 * Describes the expected shape of TaskSubmission.templateData
 * for each templateType. Used by the frontend to render the
 * correct submission form and by the backend to validate fields.
 *
 * Each entry:
 *   fields   — ordered list of field descriptors
 *   steps    — human-readable step labels (for multi-step UI)
 *
 * Template → use case map:
 *   khan           — Khan Academy exercise sets
 *   amc            — AMC 8 / AMC 10 / AIME problem sets
 *   timed_exam     — Full past exams under real conditions (AMC, AP, SAT, PSAT)
 *   review         — Error review after any exam or problem set
 *   ap_lesson      — Every AP study session (read/watch/notes/practice)
 *   ap_frq         — AP free-response / essay writing against a real past prompt
 *   language       — Michel Thomas or any audio-based language learning session
 *   research       — Career, college, topic, pre-AP exploration deep-dives
 *   writing        — Personal statements, scholarship essays, stories, college essays
 *   activity_log   — Extracurriculars, volunteer hours, competitions, clubs
 *   application    — Internships, scholarships, summer programs, college apps
 *   weekly_preview — End-of-week reflection + next-week planning
 *   simple         — Fallback only
 */
const TEMPLATE_FIELDS = {

  // ── simple ────────────────────────────────────────────────────────────────
  simple: {
    steps: ['Confirm & Submit'],
    fields: [],
  },

  // ── khan ──────────────────────────────────────────────────────────────────
  khan: {
    steps: ['Exercise Info', 'Screenshot Proof', 'Submit'],
    fields: [
      { key: 'course',        label: 'Khan course name',                                             type: 'text',     required: true  },
      { key: 'unit',          label: 'Unit / section completed',                                     type: 'text',     required: true  },
      { key: 'percentDone',   label: 'Unit % complete after this session',                           type: 'number',   required: true  },
      { key: 'screenshotUrl', label: 'Screenshot of your score (Drive link)',                        type: 'url',      required: true  },
      { key: 'notes',         label: 'What concept was hardest? (optional)',                         type: 'textarea', required: false },
    ],
  },

  // ── amc ───────────────────────────────────────────────────────────────────
  amc: {
    steps: ['Problem Set Info', 'Show Your Work', 'Submit'],
    fields: [
      { key: 'topic',        label: 'Topic / problem source (e.g. "AMC 10A 2023 #1–10")',           type: 'text',     required: true  },
      { key: 'problemNums',  label: 'Problem numbers completed',                                     type: 'text',     required: true  },
      { key: 'workLink',     label: 'Scan / photo of your written work (Drive link)',                type: 'url',      required: true  },
      { key: 'numCorrect',   label: 'Number correct (self-graded)',                                  type: 'number',   required: true  },
      { key: 'numAttempted', label: 'Number attempted',                                              type: 'number',   required: true  },
      { key: 'hardest',      label: 'Which problem was hardest and why? (optional)',                 type: 'textarea', required: false },
    ],
  },

  // ── timed_exam ────────────────────────────────────────────────────────────
  timed_exam: {
    steps: ['Exam Setup', 'Your Score', 'Submit'],
    fields: [
      { key: 'examName',    label: 'Exam name and year (e.g. "2023 AMC 8", "AP Bio Practice Exam 1")', type: 'text',     required: true  },
      { key: 'timeAllowed', label: 'Official time allowed (minutes)',                                   type: 'number',   required: true  },
      { key: 'timeUsed',    label: 'Time you actually used (minutes)',                                  type: 'number',   required: true  },
      { key: 'score',       label: 'Your raw score (e.g. "18/25", "72/108")',                          type: 'text',     required: true  },
      { key: 'scanLink',    label: 'Scan of your full exam paper with all work (Drive link)',           type: 'url',      required: true  },
      { key: 'hardest',     label: 'Which section or problem gave you the most trouble? (optional)',   type: 'textarea', required: false },
    ],
  },

  // ── review ────────────────────────────────────────────────────────────────
  review: {
    steps: ['Source', 'Corrections', 'Submit'],
    fields: [
      { key: 'source',          label: 'What you\'re reviewing (e.g. "2023 AMC 8 — problems 14, 17, 19–22")',             type: 'text',     required: true  },
      { key: 'numMissed',       label: 'Number of problems / points originally missed',                                    type: 'number',   required: true  },
      { key: 'correctionsLink', label: 'Full correct solutions for every missed item, written by hand (Drive link)',       type: 'url',      required: true  },
      { key: 'rootCause',       label: 'Main reason you missed these — concept gap, careless error, time pressure, etc.', type: 'textarea', required: true  },
      { key: 'fixPlan',         label: 'What specifically will you do to prevent this next time? (optional)',              type: 'textarea', required: false },
    ],
  },

  // ── ap_lesson ─────────────────────────────────────────────────────────────
  ap_lesson: {
    steps: ['Study Source', 'Notes & Practice', 'Submit'],
    fields: [
      { key: 'source',       label: 'Where you studied (e.g. "Khan AP Bio Unit 3 · Lesson 2", "AP Classroom video", "Barron\'s p.112–124")', type: 'text',     required: true  },
      { key: 'topicSummary', label: 'Write 3–5 key concepts from this lesson in your own words',                                             type: 'textarea', required: true  },
      { key: 'problemsDone', label: 'Practice problems completed (e.g. "AP Classroom progress check Unit 3 · 10 MCQ")',                      type: 'text',     required: true  },
      { key: 'score',        label: 'Score on practice problems (e.g. "8/10")',                                                              type: 'text',     required: true  },
      { key: 'notesLink',    label: 'Photo/scan of your handwritten notes (Drive link)',                                                     type: 'url',      required: true  },
      { key: 'confusion',    label: 'What are you still confused about? (optional)',                                                         type: 'textarea', required: false },
    ],
  },

  // ── ap_frq ────────────────────────────────────────────────────────────────
  ap_frq: {
    steps: ['Prompt', 'Your Response', 'Self-Score', 'Submit'],
    fields: [
      { key: 'prompt',       label: 'Paste the full FRQ prompt here',                              type: 'textarea', required: true  },
      { key: 'source',       label: 'Source of prompt (e.g. "2022 AP Bio FRQ #2")',                type: 'text',     required: true  },
      { key: 'responseLink', label: 'Your written response — doc or scan (Drive link)',             type: 'url',      required: true  },
      { key: 'rubricLink',   label: 'AP scoring rubric you used (College Board URL or Drive link)', type: 'url',      required: false },
      { key: 'selfScore',    label: 'Self-score using the rubric (e.g. "6/10")',                   type: 'text',     required: true  },
      { key: 'reflection',   label: 'What would you write differently on a second attempt?',       type: 'textarea', required: false },
    ],
  },

  // ── language ──────────────────────────────────────────────────────────────
  language: {
    steps: ['Session Info', 'Written Output', 'Submit'],
    fields: [
      { key: 'course',        label: 'Course and track (e.g. "Michel Thomas Spanish Foundation — Track 4")',  type: 'text',     required: true  },
      { key: 'newVocab',      label: 'List 10 new words or phrases you learned, with translations',           type: 'textarea', required: true  },
      { key: 'sentences',     label: 'Write 10 original sentences using grammar from this track',             type: 'textarea', required: true  },
      { key: 'recordingLink', label: 'Recording of you reading your sentences aloud (Drive link, optional)', type: 'url',      required: false },
      { key: 'difficulty',    label: 'What grammar rule was hardest to produce naturally? (optional)',        type: 'textarea', required: false },
    ],
  },

  // ── research ──────────────────────────────────────────────────────────────
  research: {
    steps: ['Topic', 'Research Notes', 'Submit'],
    fields: [
      { key: 'topic',      label: 'Exact topic researched (e.g. "Biomedical Engineer", "MIT", "AP Chemistry overview")', type: 'text',     required: true  },
      { key: 'summary',    label: 'Write a 5–8 sentence summary of what you found',                                      type: 'textarea', required: true  },
      { key: 'keyFacts',   label: 'List 5 specific concrete facts — numbers, names, dates',                               type: 'textarea', required: true  },
      { key: 'sourceUrls', label: 'Sources used — paste 1–3 URLs',                                                       type: 'textarea', required: true  },
      { key: 'takeaway',   label: 'Your honest take — does this interest you? Why or why not?',                           type: 'textarea', required: true  },
    ],
  },

  // ── writing ───────────────────────────────────────────────────────────────
  writing: {
    steps: ['Assignment Info', 'Your Draft', 'Self-Review', 'Submit'],
    fields: [
      { key: 'assignmentType', label: 'Type of writing (e.g. "Personal Statement", "Scholarship Essay", "Short Story")', type: 'text',     required: true  },
      { key: 'prompt',         label: 'Writing prompt or topic — paste in full',                                          type: 'textarea', required: true  },
      { key: 'wordCount',      label: 'Word count of your draft',                                                         type: 'number',   required: true  },
      { key: 'draftLink',      label: 'Your draft — Google Doc link',                                                    type: 'url',      required: true  },
      { key: 'selfNotes',      label: 'What do you think is strongest about this draft?',                                 type: 'textarea', required: true  },
      { key: 'weakestPart',    label: 'What do you think needs the most work?',                                           type: 'textarea', required: true  },
    ],
  },

  // ── activity_log ──────────────────────────────────────────────────────────
  activity_log: {
    steps: ['Activity Info', 'What You Did', 'Submit'],
    fields: [
      { key: 'activityName', label: 'Activity name (e.g. "Math Club", "Orchestra Practice", "Volunteer at Food Bank")', type: 'text',     required: true  },
      { key: 'date',         label: 'Date(s) of activity',                                                              type: 'text',     required: true  },
      { key: 'hoursSpent',   label: 'Hours spent',                                                                      type: 'number',   required: true  },
      { key: 'whatYouDid',   label: 'Describe specifically what you did during this session',                           type: 'textarea', required: true  },
      { key: 'proofLink',    label: 'Proof — photo, certificate, sign-in sheet, etc. (Drive link, optional)',          type: 'url',      required: false },
      { key: 'reflection',   label: 'What did you get better at or contribute? (optional)',                             type: 'textarea', required: false },
    ],
  },

  // ── application ───────────────────────────────────────────────────────────
  application: {
    steps: ['Application Info', 'Materials', 'Submit'],
    fields: [
      { key: 'orgName',       label: 'Organization / program name',                                                       type: 'text',     required: true  },
      { key: 'appType',       label: 'Type (e.g. "Internship", "Scholarship", "Summer Program", "Competition")',          type: 'text',     required: true  },
      { key: 'deadline',      label: 'Application deadline',                                                              type: 'text',     required: true  },
      { key: 'materialsLink', label: 'Link to your submitted materials or draft folder (Drive link)',                     type: 'url',      required: true  },
      { key: 'status',        label: 'Current status (e.g. "Draft", "Submitted", "Waiting", "Accepted", "Rejected")',    type: 'text',     required: true  },
      { key: 'notes',         label: 'Anything the reviewer should know about this application (optional)',               type: 'textarea', required: false },
    ],
  },

  // ── weekly_preview ────────────────────────────────────────────────────────
  weekly_preview: {
    steps: ['This Week', 'Next Week', 'Submit'],
    fields: [
      { key: 'biggestWin',      label: 'Biggest win this week — be specific',                    type: 'textarea', required: true  },
      { key: 'biggestStruggle', label: 'Biggest struggle — what made it hard?',                  type: 'textarea', required: true  },
      { key: 'tasksCompleted',  label: 'Tasks completed vs. assigned this week (e.g. "14/17")', type: 'text',     required: true  },
      { key: 'nextWeekGoal',    label: 'ONE main goal for next week — specific and measurable',  type: 'textarea', required: true  },
      { key: 'proofLink',       label: 'Weekly summary doc or notes (Drive link, optional)',     type: 'url',      required: false },
    ],
  },

};

// Legacy aliases — map old templateType keys to their current equivalents
const ALIASES = {
  ap:           'ap_lesson',
  block_review: 'review',
  career:       'activity_log',
  college:      'application',
};

/**
 * Returns the template definition or falls back to 'simple'.
 */
function getTemplateFields(templateType) {
  const resolved = ALIASES[templateType] || templateType;
  return TEMPLATE_FIELDS[resolved] || TEMPLATE_FIELDS.simple;
}

/**
 * Validates that all required fields are present in templateData.
 * Returns an array of missing field keys (empty array = valid).
 */
function validateTemplateData(templateType, templateData) {
  const def = getTemplateFields(templateType);
  return def.fields
    .filter(f => f.required && !templateData?.[f.key])
    .map(f => f.key);
}

module.exports = { TEMPLATE_FIELDS, getTemplateFields, validateTemplateData };
