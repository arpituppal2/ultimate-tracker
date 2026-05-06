/*
  ResearchTemplate.jsx
  Deep-dive research — career exploration, college research, topic investigations.
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

export default function ResearchTemplate({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-7)' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 'var(--space-1)' }}>Research</div>
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-text)', lineHeight: 1.2 }}>Deep-Dive Investigation</div>
      </div>

      {/* Meta */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)' }}>
        <Field label="Topic" required style={{ marginBottom: 0 }}>
          <Inp value={data?.topic} onChange={e => set('topic', e.target.value)}
            placeholder="e.g. Biomedical Engineer | MIT | AP Chemistry overview | Neuroscience research" />
        </Field>
        <Field label="Research type" required style={{ marginBottom: 0 }}>
          <select value={data?.research_type || ''} onChange={e => set('research_type', e.target.value)} style={base} onFocus={focus} onBlur={blur}>
            <option value="">Select…</option>
            <option>Career</option>
            <option>College / University</option>
            <option>Academic Topic</option>
            <option>Scholarship / Program</option>
            <option>Industry / Field</option>
            <option>Other</option>
          </select>
        </Field>
      </div>

      {/* 1. Sources */}
      <Section number="1" title="Sources">
        {[1,2,3].map(n => (
          <div key={n} style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <Field label={n === 1 ? 'Source name' : undefined} required={n === 1} style={{ marginBottom: 0 }}>
              <Inp value={data?.[`src${n}_name`]} onChange={e => set(`src${n}_name`, e.target.value)}
                placeholder={`Source ${n} name`} />
            </Field>
            <Field label={n === 1 ? 'URL' : undefined} required={n === 1} style={{ marginBottom: 0 }}>
              <Inp value={data?.[`src${n}_url`]} onChange={e => set(`src${n}_url`, e.target.value)}
                placeholder={`URL ${n}`} />
            </Field>
          </div>
        ))}
      </Section>

      {/* 2. Findings */}
      <Section number="2" title="What You Found">
        <Field label="5–8 sentence summary of your findings" required>
          <Txt value={data?.summary} onChange={e => set('summary', e.target.value)}
            placeholder="Synthesize what you learned — not just a list of facts, but a coherent picture…" rows={6} />
        </Field>
        <Field label="5 specific concrete facts (numbers, names, dates, statistics)" required>
          <Txt value={data?.key_facts} onChange={e => set('key_facts', e.target.value)}
            placeholder="1. …\n2. …\n3. …\n4. …\n5. …" rows={5} />
        </Field>
      </Section>

      {/* 3. Analysis */}
      <Section number="3" title="Your Analysis">
        <Field label="What surprised you most?" required>
          <Txt value={data?.surprised} onChange={e => set('surprised', e.target.value)}
            placeholder="Something you didn't expect or that changed your understanding…" rows={2} />
        </Field>
        <Field label="What questions does this raise that you still don't know?">
          <Txt value={data?.open_questions} onChange={e => set('open_questions', e.target.value)}
            placeholder="Things you'd want to research further…" rows={2} />
        </Field>
      </Section>

      {/* 4. Honest Take */}
      <Section number="4" title="Your Honest Take">
        <Field label="Does this topic / career / school interest you? Rate 1–10 and explain." required>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
            <Inp type="number" value={data?.interest_score}
              onChange={e => { const v = Math.min(10, Math.max(1, parseInt(e.target.value) || '')); set('interest_score', v); }}
              placeholder="1–10" />
            <Txt value={data?.interest_reason} onChange={e => set('interest_reason', e.target.value)}
              placeholder="Why that score? What excites or doesn't excite you about this?" rows={3} />
          </div>
        </Field>
        <Field label="Would you pursue this seriously? What would the next step be?" required>
          <Txt value={data?.next_step} onChange={e => set('next_step', e.target.value)}
            placeholder="If yes: what would you do next? If no: what would have to change?" rows={2} />
        </Field>
      </Section>
    </div>
  );
}
