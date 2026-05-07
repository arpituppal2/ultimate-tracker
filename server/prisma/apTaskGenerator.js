'use strict';

function cloneDate(dateLike) {
  return new Date(dateLike.getTime());
}

function asUtcDay(dateLike) {
  if (dateLike instanceof Date) {
    return new Date(Date.UTC(
      dateLike.getUTCFullYear(),
      dateLike.getUTCMonth(),
      dateLike.getUTCDate(),
      8,
      0,
      0,
      0
    ));
  }

  const [year, month, day] = String(dateLike).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 8, 0, 0, 0));
}

function addDays(dateLike, amount) {
  const value = asUtcDay(dateLike);
  value.setUTCDate(value.getUTCDate() + amount);
  return value;
}

function enumerateDaysInclusive(startDate, endDate) {
  const out = [];
  const start = asUtcDay(startDate);
  const end = asUtcDay(endDate);

  for (let current = cloneDate(start); current <= end; current = addDays(current, 1)) {
    out.push(cloneDate(current));
  }

  return out;
}

function topicsForUnit(unit, titles) {
  return titles.map((title, index) => ({
    unit,
    topic: index + 1,
    title,
  }));
}

const GRADE_WINDOWS = {
  ninth: { startDate: '2027-05-03', endDate: '2028-04-29' },
  tenth: { startDate: '2028-05-01', endDate: '2029-04-29' },
  eleventh: { startDate: '2029-04-30', endDate: '2030-04-28' },
  twelfth: { startDate: '2030-04-29', endDate: '2031-01-26' },
};

const AP_ACTIVE_WINDOWS = [
  { apName: 'AP Psychology', ...GRADE_WINDOWS.ninth },
  { apName: 'AP Precalculus', ...GRADE_WINDOWS.ninth },
  { apName: 'AP Computer Science Principles', ...GRADE_WINDOWS.ninth },
  { apName: 'AP Physics 1', ...GRADE_WINDOWS.ninth },
  { apName: 'AP Biology', startDate: '2027-05-03', endDate: '2029-04-29' },

  { apName: 'AP Calculus BC', ...GRADE_WINDOWS.tenth },
  { apName: 'AP Physics 2', ...GRADE_WINDOWS.tenth },
  { apName: 'AP Computer Science A', ...GRADE_WINDOWS.tenth },
  { apName: 'AP Human Geography', ...GRADE_WINDOWS.tenth },
  { apName: 'AP Chemistry', ...GRADE_WINDOWS.tenth },

  { apName: 'AP Physics C: Electricity and Magnetism', ...GRADE_WINDOWS.eleventh },
  { apName: 'AP Physics C: Mechanics', ...GRADE_WINDOWS.eleventh },
  { apName: 'AP Statistics', ...GRADE_WINDOWS.eleventh },

  { apName: 'AP Spanish Language', ...GRADE_WINDOWS.twelfth },
  { apName: 'AP Business', ...GRADE_WINDOWS.twelfth },
];

