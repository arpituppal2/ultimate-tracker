/*
  APAnalysisTemplate.jsx — AP Curriculum Analysis
  Based on the AP Analysis Framework in Avni's Master Plan. LAMT design system.
*/
const base = {
  width: '100%', padding: '0.4rem 0.65rem',
  fontSize: 'var(--text-sm)', border: '1px solid var(--color-border)',
  borderRadius: 0, background: 'var(--color-surface)', color: 'var(--color-text)',
  boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
  transition: 'border-color var(--transition-interactive)',
};
const focus = e => { e.target.style.borderColor = 'var(--color-primary)'; };
const blur  = e => { e.target.style.borderColor = 'var(--color-border)'; };
function Inp({ value, onChange, placeholder, type = 'text', style }) {
  return <input type={type} value={value || ''} onChange={onChange} placeholder={placeholder}
    style={{ ...base, ...style }} onFocus={focus} onBlur={blur} />;
}
function Txt({ value, onChange, placeholder, rows = 4 }) {
  return <textarea value={value || ''} onChange={onChange} placeholder={placeholder} rows={rows}
    style={{ ...base, resize: 'vertical', lineHeight: 1.7 }} onFocus={focus} onBlur={blur} />;
}
function Label({ children, required }) {
  return (
    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 'var(--space-1)' }}>
      {children}{required && <span style={{ color: 'var(--color-error)', marginLeft: 2 }}>*</span>}
    </label>
  );
}
function Field({ label, required, hint, source, children, style }) {
  return (
    <div style={{ marginBottom: 'var(--space-4)', ...style }}>
      {label && <Label required={required}>{label}</Label>}
      {hint && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.55, marginBottom: 'var(--space-2)', borderLeft: '2px solid var(--color-border)', paddingLeft: 'var(--space-2)' }}>{hint}</div>}
      {children}
      {source && <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: 6, fontStyle: 'italic' }}>📌 Source: {source}</div>}
    </div>
  );
}
function Part({ num, title, subtitle, children }) {
  return (
    <div style={{ marginBottom: 'var(--space-6)' }}>
      <div style={{ borderBottom: '2px solid var(--color-primary)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.06em' }}>PART {num}</span>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-faint)' }}>{title}</span>
        </div>
        {subtitle && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 3 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}
function Grid({ cols = 2, children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 'var(--space-3)' }}>{children}</div>;
}
function RatingRow({ value, onChange, max = 10, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
      <Inp type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={`1–${max}`}
        style={{ maxWidth: 80 }} />
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>/ {max} — {label}</span>
    </div>
  );
}
function BulletList({ value, onChange, placeholder, addLabel = '+ Add' }) {
  const items = value || ['', '', ''];
  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--color-primary)', fontSize: 'var(--text-sm)', paddingTop: '0.45rem', minWidth: 12 }}>{i + 1}.</span>
          <Inp value={item} onChange={e => onChange(items.map((x, j) => j === i ? e.target.value : x))} placeholder={placeholder} />
        </div>
      ))}
      <button onClick={() => onChange([...items, ''])}
        style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', background: 'transparent', border: '1px dashed var(--color-border)', padding: '0.25rem 0.75rem', cursor: 'pointer', marginTop: 2 }}>{addLabel}</button>
    </div>
  );
}

const u = (data, key, val) => ({ ...data, [key]: val });

