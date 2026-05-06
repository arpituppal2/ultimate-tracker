/*
  WritingTemplate.jsx
  Personal statements, scholarship essays, college app essays, short stories, creative writing.
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

export default function WritingTemplate({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-7)' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 'var(--space-1)' }}>Writing</div>
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-text)', lineHeight: 1.2 }}>Draft Submission</div>
      </div>

      {/* Meta */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)' }}>
        <Field label="Assignment type" required style={{ marginBottom: 0 }}>
          <select value={data?.assignment_type || ''} onChange={e => set('assignment_type', e.target.value)} style={base} onFocus={focus} onBlur={blur}>
            <option value="">Select…</option>
            <option>Personal Statement</option>
            <option>Scholarship Essay</option>
            <option>College Application Essay</option>
            <option>Short Story</option>
            <option>Analytical Essay</option>
            <option>Reflection</option>
            <option>Cover Letter</option>
            <option>Other</option>
          </select>
        </Field>
        <Field label="Word count" required style={{ marginBottom: 0 }}>
          <Inp type="number" value={data?.word_count} onChange={e => set('word_count', e.target.value)} placeholder="e.g. 650" />
        </Field>
        <Field label="Draft #" required style={{ marginBottom: 0 }}>
          <Inp type="number" value={data?.draft_num} onChange={e => set('draft_num', e.target.value)} placeholder="e.g. 1" />
        </Field>
      </div>

      {/* 1. Prompt */}
      <Section number="1" title="The Prompt">
        <Field label="Full prompt or topic" required>
          <Txt value={data?.prompt} onChange={e => set('prompt', e.target.value)}
            placeholder="Paste the complete prompt or describe the topic in full…" rows={4} />
        </Field>
        <Field label="Word limit or target length">
          <Inp value={data?.word_limit} onChange={e => set('word_limit', e.target.value)} placeholder="e.g. 650 words max" style={{ width: 200 }} />
        </Field>
      </Section>

      {/* 2. Your Draft */}
      <Section number="2" title="Your Draft">
        <Field label="Google Doc link to your draft" required>
          <Inp value={data?.draft_link} onChange={e => set('draft_link', e.target.value)}
            placeholder="https://docs.google.com/…" />
        </Field>
        <Field label="In 1–2 sentences, what is the central argument or story of this draft?" required>
          <Txt value={data?.central_idea} onChange={e => set('central_idea', e.target.value)}
            placeholder="The core of what this piece is trying to say or show…" rows={2} />
        </Field>
      </Section>

      {/* 3. Self-Review */}
      <Section number="3" title="Self-Review">
        <Field label="What is the strongest sentence or paragraph in this draft?" required>
          <Txt value={data?.strongest} onChange={e => set('strongest', e.target.value)}
            placeholder="Quote or describe the part you're most proud of and why it works…" rows={2} />
        </Field>
        <Field label="What is the weakest part and why?" required>
          <Txt value={data?.weakest} onChange={e => set('weakest', e.target.value)}
            placeholder="The section that feels off, vague, rushed, or not authentic…" rows={2} />
        </Field>
        <Field label="What one specific thing would make this draft significantly better?" required>
          <Txt value={data?.one_improvement} onChange={e => set('one_improvement', e.target.value)}
            placeholder="Not a list — just the single highest-leverage change…" rows={2} />
        </Field>
      </Section>

      {/* 4. Next Steps */}
      <Section number="4" title="Next Steps">
        <Field label="What feedback are you asking for from the reviewer?" required>
          <Txt value={data?.feedback_request} onChange={e => set('feedback_request', e.target.value)}
            placeholder="Be specific — voice, structure, argument, word choice, opening, closing…" rows={2} />
        </Field>
        <Field label="What is your target submission deadline?">
          <Inp type="date" value={data?.deadline} onChange={e => set('deadline', e.target.value)} style={{ width: 200 }} />
        </Field>
      </Section>
    </div>
  );
}
