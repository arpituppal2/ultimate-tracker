/*
  WeeklyTaskTemplate.jsx
  Weekly task — multi-day log, progress toward a goal, proof, reflection.
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

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function WeeklyTaskTemplate({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-7)' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 'var(--space-1)' }}>Weekly Task</div>
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-text)', lineHeight: 1.2 }}>Weekly Work Log</div>
      </div>

      {/* Goal */}
      <Section number="1" title="Goal for the Week">
        <Field label="What were you trying to accomplish this week?" required>
          <Txt value={data?.weekly_goal} onChange={e => set('weekly_goal', e.target.value)}
            placeholder="Specific, measurable goal — e.g. 'Finish Chapter 4 practice problems', 'Complete 3 AMC mock sets'…" rows={2} />
        </Field>
      </Section>

      {/* Daily log */}
      <Section number="2" title="Day-by-Day Log">
        <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.65, marginBottom: 'var(--space-4)' }}>
          Fill in each day you worked on this task. Leave blank if you didn't work that day.
        </div>
        {DAYS.map(day => (
          <Field key={day} label={day} style={{ marginBottom: 'var(--space-3)' }}>
            <Inp value={data?.[`log_${day.toLowerCase()}`]} onChange={e => set(`log_${day.toLowerCase()}`, e.target.value)}
              placeholder={`What did you do on ${day}? (leave blank if none)`} />
          </Field>
        ))}
      </Section>

      {/* Total time */}
      <Section number="3" title="Time & Output">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <Field label="Total time this week (minutes)" style={{ marginBottom: 0 }}>
            <Inp type="number" value={data?.total_time_mins} onChange={e => set('total_time_mins', e.target.value)} placeholder="e.g. 180" />
          </Field>
          <Field label="Days worked" style={{ marginBottom: 0 }}>
            <Inp type="number" value={data?.days_worked} onChange={e => set('days_worked', e.target.value)} placeholder="e.g. 4" />
          </Field>
        </div>
      </Section>

      {/* Proof */}
      <Section number="4" title="Proof">
        <Field label="Proof link (Drive, doc, screenshot)">
          <Inp value={data?.proof_link} onChange={e => set('proof_link', e.target.value)}
            placeholder="https://drive.google.com/…" />
        </Field>
      </Section>

      {/* Reflection */}
      <Section number="5" title="Reflection">
        <Field label="Did you hit your goal? What went well?" required>
          <Txt value={data?.went_well} onChange={e => set('went_well', e.target.value)}
            placeholder="Be honest — what actually worked?" rows={2} />
        </Field>
        <Field label="What got in the way or stayed incomplete?">
          <Txt value={data?.obstacles} onChange={e => set('obstacles', e.target.value)}
            placeholder="Interruptions, confusion, underestimating scope…" rows={2} />
        </Field>
        <Field label="Goal for next week">
          <Inp value={data?.next_goal} onChange={e => set('next_goal', e.target.value)}
            placeholder="One specific thing to focus on next week…" />
        </Field>
      </Section>
    </div>
  );
}