export default function APAnalysisTemplate({ data = {}, onChange }) {
  const s = key => val => onChange(u(data, key, val));

  return (
    <div>
      {/* META */}
      <div style={{ marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 'var(--space-3)' }}>AP Curriculum Analysis</div>
        <Grid cols={3}>
          <Field label="Course Name" required><Inp value={data.courseName} onChange={e => s('courseName')(e.target.value)} placeholder="e.g. AP Calculus BC" /></Field>
          <Field label="Subject Category"><Inp value={data.category} onChange={e => s('category')(e.target.value)} placeholder="e.g. STEM · Mathematics" /></Field>
          <Field label="Date Completed"><Inp type="date" value={data.dateCompleted} onChange={e => s('dateCompleted')(e.target.value)} /></Field>
        </Grid>
      </div>

      {/* PART 1 — COURSE SPECIFICATIONS */}
      <Part num="1" title="Course Specifications & Exam Metrics" subtitle="Complete using College Board AP Central. Search '[Course Name] Score Distributions'.">
        <Grid cols={3}>
          <Field label="Global Exam Pass Rate (3+)" source="College Board AP Central" required>
            <Inp value={data.passRate} onChange={e => s('passRate')(e.target.value)} placeholder="e.g. 61.3%" />
          </Field>
          <Field label="Elite Performance Rate (5.0)" source="College Board AP Central">
            <Inp value={data.eliteRate} onChange={e => s('eliteRate')(e.target.value)} placeholder="e.g. 17.4%" />
          </Field>
          <Field label="Mean Score" source="College Board AP Central">
            <Inp value={data.meanScore} onChange={e => s('meanScore')(e.target.value)} placeholder="e.g. 3.32 / 5.0" />
          </Field>
        </Grid>
        <Field label="Exam Format" required source="College Board Course & Exam Description"
          hint="Detail the breakdown: number of MCQs, FRQs, time allocation, calculator use, etc.">
          <Txt rows={2} value={data.examFormat} onChange={e => s('examFormat')(e.target.value)} placeholder="45 MCQ (1h 45m) + 6 FRQ (1h 30m). Calculator permitted on Part B only." />
        </Field>
      </Part>

      {/* PART 2 — RIGOR & UTILITY */}
      <Part num="2" title="Rigor & Utility Assessment" subtitle="Does this course provide a significant advantage for T20 admissions and college credit?">
        <Field label="1. Institutional Credit Policy (T20 Alignment)" required
          hint="Use College Board AP Credit Policy Search. Select Harvard and MIT (or UCLA). Does the school grant credit? What minimum score? General Ed or Major requirement?"
          source="AP Credit Policy Search Tool">
          <Txt rows={4} value={data.creditPolicy} onChange={e => s('creditPolicy')(e.target.value)} placeholder="Harvard grants credit for a score of 5, which satisfies the Mathematics Core requirement and allows placement out of Math 1a. MIT awards credit for a score of 5 only, counting toward one GIR science requirement…" />
        </Field>
        <Field label="2. Subject Difficulty & Satisfaction Rating" required
          hint="Use Fiveable or BestColleges 'Hardest AP Classes' rankings. What rank is this course? Student satisfaction rating? Is the workload considered 'heavy'?"
          source="Fiveable / BestColleges">
          <Txt rows={3} value={data.difficultyRating} onChange={e => s('difficultyRating')(e.target.value)} placeholder="Ranked #3 hardest AP by Fiveable. Student satisfaction: 4.1/5. Workload considered heavy — average 7–9 hours/week outside school…" />
        </Field>
        <Field label="3. Strategic Value for T20 Admissions" required
          hint="Is this a 'Core' AP that elite admissions officers expect, or an elective? How does taking this demonstrate academic courage?"
          source="Independent research / expert blog">
          <Txt rows={4} value={data.strategicValue} onChange={e => s('strategicValue')(e.target.value)} placeholder="AP Calculus BC is a 'Core' AP that T20 admissions officers consider a near-requirement for STEM-track students. Admissions experts note that skipping BC in favor of AB signals a lack of ambition. Taking this course as a 9th grader would demonstrate extraordinary academic acceleration…" />
        </Field>
      </Part>

      {/* PART 3 — QUALITATIVE PERFORMANCE */}
      <Part num="3" title="Qualitative Performance Review" subtitle="Use Reddit r/APStudents or Save My Exams to synthesize peer feedback.">
        <Field label="4. Primary Conceptual Challenges" required
          hint="The 3 most difficult units/topics and why they are hard. What prerequisite knowledge is required?"
          source="Reddit r/APStudents / Save My Exams">
          <Txt rows={5} value={data.challenges} onChange={e => s('challenges')(e.target.value)} placeholder="1. Series and Sequences (Unit 10) — requires deep comfort with limits and convergence tests; the Alternating Series and Ratio Test trip up most students.&#10;2. Differential Equations (Unit 7) — separation of variables demands strong algebraic fluency.&#10;3. Polar Coordinates (Unit 9) — abstract visualization; almost no prior exposure in most curricula." />
        </Field>
      </Part>

      {/* PART 4 — FINAL SYNTHESIS */}
      <Part num="4" title="Final Synthesis & Enrollment Recommendation" subtitle="Synthesize the data to determine the risk vs. reward of this course.">
        <Field label="Risk vs. Reward Analysis (4–5 sentences)" required
          hint="Is the probability of a 5 worth the time investment? Does this directly support a future T20 major? What happens if you score a 3?">
          <Txt rows={6} value={data.synthesis} onChange={e => s('synthesis')(e.target.value)} placeholder="Given the 17.4% rate of achieving a 5, the risk is manageable but not trivial. For a student targeting STEM at MIT or Caltech, BC Calculus is not optional — it signals mathematical maturity. A score of 3 would be worse than not taking it, as T20 readers notice underperformance on flagship courses. The time commitment of ~8 hrs/week is significant but justified given the college credit saved (~$3,000 per semester at UCLA)…" />
        </Field>
        <Field label="Rigor Rating (1.0–10.0)" required
          hint="10.0 = Extreme rigor, high T20 value (e.g. AP Calc BC, AP Physics C). 1.0 = Introductory, low collegiate weight.">
          <RatingRow value={data.rigorRating} onChange={s('rigorRating')} label="1.0 = Introductory · 10.0 = Extreme Rigor / High T20 Value" />
        </Field>
      </Part>

      {/* PART 5 — PERSONAL ALIGNMENT */}
      <Part num="5" title="Personal Alignment & Subjective Fit" subtitle="Transition from data to personal assessment. Be honest.">
        <Field label="1. Primary Incentives — 3 Things You Like" required
          hint="3 specific components of the curriculum or exam structure that align with your strengths. Explain WHY each one appeals to you.">
          <BulletList value={data.incentives} onChange={s('incentives')} placeholder="e.g. The FRQ section rewards partial credit for showing work — plays to my strength of thinking out loud." />
        </Field>
        <Field label="2. Significant Deterrents — 3 Things You Dislike" required
          hint="3 specific factors that may hinder your performance. Be critical — what is the real 'cost' of this course?">
          <BulletList value={data.deterrents} onChange={s('deterrents')} placeholder="e.g. The sheer volume of convergence tests is pure memorization — not my strength." />
        </Field>
        <Field label="3. Success Probability Analysis" required
          hint="Compare the Elite Performance Rate from Part 1 to your past performance. What lifestyle changes would be needed to hit a 5?">
          <Txt rows={3} value={data.successProb} onChange={e => s('successProb')(e.target.value)} placeholder="Given a 17.4% base rate for a 5, and my current A average in math, I estimate a 30% probability of a 5 without extra prep. To reach 50%+, I would need to spend 2 extra hours/week on FRQ practice starting 3 months before the exam…" />
        </Field>
      </Part>

      {/* PART 6 — SOURCE AUDIT */}
      <Part num="6" title="Documented Evidence — Source Audit" subtitle="All claims must be backed by specific links.">
        <Grid cols={2}>
          <Field label="Official Curriculum Source" required source="College Board">
            <Inp value={data.srcCurriculum} onChange={e => s('srcCurriculum')(e.target.value)} placeholder="Link to College Board Course & Exam Description" />
          </Field>
          <Field label="Institutional Credit Proof" required source="AP Credit Policy Search">
            <Inp value={data.srcCredit} onChange={e => s('srcCredit')(e.target.value)} placeholder="Link to T20 University AP Credit Table" />
          </Field>
          <Field label="Rigor / Difficulty Source" required source="Fiveable / BestColleges">
            <Inp value={data.srcRigor} onChange={e => s('srcRigor')(e.target.value)} placeholder="Link to Fiveable or BestColleges ranking" />
          </Field>
          <Field label="Peer / Student Sentiment" required source="Reddit r/APStudents">
            <Inp value={data.srcPeer} onChange={e => s('srcPeer')(e.target.value)} placeholder="Link to Reddit thread or review forum" />
          </Field>
        </Grid>
        <Field label="Final Thoughts / Additional Notes">
          <Txt rows={3} value={data.finalThoughts} onChange={e => s('finalThoughts')(e.target.value)} placeholder="Any other observations, things that surprised you, or reasons this research changed your mind about the course…" />
        </Field>
      </Part>
    </div>
  );
}
