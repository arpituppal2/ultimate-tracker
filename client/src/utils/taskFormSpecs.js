import { getTaskCategoryKey } from './taskPresentation';

function sections(title, sectionDefs) {
  return { title, sections: sectionDefs };
}

const genericAssignment = [
  {
    title: 'Completion',
    fields: [
      { key: 'workCompleted', label: 'What you completed', type: 'textarea', required: true, rows: 4 },
      { key: 'proofLink', label: 'Proof link', type: 'url' },
      { key: 'notes', label: 'Notes', type: 'textarea', rows: 3 },
    ],
  },
];

const SPECS = {
  competition_math: sections('Competition Math', [
    {
      title: 'Execution',
      fields: [
        { key: 'problemSet', label: 'Problem set', type: 'text', required: true },
        { key: 'attempted', label: 'Problems attempted', type: 'number', required: true },
        { key: 'correct', label: 'Problems correct', type: 'number', required: true },
        { key: 'errorLogLink', label: 'Error log link', type: 'url', required: true },
        { key: 'polishedSolutionLink', label: 'Polished solution link', type: 'url' },
      ],
    },
    {
      title: 'Checklist',
      fields: [
        { key: 'completedSprint', label: 'Completed sprint', type: 'checkbox', required: true },
        { key: 'updatedErrorLog', label: 'Updated error log', type: 'checkbox', required: true },
        { key: 'wrotePolishedSolution', label: 'Wrote one polished solution', type: 'checkbox' },
      ],
    },
    {
      title: 'Reflection',
      fields: [
        { key: 'mainMiss', label: 'Main miss', type: 'textarea', rows: 3 },
        { key: 'nextFix', label: 'Next fix', type: 'textarea', rows: 3 },
      ],
    },
  ]),
  curriculum_math: sections('Curriculum Math', [
    {
      title: 'Modules',
      fields: [
        { key: 'platform', label: 'Platform', type: 'text', required: true },
        { key: 'moduleNames', label: 'Modules completed', type: 'textarea', required: true, rows: 3 },
        { key: 'blocksCount', label: 'Blocks completed', type: 'number', required: true },
        { key: 'masteryChecks', label: 'Mastery checks', type: 'text' },
        { key: 'videoMinutes', label: 'Video minutes', type: 'number' },
      ],
    },
    {
      title: 'Reflection',
      fields: [
        { key: 'reflection', label: 'Reflection', type: 'textarea', required: true, rows: 4 },
        { key: 'proofLink', label: 'Proof link', type: 'url' },
      ],
    },
  ]),
  sat: sections('SAT Prep', [
    {
      title: 'Session',
      fields: [
        { key: 'moduleName', label: 'Module', type: 'text', required: true },
        { key: 'mode', label: 'Mode', type: 'select', required: true, options: ['Timed', 'Untimed'] },
        { key: 'questionCount', label: 'Questions', type: 'number', required: true },
        { key: 'correctCount', label: 'Correct', type: 'number', required: true },
        { key: 'missesCorrected', label: 'Misses corrected', type: 'number' },
        { key: 'errorLogLink', label: 'Error log link', type: 'url' },
      ],
    },
    {
      title: 'Review',
      fields: [
        { key: 'weakSkill', label: 'Weak skill', type: 'text' },
        { key: 'nextStep', label: 'Next step', type: 'textarea', rows: 3 },
      ],
    },
  ]),
  ap: sections('AP Study', [
    {
      title: 'MCQ',
      fields: [
        { key: 'unit', label: 'Unit', type: 'text', required: true },
        { key: 'source', label: 'Source', type: 'text', required: true },
        { key: 'mcqCount', label: 'MCQ attempted', type: 'number', required: true },
        { key: 'mcqCorrect', label: 'MCQ correct', type: 'number', required: true },
      ],
    },
    {
      title: 'FRQ',
      fields: [
        { key: 'frqPrompt', label: 'FRQ prompt', type: 'text' },
        { key: 'frqScore', label: 'FRQ score', type: 'text' },
        { key: 'frqLink', label: 'FRQ link', type: 'url' },
      ],
    },
    {
      title: 'Notes',
      fields: [
        { key: 'keyTakeaways', label: 'Key takeaways', type: 'textarea', required: true, rows: 4 },
        { key: 'notesLink', label: 'Notes link', type: 'url' },
      ],
    },
  ]),
  language: sections('Language', [
    {
      title: 'Session',
      fields: [
        { key: 'track', label: 'Track or lesson', type: 'text', required: true },
        { key: 'minutes', label: 'Minutes', type: 'number' },
        { key: 'newVocab', label: 'New vocabulary', type: 'textarea', required: true, rows: 4 },
        { key: 'grammarFocus', label: 'Grammar focus', type: 'textarea', rows: 3 },
        { key: 'sentenceLink', label: 'Sentence proof link', type: 'url' },
      ],
    },
  ]),
  reading: sections('Reading', [
    {
      title: 'Reading',
      fields: [
        { key: 'textTitle', label: 'Text', type: 'text', required: true },
        { key: 'pages', label: 'Pages or sections', type: 'text', required: true },
        { key: 'annotationLink', label: 'Annotation link', type: 'url' },
        { key: 'mainIdea', label: 'Main idea', type: 'textarea', required: true, rows: 3 },
      ],
    },
  ]),
  writing: sections('Writing', [
    {
      title: 'Draft',
      fields: [
        { key: 'draftType', label: 'Draft type', type: 'text', required: true },
        { key: 'wordCount', label: 'Word count', type: 'number' },
        { key: 'draftLink', label: 'Draft link', type: 'url', required: true },
        { key: 'strongestPart', label: 'Strongest part', type: 'textarea', rows: 3 },
        { key: 'nextRevision', label: 'Next revision', type: 'textarea', rows: 3 },
      ],
    },
  ]),
  stem_project: sections('STEM Project', [
    {
      title: 'Work',
      fields: [
        { key: 'projectName', label: 'Project', type: 'text', required: true },
        { key: 'stepCompleted', label: 'Step completed', type: 'text', required: true },
        { key: 'artifactLink', label: 'Artifact link', type: 'url', required: true },
        { key: 'blocker', label: 'Blocker', type: 'textarea', rows: 3 },
      ],
    },
  ]),
  leadership: sections('Leadership', [
    {
      title: 'Work',
      fields: [
        { key: 'activityName', label: 'Activity', type: 'text', required: true },
        { key: 'hoursSpent', label: 'Hours', type: 'number', required: true },
        { key: 'deliverable', label: 'Deliverable', type: 'text' },
        { key: 'proofLink', label: 'Proof link', type: 'url' },
        { key: 'impact', label: 'Impact', type: 'textarea', rows: 3 },
      ],
    },
  ]),
  health: sections('Health', [
    {
      title: 'Check-In',
      fields: [
        { key: 'sleepHours', label: 'Sleep hours', type: 'number' },
        { key: 'exerciseMinutes', label: 'Exercise minutes', type: 'number' },
        { key: 'energyLevel', label: 'Energy', type: 'select', options: ['Low', 'Medium', 'High'] },
        { key: 'note', label: 'Note', type: 'textarea', rows: 3 },
      ],
    },
  ]),
  college: sections('College Strategy', [
    {
      title: 'Research',
      fields: [
        { key: 'schoolName', label: 'School', type: 'text', required: true },
        { key: 'sourceSet', label: 'Sources used', type: 'textarea', required: true, rows: 3 },
        { key: 'mainFinding', label: 'Main finding', type: 'textarea', required: true, rows: 4 },
        { key: 'fitNote', label: 'Fit note', type: 'textarea', rows: 3 },
      ],
    },
  ]),
  generic: sections('Task', genericAssignment),
};

