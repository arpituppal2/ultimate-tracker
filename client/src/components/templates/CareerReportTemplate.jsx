/*
  CareerReportTemplate.jsx — Deep Career Research Report
  Exact format from Avni's Master Plan. LAMT design system.
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
function Txt({ value, onChange, placeholder, rows = 4 }) {
  return <textarea value={value || ''} onChange={onChange} placeholder={placeholder} rows={rows}
    style={{ ...base, resize: 'vertical', lineHeight: 1.7 }} onFocus={focus} onBlur={blur} />;
}
function Label({ children, required }) {
  return (
    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 'var(--space-1)' }}>
      {children}{required && <span style={{ color: 'var(--color-error)', marginLeft: 2 }}>*</span>}
    </label>
  );
}
function Field({ label, required, hint, children, style }) {
  return (
    <div style={{ marginBottom: 'var(--space-4)', ...style }}>
      {label && <Label required={required}>{label}</Label>}
      {hint && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.55, marginBottom: 'var(--space-2)', borderLeft: '2px solid var(--color-border)', paddingLeft: 'var(--space-2)' }}>{hint}</div>}
      {children}
    </div>
  );
}
function Section({ title, accent, children }) {
  return (
    <div style={{ marginBottom: 'var(--space-6)' }}>
      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent || 'var(--color-text-faint)', borderBottom: `2px solid ${accent || 'var(--color-border)'}`, paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>{title}</div>
      {children}
    </div>
  );
}
function Grid({ cols = 2, children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 'var(--space-3)' }}>{children}</div>;
}
function BulletList({ value, onChange, placeholder, addLabel = '+ Add' }) {
  const items = value || [''];
  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--color-primary)', fontSize: 'var(--text-sm)', paddingTop: '0.45rem' }}>•</span>
          <Inp value={item} onChange={e => onChange(items.map((x, j) => j === i ? e.target.value : x))} placeholder={placeholder} />
          {items.length > 1 && (
            <button onClick={() => onChange(items.filter((_, j) => j !== i))}
              style={{ flexShrink: 0, background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0.4rem 0.3rem', fontSize: 'var(--text-xs)' }}>✕</button>
          )}
        </div>
      ))}
      <button onClick={() => onChange([...items, ''])}
        style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', background: 'transparent', border: '1px dashed var(--color-border)', padding: '0.25rem 0.75rem', cursor: 'pointer', marginTop: 2 }}>{addLabel}</button>
    </div>
  );
}

const u = (data, key, val) => ({ ...data, [key]: val });

export default function CareerReportTemplate({ data = {}, onChange }) {
  const s = key => val => onChange(u(data, key, val));

  return (
    <div>
      {/* META */}
      <Section title="Report Header">
        <Grid cols={2}>
          <Field label="Career Title" required><Inp value={data.careerTitle} onChange={e => s('careerTitle')(e.target.value)} placeholder="e.g. Software Engineer · Machine Learning" /></Field>
          <Field label="Date Completed"><Inp type="date" value={data.dateCompleted} onChange={e => s('dateCompleted')(e.target.value)} /></Field>
          <Field label="Block / Week"><Inp value={data.blockWeek} onChange={e => s('blockWeek')(e.target.value)} placeholder="e.g. Block 2 / Week 6" /></Field>
          <Field label="Researcher">
            <div style={{ ...base, color: 'var(--color-text-muted)', background: 'var(--color-surface-offset)' }}>Avni Uppal</div>
          </Field>
        </Grid>
      </Section>

      {/* EXECUTIVE OVERVIEW */}
      <Section title="━━━ Executive Overview ━━━" accent="var(--color-primary)">
        <Field label="What this career is and why it matters today (2–3 paragraphs)" required
          hint="Paragraph 1: Define the role. Paragraph 2: Why is it important in today's economy / society? Paragraph 3: What makes this career unique or different from related fields?">
          <Txt rows={8} value={data.execOverview} onChange={e => s('execOverview')(e.target.value)} placeholder="Paragraph 1: At its core, a [career title] is responsible for…&#10;&#10;Paragraph 2: This career matters today because…&#10;&#10;Paragraph 3: What makes this different from similar roles is…" />
        </Field>
      </Section>

      {/* JOB DESCRIPTION */}
      <Section title="━━━ Job Description & Responsibilities ━━━" accent="var(--color-primary)">
        <Field label="Daily Tasks & Work Environment" required
          hint="What does a person in this role actually do all day? Include specific daily/weekly activities.">
          <Txt rows={5} value={data.jobDescription} onChange={e => s('jobDescription')(e.target.value)} placeholder="On a typical day, this professional will… &#10;The work environment is…&#10;Common weekly responsibilities include…" />
        </Field>
        <Field label="Remote / Hybrid / Field?">
          <div style={{ display: 'flex', gap: 'var(--space-4)', paddingTop: '0.25rem' }}>
            {['Fully Remote', 'Hybrid', 'In-Office', 'Field Work', 'Varies by Employer'].map(opt => (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                <input type="radio" name="workStyle" checked={data.workStyle === opt} onChange={() => s('workStyle')(opt)} style={{ accentColor: 'var(--color-primary)' }} />
                {opt}
              </label>
            ))}
          </div>
        </Field>
      </Section>

      {/* EDUCATIONAL REQUIREMENTS */}
      <Section title="━━━ Educational Requirements ━━━" accent="var(--color-primary)">
        <Field label="Minimum credentials and typical pathway from high school" required
          hint="What degrees, certifications, or training are needed? What's the normal academic path?">
          <Txt rows={4} value={data.education} onChange={e => s('education')(e.target.value)} placeholder="Minimum: Bachelor's degree in…&#10;Most employers prefer: Master's or PhD in…&#10;High school pathway: Focus on [subjects]. Strong SAT in [areas]. Apply to [types of programs]." />
        </Field>
        <Field label="Certifications / Licenses (if applicable)">
          <BulletList value={data.certifications} onChange={s('certifications')} placeholder="e.g. PE License, CPA, AWS Certified, etc." addLabel="+ Add certification" />
        </Field>
      </Section>

      {/* SKILLS */}
      <Section title="━━━ Skills & Competencies ━━━" accent="var(--color-primary)">
        <Grid cols={2}>
          <Field label="Essential Skills (must-have)" required>
            <BulletList value={data.essentialSkills} onChange={s('essentialSkills')} placeholder="e.g. Python / data structures" addLabel="+ Add essential skill" />
          </Field>
          <Field label="Desirable Skills (nice-to-have)">
            <BulletList value={data.desirableSkills} onChange={s('desirableSkills')} placeholder="e.g. ML/AI experience, cloud platforms" addLabel="+ Add skill" />
          </Field>
        </Grid>
      </Section>

      {/* CAREER PROGRESSION */}
      <Section title="━━━ Career Progression ━━━" accent="var(--color-primary)">
        <Field label="Entry → Mid → Senior (typical titles, years in each stage, lateral moves)" required
          hint="Format: Role Title (Years to reach) — What you do at this level. Then lateral options.">
          <Txt rows={5} value={data.progression} onChange={e => s('progression')(e.target.value)} placeholder="Entry (0–2 yrs): Junior [Title] — [what you do]&#10;Mid (3–6 yrs): [Title] — [responsibilities]&#10;Senior (7+ yrs): Senior / Lead / Principal — [responsibilities]&#10;Lateral options: [e.g. move to product management, research, consulting]" />
        </Field>
      </Section>

      {/* COMPENSATION */}
      <Section title="━━━ Compensation ━━━" accent="var(--color-primary)">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
          <Field label="Entry-Level Salary">
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--color-text-muted)' }}>$</span>
              <Inp value={data.salaryEntry} onChange={e => s('salaryEntry')(e.target.value)} placeholder="e.g. 75,000" />
            </div>
          </Field>
          <Field label="Mid-Level Salary">
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--color-text-muted)' }}>$</span>
              <Inp value={data.salaryMid} onChange={e => s('salaryMid')(e.target.value)} placeholder="e.g. 120,000" />
            </div>
          </Field>
          <Field label="Senior-Level Salary">
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--color-text-muted)' }}>$</span>
              <Inp value={data.salarySenior} onChange={e => s('salarySenior')(e.target.value)} placeholder="e.g. 180,000+" />
            </div>
          </Field>
        </div>
        <Field label="Source(s) for Salary Data" hint="BLS, Glassdoor, Levels.fyi, LinkedIn Salary, etc.">
          <Inp value={data.salarySource} onChange={e => s('salarySource')(e.target.value)} placeholder="e.g. BLS Occupational Outlook Handbook + Glassdoor (2024 data)" />
        </Field>
      </Section>

      {/* MARKET ANALYSIS */}
      <Section title="━━━ Market Analysis ━━━" accent="var(--color-primary)">
        <Grid cols={3}>
          <Field label="BLS Projected Growth (%)" hint="From Bureau of Labor Statistics OOH">
            <Inp value={data.blsGrowth} onChange={e => s('blsGrowth')(e.target.value)} placeholder="e.g. +25% (much faster than average)" />
          </Field>
          <Field label="Job Outlook Period">
            <Inp value={data.outlookPeriod} onChange={e => s('outlookPeriod')(e.target.value)} placeholder="e.g. 2022–2032" />
          </Field>
          <Field label="Automation Risk">
            <div style={{ display: 'flex', gap: 'var(--space-3)', paddingTop: '0.25rem', flexWrap: 'wrap' }}>
              {['Low', 'Medium', 'High', 'Unknown'].map(r => (
                <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  <input type="radio" name="autoRisk" checked={data.automationRisk === r} onChange={() => s('automationRisk')(r)} style={{ accentColor: 'var(--color-primary)' }} />
                  {r}
                </label>
              ))}
            </div>
          </Field>
        </Grid>
        <Field label="Top Employers in This Field">
          <BulletList value={data.topEmployers} onChange={s('topEmployers')} placeholder="e.g. Google, Meta, OpenAI, government labs, startups" addLabel="+ Add employer" />
        </Field>
      </Section>

      {/* DAY-TO-DAY */}
      <Section title="━━━ Day-to-Day Reality ━━━" accent="var(--color-primary)">
        <Grid cols={2}>
          <Field label="Hours & Work-Life Balance">
            <Inp value={data.wlb} onChange={e => s('wlb')(e.target.value)} placeholder="e.g. 40–50 hrs/wk, WLB rated 7/10 by most" />
          </Field>
          <Field label="Typical Tools Used Daily">
            <Inp value={data.tools} onChange={e => s('tools')(e.target.value)} placeholder="e.g. Python, VS Code, Jira, Slack, Jupyter" />
          </Field>
        </Grid>
      </Section>

      {/* PERSONAL FIT */}
      <Section title="━━━ Personal Fit ━━━" accent="var(--color-primary)">
        <Field label="Who thrives in this career?" required
          hint="Describe the personality, mindset, and strengths of people who do best here.">
          <Txt rows={3} value={data.whoThrives} onChange={e => s('whoThrives')(e.target.value)} placeholder="People who thrive here tend to be… They enjoy… They are motivated by…" />
        </Field>
        <Field label="Biggest challenges and why people leave" required>
          <Txt rows={3} value={data.challenges} onChange={e => s('challenges')(e.target.value)} placeholder="The hardest parts of this job are… People leave because… Burnout risk comes from…" />
        </Field>
        <Field label="What I found most interesting about this career" required>
          <Txt rows={3} value={data.mostInteresting} onChange={e => s('mostInteresting')(e.target.value)} placeholder="The part that surprised me most was… I find it interesting that… This connects to my own interests because…" />
        </Field>
      </Section>

      {/* REFERENCES */}
      <Section title="━━━ References ━━━" accent="var(--color-primary)">
        <Field label="All Sources Used" hint="List every source: BLS, Wikipedia, Glassdoor, YouTube videos, Reddit threads, anything you read or watched.">
          <BulletList value={data.references} onChange={s('references')} placeholder="e.g. BLS OOH: Computer and Information Research Scientists — https://bls.gov/…" addLabel="+ Add source" />
        </Field>
      </Section>
    </div>
  );
}
