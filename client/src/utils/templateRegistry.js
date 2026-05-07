import APAnalysisTemplate from '../components/templates/APAnalysisTemplate';
import ActivityLogTemplate from '../components/templates/ActivityLogTemplate';
import AmcTemplate from '../components/templates/AmcTemplate';
import ApExploreTemplate from '../components/templates/ApExploreTemplate';
import ApFrqTemplate from '../components/templates/ApFrqTemplate';
import ApLessonTemplate from '../components/templates/ApLessonTemplate';
import CareerReportTemplate from '../components/templates/CareerReportTemplate';
import CollegeResearchTemplate from '../components/templates/CollegeResearchTemplate';
import KhanTemplate from '../components/templates/KhanTemplate';
import LanguageTemplate from '../components/templates/LanguageTemplate';
import ReadingLogTemplate from '../components/templates/ReadingLogTemplate';
import ResearchTemplate from '../components/templates/ResearchTemplate';
import ReviewTemplate from '../components/templates/ReviewTemplate';
import SATTemplate from '../components/templates/SATTemplate';
import TimedExamTemplate from '../components/templates/TimedExamTemplate';
import WeeklyPreviewTemplate from '../components/templates/WeeklyPreviewTemplate';

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const REGISTRY = {
  ap_curriculum_analysis: {
    Component: APAnalysisTemplate,
    requiredKeys: ['courseName', 'passRate', 'examFormat', 'creditPolicy', 'difficultyRating', 'strategicValue', 'challenges', 'synthesis', 'rigorRating', 'srcCurriculum', 'srcCredit', 'srcRigor', 'srcPeer'],
    hideAssignmentLink: true,
  },
  ap_review: {
    Component: APAnalysisTemplate,
    requiredKeys: ['courseName', 'passRate', 'examFormat', 'creditPolicy', 'difficultyRating', 'strategicValue', 'challenges', 'synthesis', 'rigorRating', 'srcCurriculum', 'srcCredit', 'srcRigor', 'srcPeer'],
    hideAssignmentLink: true,
  },
  ap_analysis: {
    Component: APAnalysisTemplate,
    requiredKeys: ['courseName', 'passRate', 'examFormat', 'creditPolicy', 'difficultyRating', 'strategicValue', 'challenges', 'synthesis', 'rigorRating', 'srcCurriculum', 'srcCredit', 'srcRigor', 'srcPeer'],
    hideAssignmentLink: true,
  },
  ap_exploration: {
    Component: ApExploreTemplate,
    requiredKeys: ['courseName', 'whyThisCourse', 'courseDescription', 'unitsCovered', 'skillsNeeded', 'timeCommitment', 'sourceLinks'],
    hideAssignmentLink: true,
  },
  ap_explore: {
    Component: ApExploreTemplate,
    requiredKeys: ['courseName', 'whyThisCourse', 'courseDescription', 'unitsCovered', 'skillsNeeded', 'timeCommitment', 'sourceLinks'],
    hideAssignmentLink: true,
  },
  college_research: {
    Component: CollegeResearchTemplate,
    requiredKeys: ['schoolName', 'location', 'undergradPopulation', 'acceptanceRate', 'studentFacultyRatio', 'financialCommitment', 'endowmentAnalysis', 'feederAnalysis', 'riskAnalysis', 'strengthAnalysis', 'redFlags', 'summary', 'prestigeRating', 'officialSource', 'independentSource', 'studentSource', 'prestigeSource'],
    hideAssignmentLink: true,
  },
  career_report: {
    Component: CareerReportTemplate,
    requiredKeys: ['careerTitle', 'dateCompleted', 'weekLabel', 'executiveOverview', 'responsibilities', 'educationRequirements', 'essentialSkills', 'careerProgression', 'entryCompensation', 'marketAnalysis', 'dayToDayReality', 'personalFit', 'references'],
    hideAssignmentLink: true,
  },
  amc_topic_log: {
    Component: AmcTemplate,
    requiredKeys: ['topic', 'goal', 'prerequisites', 'warmups', 'coreIdea', 'recognitionTraining', 'mechanicsDrill', 'workedExamples', 'scaffoldedPractice', 'masteryCheck', 'errorLog', 'retrievalPractice'],
  },
  khan_exercise: {
    Component: KhanTemplate,
    requiredKeys: ['courseName', 'lessonName', 'masteryGoal', 'proofDocLink'],
  },
  timed_exam: {
    Component: TimedExamTemplate,
    requiredKeys: ['examName', 'score', 'timeSpent', 'proofDocLink'],
  },
  sat: {
    Component: SATTemplate,
    requiredKeys: ['examName', 'moduleName', 'score', 'proofDocLink'],
  },
  ap_lesson: {
    Component: ApLessonTemplate,
    requiredKeys: ['lessonCode', 'lessonTitle', 'proofDocLink'],
  },
  ap_frq: {
    Component: ApFrqTemplate,
    requiredKeys: ['prompt', 'score', 'responseLink', 'proofDocLink'],
  },
  language: {
    Component: LanguageTemplate,
    requiredKeys: ['language', 'focusArea', 'proofDocLink'],
  },
  reading_log: {
    Component: ReadingLogTemplate,
    requiredKeys: ['bookTitle', 'pagesRead', 'summary', 'proofDocLink'],
  },
  weekly_preview: {
    Component: WeeklyPreviewTemplate,
    requiredKeys: ['lastWeekReflection', 'weeklyFocus', 'proofDocLink'],
  },
  activity_log: {
    Component: ActivityLogTemplate,
    requiredKeys: ['activityName', 'proofDocLink'],
  },
  research: {
    Component: ResearchTemplate,
    requiredKeys: ['topic', 'researchQuestion', 'proofDocLink'],
  },
  review: {
    Component: ReviewTemplate,
    requiredKeys: ['reviewTopic', 'proofDocLink'],
  },
};

