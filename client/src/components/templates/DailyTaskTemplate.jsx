/*
  DailyTaskTemplate.jsx
  General daily task — what you did, proof, reflection.
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

export default function DailyTaskTemplate({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-7)' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 'var(--space-1)' }}>Daily Task</div>
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-text)', lineHeight: 1.2 }}>Today's Work Log</div>
      </div>

      {/* 1. What You Did */}
      <Section number="1" title="What You Did">
        <Field label="Describe what you worked on today" required>
          <Txt value={data?.what_you_did} onChange={e => set('what_you_did', e.target.value)}
            placeholder="Be specific — what did you complete, practice, or produce?" rows={4} />
        </Field>
        <Field label="Time spent (minutes)">
          <Inp type="number" value={data?.time_mins} onChange={e => set('time_mins', e.target.value)}
            placeholder="e.g. 45" style={{ width: 160 }} />
        </Field>
      </Section>

      {/* 2. Proof */}
      <Section number="2" title="Proof">
        <Field label="Proof link (Drive, screenshot, doc, or recording)">
          <Inp value={data?.proof_link} onChange={e => set('proof_link', e.target.value)}
            placeholder="https://drive.google.com/…" />
        </Field>
      </Section>

      {/* 3. Reflection */}
      <Section number="3" title="Reflection">
        <Field label="What did you learn or accomplish?" required>
          <Txt value={data?.learned} onChange={e => set('learned', e.target.value)}
            placeholder="One concrete takeaway from today's session…" rows={2} />
        </Field>
        <Field label="Anything to carry into tomorrow?">
          <Inp value={data?.carry_forward} onChange={e => set('carry_forward', e.target.value)}
            placeholder="A loose end, follow-up question, or next step…" />
        </Field>
      </Section>
    </div>
  );
}
