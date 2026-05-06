/*
  TimedExamTemplate.jsx
  Full past exam under real timed conditions — AMC, AP practice exams, SAT, PSAT.
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
function Section({ number, title, children }) {
  return (
    <div style={{ marginBottom: 'var(--space-8)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--color-divider)' }} />
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          {number && <span style={{ color: 'var(--color-primary)', marginRight: 5 }}>{number}.</span>}
          {title}
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--color-divider)' }} />
      </div>
      {children}
    </div>
  );
}

export default function TimedExamTemplate({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-7)' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 'var(--space-1)' }}>Timed Exam</div>
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-text)', lineHeight: 1.2 }}>Full Past Exam — Real Conditions</div>
      </div>

      {/* Meta */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)' }}>
        <Field label="Exam name & year" required style={{ marginBottom: 0 }}>
          <Inp value={data?.exam_name} onChange={e => set('exam_name', e.target.value)} placeholder="e.g. 2023 AMC 10A, AP Bio Practice Exam 1" />
        </Field>
        <Field label="Time allowed (min)" required style={{ marginBottom: 0 }}>
          <Inp type="number" value={data?.time_allowed} onChange={e => set('time_allowed', e.target.value)} placeholder="e.g. 75" />
        </Field>
        <Field label="Time used (min)" required style={{ marginBottom: 0 }}>
          <Inp type="number" value={data?.time_used} onChange={e => set('time_used', e.target.value)} placeholder="e.g. 71" />
        </Field>
      </div>

      {/* 1. Conditions */}
      <Section number="1" title="Exam Conditions">
        <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.65, marginBottom: 'var(--space-4)' }}>
          A timed exam only counts if conditions are real. No phone, no breaks, no looking things up.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
          <Field label="Phone away?" required>
            <select value={data?.phone_away || ''} onChange={e => set('phone_away', e.target.value)} style={base} onFocus={focus} onBlur={blur}>
              <option value="">Select…</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
          <Field label="No notes/internet?" required>
            <select value={data?.no_aids || ''} onChange={e => set('no_aids', e.target.value)} style={base} onFocus={focus} onBlur={blur}>
              <option value="">Select…</option>
              <option value="yes">Yes</option>
              <option value="no">No (explain below)</option>
            </select>
          </Field>
          <Field label="Completed in one sitting?" required>
            <select value={data?.one_sitting || ''} onChange={e => set('one_sitting', e.target.value)} style={base} onFocus={focus} onBlur={blur}>
              <option value="">Select…</option>
              <option value="yes">Yes</option>
              <option value="no">No (explain below)</option>
            </select>
          </Field>
        </div>
        <Field label="Any deviations from real conditions? Explain.">
          <Txt value={data?.conditions_notes} onChange={e => set('conditions_notes', e.target.value)}
            placeholder="If you used notes, took breaks, or looked anything up — be honest here…" rows={2} />
        </Field>
      </Section>

      {/* 2. Score */}
      <Section number="2" title="Your Score">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
          <Field label="Raw score" required>
            <Inp value={data?.raw_score} onChange={e => set('raw_score', e.target.value)} placeholder="e.g. 18/25" />
          </Field>
          <Field label="Scaled / final score (if applicable)">
            <Inp value={data?.scaled_score} onChange={e => set('scaled_score', e.target.value)} placeholder="e.g. 108 / 5" />
          </Field>
          <Field label="Percentile or target score">
            <Inp value={data?.target} onChange={e => set('target', e.target.value)} placeholder="e.g. AIME cutoff: 20" />
          </Field>
        </div>
        <Field label="Scan of your full exam paper with all work shown (Drive link)" required>
          <Inp value={data?.scan_link} onChange={e => set('scan_link', e.target.value)} placeholder="https://drive.google.com/…" />
        </Field>
      </Section>

      {/* 3. Section Breakdown */}
      <Section number="3" title="Section Breakdown">
        <Field label="Which section or topic did you perform best on?" required>
          <Txt value={data?.best_section} onChange={e => set('best_section', e.target.value)}
            placeholder="Name the section/topic and why you think you did well…" rows={2} />
        </Field>
        <Field label="Which section or topic gave you the most trouble?" required>
          <Txt value={data?.worst_section} onChange={e => set('worst_section', e.target.value)}
            placeholder="Name the section/topic and what specifically went wrong…" rows={2} />
        </Field>
        <Field label="How was your time management?" required>
          <Txt value={data?.time_management} onChange={e => set('time_management', e.target.value)}
            placeholder="Did you run out of time? Rush? Have time to check? What would you change?" rows={2} />
        </Field>
      </Section>

      {/* 4. Reflection */}
      <Section number="4" title="Reflection">
        <Field label="Compared to your last attempt, what improved?" required>
          <Txt value={data?.improved} onChange={e => set('improved', e.target.value)}
            placeholder="Be specific — which topics, techniques, or habits got better?" rows={3} />
        </Field>
        <Field label="Top 3 problem types to fix before next sitting" required>
          <Txt value={data?.to_fix} onChange={e => set('to_fix', e.target.value)}
            placeholder="1. …\n2. …\n3. …" rows={3} />
        </Field>
      </Section>
    </div>
  );
}
