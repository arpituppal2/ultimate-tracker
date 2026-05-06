/* ─────────────────────────────────────────────────────────────
   ApTemplate.jsx
   Advanced Placement (AP) Curriculum Analysis Template
   Single-page, fully self-contained, LAMT design system.
───────────────────────────────────────────────────────────── */

const s = {
  section: {
    marginBottom: 'var(--space-8)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    marginBottom: 'var(--space-4)',
    paddingBottom: 'var(--space-2)',
    borderBottom: '1px solid var(--color-divider)',
  },
  sectionLabel: {
    fontSize: 'var(--text-xs)',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--color-text-faint)',
  },
  sectionTitle: {
    fontSize: 'var(--text-base)',
    fontWeight: 700,
    color: 'var(--color-text)',
    fontFamily: 'var(--font-display)',
  },
  instruction: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    lineHeight: 1.6,
    marginBottom: 'var(--space-3)',
    fontStyle: 'italic',
  },
  fieldWrap: {
    marginBottom: 'var(--space-4)',
  },
  label: {
    display: 'block',
    fontSize: 'var(--text-xs)',
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: 'var(--color-text-faint)',
    marginBottom: 'var(--space-1)',
  },
  input: {
    width: '100%',
    padding: '0.4rem 0.65rem',
    fontSize: 'var(--text-sm)',
    border: '1px solid var(--color-border)',
    borderRadius: 0,
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color var(--transition-interactive)',
  },
  textarea: {
    width: '100%',
    padding: '0.5rem 0.65rem',
    fontSize: 'var(--text-sm)',
    border: '1px solid var(--color-border)',
    borderRadius: 0,
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    boxSizing: 'border-box',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.6,
    transition: 'border-color var(--transition-interactive)',
  },
  sourceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    marginTop: 'var(--space-2)',
  },
  sourceLabel: {
    fontSize: 'var(--text-xs)',
    fontWeight: 700,
    color: 'var(--color-text-faint)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-3)',
  },
  numberedItem: {
    display: 'flex',
    gap: 'var(--space-2)',
    alignItems: 'flex-start',
    marginBottom: 'var(--space-2)',
  },
  itemNum: {
    fontSize: 'var(--text-xs)',
    fontWeight: 800,
    color: 'var(--color-primary)',
    minWidth: 18,
    paddingTop: '0.45rem',
  },
  ratingWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    marginTop: 'var(--space-2)',
  },
  ratingInput: {
    width: 90,
    padding: '0.4rem 0.65rem',
    fontSize: 'var(--text-sm)',
    border: '1px solid var(--color-border)',
    borderRadius: 0,
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color var(--transition-interactive)',
  },
  ratingHint: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-faint)',
  },
};

function focus(e)  { e.target.style.borderColor = 'var(--color-primary)'; }
function blur(e)   { e.target.style.borderColor = 'var(--color-border)'; }

function Field({ label, children, style }) {
  return (
    <div style={{ ...s.fieldWrap, ...style }}>
      {label && <label style={s.label}>{label}</label>}
      {children}
    </div>
  );
}

function Inp({ value, onChange, placeholder, type = 'text', style }) {
  return (
    <input
      type={type}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      style={{ ...s.input, ...style }}
      onFocus={focus}
      onBlur={blur}
    />
  );
}

function Txt({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={s.textarea}
      onFocus={focus}
      onBlur={blur}
    />
  );
}

function SectionHead({ part, title }) {
  return (
    <div style={s.sectionHeader}>
      <span style={s.sectionLabel}>{part}</span>
      <span style={{ color: 'var(--color-divider)', fontSize: 'var(--text-xs)' }}>—</span>
      <span style={s.sectionTitle}>{title}</span>
    </div>
  );
}

function AnalysisBlock({ qNum, qTitle, instruction, value, onChange, sourceValue, onSourceChange, sourcePlaceholder, rows = 4 }) {
  return (
    <div style={s.fieldWrap}>
      <div style={{ marginBottom: 'var(--space-2)' }}>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text)' }}>
          {qNum}. {qTitle}
        </span>
      </div>
      {instruction && <p style={s.instruction}>{instruction}</p>}
      <Txt value={value} onChange={onChange} placeholder="Analysis…" rows={rows} />
      <div style={s.sourceRow}>
        <span style={s.sourceLabel}>Source:</span>
        <input
          value={sourceValue || ''}
          onChange={onSourceChange}
          placeholder={sourcePlaceholder || 'Enter source name or URL'}
          style={{ ...s.input, flex: 1 }}
          onFocus={focus}
          onBlur={blur}
        />
      </div>
    </div>
  );
}

