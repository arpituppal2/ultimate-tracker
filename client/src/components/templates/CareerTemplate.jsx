/*
  CareerTemplate.jsx
  Career Report — full structured research form.
  LAMT design system, no Drive links, single-page.
*/

// ── Shared styles ─────────────────────────────────────────────────────────────────
const base = {
  width: '100%',
  padding: '0.4rem 0.65rem',
  fontSize: 'var(--text-sm)',
  border: '1px solid var(--color-border)',
  borderRadius: 0,
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color var(--transition-interactive)',
};

const focus = e => { e.target.style.borderColor = 'var(--color-primary)'; };
const blur  = e => { e.target.style.borderColor = 'var(--color-border)'; };

// ── Primitives ─────────────────────────────────────────────────────────────────
function Inp({ value, onChange, placeholder, type = 'text', style }) {
  return (
    <input
      type={type}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      style={{ ...base, ...style }}
      onFocus={focus}
      onBlur={blur}
    />
  );
}

function Txt({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{ ...base, resize: 'vertical', lineHeight: 1.65 }}
      onFocus={focus}
      onBlur={blur}
    />
  );
}

function Label({ children, required }) {
  return (
    <label style={{
      display: 'block',
      fontSize: 'var(--text-xs)', fontWeight: 700,
      letterSpacing: '0.07em', textTransform: 'uppercase',
      color: 'var(--color-text-faint)',
      marginBottom: 'var(--space-1)',
    }}>
      {children}
      {required && <span style={{ color: 'var(--color-error)', marginLeft: 2 }}>*</span>}
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

// Section divider — matches the ━━━ TITLE ━━━ look from the spec
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 'var(--space-8)' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-4)',
      }}>
        <div style={{ flex: 1, height: 1, background: 'var(--color-divider)' }} />
        <span style={{
          fontSize: 'var(--text-xs)', fontWeight: 800,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
          whiteSpace: 'nowrap',
        }}>
          {title}
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--color-divider)' }} />
      </div>
      {children}
    </div>
  );
}

// Bullet list editor — add/remove rows
function BulletList({ items, onChange, placeholder }) {
  const update = (i, val) => {
    const next = [...items];
    next[i] = val;
    onChange(next);
  };
  const add    = () => onChange([...items, '']);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <span style={{ color: 'var(--color-text-faint)', fontSize: 'var(--text-sm)', flexShrink: 0 }}>•</span>
          <input
            value={item}
            onChange={e => update(i, e.target.value)}
            placeholder={placeholder}
            style={{ ...base, flex: 1 }}
            onFocus={focus}
            onBlur={blur}
          />
          {items.length > 1 && (
            <button
              onClick={() => remove(i)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-faint)', fontSize: '1rem', lineHeight: 1,
                padding: '0 0.2rem', flexShrink: 0,
              }}
              aria-label="Remove"
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        onClick={add}
        style={{
          background: 'none',
          border: '1px dashed var(--color-border)',
          padding: '0.25rem 0.7rem',
          cursor: 'pointer',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--text-xs)', fontWeight: 600,
          marginTop: 'var(--space-1)',
        }}
      >
        + Add
      </button>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────────
