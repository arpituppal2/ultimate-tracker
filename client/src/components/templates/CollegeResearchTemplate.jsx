/*
  CollegeResearchTemplate.jsx — College Research Framework
  Based on the College Research Framework in Avni's Master Plan. LAMT design system.
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
function Stat({ label, children }) {
  return (
    <div style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

const u = (data, key, val) => ({ ...data, [key]: val });

export default function CollegeResearchTemplate({ data = {}, onChange }) {
  const s = key => val => onChange(u(data, key, val));

  return (
    <div>
      {/* META */}
      <div style={{ marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 'var(--space-3)' }}>College Research Framework</div>
        <Grid cols={3}>
          <Field label="University / College Name" required><Inp value={data.universityName} onChange={e => s('universityName')(e.target.value)} placeholder="e.g. Massachusetts Institute of Technology" /></Field>
          <Field label="Short Name / Abbreviation"><Inp value={data.shortName} onChange={e => s('shortName')(e.target.value)} placeholder="e.g. MIT" /></Field>
          <Field label="Date Completed"><Inp type="date" value={data.dateCompleted} onChange={e => s('dateCompleted')(e.target.value)} /></Field>
        </Grid>
      </div>

      {/* PART 1 — INSTITUTIONAL SPECIFICATIONS */}
      <Part num="1" title="Institutional Specifications" subtitle="Complete using the Common Data Set (CDS) for the current academic year. Search '[University Name] Common Data Set'.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <Stat label="Location"><Inp value={data.location} onChange={e => s('location')(e.target.value)} placeholder="Cambridge, MA" /></Stat>
          <Stat label="Total Undergrad Population"><Inp value={data.undergradPop} onChange={e => s('undergradPop')(e.target.value)} placeholder="e.g. 4,500 (CDS Section B1)" /></Stat>
          <Stat label="Institutional Control"><Inp value={data.control} onChange={e => s('control')(e.target.value)} placeholder="Private / Public" /></Stat>
          <Stat label="Campus Size"><Inp value={data.campusSize} onChange={e => s('campusSize')(e.target.value)} placeholder="e.g. 168 acres" /></Stat>
          <Stat label="Student-Faculty Ratio"><Inp value={data.sfRatio} onChange={e => s('sfRatio')(e.target.value)} placeholder="e.g. 3:1 (CDS Section I-2)" /></Stat>
          <Stat label="Application Fee"><Inp value={data.appFee} onChange={e => s('appFee')(e.target.value)} placeholder="e.g. $75 (CDS Section G)" /></Stat>
        </div>
        <Grid cols={2}>
          <Field label="Class Size Distribution" source="CDS Section I-3"
            hint="Report % of classes under 20 students vs. over 50 students.">
            <Inp value={data.classSize} onChange={e => s('classSize')(e.target.value)} placeholder="e.g. 71% of classes < 20 students · 6% of classes > 50 students" />
          </Field>
          <Field label="Tuition + Room & Board" source="CDS Section G">
            <Inp value={data.cost} onChange={e => s('cost')(e.target.value)} placeholder="e.g. Tuition: $59,750 · R&B: $18,100 · Total COA: ~$80,000/yr" />
          </Field>
          <Field label="Admissions Selectivity — Average SAT / ACT" source="CDS Section C9">
            <Inp value={data.satAvg} onChange={e => s('satAvg')(e.target.value)} placeholder="e.g. SAT 1520–1580 (middle 50%) · ACT 34–36" />
          </Field>
          <Field label="Acceptance Rate" source="CDS Section C1">
            <Inp value={data.acceptRate} onChange={e => s('acceptRate')(e.target.value)} placeholder="e.g. 3.9% overall · 7% for women in STEM" />
          </Field>
        </Grid>
      </Part>

      {/* PART 2 — PROFESSIONAL VIABILITY */}
      <Part num="2" title="Professional Viability & Prestige Metrics" subtitle="Measures return on investment and 'signaling power' of the degree.">
        <Field label="1. Capital Resources — Endowment Per Student" required
          hint="Locate total endowment via Annual Financial Report or NACUBO rankings. Divide by student count. Is it enough to insulate from budget cuts?"
          source="Annual Financial Report / NACUBO">
          <Txt rows={3} value={data.endowment} onChange={e => s('endowment')(e.target.value)} placeholder="MIT's endowment is $23.5B (2023). Divided by ~11,500 students = ~$2.04M per student. This capital insulates the school from budget cycles and funds world-class labs and fellowships…" />
        </Field>
        <Field label="2. Workforce Integration — Elite Employer Pipeline" required
          hint="Use LinkedIn Alumni Insights. Filter by top employers. List the top 5 elite employers. Is this a primary recruitment hub for Big 3 consulting, Bulge Bracket banks, or FAANG?"
          source="LinkedIn Alumni Insights / College Transitions">
          <Txt rows={4} value={data.employerPipeline} onChange={e => s('employerPipeline')(e.target.value)} placeholder="Top 5 employers for MIT alumni: Google, Microsoft, Amazon, McKinsey, Goldman Sachs.&#10;MIT functions as a primary on-campus recruitment hub for all FAANG firms. Google hires ~150+ MIT graduates annually via dedicated MIT recruiting. Goldman Sachs has a specific 'MIT Finance Track' for quant roles…" />
        </Field>
        <Field label="3. Economic Risk — Unemployment & Underemployment" required
          hint="Use College Scorecard. Report % unemployed 1 year post-grad. Identify underemployment rate."
          source="US Dept. of Education College Scorecard">
          <Txt rows={3} value={data.economicRisk} onChange={e => s('economicRisk')(e.target.value)} placeholder="Per College Scorecard: MIT graduates have a 1-year unemployment rate of 2.1% (vs. national avg 4%). Underemployment rate (graduates in non-degree jobs): 7% — lowest in the nation for STEM schools…" />
        </Field>
      </Part>

      {/* PART 3 — QUALITATIVE CRITIQUE */}
      <Part num="3" title="Qualitative Institutional Critique" subtitle="Use Unigo, Niche, and Reddit r/ApplyingToCollege to synthesize student feedback.">
        <Field label="4. Primary Institutional Strength" required
          hint="What specific department or network benefit carries the highest global prestige? What does a student gain by having this name on a resume?"
          source="Niche / Unigo / Reddit">
          <Txt rows={4} value={data.strengths} onChange={e => s('strengths')(e.target.value)} placeholder="MIT's primary prestige driver is its STEM research ecosystem. Having 'MIT' on a resume in any engineering or quantitative field is a near-automatic first-round interview at every top firm. The alumni network in Silicon Valley is unmatched — over 30 MIT alumni have founded companies worth $1B+…" />
        </Field>
        <Field label="5. Critical Deficiencies (Red Flags)" required
          hint="Recurring complaints about administration, safety, or 'prestige decay'. What would hinder a student's ability to reach a T20 career trajectory?"
          source="Niche / Reddit r/ApplyingToCollege">
          <Txt rows={3} value={data.weaknesses} onChange={e => s('weaknesses')(e.target.value)} placeholder="Recurring complaints include: extreme academic pressure ('drinking from a firehose'), limited social life due to workload, and a culture that can feel isolating for students who did not grow up in elite academic environments. Mental health resources are rated below average…" />
        </Field>
      </Part>

      {/* PART 4 — FINAL SYNTHESIS */}
      <Part num="4" title="Final Synthesis & Verdict" subtitle="Synthesize all data points. Is this a 'Golden Ticket' or a 'Death Sentence'?">
        <Field label="Final Summary (5–6 sentences)" required
          hint="Golden Ticket = guaranteed elite placement. Death Sentence = high risk of underemployment + low social mobility. Evaluate the degree's weight in a room of high-net-worth individuals or executive recruiters.">
          <Txt rows={7} value={data.finalSummary} onChange={e => s('finalSummary')(e.target.value)} placeholder="MIT represents the clearest available 'Golden Ticket' for a student targeting quantitative STEM careers at elite firms. The 3.9% acceptance rate, while daunting, does not reflect the probability for a student who has built the right profile from 7th grade onward. The $23.5B endowment and 2.1% post-grad unemployment rate make the financial risk near-zero. In a room of executive recruiters, MIT carries hegemonic signaling power second only to Caltech in pure engineering…" />
        </Field>
        <Field label="Overall Prestige Rating (1.0–10.0)" required
          hint="10.0 = Global Hegemony (MIT, Harvard, Stanford). 1.0 = Total professional irrelevance.">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Inp type="number" value={data.prestigeRating} onChange={e => s('prestigeRating')(e.target.value)} placeholder="1–10" style={{ maxWidth: 80 }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>/ 10.0 — 10 = Global Hegemony · 1 = Total Professional Irrelevance</span>
          </div>
        </Field>
      </Part>

      {/* PART 5 — PERSONAL ALIGNMENT */}
      <Part num="5" title="Personal Alignment & Subjective Fit" subtitle="Move from data to honest personal assessment. Do not list 'prestige' as a reason you like it.">
        <Field label="1. Primary Incentives — 3 Things You Like" required
          hint="Specific curriculum tracks, unique ECs, or campus facilities you would actually use. NOT prestige or rankings.">
          <BulletList value={data.incentives} onChange={s('incentives')} placeholder="e.g. The 5-lab requirement in Course 6 means I'd get hands-on hardware + software experience before sophomore year." />
        </Field>
        <Field label="2. Significant Deterrents — 3 Things You Dislike" required
          hint="Deal-breakers or significant negatives. Weather, culture, curriculum rigidity, social environment — anything that would decrease your productivity or mental health.">
          <BulletList value={data.deterrents} onChange={s('deterrents')} placeholder="e.g. Cambridge winters are brutal and MIT's campus is notoriously insular — it's hard to connect with non-MIT people." />
        </Field>
        <Field label="3. Comparative Alternatives" required
          hint="Two other schools with a similar prestige rating but different 'vibes'. Why might they be better or worse? Compare economic risk profiles.">
          <Txt rows={4} value={data.alternatives} onChange={e => s('alternatives')(e.target.value)} placeholder="Alternative 1: Caltech (Prestige: 9.8) — even more intense technically, smaller community (900 undergrads), stronger in pure physics. Less social, less name recognition in finance.&#10;Alternative 2: Stanford (Prestige: 9.9) — warmer climate, better entrepreneurship network, but more 'holistic' culture and slightly less intense technically." />
        </Field>
      </Part>

      {/* PART 6 — EXTERNAL VALIDATION */}
      <Part num="6" title="External Validation — Source Audit" subtitle="Every data point and opinion must be traceable. Paste specific URLs.">
        <Grid cols={2}>
          <Field label="Official Institutional Source" required source="University / College Board">
            <Inp value={data.srcOfficial} onChange={e => s('srcOfficial')(e.target.value)} placeholder="Link to university admissions page / CDS" />
          </Field>
          <Field label="Independent Data Source" required source="College Scorecard / LinkedIn / CDS">
            <Inp value={data.srcData} onChange={e => s('srcData')(e.target.value)} placeholder="Link to College Scorecard / NACUBO / LinkedIn Alumni" />
          </Field>
          <Field label="Student / Peer Perspective" required source="Niche / Unigo / Reddit">
            <Inp value={data.srcPeer} onChange={e => s('srcPeer')(e.target.value)} placeholder="Link to Niche, Unigo, or r/ApplyingToCollege thread" />
          </Field>
          <Field label="Prestige / Rankings Validation" required source="Forbes / QS / Times Higher Ed">
            <Inp value={data.srcRankings} onChange={e => s('srcRankings')(e.target.value)} placeholder="Link to Forbes, QS World Rankings, Times Higher Ed" />
          </Field>
        </Grid>
      </Part>
    </div>
  );
}