export default function ApTemplate({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });

  return (
    <div>

      {/* ── Header ── */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 'var(--space-1)' }}>
          Submission Template
        </div>
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-text)', lineHeight: 1.2 }}>
          Advanced Placement Curriculum Analysis
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)', lineHeight: 1.5 }}>
          Evaluate academic rigor, exam performance, and collegiate value using primary data sources from College Board and independent review platforms.
        </div>
      </div>

      {/* ── Part 1 ── */}
      <div style={s.section}>
        <SectionHead part="Part 1" title="Course Specifications & Exam Metrics" />
        <p style={s.instruction}>
          Complete this section using the College Board AP Central website. Search for "[AP Course Name] Score Distributions."
        </p>
        <div style={s.grid2}>
          <Field label="Course Name">
            <Inp value={data?.course_name} onChange={e => set('course_name', e.target.value)} placeholder="Full title of the AP course" />
          </Field>
          <Field label="Subject Category">
            <Inp value={data?.subject_category} onChange={e => set('subject_category', e.target.value)} placeholder="e.g. STEM, Humanities, Arts" />
          </Field>
          <Field label="Global Exam Pass Rate (3+)">
            <Inp value={data?.pass_rate} onChange={e => set('pass_rate', e.target.value)} placeholder="e.g. 58.3%" />
          </Field>
          <Field label="Elite Performance Rate (5.0)">
            <Inp value={data?.five_rate} onChange={e => set('five_rate', e.target.value)} placeholder="e.g. 14.2%" />
          </Field>
          <Field label="Mean Score">
            <Inp value={data?.mean_score} onChange={e => set('mean_score', e.target.value)} placeholder="e.g. 3.1" />
          </Field>
          <Field label="Exam Format (MCQ vs. FRQ)">
            <Inp value={data?.exam_format} onChange={e => set('exam_format', e.target.value)} placeholder="e.g. 45 MCQ · 3 FRQ" />
          </Field>
        </div>
      </div>

      {/* ── Part 2 ── */}
      <div style={s.section}>
        <SectionHead part="Part 2" title="Rigor & Utility Assessment" />

        <AnalysisBlock
          qNum={1}
          qTitle="Institutional Credit Policy (T20 Alignment)"
          instruction="Use the College Board AP Credit Policy Search. Select two T20 universities (e.g., Harvard, MIT, or UCLA). Does the university grant credit? What minimum score is required? Does this satisfy a General Education or Major requirement?"
          value={data?.credit_policy}
          onChange={e => set('credit_policy', e.target.value)}
          sourceValue={data?.credit_policy_source}
          onSourceChange={e => set('credit_policy_source', e.target.value)}
          sourcePlaceholder="AP Credit Policy Search Tool"
          rows={4}
        />

        <AnalysisBlock
          qNum={2}
          qTitle="Subject Difficulty & Satisfaction Rating"
          instruction="Use Fiveable or BestColleges rankings for 'Hardest AP Classes.' Where does this course rank in difficulty? Report the student satisfaction rating (if available). Is the workload considered heavy relative to other APs?"
          value={data?.difficulty_rating}
          onChange={e => set('difficulty_rating', e.target.value)}
          sourceValue={data?.difficulty_source}
          onSourceChange={e => set('difficulty_source', e.target.value)}
          sourcePlaceholder="e.g. Fiveable, BestColleges"
          rows={4}
        />

        <AnalysisBlock
          qNum={3}
          qTitle="Strategic Value for T20 Admissions"
          instruction="Is this a 'Core' AP (e.g., Calculus BC, Physics C, English Literature) that elite admissions officers expect, or is it an elective (e.g., Psychology, Human Geography)? How does taking this class demonstrate 'academic courage'?"
          value={data?.strategic_value}
          onChange={e => set('strategic_value', e.target.value)}
          sourceValue={data?.strategic_source}
          onSourceChange={e => set('strategic_source', e.target.value)}
          sourcePlaceholder="Independent Research / Expert Blog"
          rows={4}
        />
      </div>

      {/* ── Part 3 ── */}
      <div style={s.section}>
        <SectionHead part="Part 3" title="Qualitative Performance Review" />
        <p style={s.instruction}>Use Reddit (r/APStudents) or Save My Exams to synthesize peer feedback.</p>

        <AnalysisBlock
          qNum={4}
          qTitle="Primary Conceptual Challenges"
          instruction="Identify the three most difficult units or topics. What makes them difficult (heavy memorization, complex math, abstract theory)? What prerequisite knowledge is required for success?"
          value={data?.conceptual_challenges}
          onChange={e => set('conceptual_challenges', e.target.value)}
          sourceValue={data?.challenges_source}
          onSourceChange={e => set('challenges_source', e.target.value)}
          sourcePlaceholder="e.g. r/APStudents, Save My Exams"
          rows={5}
        />
      </div>

      {/* ── Part 4 ── */}
      <div style={s.section}>
        <SectionHead part="Part 4" title="Final Synthesis & Enrollment Recommendation" />

        <Field label="Final Summary">
          <p style={{ ...s.instruction, marginBottom: 'var(--space-2)' }}>
            Assess whether the probability of achieving a 5.0 is worth the time commitment. Does this course directly support a future T20 major, or is it a filler course? Evaluate the impact of a potential score of 3 or below on a high-tier transcript. (4–5 sentences)
          </p>
          <Txt
            value={data?.final_summary}
            onChange={e => set('final_summary', e.target.value)}
            placeholder="Final synthesis and enrollment recommendation…"
            rows={6}
          />
        </Field>

        <Field label="Rigor Rating (1.0 – 10.0)">
          <p style={{ ...s.instruction, marginBottom: 'var(--space-2)' }}>
            10.0 = Extreme Rigor / High T20 Value · 1.0 = Introductory / Low Collegiate Weight
          </p>
          <div style={s.ratingWrap}>
            <input
              type="number"
              min={1} max={10} step={0.1}
              value={data?.rigor_rating || ''}
              onChange={e => set('rigor_rating', e.target.value)}
              placeholder="e.g. 8.5"
              style={s.ratingInput}
              onFocus={focus}
              onBlur={blur}
            />
            <span style={s.ratingHint}>out of 10.0</span>
          </div>
        </Field>
      </div>

      {/* ── Part 5 ── */}
      <div style={s.section}>
        <SectionHead part="Part 5" title="Personal Alignment & Subjective Fit" />

        {/* Likes */}
        <Field label="1. Primary Incentives — 3 Things You Like">
          <p style={{ ...s.instruction, marginBottom: 'var(--space-2)' }}>
            Identify three specific components of the curriculum or exam structure that align with your academic strengths. Focus on the why.
          </p>
          {[1, 2, 3].map(n => (
            <div key={n} style={s.numberedItem}>
              <span style={s.itemNum}>{n}.</span>
              <input
                value={data?.[`like_${n}`] || ''}
                onChange={e => set(`like_${n}`, e.target.value)}
                placeholder="Specific aspect of coursework or topic you like"
                style={{ ...s.input, flex: 1 }}
                onFocus={focus}
                onBlur={blur}
              />
            </div>
          ))}
        </Field>

        {/* Dislikes */}
        <Field label="2. Significant Deterrents — 3 Things You Dislike">
          <p style={{ ...s.instruction, marginBottom: 'var(--space-2)' }}>
            Identify three specific factors that may hinder your performance or engagement. Be critical about the cost of the course.
          </p>
          {[1, 2, 3].map(n => (
            <div key={n} style={s.numberedItem}>
              <span style={s.itemNum}>{n}.</span>
              <input
                value={data?.[`dislike_${n}`] || ''}
                onChange={e => set(`dislike_${n}`, e.target.value)}
                placeholder="Specific burden or negative factor"
                style={{ ...s.input, flex: 1 }}
                onFocus={focus}
                onBlur={blur}
              />
            </div>
          ))}
        </Field>

        {/* Success probability */}
        <AnalysisBlock
          qNum={3}
          qTitle="Success Probability Analysis"
          instruction="Compare the Elite Performance Rate (5.0) from Part 1 with your own past performance in this subject area. Given your interest and the identified deterrents, what is the realistic likelihood of achieving a 5.0? State what specific lifestyle or study changes would be required. (2–3 sentences)"
          value={data?.success_probability}
          onChange={e => set('success_probability', e.target.value)}
          sourceValue={data?.success_source}
          onSourceChange={e => set('success_source', e.target.value)}
          sourcePlaceholder="Self-Reflection / Past Grade Trends"
          rows={4}
        />
      </div>

      {/* ── Part 6 ── */}
      <div style={s.section}>
        <SectionHead part="Part 6" title="Documented Evidence — Source Audit" />
        <p style={s.instruction}>
          All claims regarding rigor, credit policies, and difficulty must be backed by documented evidence. Provide the specific links used.
        </p>

        <Field label="Official Curriculum Source">
          <Inp value={data?.source_curriculum} onChange={e => set('source_curriculum', e.target.value)} placeholder="Link to College Board Course & Exam Description" />
        </Field>
        <Field label="Institutional Credit Proof">
          <Inp value={data?.source_credit} onChange={e => set('source_credit', e.target.value)} placeholder="Link to T20 University AP Credit Table" />
        </Field>
        <Field label="Rigor / Difficulty Source">
          <Inp value={data?.source_rigor} onChange={e => set('source_rigor', e.target.value)} placeholder="Link to Fiveable, BestColleges, or similar ranking" />
        </Field>
        <Field label="Peer / Student Sentiment">
          <Inp value={data?.source_sentiment} onChange={e => set('source_sentiment', e.target.value)} placeholder="Link to r/APStudents or similar forum" />
        </Field>
      </div>

      {/* ── Final Thoughts ── */}
      <div style={s.section}>
        <SectionHead part="Final Thoughts" title="Closing Remarks" />
        <Txt
          value={data?.final_thoughts}
          onChange={e => set('final_thoughts', e.target.value)}
          placeholder="Any additional reflections, caveats, or context not covered above…"
          rows={5}
        />
      </div>

    </div>
  );
}
