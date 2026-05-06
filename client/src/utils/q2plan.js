// Q2 2026 — Week structure
// Apr 28 (Tue) → Jul 27 (Mon), 13 weeks
// Weeks run Tuesday → Monday (matching Avni's master plan)

export const Q2_META = {
  id:        'Q2_2026',
  label:     'Q2 2026',
  startDate: '2026-04-28',
  endDate:   '2026-07-27',
  weekStart: 1,
  weekEnd:   13,
  grade:     '7th (finishing)',
  focus:     'K–6th Math | MS Science | AMC Geo+Combo Wks 1–10 | Careers 1–2/wk | AP Explore 1/wk',
};

// All weeks start on Tuesday (per master plan)
const WEEK_STARTS = [
  '2026-04-28', // W01: Apr 28–May 04
  '2026-05-05', // W02: May 05–May 11
  '2026-05-12', // W03: May 12–May 18
  '2026-05-19', // W04: May 19–May 25
  '2026-05-26', // W05: May 26–Jun 01
  '2026-06-02', // W06: Jun 02–Jun 08
  '2026-06-09', // W07: Jun 09–Jun 15
  '2026-06-16', // W08: Jun 16–Jun 22
  '2026-06-23', // W09: Jun 23–Jun 29
  '2026-06-30', // W10: Jun 30–Jul 06
  '2026-07-07', // W11: Jul 07–Jul 13
  '2026-07-14', // W12: Jul 14–Jul 20
  '2026-07-21', // W13: Jul 21–Jul 27
];

// Tue → Mon ordering
const DAYS = ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday'];

