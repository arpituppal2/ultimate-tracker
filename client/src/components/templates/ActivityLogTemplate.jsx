/*
  ActivityLogTemplate.jsx
  Extracurricular practice logs, club meetings, volunteer hours, competitions, performances.
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

export default function ActivityLogTemplate({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-7)' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 'var(--space-1)' }}>Activity Log</div>
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-text)', lineHeight: 1.2 }}>Extracurricular Session Record</div>
      </div>

      {/* Meta */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)' }}>
        <Field label="Activity name" required style={{ marginBottom: 0 }}>
          <Inp value={data?.activity_name} onChange={e => set('activity_name', e.target.value)}
            placeholder="e.g. Math Club, Orchestra, Volunteer at Food Bank" />
        </Field>
        <Field label="Activity type" required style={{ marginBottom: 0 }}>
          <select value={data?.activity_type || ''} onChange={e => set('activity_type', e.target.value)} style={base} onFocus={focus} onBlur={blur}>
            <option value="">Select…</option>
            <option>Academic Club</option>
            <option>Sports / Athletics</option>
            <option>Performing Arts</option>
            <option>Visual Arts</option>
            <option>Community Service</option>
            <option>Competition</option>
            <option>Leadership / Student Gov</option>
            <option>Work / Internship</option>
            <option>Religious / Cultural</option>
            <option>Other</option>
          </select>
        </Field>
        <Field label="Date" required style={{ marginBottom: 0 }}>
          <Inp type="date" value={data?.date} onChange={e => set('date', e.target.value)} />
        </Field>
        <Field label="Hours spent" required style={{ marginBottom: 0 }}>
          <Inp type="number" value={data?.hours} onChange={e => set('hours', e.target.value)} placeholder="e.g. 2" />
        </Field>
      </div>

      {/* 1. What You Did */}
      <Section number="1" title="What You Did">
        <Field label="Describe specifically what happened during this session" required>
          <Txt value={data?.what_you_did} onChange={e => set('what_you_did', e.target.value)}
            placeholder="Be concrete — what did you practice, build, perform, organize, or contribute? Avoid vague summaries." rows={5} />
        </Field>
        <Field label="Your specific role or contribution" required>
          <Txt value={data?.your_role} onChange={e => set('your_role', e.target.value)}
            placeholder="What did you personally do? What decisions or actions were yours?" rows={2} />
        </Field>
      </Section>

      {/* 2. Progress */}
      <Section number="2" title="Progress & Growth">
        <Field label="What did you get better at in this session?" required>
          <Txt value={data?.improved} onChange={e => set('improved', e.target.value)}
            placeholder="A skill, technique, concept, or behavior that improved…" rows={2} />
        </Field>
        <Field label="What is still a weakness you're working on?">
          <Txt value={data?.weakness} onChange={e => set('weakness', e.target.value)}
            placeholder="Something you're still not where you want to be on…" rows={2} />
        </Field>
        <Field label="Cumulative hours in this activity this year">
          <Inp type="number" value={data?.cumulative_hours} onChange={e => set('cumulative_hours', e.target.value)}
            placeholder="Running total for the school year" style={{ width: 160 }} />
        </Field>
      </Section>

      {/* 3. Proof */}
      <Section number="3" title="Proof">
        <Field label="Proof link — photo, certificate, sign-in sheet, score, recording (Drive link)">
          <Inp value={data?.proof_link} onChange={e => set('proof_link', e.target.value)}
            placeholder="https://drive.google.com/… (optional but strongly encouraged)" />
        </Field>
        <Field label="Any awards, placements, or recognitions from this session?">
          <Inp value={data?.awards} onChange={e => set('awards', e.target.value)}
            placeholder="e.g. 1st place, perfect score, selected for leadership role, published…" />
        </Field>
      </Section>

      {/* 4. College Application Value */}
      <Section number="4" title="College Application Value">
        <Field label="In 2 sentences, how would you describe this activity to a college admissions officer?">
          <Txt value={data?.college_pitch} onChange={e => set('college_pitch', e.target.value)}
            placeholder="Concise, specific, and accomplishment-focused — not vague or generic…" rows={2} />
        </Field>
      </Section>
    </div>
  );
}
