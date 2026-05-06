/*
  ReadingLogTemplate.jsx
  Reading log — tracks books, insights, and connection to college application story.
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

const u = (data, key, val) => ({ ...data, [key]: val });

export default function ReadingLogTemplate({ data = {}, onChange }) {
  const s = (key) => (val) => onChange(u(data, key, val));
  const takeaways = data.takeaways || ['', '', ''];

  return (
    <div>
      {/* ── Book Info ── */}
      <Section title="Book Details">
        <Field label="Title" required>
          <Inp value={data.title} onChange={e => s('title')(e.target.value)} placeholder="e.g. The Innovators by Walter Isaacson" />
        </Field>
        <Grid cols={3}>
          <Field label="Author">
            <Inp value={data.author} onChange={e => s('author')(e.target.value)} placeholder="e.g. Walter Isaacson" />
          </Field>
          <Field label="Genre / Type">
            <Sel value={data.genre} onChange={e => s('genre')(e.target.value)}
              options={['Non-Fiction', 'Biography', 'Autobiography', 'Science', 'History', 'Philosophy', 'Fiction / Literary', 'Self-Help', 'Business', 'Politics', 'Other']} />
          </Field>
          <Field label="Date Finished">
            <Inp type="date" value={data.dateFinished} onChange={e => s('dateFinished')(e.target.value)} />
          </Field>
        </Grid>
        <Grid cols={2}>
          <Field label="Total Pages">
            <Inp type="number" value={data.pages} onChange={e => s('pages')(e.target.value)} placeholder="e.g. 342" />
          </Field>
          <Field label="Rating (1–5 stars)">
            <Sel value={data.rating} onChange={e => s('rating')(e.target.value)}
              options={['★★★★★ (5 — Life-changing)', '★★★★☆ (4 — Excellent)', '★★★☆☆ (3 — Good)', '★★☆☆☆ (2 — OK)', '★☆☆☆☆ (1 — Didn\'t connect)']} />
          </Field>
        </Grid>
      </Section>

      {/* ── Summary ── */}
      <Section title="Summary & Understanding">
        <Field label="Summary (5–8 sentences in your own words)" required>
          <Txt rows={5} value={data.summary} onChange={e => s('summary')(e.target.value)}
            placeholder="Summarize the main argument, story, or ideas of the book. Write as if explaining to someone who hasn't read it…" />
        </Field>
        <Field label="Central Theme or Big Idea">
          <Inp value={data.theme} onChange={e => s('theme')(e.target.value)}
            placeholder="e.g. Collaboration between human creativity and machines drives technological progress" />
        </Field>
        <Field label="Most Impactful Passage or Quote"
          hint="Write out the quote or passage, and briefly explain why it stood out to you.">
          <Txt rows={3} value={data.passage} onChange={e => s('passage')(e.target.value)}
            placeholder="'The best way to predict the future is to invent it.' — This hit me because…" />
        </Field>
      </Section>

      {/* ── Key Takeaways ── */}
      <Section title="3 Key Takeaways">
        {takeaways.map((t, i) => (
          <Field key={i} label={`Takeaway ${i + 1}`}>
            <Inp value={t} onChange={e => onChange({ ...data, takeaways: takeaways.map((x, j) => j === i ? e.target.value : x) })}
              placeholder={`One specific insight, fact, or lesson from this book…`} />
          </Field>
        ))}
      </Section>

      {/* ── College Connection ── */}
      <Section title="College Application Connection">
        <Field label="How does this book connect to your academic interests or goals?"
          hint="Think about how this book relates to what you want to study, research, or pursue in college.">
          <Txt rows={3} value={data.collegeConnect} onChange={e => s('collegeConnect')(e.target.value)}
            placeholder="e.g. Reading about Turing's work made me realize I want to study theoretical CS. This book could support an essay about my interest in AI ethics…" />
        </Field>
        <Field label="Would you reference this book in a college essay?">
          <Sel value={data.essayReference} onChange={e => s('essayReference')(e.target.value)}
            options={['Yes — it directly supports a theme I want to write about', 'Maybe — depends on the prompt', 'No — but it shaped my thinking', 'No — doesn\'t relate to my application story']} />
        </Field>
        <Field label="Essay or Application Connection (if yes — explain how you'd use it)">
          <Txt rows={2} value={data.essayNotes} onChange={e => s('essayNotes')(e.target.value)}
            placeholder="Which essay prompt could this support? How would you weave it in naturally?…" />
        </Field>
        <Field label="Who Would You Recommend This To?">
          <Inp value={data.recommend} onChange={e => s('recommend')(e.target.value)}
            placeholder="e.g. Anyone interested in the history of technology, or students writing about innovation" />
        </Field>
      </Section>
    </div>
  );
}
