/*
  BlockReviewTemplate.jsx — 4-Week Block Review
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
function MoneyRow({ label, value, onChange, placeholder, bold }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--color-border)', background: bold ? 'var(--color-surface-offset)' : 'var(--color-surface)' }}>
      <span style={{ fontSize: 'var(--text-sm)', color: bold ? 'var(--color-text)' : 'var(--color-text-muted)', minWidth: 220, fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span style={{ color: 'var(--color-text-muted)' }}>$</span>
      <Inp type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ maxWidth: 130 }} />
    </div>
  );
}

const u = (data, key, val) => ({ ...data, [key]: val });

export default function BlockReviewTemplate({ data = {}, onChange }) {
  const s = key => val => onChange(u(data, key, val));

  const khanMath = data.khanMath || ['', '', ''];
  const khanSci  = data.khanSci  || ['', '', ''];
  const khanEng  = data.khanEng  || [''];
  const amcTopics = data.amcTopics || ['', '', '', ''];
  const careers  = data.careers  || Array.from({ length: 8 }, () => '');
  const aps      = data.aps      || ['', ''];

  const addTo  = (key, arr)      => onChange({ ...data, [key]: [...arr, ''] });
  const setArr = (key, arr, i, v) => onChange({ ...data, [key]: arr.map((x, j) => j === i ? v : x) });

  return (
    <div>
      {/* META */}
      <Section title="Block Header">
        <Grid cols={3}>
          <Field label="Block ID" required>
            <Inp value={data.blockId} onChange={e => s('blockId')(e.target.value)} placeholder="e.g. Block 2" />
          </Field>
          <Field label="Date Range" required>
            <Inp value={data.dateRange} onChange={e => s('dateRange')(e.target.value)} placeholder="e.g. May 26 – Jun 22, 2026" />
          </Field>
          <Field label="Date Completed">
            <Inp type="date" value={data.completedDate} onChange={e => s('completedDate')(e.target.value)} />
          </Field>
        </Grid>
      </Section>

      {/* ━━━ ACADEMICS ━━━ */}
      <Section title="━━━ Academics ━━━" accent="var(--color-primary)">
        <Field label="Khan Academy — Units Completed This Block">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
            {[
              { key: 'khanMath', arr: khanMath, label: 'Math', checkKey: 'khanMathCheck' },
              { key: 'khanSci',  arr: khanSci,  label: 'Science', checkKey: 'khanSciCheck' },
              { key: 'khanEng',  arr: khanEng,  label: 'English', checkKey: 'khanEngCheck' },
            ].map(({ key, arr, label, checkKey }) => (
              <div key={key}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>{label}</div>
                {arr.map((unitVal, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <input type="checkbox" checked={!!data[`${checkKey}_${i}`]}
                      onChange={e => onChange({ ...data, [`${checkKey}_${i}`]: e.target.checked })}
                      style={{ width: 13, height: 13, accentColor: 'var(--color-primary)', flexShrink: 0 }} />
                    <Inp value={unitVal} onChange={e => setArr(key, arr, i, e.target.value)} placeholder="Unit name…" />
                  </div>
                ))}
                <button onClick={() => addTo(key, arr)}
                  style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', background: 'transparent', border: '1px dashed var(--color-border)', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>
                  + Add
                </button>
              </div>
            ))}
          </div>
        </Field>

        <Field label="AMC / AIME — Topics Mastered This Block" hint="Check each topic once you've completed its AMC Topic Log and reviewed it.">
          {amcTopics.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <input type="checkbox" checked={!!data[`amcCheck_${i}`]}
                onChange={e => onChange({ ...data, [`amcCheck_${i}`]: e.target.checked })}
                style={{ width: 13, height: 13, accentColor: 'var(--color-primary)', flexShrink: 0 }} />
              <Inp value={t} onChange={e => setArr('amcTopics', amcTopics, i, e.target.value)} placeholder={`Topic ${i + 1} — e.g. Modular Arithmetic`} />
            </div>
          ))}
          <button onClick={() => addTo('amcTopics', amcTopics)}
            style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', background: 'transparent', border: '1px dashed var(--color-border)', padding: '0.25rem 0.75rem', cursor: 'pointer' }}>
            + Add topic
          </button>
        </Field>

        <Field label="Careers Explored" hint="8 careers per block = 2 per week × 4 weeks. List each career title and researcher name.">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            {careers.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', minWidth: 20 }}>{i + 1}.</span>
                <Inp value={c} onChange={e => setArr('careers', careers, i, e.target.value)} placeholder={`Career ${i + 1}`} />
              </div>
            ))}
          </div>
        </Field>

        <Field label="APs Explored" hint="Which AP courses did you preview or study this block?">
          {aps.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <input type="checkbox" checked={!!data[`apCheck_${i}`]}
                onChange={e => onChange({ ...data, [`apCheck_${i}`]: e.target.checked })}
                style={{ width: 13, height: 13, accentColor: 'var(--color-primary)' }} />
              <Inp value={a} onChange={e => setArr('aps', aps, i, e.target.value)} placeholder={`AP Course ${i + 1}`} />
            </div>
          ))}
          <button onClick={() => addTo('aps', aps)}
            style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', background: 'transparent', border: '1px dashed var(--color-border)', padding: '0.25rem 0.75rem', cursor: 'pointer' }}>
            + Add AP
          </button>
        </Field>
      </Section>

      {/* ━━━ HABITS ━━━ */}
      <Section title="━━━ Habits ━━━" accent="var(--color-success, #16a34a)">
        <Grid cols={3}>
          <Field label="Daily Habit Completion Rate" hint="out of 28 days">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Inp type="number" value={data.dailyRate} onChange={e => s('dailyRate')(e.target.value)} placeholder="e.g. 24" style={{ maxWidth: 80 }} />
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}> / 28 days</span>
            </div>
          </Field>
          <Field label="Weekly Streaks Maintained" hint="out of 4 weeks">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Inp type="number" value={data.weeklyStreaks} onChange={e => s('weeklyStreaks')(e.target.value)} placeholder="e.g. 3" style={{ maxWidth: 80 }} />
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}> / 4 weeks</span>
            </div>
          </Field>
          <Field label="Duolingo Streak Maintained?">
            <div style={{ display: 'flex', gap: 'var(--space-4)', paddingTop: '0.45rem', flexWrap: 'wrap' }}>
              {['Yes ✓', 'No ✗', 'Partially'].map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  <input type="radio" name="duolingo" checked={data.duolingo === opt} onChange={() => s('duolingo')(opt)} style={{ accentColor: 'var(--color-primary)' }} />
                  {opt}
                </label>
              ))}
            </div>
          </Field>
        </Grid>
        <Field label="Habit Notes">
          <Inp value={data.habitNotes} onChange={e => s('habitNotes')(e.target.value)} placeholder="e.g. Missed 3 days in week 2 due to school test — will schedule better next block" />
        </Field>
      </Section>

      {/* ━━━ MONEY ━━━ */}
      <Section title="━━━ Money ━━━" accent="#b45309">
        <MoneyRow label="Total earned this block" value={data.earned} onChange={s('earned')} placeholder="0.00" />
        <MoneyRow label="Total penalties this block" value={data.penalties} onChange={s('penalties')} placeholder="0.00" />
        <MoneyRow label="Block net (earned − penalties)" value={data.blockNet} onChange={s('blockNet')} placeholder="0.00" bold />
        <MoneyRow label="Running total (cumulative all blocks)" value={data.runningTotal} onChange={s('runningTotal')} placeholder="0.00" bold />
        <Field label="Finance Notes" style={{ marginTop: 'var(--space-2)' }}>
          <Inp value={data.financeNotes} onChange={e => s('financeNotes')(e.target.value)} placeholder="Bonuses, deductions, or context…" />
        </Field>
      </Section>

      {/* ━━━ REFLECTION ━━━ */}
      <Section title="━━━ Reflection ━━━" accent="var(--color-primary)">
        <Field label="What went well this block?" required>
          <Txt rows={4} value={data.wentWell} onChange={e => s('wentWell')(e.target.value)} placeholder="Be specific — what worked, what you're proud of, which habits held, what surprised you…" />
        </Field>
        <Field label="What I want to do better next block" required>
          <Txt rows={4} value={data.improve} onChange={e => s('improve')(e.target.value)} placeholder="What specifically should change? What will you do differently starting Week 1 of the next block?" />
        </Field>
        <Field label="Hardest thing this block" required>
          <Txt rows={3} value={data.hardest} onChange={e => s('hardest')(e.target.value)} placeholder="What was the toughest academic or personal challenge? How did you deal with it?" />
        </Field>
        <Field label="Most interesting thing I learned" required>
          <Txt rows={3} value={data.mostInteresting} onChange={e => s('mostInteresting')(e.target.value)} placeholder="Out of everything — math, careers, APs, reading — what genuinely surprised or excited you most?" />
        </Field>
      </Section>
    </div>
  );
}