const AP_TOPIC_CATALOG = {
  'AP Calculus BC': [
    ...topicsForUnit(1, [
      'Introducing Calculus: Can Change Occur at an Instant?',
      'Defining Limits and Using Limit Notation',
      'Estimating Limit Values from Graphs',
      'Estimating Limit Values from Tables',
      'Determining Limits Using Algebraic Properties of Limits',
      'Determining Limits Using Algebraic Manipulation',
      'Selecting Procedures for Determining Limits',
      'Determining Limits Using the Squeeze Theorem',
      'Connecting Multiple Representations of Limits',
      'Exploring Types of Discontinuities',
      'Defining Continuity at a Point',
      'Confirming Continuity over an Interval',
      'Removing Discontinuities',
      'Connecting Infinite Limits and Vertical Asymptotes',
      'Connecting Limits at Infinity and Horizontal Asymptotes',
      'Working with the Intermediate Value Theorem',
    ]),
    ...topicsForUnit(2, [
      'Defining Average and Instantaneous Rates of Change at a Point',
      'Defining the Derivative of a Function and Using Derivative Notation',
      'Estimating Derivatives of a Function at a Point',
      'Connecting Differentiability and Continuity',
      'Applying the Power Rule',
      'Derivative Rules for Constants, Sums, Differences, and Constant Multiples',
      'The Product Rule',
      'The Quotient Rule',
      'Derivatives of Trigonometric Functions',
      'Derivatives of Exponential Functions',
      'Derivatives of Logarithmic Functions',
    ]),
    ...topicsForUnit(3, [
      'The Chain Rule',
      'The Chain Rule with Composite Structures',
      'Implicit Differentiation',
      'Differentiating Inverse Functions',
      'Selecting Procedures for Calculating Derivatives',
      'Calculating Higher-Order Derivatives',
    ]),
    ...topicsForUnit(4, [
      'Interpreting Derivatives in Context',
      'Straight-Line Motion: Connecting Position, Velocity, and Acceleration',
      'Rates of Change in Applied Contexts Other Than Motion',
      'Introduction to Related Rates',
      'Solving Related Rates Problems',
      'Local Linearity and Linearization',
      "Using L'Hospital's Rule for Determining Limits of Indeterminate Forms",
    ]),
    ...topicsForUnit(5, [
      'Using Derivatives to Understand the Behavior of Functions',
      'Extreme Value Theorem and Global Extrema',
      'Finding Candidates for Local Extrema',
      'Determining Intervals on Which a Function Is Increasing or Decreasing',
      'Using the First Derivative Test to Determine Relative Extrema',
      'Using Derivatives to Determine Concavity',
      'Using the Second Derivative Test to Determine Extrema',
      'Sketching Graphs of Functions and Their Derivatives',
      'Connecting a Function, Its First Derivative, and Its Second Derivative',
      'Introduction to Optimization Problems',
      'Solving Optimization Problems',
      'Exploring Behaviors of Implicit Relations',
    ]),
    ...topicsForUnit(6, [
      'Exploring Accumulations of Change',
      'Approximating Areas with Riemann Sums',
      'Riemann Sums, Summation Notation, and Definite Integral Notation',
      'The Fundamental Theorem of Calculus and Accumulation Functions',
      'Interpreting the Behavior of Accumulation Functions Involving Area',
      'Applying Properties of Definite Integrals',
      'Integrating Using U-Substitution',
      'Finding Antiderivatives and Indefinite Integrals',
      'Integrating Using Long Division and Completing the Square',
    ]),
    ...topicsForUnit(7, [
      'Determining Solutions to Differential Equations',
      'Verifying Solutions to Differential Equations',
      'Sketching Slope Fields',
      'Reasoning Using Slope Fields',
      "Approximating Solutions Using Euler's Method",
      'Finding General Solutions Using Separation of Variables',
      'Finding Particular Solutions Using Initial Conditions',
      'Exponential Models with Differential Equations',
      'Logistic Models with Differential Equations',
    ]),
    ...topicsForUnit(8, [
      'Finding the Average Value of a Function on an Interval',
      'Connecting Position, Velocity, and Acceleration Using Integrals',
      'Using Accumulation Functions and Definite Integrals in Applied Contexts',
      'Finding Area Between Curves Expressed as Functions of x',
      'Finding Area Between Curves Expressed as Functions of y',
      'Finding Volume with Cross Sections',
      'Finding Volume with the Disc Method',
      'Finding Volume with the Washer Method',
      'Finding Volume with the Cylindrical Shell Method',
    ]),
    ...topicsForUnit(9, [
      'Representing Parametric Functions Graphically',
      'Representing Parametric Functions Analytically',
      'Differentiating Parametric Functions',
      'Integrating Parametric Functions',
      'Connecting Different Representations of Polar Functions',
      'Differentiating Polar Functions',
      'Integrating Polar Functions',
      'Finding Areas of Polar Regions',
      'Vector-Valued Functions',
      'Differentiating Vector-Valued Functions',
      'Integrating Vector-Valued Functions',
    ]),
    ...topicsForUnit(10, [
      'Defining Convergent and Divergent Infinite Sequences',
      'Working with Geometric Series',
      'The Harmonic Series and Other Divergent Series',
      'Testing for Divergence',
      'The Integral Test for Convergence',
      'The Comparison Test',
      'The Alternating Series Test',
      'The Ratio Test',
      'Determining Intervals of Convergence',
      'Finding Taylor Polynomial Approximations of Functions',
      'The Lagrange Error Bound',
      'Finding Taylor and Maclaurin Series for Common Functions',
      'Finding Taylor and Maclaurin Series Using Known Series',
      'Working with the Taylor Series for the Derivative of a Function',
      'Representing Functions as Power Series',
    ]),
  ],
  'AP Biology': [
    ...topicsForUnit(1, [
      'Structure of Water and Hydrogen Bonding',
      'Elements of Life and Biological Macromolecules',
      'Properties of Biological Molecules',
      'Introduction to Biological Systems',
    ]),
    ...topicsForUnit(2, [
      'Cell Structure and Function',
      'Cell Size and Surface Area to Volume Ratios',
      'Cell Membrane Structure and Transport',
      'Facilitated Diffusion and Active Transport',
      'Tonicity and Osmoregulation',
      'Subcellular Components and Their Roles',
    ]),
    ...topicsForUnit(3, [
      'Enzyme Structure and Function',
      'Environmental Impacts on Enzyme Activity',
      'Cellular Energy and ATP',
      'Photosynthesis',
      'Cellular Respiration',
    ]),
    ...topicsForUnit(4, [
      'Cell Communication',
      'Signal Transduction Pathways',
      'Feedback Mechanisms',
      'Cell Cycle',
      'Mitosis',
      'Meiosis',
    ]),
    ...topicsForUnit(5, [
      'Mendelian Genetics',
      'Non-Mendelian Genetics',
      'Environmental Effects on Phenotype',
      'Chromosomal Inheritance',
    ]),
    ...topicsForUnit(6, [
      'DNA and RNA Structure',
      'DNA Replication',
      'Transcription and RNA Processing',
      'Translation',
      'Gene Regulation',
      'Mutations and Biotechnology',
    ]),
    ...topicsForUnit(7, [
      'Natural Selection',
      'Artificial Selection',
      'Population Genetics',
      'Hardy-Weinberg Equilibrium',
      'Phylogeny and Speciation',
    ]),
    ...topicsForUnit(8, [
      'Responses to the Environment',
      'Population Ecology',
      'Community Ecology',
      'Biodiversity',
      'Disruptions to Ecosystems',
    ]),
  ],
  'AP Chemistry': [
    ...topicsForUnit(1, [
      'Moles and Molar Mass',
      'Mass Spectroscopy of Elements',
      'Elemental Composition of Pure Substances',
      'Composition of Mixtures',
      'Atomic Structure and Electron Configuration',
      'Photoelectron Spectroscopy',
      'Periodic Trends',
      'Valence Electrons and Ionic Compounds',
    ]),
    ...topicsForUnit(2, [
      'Types of Chemical Bonds',
      'Intramolecular Force and Potential Energy',
      'Structure of Ionic Solids',
      'Structure of Metals and Alloys',
      'Lewis Diagrams',
      'Resonance and Formal Charge',
      'VSEPR and Bond Hybridization',
    ]),
    ...topicsForUnit(3, [
      'Intermolecular Forces',
      'Properties of Solids',
      'Properties of Liquids',
      'Properties of Solutions',
      'Ideal Gas Law',
      'Kinetic Molecular Theory',
    ]),
    ...topicsForUnit(4, [
      'Introduction for Reactions',
      'Net Ionic Equations',
      'Representations of Reactions',
      'Physical and Chemical Changes',
      'Stoichiometry',
      'Introduction to Titration',
      'Types of Chemical Reactions',
    ]),
    ...topicsForUnit(5, [
      'Reaction Rates',
      'Rate Laws',
      'Elementary Reactions',
      'Collision Model',
      'Reaction Energy Profile',
      'Catalysis',
    ]),
    ...topicsForUnit(6, [
      'Endothermic and Exothermic Processes',
      'Energy of Phase Changes',
      'Heat Transfer and Thermal Equilibrium',
      'Hess’s Law',
      'Entropy',
      'Gibbs Free Energy and Thermodynamic Favorability',
    ]),
    ...topicsForUnit(7, [
      'Introduction to Equilibrium',
      'Calculating the Equilibrium Constant',
      'Reaction Quotient and Le Châtelier’s Principle',
      'Solubility Equilibria',
      'Free Energy of Dissolution',
    ]),
    ...topicsForUnit(8, [
      'Introduction to Acids and Bases',
      'pH and pOH of Strong Acids and Bases',
      'Acid-Base Reactions and Buffers',
      'Weak Acid and Base Equilibria',
      'Acid-Base Titrations',
      'Molecular Structure of Acids and Bases',
    ]),
    ...topicsForUnit(9, [
      'Galvanic and Electrolytic Cells',
      'Electrolysis and Faraday’s Law',
      'Application of Thermodynamics in Electrochemistry',
    ]),
  ],
  'AP Physics 1': [
    ...topicsForUnit(1, [
      'Kinematics in One Dimension',
      'Representations of Motion',
      'Kinematics in Two Dimensions',
      'Relative Motion',
    ]),
    ...topicsForUnit(2, [
      "Newton's First and Second Laws",
      'Forces and Free-Body Diagrams',
      'Newton’s Third Law',
      'Circular Motion and Gravitation',
    ]),
    ...topicsForUnit(3, [
      'Work and the Work-Energy Theorem',
      'Potential Energy',
      'Conservation of Energy',
      'Power',
    ]),
    ...topicsForUnit(4, [
      'Linear Momentum',
      'Impulse',
      'Conservation of Linear Momentum',
      'Collisions',
    ]),
    ...topicsForUnit(5, [
      'Rotational Kinematics',
      'Torque',
      'Rotational Dynamics',
      'Static Equilibrium',
    ]),
    ...topicsForUnit(6, [
      'Angular Momentum',
      'Rolling Motion',
      'Rotational Energy',
    ]),
    ...topicsForUnit(7, [
      'Simple Harmonic Motion',
      'Pendulums',
      'Energy in Oscillations',
    ]),
    ...topicsForUnit(8, [
      'Fluid Density and Pressure',
      'Buoyant Force',
      'Fluid Flow and Continuity',
    ]),
  ],
  'AP Physics 2': [
    ...topicsForUnit(1, [
      'Temperature and Thermal Equilibrium',
      'Heat Transfer and Calorimetry',
      'Ideal Gases and Kinetic Theory',
      'Thermodynamic Processes',
    ]),
    ...topicsForUnit(2, [
      'Electric Charge and Coulomb’s Law',
      'Electric Fields',
      'Electric Potential',
      'Potential from Charged Objects',
    ]),
    ...topicsForUnit(3, [
      'Current and Resistance',
      'Ohm’s Law',
      'Series and Parallel Circuits',
      'Kirchhoff’s Laws',
      'Capacitors',
    ]),
    ...topicsForUnit(4, [
      'Magnetic Fields',
      'Magnetic Force on Moving Charges',
      'Electromagnetic Induction',
      'Induced Electric Fields',
    ]),
    ...topicsForUnit(5, [
      'Reflection and Refraction',
      'Thin Lenses and Mirrors',
      'Image Formation',
    ]),
    ...topicsForUnit(6, [
      'Wave Properties',
      'Sound',
      'Interference and Diffraction',
      'Physical Optics',
    ]),
    ...topicsForUnit(7, [
      'Quantum and Photon Models of Light',
      'Atomic and Nuclear Physics',
      'Radioactive Decay',
    ]),
  ],
  'AP Physics C: Mechanics': [
    ...topicsForUnit(1, [
      'Position, Velocity, and Acceleration with Calculus',
      'One-Dimensional Motion',
      'Two-Dimensional Motion and Vectors',
    ]),
    ...topicsForUnit(2, [
      "Newton's Laws with Calculus",
      'Forces, Friction, and Constraint Systems',
      'Circular Motion and Gravitation',
    ]),
    ...topicsForUnit(3, [
      'Work and Energy Integrals',
      'Potential Energy and Conservative Forces',
      'Power and Energy Graphs',
    ]),
    ...topicsForUnit(4, [
      'Linear Momentum and Impulse',
      'Center of Mass',
      'Collisions and Conservation Laws',
    ]),
    ...topicsForUnit(5, [
      'Torque and Rotational Kinematics',
      'Rotational Inertia',
      'Rotational Dynamics',
    ]),
    ...topicsForUnit(6, [
      'Angular Momentum',
      'Rolling Motion',
      'Oscillations',
    ]),
    ...topicsForUnit(7, [
      'Gravitation',
      'Mechanics FRQ Modeling',
      'Experimental Design and Error Analysis',
    ]),
  ],
  'AP Physics C: Electricity and Magnetism': [
    ...topicsForUnit(1, [
      'Coulomb’s Law and Charge Distributions',
      'Electric Fields from Continuous Distributions',
      'Electric Potential',
    ]),
    ...topicsForUnit(2, [
      'Gauss’s Law',
      'Conductors and Equipotentials',
      'Capacitance',
    ]),
    ...topicsForUnit(3, [
      'Current, Resistance, and Resistivity',
      'Series and Parallel Circuits',
      'Kirchhoff’s Laws',
      'RC Circuits',
    ]),
    ...topicsForUnit(4, [
      'Magnetic Fields and Forces',
      'Motion of Charged Particles in Magnetic Fields',
      'Biot-Savart and Ampere’s Law',
    ]),
    ...topicsForUnit(5, [
      'Electromagnetic Induction',
      'Faraday’s Law',
      'Lenz’s Law',
    ]),
    ...topicsForUnit(6, [
      'Field-Based Systems FRQs',
      'Maxwell Connections and Synthesis',
      'Cumulative Review',
    ]),
  ],
  'AP Statistics': [
    ...topicsForUnit(1, [
      'Introducing Statistics and Data',
      'Visualizing Quantitative Data',
      'Describing Distributions',
      'Comparing Distributions',
    ]),
    ...topicsForUnit(2, [
      'Measures of Center and Spread',
      'Density Curves and the Normal Distribution',
      'Transforming Data',
      'Outliers and Resistant Measures',
    ]),
    ...topicsForUnit(3, [
      'Scatterplots and Correlation',
      'Least-Squares Regression',
      'Residuals and Model Fit',
      'Association in Categorical Data',
    ]),
    ...topicsForUnit(4, [
      'Sampling and Surveys',
      'Experiments',
      'Bias and Randomization',
      'Observational Studies versus Experiments',
    ]),
    ...topicsForUnit(5, [
      'Probability Models',
      'Conditional Probability',
      'Random Variables',
      'Expected Value',
    ]),
    ...topicsForUnit(6, [
      'Probability Distributions',
      'Binomial and Geometric Settings',
      'Sampling Distributions',
    ]),
    ...topicsForUnit(7, [
      'Estimating Population Proportions',
      'Testing Claims About Proportions',
      'Confidence Intervals for Means',
    ]),
    ...topicsForUnit(8, [
      'Significance Tests for Means',
      'Inference for Two Samples',
      'Matched Pairs and Difference of Means',
    ]),
    ...topicsForUnit(9, [
      'Chi-Square Procedures',
      'Inference for Regression Slope',
      'Investigative Task Strategy',
    ]),
  ],
  'AP Computer Science A': [
    ...topicsForUnit(1, [
      'Java Program Structure',
      'Primitive Types',
      'Variables and Assignments',
      'Expressions and Compound Assignment',
    ]),
    ...topicsForUnit(2, [
      'Using Objects',
      'String Methods',
      'Math Class and Casting',
      'Calling Methods',
    ]),
    ...topicsForUnit(3, [
      'Boolean Expressions',
      'if Statements',
      'if-else and Nested Conditionals',
      'Compound Boolean Expressions',
    ]),
    ...topicsForUnit(4, [
      'Iteration with while',
      'for Loops',
      'Nested Iteration',
      'Loop Analysis',
    ]),
    ...topicsForUnit(5, [
      'Writing Classes',
      'Constructors',
      'Accessor and Mutator Methods',
      'Encapsulation',
    ]),
    ...topicsForUnit(6, [
      'Arrays',
      'Enhanced for Loops',
      'Array Algorithms',
    ]),
    ...topicsForUnit(7, [
      'ArrayList Methods',
      'ArrayList Traversal',
      'ArrayList Algorithms',
    ]),
    ...topicsForUnit(8, [
      '2D Arrays',
      'Traversing 2D Arrays',
      '2D Array Algorithms',
    ]),
    ...topicsForUnit(9, [
      'Inheritance',
      'Polymorphism',
      'Object Superclass',
    ]),
    ...topicsForUnit(10, [
      'Recursion',
      'Recursive Methods and Tracing',
      'Cumulative FRQ Coding Practice',
    ]),
  ],
  'AP Computer Science Principles': [
    ...topicsForUnit(1, [
      'Binary and Data Compression',
      'Metadata and Data Storage',
      'Images, Audio, and Data Representation',
      'Lossy and Lossless Compression',
    ]),
    ...topicsForUnit(2, [
      'The Internet and Protocols',
      'Routing and Reliability',
      'Fault Tolerance and Redundancy',
      'The Web and Requests',
    ]),
    ...topicsForUnit(3, [
      'Variables and Assignment',
      'Conditionals',
      'Iteration',
      'Procedural Abstraction',
    ]),
    ...topicsForUnit(4, [
      'Algorithms and Sequencing',
      'Selection and Iteration in Algorithms',
      'Algorithmic Efficiency',
      'Correctness and Debugging',
    ]),
    ...topicsForUnit(5, [
      'Data Collection',
      'Cleaning and Transforming Data',
      'Visualization',
      'Drawing Conclusions from Data',
    ]),
    ...topicsForUnit(6, [
      'Simulations and Models',
      'Using Randomness',
      'Scenario Testing',
      'Abstractions in Simulations',
    ]),
    ...topicsForUnit(7, [
      'Cybersecurity Basics',
      'Encryption and Public Key Ideas',
      'Authentication and Data Integrity',
      'Privacy and Digital Footprints',
    ]),
    ...topicsForUnit(8, [
      'Computing Innovations',
      'Impact and Bias',
      'Responsible Computing',
      'Create Task Communication',
    ]),
  ],
  'AP Precalculus': [
    ...topicsForUnit(1, [
      'Change in Arithmetic and Geometric Situations',
      'Function Composition and Inverses',
      'Transformations of Functions',
      'Modeling with Functions',
      'Piecewise and Absolute Value Functions',
      'Function Families and Multiple Representations',
    ]),
    ...topicsForUnit(2, [
      'Polynomial Functions',
      'Rational Functions',
      'Zeros and End Behavior',
      'Asymptotic Behavior',
      'Modeling with Polynomial and Rational Functions',
    ]),
    ...topicsForUnit(3, [
      'Exponential Functions',
      'Logarithmic Functions',
      'Exponential and Logarithmic Equations',
      'Growth, Decay, and Logistic Models',
      'Function Comparison and Parameter Interpretation',
    ]),
    ...topicsForUnit(4, [
      'Angle Measure and the Unit Circle',
      'Sine, Cosine, and Tangent Functions',
      'Trigonometric Transformations',
      'Trigonometric Identities',
      'Solving Trigonometric Equations',
      'Polar Coordinates and Parametric Representations',
    ]),
  ],
  'AP Psychology': [
    ...topicsForUnit(1, [
      'History and Perspectives of Psychology',
      'Research Methods and Ethics',
      'Statistical Reasoning in Psychology',
    ]),
    ...topicsForUnit(2, [
      'Biological Bases of Behavior',
      'Brain Structure and Function',
      'The Nervous and Endocrine Systems',
      'States of Consciousness',
    ]),
    ...topicsForUnit(3, [
      'Sensation',
      'Perception',
      'Gestalt Principles and Thresholds',
    ]),
    ...topicsForUnit(4, [
      'Learning',
      'Classical Conditioning',
      'Operant Conditioning',
      'Observational Learning',
    ]),
    ...topicsForUnit(5, [
      'Memory',
      'Thinking and Problem Solving',
      'Language',
      'Intelligence',
    ]),
    ...topicsForUnit(6, [
      'Motivation',
      'Emotion',
      'Stress and Health',
    ]),
    ...topicsForUnit(7, [
      'Developmental Psychology',
      'Attachment and Social Development',
      'Aging and Life Span Development',
    ]),
    ...topicsForUnit(8, [
      'Personality Theories',
      'Testing and Individual Differences',
      'Psychological Disorders',
      'Treatment of Disorders',
    ]),
    ...topicsForUnit(9, [
      'Social Psychology',
      'Group Behavior',
      'Attribution and Attitudes',
      'Applying Terms to FRQ Scenarios',
    ]),
  ],
  'AP Human Geography': [
    ...topicsForUnit(1, [
      'Thinking Geographically',
      'Maps and Spatial Data',
      'Scale of Analysis',
      'Regionalization',
    ]),
    ...topicsForUnit(2, [
      'Population Distribution',
      'Population Growth and Decline',
      'Migration',
      'Population Policies',
    ]),
    ...topicsForUnit(3, [
      'Cultural Patterns',
      'Diffusion',
      'Language',
      'Religion',
      'Ethnicity and Gender',
    ]),
    ...topicsForUnit(4, [
      'Political Organization of Space',
      'Boundaries and States',
      'Voting and Gerrymandering',
      'Supranationalism and Devolution',
    ]),
    ...topicsForUnit(5, [
      'Agriculture and Rural Land Use',
      'Agricultural Production Regions',
      'Rural Settlement Patterns',
      'Food Security',
    ]),
    ...topicsForUnit(6, [
      'Industrialization',
      'Measures of Development',
      'Theories of Economic Development',
      'Women and Economic Development',
    ]),
    ...topicsForUnit(7, [
      'Urbanization',
      'Cities and Urban Models',
      'Infrastructure and Services',
      'Sustainable Urban Design',
    ]),
  ],
  'AP Spanish Language': [
    ...topicsForUnit(1, [
      'Families and Communities',
      'Interpersonal Speaking and Informal Conversation',
      'Interpretive Reading for Main Idea and Detail',
      'Vocabulary Expansion Through Cultural Texts',
    ]),
    ...topicsForUnit(2, [
      'Personal and Public Identities',
      'Formal Email',
      'Persuasive Argument with Cultural Context',
      'Audio Interpretation and Note Capture',
    ]),
    ...topicsForUnit(3, [
      'Beauty and Aesthetics',
      'Cultural Comparison',
      'Presentational Speaking',
      'Integrating Sources in Writing',
    ]),
    ...topicsForUnit(4, [
      'Science and Technology',
      'Listening for Tone and Inference',
      'Conversation Simulation',
      'Reading and Audio Synthesis',
    ]),
    ...topicsForUnit(5, [
      'Global Challenges',
      'Argumentation with Evidence',
      'Nuanced Grammar in Context',
      'Timing and Fluency under Pressure',
    ]),
    ...topicsForUnit(6, [
      'Contemporary Life',
      'Mixed-Mode AP Task Practice',
      'Culture, Register, and Precision',
      'Cumulative Review',
    ]),
  ],
  'AP Business': [
    ...topicsForUnit(1, [
      'Business Ownership and Value Creation',
      'Stakeholders and Incentives',
      'Business Models and Revenue Streams',
    ]),
    ...topicsForUnit(2, [
      'Marketing Strategy',
      'Segmentation, Positioning, and Branding',
      'Customer Research and Market Sizing',
    ]),
    ...topicsForUnit(3, [
      'Accounting Fundamentals',
      'Income Statements and Balance Sheets',
      'Cash Flow and Unit Economics',
    ]),
    ...topicsForUnit(4, [
      'Operations and Supply Chains',
      'Capacity, Constraints, and Quality Control',
      'Risk Management',
    ]),
    ...topicsForUnit(5, [
      'People Management',
      'Hiring, Teams, and Incentives',
      'Leadership and Organizational Design',
    ]),
    ...topicsForUnit(6, [
      'Entrepreneurship and Growth',
      'Product Strategy and Experimentation',
      'Pitching, Strategy, and Competitive Advantage',
    ]),
  ],
};

