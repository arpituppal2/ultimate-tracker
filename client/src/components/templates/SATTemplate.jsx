/*
  SATTemplate.jsx
  SAT / ACT practice session tracker — section scores, error analysis, drill plan.
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
function Sel({ value, onChange, options }) {
  return (
    <select value={value || ''} onChange={onChange}
      style={{ ...base, cursor: 'pointer' }} onFocus={focus} onBlur={blur}>
      <option value="">— select —</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
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
      {hint && (
        <div style={{
          fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
          lineHeight: 1.55, marginBottom: 'var(--space-2)',
          borderLeft: '2px solid var(--color-border)', paddingLeft: 'var(--space-2)',
        }}>{hint}</div>
      )}
      {children}
    </div>
  );
}
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 'var(--space-6)' }}>
      <div style={{
        fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.10em',
        textTransform: 'uppercase', color: 'var(--color-text-faint)',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-4)',
      }}>{title}</div>
      {children}
    </div>
  );
}
function Grid({ cols = 2, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 'var(--space-3)' }}>
      {children}
    </div>
  );
}
function Check({ label, value, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
      <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)}
        style={{ width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--color-primary)' }} />
      {label}
    </label>
  );
}

const u = (data, key, val) => ({ ...data, [key]: val });

export default function SATTemplate({ data = {}, onChange }) {
  const s = (key) => (val) => onChange(u(data, key, val));

  // Dynamic corrections — starts empty, not hardcoded to 5
  const corrections = Array.isArray(data.corrections) ? data.corrections : [];

  const addMistake = () => {
    onChange({ ...data, corrections: [...corrections, {}] });
  };

  const removeMistake = (i) => {
    onChange({ ...data, corrections: corrections.filter((_, j) => j !== i) });
  };

  const updateCorrection = (i, field, val) => {
    onChange({
      ...data,
      corrections: corrections.map((x, j) => j === i ? { ...x, [field]: val } : x),
    });
  };

  return (
    <div>
      {/* ── Meta ── */}
      <Section title="Session Info">
        <Grid cols={3}>
          <Field label="Exam / Practice" required>
            <Sel value={data.examType} onChange={e => s('examType')(e.target.value)}
              options={['SAT Full Test', 'SAT Math Section', 'SAT Reading & Writing', 'ACT Full Test', 'ACT Math', 'ACT English', 'ACT Science', 'PSAT', 'Khan SAT Prep']} />
          </Field>
          <Field label="Date">
            <Inp type="date" value={data.testDate} onChange={e => s('testDate')(e.target.value)} />
          </Field>
          <Field label="Source / Test #">
            <Inp value={data.source} onChange={e => s('source')(e.target.value)} placeholder="e.g. College Board Practice Test 4" />
          </Field>
        </Grid>
        <Grid cols={2}>
          <Field label="Time Allowed (min)">
            <Inp type="number" value={data.timeAllowed} onChange={e => s('timeAllowed')(e.target.value)} placeholder="e.g. 64" />
          </Field>
          <Field label="Time Actually Used (min)">
            <Inp type="number" value={data.timeUsed} onChange={e => s('timeUsed')(e.target.value)} placeholder="e.g. 61" />
          </Field>
        </Grid>
        <Field label="Test Conditions">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
            <Check label="Phone away + silent" value={data.condPhone} onChange={s('condPhone')} />
            <Check label="No internet / notes" value={data.condNoNotes} onChange={s('condNoNotes')} />
            <Check label="One sitting, no breaks" value={data.condOneSitting} onChange={s('condOneSitting')} />
            <Check label="Timer running" value={data.condTimer} onChange={s('condTimer')} />
          </div>
          <Inp value={data.condNotes} onChange={e => s('condNotes')(e.target.value)} placeholder="Any deviations from real conditions…" />
        </Field>
      </Section>

      {/* ── Scores ── */}
      <Section title="Scores">
        <Grid cols={3}>
          <Field label="Math Score (200–800)">
            <Inp type="number" value={data.mathScore} onChange={e => s('mathScore')(e.target.value)} placeholder="e.g. 680" />
          </Field>
          <Field label="Reading & Writing Score (200–800)">
            <Inp type="number" value={data.rwScore} onChange={e => s('rwScore')(e.target.value)} placeholder="e.g. 650" />
          </Field>
          <Field label="Total Composite (400–1600)">
            <Inp type="number" value={data.totalScore} onChange={e => s('totalScore')(e.target.value)} placeholder="e.g. 1330" />
          </Field>
        </Grid>
        <Grid cols={2}>
          <Field label="# Questions Wrong — Math">
            <Inp type="number" value={data.wrongMath} onChange={e => s('wrongMath')(e.target.value)} placeholder="e.g. 4" />
          </Field>
          <Field label="# Questions Wrong — R&W">
            <Inp type="number" value={data.wrongRW} onChange={e => s('wrongRW')(e.target.value)} placeholder="e.g. 6" />
          </Field>
        </Grid>
        <Field label="Scan / Photo of Completed Test">
          <Inp value={data.scanLink} onChange={e => s('scanLink')(e.target.value)} placeholder="Google Drive link to marked-up test pages…" />
        </Field>
        <Grid cols={2}>
          <Field label="Target Score (for context)">
            <Inp type="number" value={data.targetScore} onChange={e => s('targetScore')(e.target.value)} placeholder="e.g. 1500" />
          </Field>
          <Field label="Points Gained Since Last Test">
            <Inp value={data.improvement} onChange={e => s('improvement')(e.target.value)} placeholder="e.g. +30 pts from last test" />
          </Field>
        </Grid>
      </Section>

      {/* ── Error Log (dynamic) ── */}
      <Section title={`Error Log${corrections.length > 0 ? ` — ${corrections.length} Mistake${corrections.length !== 1 ? 's' : ''}` : ''}`}>
        {corrections.length === 0 && (
          <div style={{
            padding: 'var(--space-5)', textAlign: 'center',
            border: '1px dashed var(--color-border)',
            color: 'var(--color-text-faint)',
            fontSize: 'var(--text-xs)', fontWeight: 600,
            letterSpacing: '0.05em', marginBottom: 'var(--space-3)',
          }}>
            No mistakes logged yet.
          </div>
        )}

        {corrections.map((c, i) => (
          <div key={i} style={{
            border: '1px solid var(--color-border)', padding: 'var(--space-3)',
            marginBottom: 'var(--space-2)', background: 'var(--color-surface)',
            position: 'relative',
          }}>
            {/* Header row with remove button */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 'var(--space-2)',
            }}>
              <span style={{
                fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--color-text-faint)',
              }}>
                Mistake {i + 1}
              </span>
              <button
                onClick={() => removeMistake(i)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-error)', fontSize: 'var(--text-xs)',
                  fontWeight: 800, padding: '0.1rem 0.4rem',
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                  opacity: 0.7,
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
              >
                × Remove
              </button>
            </div>

            <Grid cols={2}>
              <Field label="Question # / Section">
                <Inp value={c.qId} onChange={e => updateCorrection(i, 'qId', e.target.value)}
                  placeholder="e.g. Math Q14" />
              </Field>
              <Field label="Topic / Skill">
                <Inp value={c.topic} onChange={e => updateCorrection(i, 'topic', e.target.value)}
                  placeholder="e.g. Systems of equations" />
              </Field>
            </Grid>
            <Field label="What I Got Wrong & Correct Approach">
              <Txt rows={2} value={c.analysis} onChange={e => updateCorrection(i, 'analysis', e.target.value)}
                placeholder="Describe the mistake and write the correct solution method…" />
            </Field>
          </div>
        ))}

        <button
          onClick={addMistake}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'none',
            border: '1px dashed var(--color-border)',
            padding: '0.45rem 1rem',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            fontSize: 'var(--text-xs)', fontWeight: 800,
            letterSpacing: '0.07em', textTransform: 'uppercase',
            width: '100%', justifyContent: 'center',
            transition: 'border-color var(--transition-interactive), color var(--transition-interactive)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
        >
          + Add Mistake
        </button>
      </Section>

      {/* ── Analysis ── */}
      <Section title="Analysis & Plan">
        <Grid cols={2}>
          <Field label="Weakest Skill Area — Math">
            <Inp value={data.weakMath} onChange={e => s('weakMath')(e.target.value)} placeholder="e.g. Quadratics, geometry" />
          </Field>
          <Field label="Weakest Skill Area — Reading & Writing">
            <Inp value={data.weakRW} onChange={e => s('weakRW')(e.target.value)} placeholder="e.g. Vocabulary in context, transitions" />
          </Field>
        </Grid>
        <Field label="Careless Mistakes (how many, what type)">
          <Txt rows={2} value={data.carelessMistakes} onChange={e => s('carelessMistakes')(e.target.value)}
            placeholder="e.g. Misread 3 questions, forgot to check units on 2 problems…" />
        </Field>
        <Field label="Time Management Issues">
          <Txt rows={2} value={data.timeIssues} onChange={e => s('timeIssues')(e.target.value)}
            placeholder="e.g. Spent too long on #18, ran out of time on last passage…" />
        </Field>
        <Field label="Drill Plan — What I Will Practice Before Next Test">
          <Txt rows={3} value={data.drillPlan} onChange={e => s('drillPlan')(e.target.value)}
            placeholder="Be specific: e.g. 20 Khan SAT Math quadratic problems, re-read 2 grammar lessons…" />
        </Field>
        <Grid cols={2}>
          <Field label="Confidence Going Into Next Test (1–10)">
            <Inp type="number" value={data.confidence} onChange={e => s('confidence')(e.target.value)} placeholder="1–10" style={{ maxWidth: 80 }} />
          </Field>
          <Field label="Next Practice Date Target">
            <Inp type="date" value={data.nextTestDate} onChange={e => s('nextTestDate')(e.target.value)} />
          </Field>
        </Grid>
      </Section>
    </div>
  );
}
