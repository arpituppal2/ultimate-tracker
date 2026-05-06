/*
  ApFrqTemplate.jsx
  AP Free-Response / Essay writing against a real past prompt.
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

export default function ApFrqTemplate({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-7)' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 'var(--space-1)' }}>AP Free-Response</div>
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-text)', lineHeight: 1.2 }}>FRQ Writing Practice</div>
      </div>

      {/* Meta */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)' }}>
        <Field label="AP Course" required style={{ marginBottom: 0 }}>
          <Inp value={data?.ap_course} onChange={e => set('ap_course', e.target.value)} placeholder="e.g. AP Biology" />
        </Field>
        <Field label="Prompt Source" required style={{ marginBottom: 0 }}>
          <Inp value={data?.source} onChange={e => set('source', e.target.value)} placeholder="e.g. 2022 AP Bio FRQ #2" />
        </Field>
        <Field label="Time spent (minutes)" required style={{ marginBottom: 0 }}>
          <Inp type="number" value={data?.time_mins} onChange={e => set('time_mins', e.target.value)} placeholder="e.g. 25" />
        </Field>
      </div>

      {/* 1. Prompt */}
      <Section number="1" title="The Prompt">
        <Field label="Paste the full FRQ prompt here" required>
          <Txt value={data?.prompt} onChange={e => set('prompt', e.target.value)}
            placeholder="Paste the complete prompt exactly as it appears on the exam…" rows={8} />
        </Field>
        <Field label="Rubric link (College Board URL or Drive link)">
          <Inp value={data?.rubric_link} onChange={e => set('rubric_link', e.target.value)}
            placeholder="https://apcentral.collegeboard.org/… or Drive link" />
        </Field>
        <Field label="Total points available" required>
          <Inp type="number" value={data?.total_points} onChange={e => set('total_points', e.target.value)} placeholder="e.g. 10" style={{ width: 120 }} />
        </Field>
      </Section>

      {/* 2. Pre-writing */}
      <Section number="2" title="Pre-Writing Plan">
        <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.65, marginBottom: 'var(--space-4)' }}>
          Before you write a single sentence of your response, spend 2–3 minutes outlining. List every sub-part of the prompt and what you will say for each.
        </div>
        <Field label="Outline — address every part of the prompt" required>
          <Txt value={data?.outline} onChange={e => set('outline', e.target.value)}
            placeholder="(a) I will say… because…\n(b) I will say… because…\n(c) I will argue…" rows={6} />
        </Field>
        <Field label="Key terms, formulas, or concepts you plan to use" required>
          <Txt value={data?.key_terms} onChange={e => set('key_terms', e.target.value)}
            placeholder="List the specific vocabulary and concepts that belong in this response…" rows={3} />
        </Field>
      </Section>

      {/* 3. Response */}
      <Section number="3" title="Your Response">
        <Field label="Link to your full written response (Drive — doc or scan)" required>
          <Inp value={data?.response_link} onChange={e => set('response_link', e.target.value)}
            placeholder="https://drive.google.com/…" />
        </Field>
        <Field label="Word count (approximate)">
          <Inp type="number" value={data?.word_count} onChange={e => set('word_count', e.target.value)} placeholder="e.g. 350" style={{ width: 120 }} />
        </Field>
      </Section>

      {/* 4. Self-Scoring */}
      <Section number="4" title="Self-Score Against the Rubric">
        <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.65, marginBottom: 'var(--space-4)' }}>
          Go through the official scoring rubric point by point. Award yourself only points you genuinely earned — not points you think you were trying for.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <Field label="Points earned (self-scored)" required>
            <Inp value={data?.self_score} onChange={e => set('self_score', e.target.value)} placeholder="e.g. 7" />
          </Field>
          <Field label="Out of (total rubric points)" required>
            <Inp value={data?.score_total} onChange={e => set('score_total', e.target.value)} placeholder="e.g. 10" />
          </Field>
        </div>
        <Field label="Which rubric points did you miss and why?" required>
          <Txt value={data?.missed_points} onChange={e => set('missed_points', e.target.value)}
            placeholder="List each missed point and the exact reason — missing term, wrong direction, incomplete explanation…" rows={4} />
        </Field>
      </Section>

      {/* 5. Reflection */}
      <Section number="5" title="Reflection">
        <Field label="What was strongest about your response?" required>
          <Txt value={data?.strength} onChange={e => set('strength', e.target.value)}
            placeholder="Be specific — which part was well-argued, clearly explained, or precisely worded?" rows={2} />
        </Field>
        <Field label="What would you write differently in 20 minutes?" required>
          <Txt value={data?.improvement} onChange={e => set('improvement', e.target.value)}
            placeholder="If you could rewrite one section, what would change and why?" rows={3} />
        </Field>
        <Field label="What concept gap does this FRQ reveal you need to study?" required>
          <Inp value={data?.gap} onChange={e => set('gap', e.target.value)}
            placeholder="The specific topic you need to go back and learn more deeply…" />
        </Field>
      </Section>
    </div>
  );
}
