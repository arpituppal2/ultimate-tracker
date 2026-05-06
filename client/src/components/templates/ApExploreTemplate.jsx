/*
  ApExploreTemplate.jsx
  Advanced Placement (AP) Curriculum Analysis — 6-part worksheet.
  LAMT design system.
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
function Txt({ value, onChange, placeholder, rows = 3 }) {
  return <textarea value={value || ''} onChange={onChange} placeholder={placeholder} rows={rows}
    style={{ ...base, resize: 'vertical', lineHeight: 1.65 }} onFocus={focus} onBlur={blur} />;
}
function Label({ children, required }) {
  return (
    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 'var(--space-1)' }}>
      {children}{required && <span style={{ color: 'var(--color-error)', marginLeft: 2 }}>*</span>}
    </label>
  );
}
function Field({ label, required, children, style }) {
  return (
    <div style={{ marginBottom: 'var(--space-4)', ...style }}>
      {label && <Label required={required}>{label}</Label>}
      {children}
    </div>
  );
}
function Instruction({ children }) {
  return (
    <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 'var(--space-4)' }}>
      {children}
    </div>
  );
}
function Part({ number, title, subtitle, children }) {
  return (
    <div style={{ marginBottom: 'var(--space-10)' }}>
      <div style={{ marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-3)', borderBottom: '2px solid var(--color-border)' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 'var(--space-1)' }}>Part {number}</div>
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-text)', lineHeight: 1.2 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)', lineHeight: 1.6 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}
function SubQ({ number, title, children }) {
  return (
    <div style={{ marginBottom: 'var(--space-7)' }}>
      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
        <span style={{ color: 'var(--color-primary)', marginRight: 6 }}>{number}.</span>{title}
      </div>
      {children}
    </div>
  );
}

export default function ApExploreTemplate({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 'var(--space-1)' }}>AP Explore</div>
        <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-text)', lineHeight: 1.15, marginBottom: 'var(--space-2)' }}>Advanced Placement Curriculum Analysis</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>Evaluate academic rigor, exam performance, and collegiate value using College Board and independent review sources.</div>
      </div>

      {/* ── PART 1 ── */}
      <Part number="1" title="Course Specifications & Exam Metrics"
        subtitle='Complete using AP Central. Search \u201c[AP Course Name] Score Distributions\u201d on the College Board website.'>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <Field label="Course name (full title)" required style={{ marginBottom: 0 }}>
            <Inp value={data?.course_name} onChange={e => set('course_name', e.target.value)}
              placeholder="e.g. AP Calculus BC" />
          </Field>
          <Field label="Subject category" required style={{ marginBottom: 0 }}>
            <select value={data?.subject_category || ''} onChange={e => set('subject_category', e.target.value)} style={base} onFocus={focus} onBlur={blur}>
              <option value="">Select…</option>
              <option>STEM</option>
              <option>Humanities</option>
              <option>Social Sciences</option>
              <option>Arts</option>
              <option>World Languages</option>
              <option>Capstone</option>
            </select>
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <Field label="Global pass rate (3+)" required style={{ marginBottom: 0 }}>
            <Inp value={data?.pass_rate} onChange={e => set('pass_rate', e.target.value)} placeholder="e.g. 58.3%" />
          </Field>
          <Field label="Elite performance rate (5.0)" required style={{ marginBottom: 0 }}>
            <Inp value={data?.five_rate} onChange={e => set('five_rate', e.target.value)} placeholder="e.g. 14.1%" />
          </Field>
          <Field label="Mean score" required style={{ marginBottom: 0 }}>
            <Inp value={data?.mean_score} onChange={e => set('mean_score', e.target.value)} placeholder="e.g. 3.12" />
          </Field>
        </div>

        <Field label="Exam format (MCQ count vs FRQ count)" required>
          <Inp value={data?.exam_format} onChange={e => set('exam_format', e.target.value)}
            placeholder="e.g. 45 MCQ (Section I, 105 min) + 6 FRQ (Section II, 90 min)" />
        </Field>
      </Part>

      {/* ── PART 2 ── */}
      <Part number="2" title="Rigor & Utility Assessment"
        subtitle="Determines whether the course provides a significant advantage for T20 admissions and college credit.">

        <SubQ number="1" title="Institutional Credit Policy (T20 Alignment)">
          <Instruction>
            Use the <strong>College Board AP Credit Policy Search</strong>. Select two T20 universities (e.g., Harvard, MIT, or UCLA) and search for this specific course. Does the university grant credit? What minimum score is required? Does it satisfy a General Education or Major requirement?
          </Instruction>
          <Field label="Analysis (2–3 sentences)" required>
            <Txt value={data?.credit_policy} onChange={e => set('credit_policy', e.target.value)}
              placeholder="e.g. 'Harvard grants credit for a 5, satisfying the General Education math requirement. UCLA awards 8 units toward the STEM core with a 4 or 5, covering the Math 31A/31B sequence…'" rows={3} />
          </Field>
          <Field label="Source">
            <Inp value={data?.credit_policy_source} onChange={e => set('credit_policy_source', e.target.value)}
              placeholder="AP Credit Policy Search Tool — https://apstudents.collegeboard.org/getting-credit-placement/search-policies" />
          </Field>
        </SubQ>

        <SubQ number="2" title="Subject Difficulty & Satisfaction Rating">
          <Instruction>
            Use <strong>Fiveable</strong> or <strong>BestColleges</strong> rankings for “Hardest AP Classes.” Where does this course rank in difficulty? Report the student satisfaction rating if available. Is the workload considered heavy relative to other APs?
          </Instruction>
          <Field label="Analysis (2–3 sentences)" required>
            <Txt value={data?.difficulty_rating} onChange={e => set('difficulty_rating', e.target.value)}
              placeholder="e.g. 'AP Calculus BC ranks #3 on Fiveable’s hardest AP list with a difficulty score of 8.1/10. Student satisfaction sits at 72%, with most complaints citing the volume of integration techniques required…'" rows={3} />
          </Field>
          <Field label="Source">
            <Inp value={data?.difficulty_source} onChange={e => set('difficulty_source', e.target.value)}
              placeholder="e.g. Fiveable — https://fiveable.me/" />
          </Field>
        </SubQ>

        <SubQ number="3" title="Strategic Value for T20 Admissions">
          <Instruction>
            Is this a <strong>Core AP</strong> (e.g., Calculus BC, Physics C, English Literature) that elite admissions officers expect to see, or an elective? Explain how taking this class demonstrates academic courage. (3 sentences)
          </Instruction>
          <Field label="Analysis (3 sentences)" required>
            <Txt value={data?.strategic_value} onChange={e => set('strategic_value', e.target.value)}
              placeholder="e.g. 'AP Calculus BC is considered a core signal for STEM applicants at every T20 school…'" rows={4} />
          </Field>
          <Field label="Source">
            <Inp value={data?.strategic_source} onChange={e => set('strategic_source', e.target.value)}
              placeholder="Independent research / expert blog URL" />
          </Field>
        </SubQ>
      </Part>

      {/* ── PART 3 ── */}
      <Part number="3" title="Qualitative Performance Review"
        subtitle="Use Reddit (r/APStudents) or Save My Exams to synthesize peer feedback.">

        <SubQ number="4" title="Primary Conceptual Challenges">
          <Instruction>
            Identify the three most difficult units or topics within the curriculum. What makes them difficult (heavy memorization, complex math, abstract theory)? What prerequisite knowledge is required for success? (3 sentences)
          </Instruction>
          <Field label="Analysis (3 sentences)" required>
            <Txt value={data?.challenges} onChange={e => set('challenges', e.target.value)}
              placeholder="e.g. 'The three hardest units are Series Convergence Tests, Polar/Parametric Calculus, and Differential Equations…'" rows={4} />
          </Field>
          <Field label="Source">
            <Inp value={data?.challenges_source} onChange={e => set('challenges_source', e.target.value)}
              placeholder="e.g. r/APStudents — https://reddit.com/r/APStudents" />
          </Field>
        </SubQ>
      </Part>

      {/* ── PART 4 ── */}
      <Part number="4" title="Final Synthesis & Enrollment Recommendation">

        <SubQ number="" title="Final Summary">
          <Instruction>
            Synthesize the data to determine the “Risk vs. Reward” of this course. Assess whether the probability of achieving a 5.0 is worth the time commitment. Does this course directly support a future T20 major, or is it a filler? Evaluate the impact of a potential score of 3 or below on a high-tier transcript. (4–5 sentences)
          </Instruction>
          <Field label="Analysis (4–5 sentences)" required>
            <Txt value={data?.final_summary} onChange={e => set('final_summary', e.target.value)}
              placeholder="Risk vs. Reward synthesis…" rows={5} />
          </Field>
        </SubQ>

        <SubQ number="" title="Rigor Rating (1.0–10.0)">
          <Instruction>
            Assign a numerical value based on academic difficulty and prestige. Scale: <strong>10.0</strong> = Extreme Rigor / High T20 Value → <strong>1.0</strong> = Introductory / Low Collegiate Weight.
          </Instruction>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <Field label="Rating" required style={{ marginBottom: 0, flex: '0 0 120px' }}>
              <Inp type="number" value={data?.rigor_rating} onChange={e => set('rigor_rating', e.target.value)}
                placeholder="e.g. 8.5" style={{ width: 120 }} />
            </Field>
            <Field label="Justification" style={{ marginBottom: 0, flex: 1 }}>
              <Inp value={data?.rigor_justification} onChange={e => set('rigor_justification', e.target.value)}
                placeholder="One sentence explaining the rating…" />
            </Field>
          </div>
        </SubQ>
      </Part>

      {/* ── PART 5 ── */}
      <Part number="5" title="Personal Alignment & Subjective Fit"
        subtitle="Transition from objective statistics to a personal assessment of compatibility against the course requirements.">

        <SubQ number="1" title="Primary Incentives — 3 Things You Like">
          <Instruction>
            Identify three specific components of the curriculum or exam structure that align with your academic strengths. Focus on the “why” — e.g., essay-heavy nature, specific historical era, laboratory-based learning.
          </Instruction>
          {[1,2,3].map(n => (
            <Field key={n} label={`Incentive ${n}`} required style={{ marginBottom: 'var(--space-3)' }}>
              <Inp value={data?.[`pro_${n}`]} onChange={e => set(`pro_${n}`, e.target.value)}
                placeholder={`Specific aspect of coursework or topic you find appealing…`} />
            </Field>
          ))}
        </SubQ>

        <SubQ number="2" title="Significant Deterrents — 3 Things You Dislike">
          <Instruction>
            Identify three specific factors that may hinder your performance or engagement. Be critical about the “cost” — volume of reading, lack of partial credit, heavy memorization over logic, etc.
          </Instruction>
          {[1,2,3].map(n => (
            <Field key={n} label={`Deterrent ${n}`} required style={{ marginBottom: 'var(--space-3)' }}>
              <Inp value={data?.[`con_${n}`]} onChange={e => set(`con_${n}`, e.target.value)}
                placeholder={`Specific burden or negative factor…`} />
            </Field>
          ))}
        </SubQ>

        <SubQ number="3" title="Success Probability Analysis">
          <Instruction>
            Compare the Elite Performance Rate (5.0) from Part 1 with your own past performance in this subject. Given your interest and the identified deterrents, what is the realistic likelihood of achieving a 5.0? State what specific lifestyle or study changes would be required. (2–3 sentences)
          </Instruction>
          <Field label="Analysis (2–3 sentences)" required>
            <Txt value={data?.success_prob} onChange={e => set('success_prob', e.target.value)}
              placeholder="e.g. 'Given the 14% global five rate and my current B+ average in Pre-Calc, I estimate a 40% chance of a 5 without major changes to my study routine…'" rows={3} />
          </Field>
          <Field label="Source">
            <Inp value={data?.success_prob_source} onChange={e => set('success_prob_source', e.target.value)}
              placeholder="Self-reflection / past grade trends" />
          </Field>
        </SubQ>
      </Part>

      {/* ── PART 6 ── */}
      <Part number="6" title="Documented Evidence — Source Audit"
        subtitle="All claims regarding rigor, credit policies, and difficulty must be backed by documented evidence.">

        <Field label="Official curriculum source (College Board CED)" required>
          <Inp value={data?.source_ced} onChange={e => set('source_ced', e.target.value)}
            placeholder="https://apcentral.collegeboard.org/courses/…" />
        </Field>
        <Field label="Institutional credit proof (T20 AP credit table)" required>
          <Inp value={data?.source_credit} onChange={e => set('source_credit', e.target.value)}
            placeholder="https://…" />
        </Field>
        <Field label="Rigor / difficulty source (Fiveable, BestColleges, etc.)" required>
          <Inp value={data?.source_rigor} onChange={e => set('source_rigor', e.target.value)}
            placeholder="https://…" />
        </Field>
        <Field label="Peer / student sentiment (r/APStudents or similar)" required>
          <Inp value={data?.source_peer} onChange={e => set('source_peer', e.target.value)}
            placeholder="https://reddit.com/r/APStudents/…" />
        </Field>

        <div style={{ marginTop: 'var(--space-6)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-5)' }}>
          <Field label="Final thoughts">
            <Txt value={data?.final_thoughts} onChange={e => set('final_thoughts', e.target.value)}
              placeholder="Any additional reflections, caveats, or personal notes…" rows={4} />
          </Field>
        </div>
      </Part>
    </div>
  );
}
