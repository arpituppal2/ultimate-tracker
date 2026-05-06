/*
  InterviewPrepTemplate.jsx
  College / program interview tracker — prep, actual questions, reflection.
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

export default function InterviewPrepTemplate({ data = {}, onChange }) {
  const s = (key) => (val) => onChange(u(data, key, val));
  const prepQA = data.prepQA || Array.from({ length: 5 }, () => ({ q: '', a: '' }));
  const actualQA = data.actualQA || Array.from({ length: 4 }, () => ({ q: '', a: '' }));

  return (
    <div>
      {/* ── Meta ── */}
      <Section title="Interview Details">
        <Field label="Program / School / Opportunity" required>
          <Inp value={data.program} onChange={e => s('program')(e.target.value)} placeholder="e.g. RSI 2029, Stanford Alumni Interview, Regeneron STS" />
        </Field>
        <Grid cols={3}>
          <Field label="Interview Type">
            <Sel value={data.interviewType} onChange={e => s('interviewType')(e.target.value)}
              options={['Alumni Interview', 'Panel Interview', 'On-Campus Visit', 'Video Call', 'Phone Call', 'Practice / Mock', 'Informational Chat']} />
          </Field>
          <Field label="Interview Date">
            <Inp type="date" value={data.interviewDate} onChange={e => s('interviewDate')(e.target.value)} />
          </Field>
          <Field label="Interviewer Name / Role">
            <Inp value={data.interviewer} onChange={e => s('interviewer')(e.target.value)} placeholder="e.g. Jane Doe, MIT '15" />
          </Field>
        </Grid>
      </Section>

      {/* ── Prep ── */}
      <Section title="Preparation (Before the Interview)">
        <Field label="Research Notes on the Program / School"
          hint="Key facts, recent news, specific programs, professors, or initiatives you want to mention.">
          <Txt rows={4} value={data.researchNotes} onChange={e => s('researchNotes')(e.target.value)}
            placeholder="e.g. MIT has a new quantum computing lab. RSI selects 80 students globally. I want to mention Professor X's research…" />
        </Field>
        <Field label="Top 3 Things You Want Them to Know About You">
          {['thingToKnow1', 'thingToKnow2', 'thingToKnow3'].map((key, i) => (
            <div key={key} style={{ marginBottom: 'var(--space-2)' }}>
              <Inp value={data[key]} onChange={e => s(key)(e.target.value)}
                placeholder={`${i + 1}. e.g. My AMC math journey and what drives me to solve hard problems`} />
            </div>
          ))}
        </Field>
        <Field label="Your 30-Second 'About Me' Answer">
          <Txt rows={3} value={data.aboutMe} onChange={e => s('aboutMe')(e.target.value)}
            placeholder="Write out how you'd answer 'Tell me about yourself' — practice makes it natural…" />
        </Field>

        <div style={{
          fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--color-text-faint)',
          margin: 'var(--space-4) 0 var(--space-3)',
        }}>Practice Q&A — 5 Likely Questions</div>
        {prepQA.map((qa, i) => (
          <div key={i} style={{
            border: '1px solid var(--color-border)', padding: 'var(--space-3)',
            marginBottom: 'var(--space-2)', background: 'var(--color-surface)',
          }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 'var(--space-2)' }}>
              Q{i + 1}
            </div>
            <Field label="Anticipated Question">
              <Inp value={qa.q} onChange={e => onChange({ ...data, prepQA: prepQA.map((x, j) => j === i ? { ...x, q: e.target.value } : x) })}
                placeholder="e.g. Why do you want to attend this program?" />
            </Field>
            <Field label="Your Planned Answer" style={{ marginBottom: 0 }}>
              <Txt rows={3} value={qa.a} onChange={e => onChange({ ...data, prepQA: prepQA.map((x, j) => j === i ? { ...x, a: e.target.value } : x) })}
                placeholder="Write a strong, specific answer. Use the STAR method for behavioral questions…" />
            </Field>
          </div>
        ))}
      </Section>

      {/* ── Actual Interview ── */}
      <Section title="Actual Interview (Fill In After)">
        <div style={{
          fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--color-text-faint)',
          marginBottom: 'var(--space-3)',
        }}>What They Actually Asked</div>
        {actualQA.map((qa, i) => (
          <div key={i} style={{
            border: '1px solid var(--color-border)', padding: 'var(--space-3)',
            marginBottom: 'var(--space-2)', background: 'var(--color-surface)',
          }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 'var(--space-2)' }}>
              Real Question {i + 1}
            </div>
            <Field label="Question Asked">
              <Inp value={qa.q} onChange={e => onChange({ ...data, actualQA: actualQA.map((x, j) => j === i ? { ...x, q: e.target.value } : x) })}
                placeholder="Write out the question as best you remember it…" />
            </Field>
            <Field label="How I Answered" style={{ marginBottom: 0 }}>
              <Txt rows={2} value={qa.a} onChange={e => onChange({ ...data, actualQA: actualQA.map((x, j) => j === i ? { ...x, a: e.target.value } : x) })}
                placeholder="Summarize what you actually said…" />
            </Field>
          </div>
        ))}

        <Field label="Questions You Asked the Interviewer">
          <Txt rows={2} value={data.questionsAsked} onChange={e => s('questionsAsked')(e.target.value)}
            placeholder="What did you ask them? (Shows genuine interest)" />
        </Field>
      </Section>

      {/* ── Reflection ── */}
      <Section title="Reflection & Follow-Up">
        <Grid cols={2}>
          <Field label="Overall Confidence (1–10)">
            <Inp type="number" value={data.confidence} onChange={e => s('confidence')(e.target.value)} placeholder="1–10" style={{ maxWidth: 80 }} />
          </Field>
          <Field label="Estimated Duration (min)">
            <Inp type="number" value={data.duration} onChange={e => s('duration')(e.target.value)} placeholder="e.g. 30" />
          </Field>
        </Grid>
        <Field label="Strongest Moment / Answer">
          <Txt rows={2} value={data.strongest} onChange={e => s('strongest')(e.target.value)}
            placeholder="What answer or moment do you feel best about? Why?" />
        </Field>
        <Field label="What I Would Do Differently">
          <Txt rows={2} value={data.improvement} onChange={e => s('improvement')(e.target.value)}
            placeholder="Be honest — what answer fell flat? What would you say differently next time?" />
        </Field>
        <Field label="Follow-Up Actions">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
            <Check label="Thank-you email sent within 24h" value={data.thankYouSent} onChange={s('thankYouSent')} />
            <Check label="Added to application tracker" value={data.addedToTracker} onChange={s('addedToTracker')} />
            <Check label="Noted improvements for next interview" value={data.notedImprovements} onChange={s('notedImprovements')} />
          </div>
          <Txt rows={2} value={data.followUpNotes} onChange={e => s('followUpNotes')(e.target.value)}
            placeholder="Any specific follow-up items, names to remember, or next steps…" />
        </Field>
      </Section>
    </div>
  );
}