function fillReviewTasks(apName, existingTasks, window, tasksPerDay = 2) {
  const contentCount = existingTasks.length;
  const dates = enumerateDaysInclusive(window.startDate, window.endDate);
  const totalSlots = dates.length * tasksPerDay;
  const remaining = Math.max(0, totalSlots - contentCount);
  const highestUnit = existingTasks.reduce((max, task) => Math.max(max, task.unit || 0), 0);
  const reviewUnitStart = Math.max(12, highestUnit + 1);
  const firstReviewDayIndex = Math.floor(contentCount / tasksPerDay);
  const reviews = [];

  for (let index = 0; index < remaining; index += 1) {
    const slotIndex = contentCount + index;
    const dayIndex = Math.floor(slotIndex / tasksPerDay);
    const slotOfDay = (slotIndex % tasksPerDay) + 1;
    const dueDate = dates[dayIndex];
    const reviewUnit = reviewUnitStart + (dayIndex - firstReviewDayIndex);
    const canonicalTitle = `Spiral Review Set ${reviewUnit}.${slotOfDay}`;

    reviews.push({
      source: 'ap-topic-seed',
      apName,
      unit: reviewUnit,
      topicNumber: slotOfDay,
      title: `${apName} — ${canonicalTitle}`,
      dueDate: cloneDate(dueDate),
      meta: {
        apName,
        unit: reviewUnit,
        topicNumber: slotOfDay,
        canonicalTitle,
        slotOfDay,
        tasksPerDay,
        reviewTask: true,
      },
    });
  }

  return reviews;
}

