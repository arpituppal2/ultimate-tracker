/*
  ApplicationTemplate.jsx
  Internship, scholarship, summer program, competition, and college applications.
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

export default function ApplicationTemplate({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-7)' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 'var(--space-1)' }}>Application</div>
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-text)', lineHeight: 1.2 }}>Program / Opportunity Application</div>
      </div>

      {/* Meta */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)' }}>
        <Field label="Organization / program name" required style={{ marginBottom: 0 }}>
          <Inp value={data?.org_name} onChange={e => set('org_name', e.target.value)}
            placeholder="e.g. MIT PRIMES, Gates Scholarship, RSI, Regeneron STS" />
        </Field>
        <Field label="Application type" required style={{ marginBottom: 0 }}>
          <select value={data?.app_type || ''} onChange={e => set('app_type', e.target.value)} style={base} onFocus={focus} onBlur={blur}>
            <option value="">Select…</option>
            <option>Internship</option>
            <option>Scholarship</option>
            <option>Summer Program</option>
            <option>Research Program</option>
            <option>Competition</option>
            <option>College Application</option>
            <option>Grant / Award</option>
            <option>Other</option>
          </select>
        </Field>
        <Field label="Deadline" required style={{ marginBottom: 0 }}>
          <Inp type="date" value={data?.deadline} onChange={e => set('deadline', e.target.value)} />
        </Field>
      </div>

      {/* 1. The Opportunity */}
      <Section number="1" title="The Opportunity">
        <Field label="What is this program / scholarship / opportunity? (3–5 sentences)" required>
          <Txt value={data?.opportunity_desc} onChange={e => set('opportunity_desc', e.target.value)}
            placeholder="Describe what it is, who it's for, what you would do or receive, and why it matters…" rows={4} />
        </Field>
        <Field label="Why are you a strong candidate for this?" required>
          <Txt value={data?.why_you} onChange={e => set('why_you', e.target.value)}
            placeholder="Your relevant experience, achievements, and qualities that fit this opportunity…" rows={3} />
        </Field>
        <Field label="Program/opportunity website URL">
          <Inp value={data?.website_url} onChange={e => set('website_url', e.target.value)}
            placeholder="https://…" />
        </Field>
      </Section>

      {/* 2. Materials */}
      <Section number="2" title="Application Materials">
        <Field label="Materials checklist — what does this application require?" required>
          <Txt value={data?.checklist} onChange={e => set('checklist', e.target.value)}
            placeholder="e.g.\n- Personal statement (500 words)\n- 2 teacher recommendations\n- Transcript\n- Resume\n- Short answer (250 words)" rows={5} />
        </Field>
        <Field label="Link to your application folder (Drive — all materials)" required>
          <Inp value={data?.materials_link} onChange={e => set('materials_link', e.target.value)}
            placeholder="https://drive.google.com/… (folder with all drafts and final versions)" />
        </Field>
        <Field label="What is still incomplete or in progress?">
          <Txt value={data?.incomplete} onChange={e => set('incomplete', e.target.value)}
            placeholder="Anything not yet finished or submitted…" rows={2} />
        </Field>
      </Section>

      {/* 3. Status */}
      <Section number="3" title="Status">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <Field label="Current status" required>
            <select value={data?.status || ''} onChange={e => set('status', e.target.value)} style={base} onFocus={focus} onBlur={blur}>
              <option value="">Select…</option>
              <option>Researching</option>
              <option>Drafting</option>
              <option>Under Review (by admin)</option>
              <option>Submitted</option>
              <option>Waiting for Decision</option>
              <option>Accepted</option>
              <option>Waitlisted</option>
              <option>Rejected</option>
              <option>Declined (by me)</option>
            </select>
          </Field>
          <Field label="Outcome (if decided)">
            <Inp value={data?.outcome} onChange={e => set('outcome', e.target.value)}
              placeholder="Award amount, acceptance, result…" />
          </Field>
        </div>
        <Field label="Notes for reviewer">
          <Txt value={data?.reviewer_notes} onChange={e => set('reviewer_notes', e.target.value)}
            placeholder="Anything specific you want feedback on, or context the reviewer needs…" rows={2} />
        </Field>
      </Section>
    </div>
  );
}