export default function CareerTemplate({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });

  // bullet list helpers — default to [''] if not yet set
  const bullets = (key) => (data?.[key]?.length ? data[key] : ['']);
  const setBullets = (key) => (arr) => set(key, arr);

  return (
    <div>

      {/* ── Header ── */}
      <div style={{ marginBottom: 'var(--space-7)' }}>
        <div style={{
          fontSize: 'var(--text-xs)', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'var(--color-primary)', marginBottom: 'var(--space-1)',
        }}>
          Submission Template
        </div>
        <div style={{
          fontSize: 'var(--text-lg)', fontWeight: 800,
          fontFamily: 'var(--font-display)',
          color: 'var(--color-text)', lineHeight: 1.2,
          marginBottom: 'var(--space-1)',
        }}>
          Career Report
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          Researcher: Avni Uppal
        </div>
      </div>

      {/* ── Meta ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-6)',
        padding: 'var(--space-4)',
        background: 'var(--color-surface-offset)',
        border: '1px solid var(--color-border)',
      }}>
        <Field label="Career Title" required>
          <Inp value={data?.career_title} onChange={e => set('career_title', e.target.value)} placeholder="e.g. Pediatric Surgeon" />
        </Field>
        <Field label="Date Completed">
          <Inp type="date" value={data?.date_completed} onChange={e => set('date_completed', e.target.value)} />
        </Field>
        <Field label="Block / Week" style={{ marginBottom: 0 }}>
          <Inp value={data?.block_week} onChange={e => set('block_week', e.target.value)} placeholder="e.g. Block 3 / Week 2" />
        </Field>
      </div>

      {/* ── Executive Overview ── */}
      <Section title="Executive Overview">
        <Field label="Overview" required>
          <Txt
            value={data?.executive_overview}
            onChange={e => set('executive_overview', e.target.value)}
            placeholder="2–3 paragraphs: what this career is, why it matters today, the broad landscape of the field…"
            rows={6}
          />
        </Field>
      </Section>

      {/* ── Job Description ── */}
      <Section title="Job Description & Responsibilities">
        <Field label="Daily Tasks & Work Environment" required>
          <Txt
            value={data?.job_description}
            onChange={e => set('job_description', e.target.value)}
            placeholder="Daily tasks, work environment, remote / hybrid / field breakdown, team structure…"
            rows={5}
          />
        </Field>
      </Section>

      {/* ── Education ── */}
      <Section title="Educational Requirements">
        <Field label="Requirements" required>
          <Txt
            value={data?.education}
            onChange={e => set('education', e.target.value)}
            placeholder="Minimum credentials, typical degree path from high school, certifications, licensure…"
            rows={4}
          />
        </Field>
      </Section>

      {/* ── Skills ── */}
      <Section title="Skills & Competencies">
        <Field label="Essential Skills" required>
          <BulletList
            items={bullets('skills_essential')}
            onChange={setBullets('skills_essential')}
            placeholder="Essential skill or competency"
          />
        </Field>
        <Field label="Desirable / Nice-to-Have">
          <BulletList
            items={bullets('skills_desirable')}
            onChange={setBullets('skills_desirable')}
            placeholder="Desirable skill or trait"
          />
        </Field>
      </Section>

      {/* ── Career Progression ── */}
      <Section title="Career Progression">
        <Field label="Entry → Mid → Senior Path" required>
          <Txt
            value={data?.progression}
            onChange={e => set('progression', e.target.value)}
            placeholder="Titles, years at each level, lateral options, common transition paths…"
            rows={4}
          />
        </Field>
      </Section>

      {/* ── Compensation ── */}
      <Section title="Compensation">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
          <Field label="Entry-Level ($)" required>
            <Inp value={data?.comp_entry} onChange={e => set('comp_entry', e.target.value)} placeholder="e.g. $55,000" />
          </Field>
          <Field label="Mid-Level ($)" required>
            <Inp value={data?.comp_mid} onChange={e => set('comp_mid', e.target.value)} placeholder="e.g. $90,000" />
          </Field>
          <Field label="Senior ($)" required>
            <Inp value={data?.comp_senior} onChange={e => set('comp_senior', e.target.value)} placeholder="e.g. $145,000" />
          </Field>
        </div>
        <Field label="Compensation Source">
          <Inp value={data?.comp_source} onChange={e => set('comp_source', e.target.value)} placeholder="e.g. BLS.gov, Glassdoor, Levels.fyi" />
        </Field>
      </Section>

      {/* ── Market Analysis ── */}
      <Section title="Market Analysis">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <Field label="BLS Projected Growth %" required>
            <Inp value={data?.bls_growth} onChange={e => set('bls_growth', e.target.value)} placeholder="e.g. +8% (faster than avg)" />
          </Field>
          <Field label="Automation Risk">
            <Inp value={data?.automation_risk} onChange={e => set('automation_risk', e.target.value)} placeholder="e.g. Low / Medium / High" />
          </Field>
        </div>
        <Field label="Top Employers">
          <BulletList
            items={bullets('top_employers')}
            onChange={setBullets('top_employers')}
            placeholder="Company or employer type"
          />
        </Field>
      </Section>

      {/* ── Day-to-Day Reality ── */}
      <Section title="Day-to-Day Reality">
        <Field label="Hours & Work-Life Balance" required>
          <Txt
            value={data?.wlb}
            onChange={e => set('wlb', e.target.value)}
            placeholder="Typical hours per week, on-call expectations, WLB reputation in this field…"
            rows={3}
          />
        </Field>
        <Field label="Tools Used Daily">
          <BulletList
            items={bullets('tools')}
            onChange={setBullets('tools')}
            placeholder="Software, equipment, platform…"
          />
        </Field>
      </Section>

      {/* ── Personal Fit ── */}
      <Section title="Personal Fit">
        <Field label="Who Thrives Here" required>
          <Txt
            value={data?.who_thrives}
            onChange={e => set('who_thrives', e.target.value)}
            placeholder="Personality traits, working styles, and strengths that excel in this role…"
            rows={3}
          />
        </Field>
        <Field label="Biggest Challenges / Why People Leave">
          <Txt
            value={data?.challenges}
            onChange={e => set('challenges', e.target.value)}
            placeholder="Burnout factors, common frustrations, reasons for attrition…"
            rows={3}
          />
        </Field>
        <Field label="What I Found Most Interesting" required>
          <Txt
            value={data?.personal_interest}
            onChange={e => set('personal_interest', e.target.value)}
            placeholder="Your personal reflection — what surprised you, what appeals to you, what gives you pause…"
            rows={4}
          />
        </Field>
      </Section>

      {/* ── References ── */}
      <Section title="References">
        <BulletList
          items={bullets('references')}
          onChange={setBullets('references')}
          placeholder="Source name or URL (BLS, articles, LinkedIn, interviews…)"
        />
      </Section>

    </div>
  );
}
