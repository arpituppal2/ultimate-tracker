/*
  KhanTemplate.jsx
  Khan Academy topic completion — proof of completion.
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
    <div style={{ marginBottom: 'var(--space-7)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)',
      }}>
        <div style={{ flex: 1, height: 1, background: 'var(--color-divider)' }} />
        <span style={{
          fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: 'var(--color-text-muted)', whiteSpace: 'nowrap',
        }}>
          {title}
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--color-divider)' }} />
      </div>
      {children}
    </div>
  );
}
function BulletList({ items, onChange, placeholder }) {
  const update = (i, v) => { const n = [...items]; n[i] = v; onChange(n); };
  const add    = () => onChange([...items, '']);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <span style={{ color: 'var(--color-text-faint)', fontSize: 'var(--text-sm)', flexShrink: 0 }}>•</span>
          <input value={item} onChange={e => update(i, e.target.value)} placeholder={placeholder}
            style={{ ...base, flex: 1 }} onFocus={focus} onBlur={blur} />
          {items.length > 1 && (
            <button onClick={() => remove(i)} aria-label="Remove"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-faint)', fontSize: '1rem', lineHeight: 1, padding: '0 0.2rem', flexShrink: 0 }}>
              ×
            </button>
          )}
        </div>
      ))}
      <button onClick={add}
        style={{ background: 'none', border: '1px dashed var(--color-border)', padding: '0.25rem 0.7rem',
          cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', fontWeight: 600, marginTop: 'var(--space-1)' }}>
        + Add
      </button>
    </div>
  );
}
// Checkbox-style toggle
function Check({ value, onChange, label }) {
  return (
    <button onClick={() => onChange(!value)}
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        fontSize: 'var(--text-sm)', color: value ? 'var(--color-success)' : 'var(--color-text-muted)',
        fontWeight: value ? 700 : 400,
      }}>
      <span style={{
        width: 16, height: 16, border: '1.5px solid',
        borderColor: value ? 'var(--color-success)' : 'var(--color-border)',
        background: value ? 'var(--color-success)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: '0.65rem', color: '#fff',
      }}>
        {value ? '✓' : ''}
      </span>
      {label}
    </button>
  );
}

// Photo upload field — stores as base64 data URL in state
function PhotoUpload({ value, onChange, label, required }) {
  const handleFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFile}
        style={{ display: 'none' }} id="notes-photo-upload" />
      <label htmlFor="notes-photo-upload" style={{
        display: 'inline-block', padding: '0.35rem 0.8rem',
        border: '1px dashed var(--color-border)', cursor: 'pointer',
        fontSize: 'var(--text-xs)', fontWeight: 600,
        color: 'var(--color-text-muted)', background: 'none',
        transition: 'border-color var(--transition-interactive)',
      }}>
        {value ? 'Replace photo' : 'Upload photo'}
      </label>
      {value && (
        <div style={{ marginTop: 'var(--space-3)' }}>
          <img src={value} alt="Handwritten notes" style={{
            maxWidth: '100%', maxHeight: 320, border: '1px solid var(--color-border)',
            display: 'block',
          }} />
        </div>
      )}
    </div>
  );
}

export default function KhanTemplate({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });
  const bullets = key => (data?.[key]?.length ? data[key] : ['']);
  const setBullets = key => arr => set(key, arr);

  return (
    <div>

      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{
          fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 'var(--space-1)',
        }}>
          Completion Record
        </div>
        <div style={{
          fontSize: 'var(--text-lg)', fontWeight: 800, fontFamily: 'var(--font-display)',
          color: 'var(--color-text)', lineHeight: 1.2,
        }}>
          Khan Academy Topic
        </div>
      </div>

      {/* Meta */}
      <div style={{
        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 'var(--space-3)',
        padding: 'var(--space-4)', background: 'var(--color-surface-offset)',
        border: '1px solid var(--color-border)', marginBottom: 'var(--space-6)',
      }}>
        <Field label="Topic / Unit Name" required style={{ marginBottom: 0 }}>
          <Inp value={data?.topic_name} onChange={e => set('topic_name', e.target.value)}
            placeholder="e.g. Quadratic Equations" />
        </Field>
        <Field label="Subject" style={{ marginBottom: 0 }}>
          <select value={data?.subject || ''} onChange={e => set('subject', e.target.value)}
            style={{ ...base }} onFocus={focus} onBlur={blur}>
            <option value="">Select…</option>
            <option>Math</option><option>Science</option><option>English</option><option>Other</option>
          </select>
        </Field>
        <Field label="Date Completed" style={{ marginBottom: 0 }}>
          <Inp type="date" value={data?.date_completed} onChange={e => set('date_completed', e.target.value)} />
        </Field>
        <Field label="Block / Week" style={{ marginBottom: 0 }}>
          <Inp value={data?.block_week} onChange={e => set('block_week', e.target.value)}
            placeholder="e.g. B2 / W3" />
        </Field>
      </div>

      {/* 1. Video */}
      <Section title="Video">
        <Field label="Main video title" required>
          <Inp value={data?.video_title} onChange={e => set('video_title', e.target.value)}
            placeholder="Exact Khan Academy video title" />
        </Field>
        <Field label="Video link" required>
          <Inp value={data?.video_link} onChange={e => set('video_link', e.target.value)}
            placeholder="khanacademy.org/… URL" />
        </Field>
        <Check value={data?.video_confirmed} onChange={v => set('video_confirmed', v)}
          label="I confirm this video was fully watched" />
      </Section>

      {/* 2. Practice & Quiz */}
      <Section title="Practice & Quiz — 100% Screenshots">
        <div style={{
          fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.65,
          marginBottom: 'var(--space-4)',
          borderLeft: '2px solid var(--color-border)', paddingLeft: 'var(--space-2)',
        }}>
          Paste screenshot links showing 100% on every associated practice set and quiz. Add more rows as needed.
        </div>
        <BulletList
          items={bullets('proof_screenshots')}
          onChange={setBullets('proof_screenshots')}
          placeholder="Screenshot link or image URL (label which task this covers)…"
        />
        <div style={{ marginTop: 'var(--space-3)' }}>
          <Check value={data?.practice_confirmed} onChange={v => set('practice_confirmed', v)}
            label="All practice tasks and quizzes show 100%" />
        </div>
      </Section>

      {/* 3. Handwritten Notes */}
      <Section title="Handwritten Notes">
        <div style={{
          fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.65,
          marginBottom: 'var(--space-4)',
          borderLeft: '2px solid var(--color-border)', paddingLeft: 'var(--space-2)',
        }}>
          Take handwritten notes on paper while watching. Photograph or scan and upload below.
        </div>
        <Field label="Notes photo / scan" required>
          <PhotoUpload
            value={data?.notes_photo}
            onChange={v => set('notes_photo', v)}
          />
        </Field>
        <Field label="Brief description of what's on the page">
          <Txt value={data?.notes_desc} onChange={e => set('notes_desc', e.target.value)}
            placeholder="Key formulas, diagrams, or steps you wrote down…" rows={2} />
        </Field>
        <Check value={data?.notes_confirmed} onChange={v => set('notes_confirmed', v)}
          label="Handwritten notes photo is attached" />
      </Section>

      {/* 4. Summary */}
      <Section title="Summary in Your Own Words">
        <Field label="What I learned (1–2 sentences)" required
          hint="Must be in your own words — not copied from Khan or any other source.">
          <Txt value={data?.summary} onChange={e => set('summary', e.target.value)}
            placeholder="In my own words, what this topic is about and why it matters…" rows={3} />
        </Field>
      </Section>

      {/* Completion checklist */}
      <div style={{
        padding: 'var(--space-4)', border: '1px solid var(--color-border)',
        background: 'var(--color-surface-offset)',
      }}>
        <div style={{
          fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)',
        }}>
          Completion Checklist
        </div>
        {[
          ['video_confirmed',    'Main video fully watched'],
          ['practice_confirmed', 'All practice/quiz tasks at 100% (screenshots attached)'],
          ['notes_confirmed',    'Handwritten notes photo attached'],
          ['summary_confirmed',  'Summary written in my own words'],
        ].map(([key, label]) => (
          <div key={key} style={{ marginBottom: 'var(--space-2)' }}>
            <Check value={data?.[key]} onChange={v => set(key, v)} label={label} />
          </div>
        ))}
      </div>

    </div>
  );
}