function inferTaskKind(task) {
  const category = getTaskCategoryKey(task);
  const templateType = String(task?.templateType || '').toLowerCase();
  const title = String(task?.title || '').toLowerCase();

  if (category === 'competition_math') return 'competition_math';
  if (category === 'curriculum_math' || templateType.includes('khan')) return 'curriculum_math';
  if (category === 'ap' || templateType.includes('ap_') || templateType === 'timed_exam') return 'ap';
  if (category === 'sat' || templateType.includes('sat')) return 'sat';
  if (category === 'language' || templateType.includes('language')) return 'language';
  if (category === 'reading' || title.includes('reading')) return 'reading';
  if (category === 'writing' || templateType === 'writing') return 'writing';
  if (category === 'stem_project' || title.includes('project') || templateType === 'project') return 'stem_project';
  if (category === 'leadership' || (templateType === 'activity_log' && title.includes('leadership'))) return 'leadership';
  if (category === 'college' || templateType.includes('college') || templateType === 'application') return 'college';
  if (category === 'health') return 'health';
  return 'generic';
}

export function getTaskFormSpec(task) {
  const kind = inferTaskKind(task);
  return SPECS[kind] || SPECS.generic;
}

export function getRequiredFieldKeys(task) {
  return getTaskFormSpec(task).sections.flatMap(section =>
    section.fields.filter(field => field.required).map(field => field.key)
  );
}
