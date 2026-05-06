/*
  CareerExploreTemplate.jsx
  Career Report — structured research document.
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
function SectionHeader({ title }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
      marginBottom: 'var(--space-5)', marginTop: 'var(--space-2)',
    }}>
      <div style={{ flex: 1, height: 2, background: 'var(--color-border)' }} />
      <span style={{
        fontSize: 'var(--text-xs)', fontWeight: 900, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: 'var(--color-text-muted)',
        whiteSpace: 'nowrap', padding: '0 var(--space-2)',
      }}>{title}</span>
      <div style={{ flex: 1, height: 2, background: 'var(--color-border)' }} />
    </div>
  );
}
function Block({ title, children }) {
  return (
    <div style={{ marginBottom: 'var(--space-8)' }}>
      <SectionHeader title={title} />
      {children}
    </div>
  );
}

export default function CareerExploreTemplate({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });

  return (
    <div>
      {/* Report header */}
      <div style={{ marginBottom: 'var(--space-8)', textAlign: 'center', padding: 'var(--space-6) var(--space-4)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 'var(--space-2)' }}>Career Report</div>
        <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-text)', lineHeight: 1.1, marginBottom: 'var(--space-5)' }}>
          {data?.career_title || <span style={{ color: 'var(--color-text-faint)' }}>Career Title</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 'var(--space-3)', maxWidth: 720, margin: '0 auto' }}>
          <Field label="Researcher" style={{ marginBottom: 0, textAlign: 'left' }}>
            <Inp value={data?.researcher} onChange={e => set('researcher', e.target.value)} placeholder="Name" />
          </Field>
          <Field label="Date completed" style={{ marginBottom: 0, textAlign: 'left' }}>
            <Inp type="date" value={data?.date_completed} onChange={e => set('date_completed', e.target.value)} />
          </Field>
          <Field label="Career title" style={{ marginBottom: 0, textAlign: 'left' }}>
            <Inp value={data?.career_title} onChange={e => set('career_title', e.target.value)} placeholder="e.g. Biomedical Engineer" />
          </Field>
          <Field label="Block / Week" style={{ marginBottom: 0, textAlign: 'left' }}>
            <Inp value={data?.block_week} onChange={e => set('block_week', e.target.value)} placeholder="e.g. Block 3 / Week 7" />
          </Field>
        </div>
      </div>

      {/* Executive Overview */}
      <Block title="Executive Overview">
        <Field label="What this career is and why it matters today (2–3 paragraphs)" required>
          <Txt value={data?.executive_overview} onChange={e => set('executive_overview', e.target.value)}
            placeholder="Paragraph 1: What the career is and what problem it solves in society.\nParagraph 2: Why this field is relevant or growing in today's economy.\nParagraph 3 (optional): Any interesting context, history, or macro trends." rows={8} />
        </Field>
      </Block>

      {/* Job Description */}
      <Block title="Job Description & Responsibilities">
        <Field label="Daily tasks, work environment, remote / hybrid / field" required>
          <Txt value={data?.job_description} onChange={e => set('job_description', e.target.value)}
            placeholder="What does a typical day look like? What are the core recurring tasks? Is this desk work, fieldwork, lab, hospital, client-facing? What’s the work environment like?" rows={5} />
        </Field>
      </Block>

      {/* Educational Requirements */}
      <Block title="Educational Requirements">
        <Field label="Minimum credentials, pathway from high school, certifications" required>
          <Txt value={data?.education} onChange={e => set('education', e.target.value)}
            placeholder="e.g. BS in Biomedical Engineering (4 yr) → optional MS (2 yr) → PE license. High school path: strong in AP Bio, AP Chem, AP Calculus BC. Certifications: EIT, PE, CBET." rows={4} />
        </Field>
      </Block>

      {/* Skills */}
      <Block title="Skills & Competencies">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <Field label="Essential skills" required style={{ marginBottom: 0 }}>
            <Txt value={data?.skills_essential} onChange={e => set('skills_essential', e.target.value)}
              placeholder="• \n• \n• " rows={5} />
          </Field>
          <Field label="Desirable skills" style={{ marginBottom: 0 }}>
            <Txt value={data?.skills_desirable} onChange={e => set('skills_desirable', e.target.value)}
              placeholder="• \n• \n• " rows={5} />
          </Field>
        </div>
      </Block>

      {/* Career Progression */}
      <Block title="Career Progression">
        <Field label="Entry → Mid → Senior (titles, years, lateral options)" required>
          <Txt value={data?.career_progression} onChange={e => set('career_progression', e.target.value)}
            placeholder="Entry (0–3 yrs): Junior Engineer / Analyst\nMid (3–8 yrs): Engineer II / Senior Analyst\nSenior (8+ yrs): Principal Engineer / Director\nLateral options: Product Management, Consulting, Entrepreneurship" rows={5} />
        </Field>
      </Block>

      {/* Compensation */}
      <Block title="Compensation">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <Field label="Entry salary" required style={{ marginBottom: 0 }}>
            <Inp value={data?.salary_entry} onChange={e => set('salary_entry', e.target.value)} placeholder="e.g. $65,000" />
          </Field>
          <Field label="Mid salary" required style={{ marginBottom: 0 }}>
            <Inp value={data?.salary_mid} onChange={e => set('salary_mid', e.target.value)} placeholder="e.g. $105,000" />
          </Field>
          <Field label="Senior salary" required style={{ marginBottom: 0 }}>
            <Inp value={data?.salary_senior} onChange={e => set('salary_senior', e.target.value)} placeholder="e.g. $160,000+" />
          </Field>
        </div>
        <Field label="Source">
          <Inp value={data?.salary_source} onChange={e => set('salary_source', e.target.value)}
            placeholder="e.g. BLS Occupational Outlook Handbook, Glassdoor, Levels.fyi" />
        </Field>
      </Block>

      {/* Market Analysis */}
      <Block title="Market Analysis">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
          <Field label="BLS projected growth %" required style={{ marginBottom: 0 }}>
            <Inp value={data?.bls_growth} onChange={e => set('bls_growth', e.target.value)} placeholder="e.g. +7% (2022–2032)" />
          </Field>
          <Field label="Top employers" style={{ marginBottom: 0 }}>
            <Inp value={data?.top_employers} onChange={e => set('top_employers', e.target.value)}
              placeholder="e.g. Medtronic, FDA, Kaiser, startups" />
          </Field>
          <Field label="Automation risk" style={{ marginBottom: 0 }}>
            <Inp value={data?.automation_risk} onChange={e => set('automation_risk', e.target.value)}
              placeholder="e.g. Low — creative + hands-on components" />
          </Field>
        </div>
      </Block>

      {/* Day-to-Day Reality */}
      <Block title="Day-to-Day Reality">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <Field label="Hours / work-life balance" required style={{ marginBottom: 0 }}>
            <Txt value={data?.hours_wlb} onChange={e => set('hours_wlb', e.target.value)}
              placeholder="Typical hours per week, on-call expectations, crunch periods, vacation norms…" rows={4} />
          </Field>
          <Field label="Tools used daily" style={{ marginBottom: 0 }}>
            <Txt value={data?.tools_daily} onChange={e => set('tools_daily', e.target.value)}
              placeholder="Software, instruments, programming languages, platforms, equipment…" rows={4} />
          </Field>
        </div>
      </Block>

      {/* Personal Fit */}
      <Block title="Personal Fit">
        <Field label="Who thrives here" required>
          <Txt value={data?.who_thrives} onChange={e => set('who_thrives', e.target.value)}
            placeholder="Traits, personality types, strengths that lead to success in this field…" rows={3} />
        </Field>
        <Field label="Biggest challenges / why people leave" required>
          <Txt value={data?.why_leave} onChange={e => set('why_leave', e.target.value)}
            placeholder="Common frustrations, burnout factors, reasons people exit the field…" rows={3} />
        </Field>
        <Field label="What I found most interesting" required>
          <Txt value={data?.most_interesting} onChange={e => set('most_interesting', e.target.value)}
            placeholder="The specific thing about this career that surprised, impressed, or genuinely interested you during research…" rows={3} />
        </Field>
      </Block>

      {/* References */}
      <Block title="References">
        <Field label="All sources used (one per line)" required>
          <Txt value={data?.references} onChange={e => set('references', e.target.value)}
            placeholder="BLS Occupational Outlook Handbook — https://bls.gov/ooh/\nGlassdoor — https://glassdoor.com\nr/biomedicalengineering — https://reddit.com/r/biomedicalengineering\n…" rows={6} />
        </Field>
      </Block>
    </div>
  );
}
