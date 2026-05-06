/*
  ApLessonTemplate.jsx
  AP Study Session — read/watch a specific lesson, take notes, do practice.
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
    <label style={{
      display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700,
      letterSpacing: '0.07em', textTransform: 'uppercase',
      color: 'var(--color-text-faint)', marginBottom: 'var(--space-1)',
    }}>
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
function Card({ label, optional, children }) {
  return (
    <div style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-offset)', padding: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {label}
        {optional && <span style={{ fontWeight: 500, color: 'var(--color-text-faint)', border: '1px solid var(--color-border)', padding: '0.05rem 0.35rem', fontSize: '0.65rem', letterSpacing: '0.06em' }}>optional</span>}
      </div>
      {children}
    </div>
  );
}

export default function ApLessonTemplate({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-7)' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 'var(--space-1)' }}>AP Study Session</div>
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-text)', lineHeight: 1.2 }}>Lesson Notes & Practice</div>
      </div>

      {/* Meta */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)' }}>
        <Field label="AP Course" required style={{ marginBottom: 0 }}>
          <Inp value={data?.ap_course} onChange={e => set('ap_course', e.target.value)} placeholder="e.g. AP Biology, AP Calculus BC" />
        </Field>
        <Field label="Unit" required style={{ marginBottom: 0 }}>
          <Inp value={data?.unit} onChange={e => set('unit', e.target.value)} placeholder="e.g. Unit 3" />
        </Field>
        <Field label="Lesson / Topic" required style={{ marginBottom: 0 }}>
          <Inp value={data?.lesson} onChange={e => set('lesson', e.target.value)} placeholder="e.g. Lesson 4" />
        </Field>
      </div>

      {/* 1. Source */}
      <Section number="1" title="Study Source">
        <Field label="Primary source used" required>
          <Inp value={data?.source} onChange={e => set('source', e.target.value)}
            placeholder="e.g. Khan Academy AP Bio Unit 3 · Lesson 2 | AP Classroom video | Barron's p.112–124" />
        </Field>
        <Field label="Secondary source (optional)">
          <Inp value={data?.source2} onChange={e => set('source2', e.target.value)}
            placeholder="Any additional resource you used" />
        </Field>
        <Field label="Estimated time spent studying (minutes)" required>
          <Inp type="number" value={data?.time_mins} onChange={e => set('time_mins', e.target.value)} placeholder="e.g. 45" style={{ width: 120 }} />
        </Field>
      </Section>

      {/* 2. Key Concepts */}
      <Section number="2" title="Key Concepts">
        <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.65, marginBottom: 'var(--space-4)' }}>
          Write each concept in your own words — not copied from the source. If you can't explain it without looking, you don't know it yet.
        </div>
        {[1,2,3,4,5].map(n => (
          <Field key={n} label={`Concept ${n}${n > 3 ? ' (optional)' : ''}`} required={n <= 3}>
            <Txt value={data?.[`concept_${n}`]} onChange={e => set(`concept_${n}`, e.target.value)}
              placeholder={`State the concept, define key terms, and explain why it matters…`} rows={2} />
          </Field>
        ))}
      </Section>

      {/* 3. Practice Problems */}
      <Section number="3" title="Practice Problems">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)' }}>
          <Field label="Problem source" required style={{ marginBottom: 0 }}>
            <Inp value={data?.practice_source} onChange={e => set('practice_source', e.target.value)}
              placeholder="e.g. AP Classroom Progress Check Unit 3 MCQ" />
          </Field>
          <Field label="# attempted" required style={{ marginBottom: 0 }}>
            <Inp type="number" value={data?.practice_attempted} onChange={e => set('practice_attempted', e.target.value)} placeholder="e.g. 10" />
          </Field>
          <Field label="# correct" required style={{ marginBottom: 0 }}>
            <Inp type="number" value={data?.practice_correct} onChange={e => set('practice_correct', e.target.value)} placeholder="e.g. 8" />
          </Field>
        </div>
        <Field label="Which problems did you miss? (list numbers or describe)">
          <Txt value={data?.missed_problems} onChange={e => set('missed_problems', e.target.value)}
            placeholder="List the problems you got wrong and what you misunderstood…" rows={3} />
        </Field>
      </Section>

      {/* 4. Handwritten Notes */}
      <Section number="4" title="Handwritten Notes">
        <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.65, marginBottom: 'var(--space-4)' }}>
          Take notes by hand while studying — diagrams, formulas, summaries. Scan or photograph them and paste the link below.
        </div>
        <Field label="Notes photo/scan (Drive link)" required>
          <Inp value={data?.notes_link} onChange={e => set('notes_link', e.target.value)} placeholder="https://drive.google.com/…" />
        </Field>
        <Field label="Describe what is on the page">
          <Txt value={data?.notes_description} onChange={e => set('notes_description', e.target.value)}
            placeholder="Diagrams, formulas, summaries — what did you write?" rows={2} />
        </Field>
      </Section>

      {/* 5. Reflection */}
      <Section number="5" title="Reflection">
        <Field label="What was hardest to understand in this lesson?" required>
          <Txt value={data?.hardest} onChange={e => set('hardest', e.target.value)}
            placeholder="Be specific — which concept, formula, or problem type tripped you up?" rows={3} />
        </Field>
        <Field label="How does this lesson connect to what you already know?">
          <Txt value={data?.connections} onChange={e => set('connections', e.target.value)}
            placeholder="Link it to a previous unit, another AP course, or real-world context…" rows={2} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-3)' }}>
          <Field label="Confidence on this topic (1–10)" required>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Inp type="number" value={data?.confidence}
                onChange={e => { const v = Math.min(10, Math.max(1, parseInt(e.target.value) || '')); set('confidence', v); }}
                placeholder="1–10" style={{ width: 80 }} />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                {data?.confidence ? data.confidence >= 9 ? '🔥 Locked in' : data.confidence >= 7 ? '✅ Solid' : data.confidence >= 5 ? '👍 Getting there' : data.confidence >= 3 ? '⚠️ Shaky' : '🚨 Need more work' : ''}
              </span>
            </div>
          </Field>
          <Field label="What do you need to review before the AP exam?" required>
            <Inp value={data?.to_review} onChange={e => set('to_review', e.target.value)}
              placeholder="Specific sub-topic or problem type to revisit…" />
          </Field>
        </div>
      </Section>
    </div>
  );
}
