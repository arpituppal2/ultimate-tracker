/*
  WeeklyPreviewTemplate.jsx — Weekly Preview
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
function Field({ label, required, hint, children, style }) {
  return (
    <div style={{ marginBottom: 'var(--space-4)', ...style }}>
      {label && <Label required={required}>{label}</Label>}
      {hint && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.55, marginBottom: 'var(--space-2)', borderLeft: '2px solid var(--color-border)', paddingLeft: 'var(--space-2)' }}>{hint}</div>}
      {children}
    </div>
  );
}
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 'var(--space-6)' }}>
      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-faint)', borderBottom: '2px solid var(--color-border)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>{title}</div>
      {children}
    </div>
  );
}
function Grid({ cols = 2, children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 'var(--space-3)' }}>{children}</div>;
}
function FocusRow({ label, hint, value, onChange, placeholder }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', marginBottom: 'var(--space-3)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-divider)' }}>
      <div style={{ minWidth: 160, paddingTop: '0.45rem' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '0.03em' }}>{label}</div>
        {hint && <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{hint}</div>}
      </div>
      <div style={{ flex: 1 }}><Inp value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} /></div>
    </div>
  );
}

const u = (data, key, val) => ({ ...data, [key]: val });

export default function WeeklyPreviewTemplate({ data = {}, onChange }) {
  const s = key => val => onChange(u(data, key, val));
  const amcTopics = data.amcTopics || ['', '', '', ''];
  const deadlines = data.deadlines || ['', ''];

  return (
    <div>
      {/* META */}
      <Section title="Week Header">
        <Grid cols={3}>
          <Field label="Block ID" required>
            <Inp value={data.blockId} onChange={e => s('blockId')(e.target.value)} placeholder="e.g. Block 2" />
          </Field>
          <Field label="Week Number">
            <Inp value={data.weekNum} onChange={e => s('weekNum')(e.target.value)} placeholder="e.g. Week 5 of 13" />
          </Field>
          <Field label="Monday's Date" required>
            <Inp type="date" value={data.mondayDate} onChange={e => s('mondayDate')(e.target.value)} />
          </Field>
        </Grid>
      </Section>

      {/* THIS WEEK'S FOCUS */}
      <Section title="This Week's Focus">
        <div style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          Fill in your specific targets for each track. Be as precise as possible — unit names, problem numbers, chapter sections.
        </div>
        <FocusRow label="Khan Math target" hint="specific unit(s)" value={data.khanMath} onChange={s('khanMath')} placeholder="e.g. Pre-Algebra Unit 4: Fractions + Unit 5: Decimals" />
        <FocusRow label="Khan Science target" hint="specific unit(s)" value={data.khanScience} onChange={s('khanScience')} placeholder="e.g. HS Biology: Cell Biology Unit 2" />
        <FocusRow label="Khan English target" hint="specific unit(s)" value={data.khanEnglish} onChange={s('khanEnglish')} placeholder="e.g. Grammar: Sentence Fragments + Writing: Thesis Statements" />

        <Field label="AMC Topics This Week (4–6 topics from schedule)" hint="List each topic on its own line. These will each get their own AMC Topic Log.">
          {amcTopics.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', paddingTop: '0.5rem', minWidth: 16 }}>{i + 1}.</span>
              <Inp value={t} onChange={e => onChange({ ...data, amcTopics: amcTopics.map((x, j) => j === i ? e.target.value : x) })} placeholder={`Topic ${i + 1} — e.g. Modular Arithmetic`} />
              {i === amcTopics.length - 1 && (
                <button onClick={() => onChange({ ...data, amcTopics: [...amcTopics, ''] })}
                  style={{ border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', padding: '0 0.5rem', cursor: 'pointer', fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>
                  + Add
                </button>
              )}
            </div>
          ))}
        </Field>

        <Grid cols={2}>
          <Field label="Career Deep-Dive #1" hint="career to research this week">
            <Inp value={data.career1} onChange={e => s('career1')(e.target.value)} placeholder="e.g. Software Engineer at Google" />
          </Field>
          <Field label="Career Deep-Dive #2" hint="second career to research">
            <Inp value={data.career2} onChange={e => s('career2')(e.target.value)} placeholder="e.g. Research Mathematician" />
          </Field>
        </Grid>

        <Field label="AP Exploration This Week" hint="which AP course and specific topic you're previewing">
          <Inp value={data.apExploration} onChange={e => s('apExploration')(e.target.value)} placeholder="e.g. AP Calculus BC — Introduction to Limits" />
        </Field>
      </Section>

      {/* SCHOOL */}
      <Section title="School / Dual Enrollment This Week">
        <Field label="Courses & Notes" hint="List any school classes, tests, or dual enrollment sessions happening this week.">
          <Txt rows={3} value={data.schoolNotes} onChange={e => s('schoolNotes')(e.target.value)} placeholder="Math class: review test Friday&#10;Science: lab report due Thursday&#10;English: finish reading Ch. 5–8" />
        </Field>
      </Section>

      {/* DEADLINES */}
      <Section title="Upcoming Deadlines">
        <Field label="Anything due this week or next week?" hint="Competition registrations, school assignments, program applications, etc.">
          {deadlines.map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', paddingTop: '0.5rem', minWidth: 16 }}>•</span>
              <Inp value={d} onChange={e => onChange({ ...data, deadlines: deadlines.map((x, j) => j === i ? e.target.value : x) })} placeholder={`Deadline ${i + 1} — e.g. AMC 8 registration closes May 15`} />
            </div>
          ))}
          <button onClick={() => onChange({ ...data, deadlines: [...deadlines, ''] })}
            style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', background: 'transparent', border: '1px solid var(--color-border)', padding: '0.25rem 0.75rem', cursor: 'pointer' }}>
            + Add deadline
          </button>
        </Field>
      </Section>

      {/* MINDSET */}
      <Section title="Mindset Check-In">
        <Field label="What I'm most looking forward to this week" required>
          <Txt rows={2} value={data.lookForward} onChange={e => s('lookForward')(e.target.value)} placeholder="I'm excited about… because…" />
        </Field>
        <Field label="What I'm nervous about">
          <Txt rows={2} value={data.nervous} onChange={e => s('nervous')(e.target.value)} placeholder="I'm a bit worried about… My plan to handle it is…" />
        </Field>
        <Field label="Any other notes or intentions for the week">
          <Txt rows={3} value={data.otherNotes} onChange={e => s('otherNotes')(e.target.value)} placeholder="Anything else you want to track, commit to, or remember this week…" />
        </Field>
      </Section>
    </div>
  );
}