function buildApTasksForWindow(apName, topics, window, options = {}) {
  const tasksPerDay = Number(options.tasksPerDay) || 2;
  const dates = enumerateDaysInclusive(window.startDate, window.endDate);
  const tasks = [];
  const totalSlots = dates.length * tasksPerDay;
  const limitedTopics = topics.slice(0, totalSlots);

  limitedTopics.forEach((topic, index) => {
    const dayIndex = Math.floor(index / tasksPerDay);
    const slotOfDay = (index % tasksPerDay) + 1;
    const dueDate = dates[dayIndex];

    tasks.push({
      source: 'ap-topic-seed',
      apName,
      unit: topic.unit,
      topicNumber: topic.topic,
      title: `[${topic.unit}.${topic.topic}] ${topic.title}`,
      dueDate: cloneDate(dueDate),
      meta: {
        apName,
        unit: topic.unit,
        topicNumber: topic.topic,
        canonicalTitle: topic.title,
        slotOfDay,
        tasksPerDay,
      },
    });
  });

  if (tasks.length < totalSlots) {
    tasks.push(...fillReviewTasks(apName, tasks, window, tasksPerDay));
  }

  return tasks;
}

function generateAllApTasks(options = {}) {
  const tasksPerDay = Number(options.tasksPerDay) || 2;

  return AP_ACTIVE_WINDOWS.flatMap(window => {
    const topics = AP_TOPIC_CATALOG[window.apName];
    if (!topics || topics.length === 0) return [];
    return buildApTasksForWindow(window.apName, topics, window, { tasksPerDay });
  });
}

module.exports = {
  AP_ACTIVE_WINDOWS,
  AP_TOPIC_CATALOG,
  buildApTasksForWindow,
  fillReviewTasks,
  generateAllApTasks,
};
