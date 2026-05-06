const CATEGORY_LABELS = {
  amc8: 'Competition Math',
  amc10: 'Competition Math',
  aime: 'Competition Math',
  competition_math: 'Competition Math',
  khan_math: 'Curriculum Math',
  curriculum_math: 'Curriculum Math',
  sat: 'SAT Prep',
  sat_prep: 'SAT Prep',
  ap: 'AP Study',
  language: 'Language',
  reading: 'Reading',
  writing: 'Writing',
  stem_project: 'STEM Project',
  leadership: 'Leadership',
  health: 'Health',
  college: 'College Strategy',
  research: 'Reading',
  project: 'STEM Project',
  recurring: 'Weekly Systems',
  life: 'Personal Systems',
};

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

export function getTaskCategoryKey(task) {
  if (!task) return 'generic';

  const explicit = normalize(task.displayCategoryKey || task.templatePrefill?.categoryKey);
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

  const category = normalize(task.category);
  const templateType = normalize(task.templateType);
  const title = normalize(task.title);

  if (['amc8', 'amc10', 'aime', 'competition_math'].includes(category)) return 'competition_math';
  if (category === 'khan_math' || templateType.includes('khan')) return 'curriculum_math';
  if (category === 'sat' || templateType.includes('sat')) return 'sat';
  if (category === 'ap' || category.startsWith('ap_') || templateType.includes('ap_') || templateType === 'timed_exam') return 'ap';
  if (category === 'language' || templateType.includes('language')) return 'language';
  if (category === 'research' || title.includes('reading')) return 'reading';
  if (category === 'writing' || templateType === 'writing') return 'writing';
  if (category === 'project' || title.includes('stem')) return 'stem_project';
  if (category === 'leadership' || title.includes('outreach') || title.includes('cold email')) return 'leadership';
  if (category === 'life' && title.includes('health')) return 'health';
  if (category === 'college' || category === 'application' || templateType.includes('college')) return 'college';
  if (category === 'health') return 'health';

  return category || 'generic';
}

export function getTaskCategoryLabel(taskOrCategory) {
  const key = typeof taskOrCategory === 'string'
    ? normalize(taskOrCategory)
    : getTaskCategoryKey(taskOrCategory);

  if (CATEGORY_LABELS[key]) return CATEGORY_LABELS[key];

  return key
    .split('_')
    .filter(Boolean)
    .map(part => part[0]?.toUpperCase() + part.slice(1))
    .join(' ') || 'Task';
}