const KEY_ALIASES = {
  ap_curriculum_review: 'ap_curriculum_analysis',
  ap_course_review: 'ap_curriculum_analysis',
  ap_study_review: 'ap_curriculum_analysis',
  ap_explorations: 'ap_exploration',
  college_report: 'college_research',
  career: 'career_report',
  amc: 'amc_topic_log',
  khan: 'khan_exercise',
  mock_test: 'timed_exam',
  sat_module: 'sat',
  sat_review: 'sat',
  language_practice: 'language',
};

function deriveTemplateKey(task) {
  const title = String(task?.title || '').toLowerCase();
  const assignment = String(task?.templatePrefill?.assignment || '').toLowerCase();
  const description = String(task?.description || '').toLowerCase();
  const haystack = `${title} ${assignment} ${description}`;

  if (haystack.includes('ap exploration') || haystack.includes('curriculum analysis')) {
    return 'ap_exploration';
  }
  if (haystack.includes('career report')) return 'career_report';
  if (haystack.includes('college research')) return 'college_research';
  if (haystack.includes('topic study sheet')) return 'amc_topic_log';
  if (haystack.includes('khan academy')) return 'khan_exercise';

  const candidates = [
    task?.templateType,
    task?.templatePrefill?.templateType,
    task?.templatePrefill?.templateKey,
    task?.templatePrefill?.taskTemplate,
    task?.templatePrefill?.source,
  ]
    .map(normalizeKey)
    .filter(Boolean);

  for (const candidate of candidates) {
    if (REGISTRY[candidate]) return candidate;
    if (KEY_ALIASES[candidate] && REGISTRY[KEY_ALIASES[candidate]]) return KEY_ALIASES[candidate];
  }

  return null;
}

export function getTemplateDescriptor(task) {
  const key = deriveTemplateKey(task);
  if (!key) return null;
  return { key, ...REGISTRY[key] };
}

function pushLink(result, value) {
  if (typeof value !== 'string') return;
  const trimmed = value.trim();
  if (!trimmed) return;
  if (/^https?:\/\//i.test(trimmed)) result.add(trimmed);
}

function walkLinks(result, value, path = '') {
  if (!value) return;

  if (Array.isArray(value)) {
    value.forEach((item, index) => walkLinks(result, item, `${path}_${index}`));
    return;
  }

  if (typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => walkLinks(result, item, `${path}_${key}`));
    return;
  }

  const keyHint = path.toLowerCase();
  if (keyHint.includes('link') || keyHint.includes('url') || keyHint.includes('proof') || keyHint.includes('doc') || keyHint.includes('drive') || keyHint.includes('sheet')) {
    pushLink(result, value);
  }
}

export function collectProofLinks(templateData) {
  const links = new Set();
  walkLinks(links, templateData);
  return Array.from(links);
}