// Content from Avni's Master Plan v2
// Khan: omitted — to be added later
const WEEK_DATA = [
  { // W01
    amcTopic:    'Geometry — Pythagorean thm | Triangle area | Heron\'s | Similarity | Congruence',
    apSubject:   'AP Explore — AP Human Geography',
    careerTopic: 'Software Engineer & Data Scientist',
    dayTasks: [
      { amc: 'AMC: Pythagorean thm',        ap: null,                    career: 'Career: Software Eng'     }, // Tue
      { amc: 'AMC: Triangle area',          ap: 'AP: Human Geography',   career: null                      }, // Wed
      { amc: 'AMC: Heron\'s formula',      ap: null,                    career: null                      }, // Thu
      { amc: 'AMC: Similarity',             ap: null,                    career: 'Career: Data Scientist'   }, // Fri
      { amc: 'AMC: Congruence',             ap: null,                    career: null                      }, // Sat
      { amc: null,                          ap: null,                    career: null                      }, // Sun
      { amc: null,                          ap: null,                    career: null                      }, // Mon
    ],
  },
  { // W02
    amcTopic:    'Geometry — sin/cos/tan + Laws | Angle bisector | Centroid/medians | Ceva\'s | Stewart\'s',
    apSubject:   'AP Explore — AP Macroeconomics',
    careerTopic: 'Biomedical Engineer & Physician (MD)',
    dayTasks: [
      { amc: 'AMC: Trig ratios + Laws',     ap: null,                    career: 'Career: Biomedical Eng'   }, // Tue
      { amc: 'AMC: Angle bisector',         ap: 'AP: Macroeconomics',    career: null                      }, // Wed
      { amc: 'AMC: Centroid/medians',       ap: null,                    career: null                      }, // Thu
      { amc: 'AMC: Ceva\'s theorem',       ap: null,                    career: 'Career: Physician (MD)'   }, // Fri
      { amc: 'AMC: Stewart\'s theorem',    ap: null,                    career: null                      }, // Sat
      { amc: null,                          ap: null,                    career: null                      }, // Sun
      { amc: null,                          ap: null,                    career: null                      }, // Mon
    ],
  },
  { // W03
    amcTopic:    'Geometry — Circles: inscribed/central/tangent | Power of Point | Cyclic quads | Ptolemy\'s | Chords',
    apSubject:   'AP Explore — AP Microeconomics',
    careerTopic: 'Lawyer (JD) & Financial Analyst',
    dayTasks: [
      { amc: 'AMC: Inscribed angles',       ap: null,                    career: 'Career: Lawyer (JD)'      }, // Tue
      { amc: 'AMC: Power of a Point',       ap: 'AP: Microeconomics',    career: null                      }, // Wed
      { amc: 'AMC: Cyclic quads',           ap: null,                    career: null                      }, // Thu
      { amc: 'AMC: Ptolemy\'s theorem',    ap: null,                    career: 'Career: Financial Analyst' }, // Fri
      { amc: 'AMC: Chords & tangents',      ap: null,                    career: null                      }, // Sat
      { amc: null,                          ap: null,                    career: null                      }, // Sun
      { amc: null,                          ap: null,                    career: null                      }, // Mon
    ],
  },
  { // W04
    amcTopic:    'Geometry — Tangent/secant | Inradius/circumradius | 3D geo | Coordinate geo | Shoelace',
    apSubject:   'AP Explore — AP World History: Modern',
    careerTopic: 'Aerospace Engineer & Environmental Scientist',
    dayTasks: [
      { amc: 'AMC: Tangent/secant',         ap: null,                    career: 'Career: Aerospace Eng'    }, // Tue
      { amc: 'AMC: Inradius/circumradius',  ap: 'AP: World History',     career: null                      }, // Wed
      { amc: 'AMC: 3D geometry',            ap: null,                    career: null                      }, // Thu
      { amc: 'AMC: Coordinate geo',         ap: null,                    career: 'Career: Env. Scientist'   }, // Fri
      { amc: 'AMC: Shoelace formula',       ap: null,                    career: null                      }, // Sat
      { amc: null,                          ap: null,                    career: null                      }, // Sun
      { amc: null,                          ap: null,                    career: null                      }, // Mon
    ],
  },
  { // W05
    amcTopic:    'Geometry — Pick\'s | Geo Review (3 hardest) | Write 2 original problems | 5 AMC geo',
    apSubject:   'AP Explore — AP US History',
    careerTopic: 'Actuary & Epidemiologist',
    dayTasks: [
      { amc: 'AMC: Pick\'s theorem',        ap: null,                    career: 'Career: Actuary'          }, // Tue
      { amc: 'AMC: Geo review (hardest 3)', ap: 'AP: US History',        career: null                      }, // Wed
      { amc: 'AMC: 5 AMC geo problems',     ap: null,                    career: null                      }, // Thu
      { amc: 'AMC: Write 2 geo problems',   ap: null,                    career: 'Career: Epidemiologist'   }, // Fri
      { amc: null,                          ap: null,                    career: null                      }, // Sat
      { amc: null,                          ap: null,                    career: null                      }, // Sun
      { amc: null,                          ap: null,                    career: null                      }, // Mon
    ],
  },
  { // W06
    amcTopic:    'Combinatorics — Counting principle | Perms/combos | Pascal\'s | Binomial coeff | Stars & bars',
    apSubject:   'AP Explore — AP Psychology',
    careerTopic: 'Product Manager & UX/UI Designer',
    dayTasks: [
      { amc: 'AMC: Counting principle',     ap: null,                    career: 'Career: Product Manager'  }, // Tue
      { amc: 'AMC: Perms & combos',         ap: 'AP: Psychology',        career: null                      }, // Wed
      { amc: 'AMC: Pascal\'s triangle',    ap: null,                    career: null                      }, // Thu
      { amc: 'AMC: Binomial coefficients',  ap: null,                    career: 'Career: UX/UI Designer'   }, // Fri
      { amc: 'AMC: Stars & bars',           ap: null,                    career: null                      }, // Sat
      { amc: null,                          ap: null,                    career: null                      }, // Sun
      { amc: null,                          ap: null,                    career: null                      }, // Mon
    ],
  },
  { // W07
    amcTopic:    'Combinatorics — Pigeonhole | Probability+conditional | Expectation | Recursion | Inclusion-exclusion',
    apSubject:   'AP Explore — AP Language & Composition',
    careerTopic: 'Mechanical Engineer & Civil Engineer',
    dayTasks: [
      { amc: 'AMC: Pigeonhole principle',   ap: null,                    career: 'Career: Mechanical Eng'   }, // Tue
      { amc: 'AMC: Conditional prob.',      ap: 'AP: AP Lang & Comp',    career: null                      }, // Wed
      { amc: 'AMC: Expected value',         ap: null,                    career: null                      }, // Thu
      { amc: 'AMC: Recursion',              ap: null,                    career: 'Career: Civil Engineer'   }, // Fri
      { amc: 'AMC: Inclusion-exclusion',    ap: null,                    career: null                      }, // Sat
      { amc: null,                          ap: null,                    career: null                      }, // Sun
      { amc: null,                          ap: null,                    career: null                      }, // Mon
    ],
  },
  { // W08
    amcTopic:    'Combinatorics — Generating functions | Burnside\'s | Double counting | Bijections | Graph counting',
    apSubject:   'AP Explore — AP Literature & Composition',
    careerTopic: 'Pharmacist & Genetic Counselor',
    dayTasks: [
      { amc: 'AMC: Generating functions',   ap: null,                    career: 'Career: Pharmacist'        }, // Tue
      { amc: 'AMC: Burnside\'s lemma',     ap: 'AP: AP Lit & Comp',     career: null                      }, // Wed
      { amc: 'AMC: Double counting',        ap: null,                    career: null                      }, // Thu
      { amc: 'AMC: Bijections',             ap: null,                    career: 'Career: Genetic Counselor' }, // Fri
      { amc: 'AMC: Graph counting',         ap: null,                    career: null                      }, // Sat
      { amc: null,                          ap: null,                    career: null                      }, // Sun
      { amc: null,                          ap: null,                    career: null                      }, // Mon
    ],
  },
  { // W09
    amcTopic:    'Combinatorics — Invariants | Extremal principle | Complementary | Casework | Write 2 problems',
    apSubject:   'AP Explore — AP European History',
    careerTopic: 'Economist & Urban Planner',
    dayTasks: [
      { amc: 'AMC: Invariants',             ap: null,                    career: 'Career: Economist'         }, // Tue
      { amc: 'AMC: Extremal principle',     ap: 'AP: European History',  career: null                      }, // Wed
      { amc: 'AMC: Complementary counting', ap: null,                    career: null                      }, // Thu
      { amc: 'AMC: Casework',               ap: null,                    career: 'Career: Urban Planner'    }, // Fri
      { amc: 'AMC: Write 2 combo problems', ap: null,                    career: null                      }, // Sat
      { amc: null,                          ap: null,                    career: null                      }, // Sun
      { amc: null,                          ap: null,                    career: null                      }, // Mon
    ],
  },
  { // W10
    amcTopic:    'Combinatorics — Combo Review (3 hardest) | 5 AMC combo | Timed 10-problem mini-set',
    apSubject:   'AP Explore — AP Gov & Politics: US',
    careerTopic: 'Neuroscientist & Psychiatrist',
    dayTasks: [
      { amc: 'AMC: Combo review (hard 3)',  ap: null,                    career: 'Career: Neuroscientist'   }, // Tue
      { amc: 'AMC: 5 AMC combo problems',   ap: 'AP: AP Gov (US)',       career: null                      }, // Wed
      { amc: 'AMC: Timed 10-problem set',   ap: null,                    career: null                      }, // Thu
      { amc: 'AMC: Review weak areas',      ap: null,                    career: 'Career: Psychiatrist'     }, // Fri
      { amc: null,                          ap: null,                    career: null                      }, // Sat
      { amc: null,                          ap: null,                    career: null                      }, // Sun
      { amc: null,                          ap: null,                    career: null                      }, // Mon
    ],
  },
  { // W11
    amcTopic:    'Number Theory — Divisibility | Primes | GCD/LCM | Euclidean algorithm | Modular arithmetic',
    apSubject:   'AP Explore — AP Gov & Politics: Comparative',
    careerTopic: 'Machine Learning Engineer & Robotics Engineer',
    dayTasks: [
      { amc: 'AMC: Divisibility rules',     ap: null,                    career: 'Career: ML Engineer'      }, // Tue
      { amc: 'AMC: Primes & factorization', ap: 'AP: AP Gov (Comp)',     career: null                      }, // Wed
      { amc: 'AMC: GCD / LCM',              ap: null,                    career: null                      }, // Thu
      { amc: 'AMC: Euclidean algorithm',    ap: null,                    career: 'Career: Robotics Eng'     }, // Fri
      { amc: 'AMC: Modular arithmetic',     ap: null,                    career: null                      }, // Sat
      { amc: null,                          ap: null,                    career: null                      }, // Sun
      { amc: null,                          ap: null,                    career: null                      }, // Mon
    ],
  },
  { // W12
    amcTopic:    'Number Theory — CRT | Fermat\'s Little | Euler\'s theorem | Wilson\'s | Chicken McNugget',
    apSubject:   'AP Explore — AP Research',
    careerTopic: 'Patent Attorney & Research Scientist',
    dayTasks: [
      { amc: 'AMC: Chinese Remainder Thm',  ap: null,                    career: 'Career: Patent Attorney'  }, // Tue
      { amc: 'AMC: Fermat\'s Little Thm',  ap: 'AP: AP Research',       career: null                      }, // Wed
      { amc: 'AMC: Euler\'s theorem',      ap: null,                    career: null                      }, // Thu
      { amc: 'AMC: Wilson\'s theorem',     ap: null,                    career: 'Career: Research Scientist' }, // Fri
      { amc: 'AMC: Chicken McNugget Thm',   ap: null,                    career: null                      }, // Sat
      { amc: null,                          ap: null,                    career: null                      }, // Sun
      { amc: null,                          ap: null,                    career: null                      }, // Mon
    ],
  },
  { // W13
    amcTopic:    'Number Theory — Legendre\'s | Divisor functions | Order mod n | Digit cycles | Parity',
    apSubject:   'AP Explore — AP Seminar',
    careerTopic: 'Dentist & Veterinarian',
    dayTasks: [
      { amc: 'AMC: Legendre\'s formula',   ap: null,                    career: 'Career: Dentist'           }, // Tue
      { amc: 'AMC: Divisor functions',      ap: 'AP: AP Seminar',        career: null                      }, // Wed
      { amc: 'AMC: Order mod n',            ap: null,                    career: null                      }, // Thu
      { amc: 'AMC: Digit cycles & parity',  ap: null,                    career: 'Career: Veterinarian'     }, // Fri
      { amc: null,                          ap: null,                    career: null                      }, // Sat
      { amc: null,                          ap: null,                    career: null                      }, // Sun
      { amc: null,                          ap: null,                    career: null                      }, // Mon
    ],
  },
];

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function buildWeek(weekIndex) {
  const wNum  = weekIndex + 1;
  const wId   = `W${String(wNum).padStart(3, '0')}`;
  const start = WEEK_STARTS[weekIndex];
  const data  = WEEK_DATA[weekIndex];

  const days = DAYS.map((dayName, di) => ({
    date:       addDays(start, di),
    dayName,
    isWeekend:  di === 4 || di === 5, // Sat=4, Sun=5
    amcTask:    data.dayTasks[di].amc,
    khanTask:   null, // Khan — added later
    apTask:     data.dayTasks[di].ap,
    careerTask: data.dayTasks[di].career,
    otherTasks: [],
    notes:      null,
  }));

  return {
    weekId:          wId,
    weekNumber:      wNum,
    startDate:       start,
    endDate:         addDays(start, 6),
    amcTopic:        data.amcTopic,
    khanLevel:       null, // Khan — added later
    apSubject:       data.apSubject,
    careerTopic:     data.careerTopic,
    creativeProject: null,
    days,
  };
}

export const Q2_WEEKS = Array.from({ length: 13 }, (_, i) => buildWeek(i));

export const Q2_DAYS = Q2_WEEKS.flatMap(week =>
  week.days.map(day => ({
    ...day,
    weekId:     week.weekId,
    weekNumber: week.weekNumber,
    amcTopic:   week.amcTopic,
    khanLevel:  week.khanLevel,
  }))
);

export function getWeekByDate(dateStr) {
  return Q2_WEEKS.find(w => dateStr >= w.startDate && dateStr <= w.endDate) || null;
}

export function getDayEntry(dateStr) {
  return Q2_DAYS.find(d => d.date === dateStr) || null;
}

export function getWeekById(weekId) {
  return Q2_WEEKS.find(w => w.weekId === weekId) || null;
}
