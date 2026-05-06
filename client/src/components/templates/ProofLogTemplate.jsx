/*
  ProofLogTemplate.jsx — Block Proof Log
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
function Section({ title, accent, note, children }) {
  return (
    <div style={{ marginBottom: 'var(--space-6)' }}>
      <div style={{ borderBottom: `2px solid ${accent || 'var(--color-border)'}`, paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent || 'var(--color-text-faint)' }}>{title}</div>
        {note && <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: 3 }}>{note}</div>}
      </div>
      {children}
    </div>
  );
}
function Grid({ cols = 2, children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 'var(--space-3)' }}>{children}</div>;
}
function AdminBadge() {
  return <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', background: 'var(--color-primary)', color: '#fff', padding: '1px 7px', borderRadius: 2, marginLeft: 8 }}>PARENT / ADMIN</span>;
}

const u = (data, key, val) => ({ ...data, [key]: val });

export default function ProofLogTemplate({ data = {}, onChange }) {
  const s = key => val => onChange(u(data, key, val));
  const amcTopics = data.amcTopics || [{ topic: '', howToUse: '', sampleProblem: '' }];

  const setTopic = (i, field, val) => {
    const next = amcTopics.map((t, j) => j === i ? { ...t, [field]: val } : t);
    onChange({ ...data, amcTopics: next });
  };
  const addTopic = () => onChange({ ...data, amcTopics: [...amcTopics, { topic: '', howToUse: '', sampleProblem: '' }] });

  return (
    <div>
      {/* META */}
      <Section title="Log Header">
        <Grid cols={3}>
          <Field label="Block ID" required><Inp value={data.blockId} onChange={e => s('blockId')(e.target.value)} placeholder="e.g. Block 2" /></Field>
          <Field label="Block Date Range" required><Inp value={data.dateRange} onChange={e => s('dateRange')(e.target.value)} placeholder="e.g. May 26 – Jun 22, 2026" /></Field>
          <Field label="Date Submitted"><Inp type="date" value={data.dateSubmitted} onChange={e => s('dateSubmitted')(e.target.value)} /></Field>
        </Grid>
        <Field label="Google Drive Block Folder Link" required
          hint="Paste the link to your Drive folder for this block — it should contain screenshots, notes scans, and all supporting documents.">
          <Inp value={data.driveFolderLink} onChange={e => s('driveFolderLink')(e.target.value)} placeholder="https://drive.google.com/drive/folders/…" />
        </Field>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          <span style={{ fontSize: '0.9rem' }}>📂</span>
          Researcher: <strong style={{ color: 'var(--color-text)', marginLeft: 4 }}>Avni Uppal</strong>
        </div>
      </Section>

      {/* DAILY HABITS */}
      <Section title="Daily Habit Screenshots" note="Add a screenshot or note for each day you completed your habits. Group by week if easier.">
        <Field label="Screenshots / Notes" required
          hint="Paste Drive links to habit screenshots, or describe what you completed each day. Evidence that the streak is real.">
          <Txt rows={5} value={data.habitScreenshots} onChange={e => s('habitScreenshots')(e.target.value)} placeholder="Week 1:&#10;  Mon – completed ✓ [screenshot link]&#10;  Tue – completed ✓&#10;  Wed – missed (sick)&#10;  Thu – completed ✓&#10;…" />
        </Field>
      </Section>

      {/* KHAN ACADEMY */}
      <Section title="Khan Academy Completed">
        <Field label="Units completed + screenshot of completion certificate" required
          hint="List each unit and paste the completion screenshot link. Don't just list the name — show the proof.">
          <Txt rows={5} value={data.khanCompleted} onChange={e => s('khanCompleted')(e.target.value)} placeholder="Math:&#10;  ✓ Pre-Algebra Unit 4: Fractions [screenshot: drive.google.com/…]&#10;Science:&#10;  ✓ HS Biology: Cell Division [screenshot: …]&#10;English:&#10;  ✓ Grammar: Sentence Fragments [screenshot: …]" />
        </Field>
        <Field label="Notes or reflections on Khan work this block">
          <Txt rows={2} value={data.khanNotes} onChange={e => s('khanNotes')(e.target.value)} placeholder="What was hard, what felt easy, what you want to go back to…" />
        </Field>
      </Section>

      {/* AMC TOPICS */}
      <Section title="AMC Topics Covered" note="One entry per topic completed this block.">
        {amcTopics.map((t, i) => (
          <div key={i} style={{ border: '1px solid var(--color-border)', padding: 'var(--space-3)', marginBottom: 'var(--space-3)', background: 'var(--color-surface)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 'var(--space-3)' }}>Topic {i + 1}</div>
            <Field label="Topic Name" required><Inp value={t.topic} onChange={e => setTopic(i, 'topic', e.target.value)} placeholder="e.g. Modular Arithmetic" /></Field>
            <Field label="How to use it (in your own words)" hint="Explain when and how you would use this on an AMC/AIME problem. Don't copy from notes — explain it.">
              <Txt rows={3} value={t.howToUse} onChange={e => setTopic(i, 'howToUse', e.target.value)} placeholder="I would use this topic when I see a problem that involves… The key idea is to… The trick is…" />
            </Field>
            <Field label="Sample problem you wrote for Dad" style={{ marginBottom: 0 }} hint="Write a short AMC-style problem using this concept. Dad will try to solve it.">
              <Txt rows={3} value={t.sampleProblem} onChange={e => setTopic(i, 'sampleProblem', e.target.value)} placeholder="Problem: If n ≡ 3 (mod 5) and n > 100, find the smallest such n.&#10;Answer: ___" />
            </Field>
          </div>
        ))}
        <button onClick={addTopic} style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', background: 'transparent', border: '1px dashed var(--color-border)', padding: '0.25rem 0.75rem', cursor: 'pointer' }}>+ Add topic</button>
      </Section>

      {/* CAREER REPORTS */}
      <Section title="Career Reports">
        <Field label="Links to Career Report documents" hint="Paste Drive links to each career report doc you completed this block (should be 8 total = 2 per week).">
          <Txt rows={4} value={data.careerReports} onChange={e => s('careerReports')(e.target.value)} placeholder="1. [Career Title 1] — drive.google.com/…&#10;2. [Career Title 2] — drive.google.com/…&#10;3. [Career Title 3] — …&#10;(continue for all 8 careers)" />
        </Field>
      </Section>

      {/* AP EXPLORATION */}
      <Section title="AP Exploration">
        <Field label="AP exploration notes link + summary" hint="Which APs did you explore this block? Link to your notes and briefly describe what you learned.">
          <Txt rows={3} value={data.apExploration} onChange={e => s('apExploration')(e.target.value)} placeholder="AP Calculus BC — Notes: drive.google.com/…&#10;Summary: Previewed limits and derivatives intro, watched 3 videos, feels doable in 9th grade…" />
        </Field>
      </Section>

      {/* OTHER NOTES */}
      <Section title="Other Notes">
        <Field label="Anything else from this block">
          <Txt rows={3} value={data.otherNotes} onChange={e => s('otherNotes')(e.target.value)} placeholder="Any competitions, books, events, breakthroughs, setbacks, or observations from this block…" />
        </Field>
      </Section>

      {/* PARENT CHECK NOTES — admin/parent only */}
      <Section title={<span>Parent Check Notes <AdminBadge /></span>} accent="var(--color-primary)" note="Dad fills this in after reviewing the proof log.">
        <Field label="Dad's Review Notes" hint="Comment on quality of work, completeness, observations, penalties, bonuses, or follow-up questions.">
          <Txt rows={5} value={data.parentNotes} onChange={e => s('parentNotes')(e.target.value)} placeholder="Reviewed on [date]. Khan work looks [complete/incomplete]. AMC topics [well-explained / needs more depth]. Habit screenshots [verified / missing X days].&#10;&#10;Bonus: $___  Penalty: $___&#10;&#10;Follow-up questions for Avni:&#10;…" />
        </Field>
      </Section>
    </div>
  );
}
