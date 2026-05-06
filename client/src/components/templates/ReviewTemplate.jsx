/*
  ReviewTemplate.jsx
  Error review after any exam or problem set.
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
function Card({ label, children }) {
  return (
    <div style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-offset)', padding: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 'var(--space-3)' }}>{label}</div>
      {children}
    </div>
  );
}

export default function ReviewTemplate({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-7)' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 'var(--space-1)' }}>Error Review</div>
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-text)', lineHeight: 1.2 }}>Missed Problems — Corrections & Analysis</div>
      </div>

      {/* Meta */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)' }}>
        <Field label="Source being reviewed" required style={{ marginBottom: 0 }}>
          <Inp value={data?.source} onChange={e => set('source', e.target.value)}
            placeholder="e.g. 2023 AMC 8 — problems 14, 17, 19–22" />
        </Field>
        <Field label="# of problems missed" required style={{ marginBottom: 0 }}>
          <Inp type="number" value={data?.num_missed} onChange={e => set('num_missed', e.target.value)} placeholder="e.g. 5" />
        </Field>
      </div>

      {/* 1. Corrections */}
      <Section number="1" title="Problem-by-Problem Corrections">
        <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.65, marginBottom: 'var(--space-4)' }}>
          For every problem you missed: write the correct solution from scratch — do not just copy the answer key. Understand each step before moving on.
        </div>
        {[1,2,3,4,5].map(n => (
          <Card key={n} label={`Problem ${n}`}>
            <Field label="Problem # or description" required style={{ marginBottom: 'var(--space-3)' }}>
              <Inp value={data?.[`p${n}_id`]} onChange={e => set(`p${n}_id`, e.target.value)}
                placeholder={`e.g. AMC 8 #19 or "Polynomial zeros problem"`} />
            </Field>
            <Field label="Where I went wrong" required style={{ marginBottom: 'var(--space-3)' }}>
              <Txt value={data?.[`p${n}_wrong`]} onChange={e => set(`p${n}_wrong`, e.target.value)}
                placeholder="Describe your original mistake — wrong approach, calculation error, misread question…" rows={2} />
            </Field>
            <Field label="Correct solution (in your own words)" required style={{ marginBottom: 0 }}>
              <Txt value={data?.[`p${n}_correct`]} onChange={e => set(`p${n}_correct`, e.target.value)}
                placeholder="Walk through the correct solution step by step…" rows={3} />
            </Field>
          </Card>
        ))}
        <Field label="Full corrections scan (all missed problems, handwritten) — Drive link" required>
          <Inp value={data?.corrections_link} onChange={e => set('corrections_link', e.target.value)}
            placeholder="https://drive.google.com/…" />
        </Field>
      </Section>

      {/* 2. Root Cause Analysis */}
      <Section number="2" title="Root Cause Analysis">
        <Field label="Primary error type across all missed problems" required>
          <select value={data?.error_type || ''} onChange={e => set('error_type', e.target.value)} style={base} onFocus={focus} onBlur={blur}>
            <option value="">Select the main pattern…</option>
            <option>Concept gap — I didn't know the underlying idea</option>
            <option>Misapplied a technique I thought I knew</option>
            <option>Careless arithmetic / algebra error</option>
            <option>Misread the problem</option>
            <option>Ran out of time</option>
            <option>Guessed / didn't attempt</option>
            <option>Mixed error types</option>
          </select>
        </Field>
        <Field label="Describe the root cause in your own words" required>
          <Txt value={data?.root_cause} onChange={e => set('root_cause', e.target.value)}
            placeholder="Be specific — what exactly broke down in your thinking or preparation?" rows={3} />
        </Field>
      </Section>

      {/* 3. Fix Plan */}
      <Section number="3" title="Fix Plan">
        <Field label="What will you study or practice to close this gap?" required>
          <Txt value={data?.study_plan} onChange={e => set('study_plan', e.target.value)}
            placeholder="Specific resource, topic, or drill you will do before the next exam…" rows={3} />
        </Field>
        <Field label="What habit or checking step will prevent careless errors?">
          <Txt value={data?.habit} onChange={e => set('habit', e.target.value)}
            placeholder="e.g. Re-read the question before writing the answer | Check units | Write out every step" rows={2} />
        </Field>
      </Section>
    </div>
  );
}
