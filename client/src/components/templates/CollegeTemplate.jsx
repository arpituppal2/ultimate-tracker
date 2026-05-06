/*
  CollegeTemplate.jsx
  College Research Framework: Quantitative and Qualitative Analysis
  LAMT design system. No external Drive links.
*/

// ── Shared primitives (same pattern as CareerTemplate) ─────────────────────────
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

function Inp({ value, onChange, placeholder, type = 'text', style }) {
  return (
    <input
      type={type} value={value || ''} onChange={onChange}
      placeholder={placeholder}
      style={{ ...base, ...style }}
      onFocus={focus} onBlur={blur}
    />
  );
}
function Txt({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value || ''} onChange={onChange}
      placeholder={placeholder} rows={rows}
      style={{ ...base, resize: 'vertical', lineHeight: 1.65 }}
      onFocus={focus} onBlur={blur}
    />
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
          borderLeft: '2px solid var(--color-border)',
          paddingLeft: 'var(--space-2)',
        }}>
          {hint}
        </div>
      )}
      {children}
    </div>
  );
}
function Section({ number, title, subtitle, children }) {
  return (
    <div style={{ marginBottom: 'var(--space-8)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
        marginBottom: 'var(--space-4)',
      }}>
        <div style={{ flex: 1, height: 1, background: 'var(--color-divider)' }} />
        <span style={{
          fontSize: 'var(--text-xs)', fontWeight: 800,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--color-text-muted)', whiteSpace: 'nowrap',
        }}>
          {number && <span style={{ color: 'var(--color-primary)', marginRight: 4 }}>Part {number}</span>}
          {title}
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--color-divider)' }} />
      </div>
      {subtitle && (
        <p style={{
          fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
          lineHeight: 1.6, marginBottom: 'var(--space-4)',
        }}>
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}
function BulletList({ items, onChange, placeholder }) {
  const update = (i, val) => { const n = [...items]; n[i] = val; onChange(n); };
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

// Analysis block: text + source on one card
function AnalysisBlock({ textKey, sourceKey, textPlaceholder, sourcePlaceholder, rows = 4, data, set }) {
  return (
    <div style={{
      border: '1px solid var(--color-border)',
      background: 'var(--color-surface-offset)',
      padding: 'var(--space-4)',
      marginBottom: 'var(--space-2)',
    }}>
      <Field label="Analysis">
        <Txt value={data?.[textKey]} onChange={e => set(textKey, e.target.value)}
          placeholder={textPlaceholder} rows={rows} />
      </Field>
      <Field label="Source" style={{ marginBottom: 0 }}>
        <Inp value={data?.[sourceKey]} onChange={e => set(sourceKey, e.target.value)}
          placeholder={sourcePlaceholder || 'URL or document name'} />
      </Field>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────────
export default function CollegeTemplate({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });
  const bullets = (key) => (data?.[key]?.length ? data[key] : ['']);
  const setBullets = (key) => (arr) => set(key, arr);

  return (
    <div>

      {/* Header */}
      <div style={{ marginBottom: 'var(--space-7)' }}>
        <div style={{
          fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 'var(--space-1)',
        }}>
          Research Template
        </div>
        <div style={{
          fontSize: 'var(--text-lg)', fontWeight: 800, fontFamily: 'var(--font-display)',
          color: 'var(--color-text)', lineHeight: 1.2, marginBottom: 'var(--space-1)',
        }}>
          College Research Framework
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          Quantitative and Qualitative Analysis
        </div>
      </div>

      {/* Meta */}
      <div style={{
        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--space-3)',
        marginBottom: 'var(--space-6)', padding: 'var(--space-4)',
        background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)',
      }}>
        <Field label="College / University" required style={{ marginBottom: 0 }}>
          <Inp value={data?.college_name} onChange={e => set('college_name', e.target.value)} placeholder="e.g. University of Michigan" />
        </Field>
        <Field label="Date Completed" style={{ marginBottom: 0 }}>
          <Inp type="date" value={data?.date_completed} onChange={e => set('date_completed', e.target.value)} />
        </Field>
        <Field label="Block / Week" style={{ marginBottom: 0 }}>
          <Inp value={data?.block_week} onChange={e => set('block_week', e.target.value)} placeholder="e.g. Block 2 / Week 3" />
        </Field>
      </div>

      {/* ────── PART 1: INSTITUTIONAL SPECIFICATIONS ────── */}
      <Section
        number="1"
        title="Institutional Specifications"
        subtitle={'Complete using the Common Data Set (CDS) for the current academic year. Search "[University Name] Common Data Set."'}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <Field label="Location (City, State)" required>
            <Inp value={data?.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Ann Arbor, Michigan" />
          </Field>
          <Field label="Institutional Control">
            <select value={data?.control || ''} onChange={e => set('control', e.target.value)}
              style={{ ...base }} onFocus={focus} onBlur={blur}>
              <option value="">Select…</option>
              <option>Public</option><option>Private Non-Profit</option><option>Private For-Profit</option>
            </select>
          </Field>
          <Field label="Total Undergrad Population (CDS B1)" required>
            <Inp value={data?.undergrad_pop} onChange={e => set('undergrad_pop', e.target.value)} placeholder="e.g. 31,329" />
          </Field>
          <Field label="Campus Size (Acres)">
            <Inp value={data?.campus_acres} onChange={e => set('campus_acres', e.target.value)} placeholder="e.g. 3,177 acres" />
          </Field>
          <Field label="Student-Faculty Ratio (CDS I-2)" required>
            <Inp value={data?.sfr} onChange={e => set('sfr', e.target.value)} placeholder="e.g. 15:1" />
          </Field>
          <Field label="Acceptance Rate (CDS C1)" required>
            <Inp value={data?.acceptance_rate} onChange={e => set('acceptance_rate', e.target.value)} placeholder="e.g. 17.7%" />
          </Field>
        </div>
        <Field
          label="Class Size Distribution (CDS I-3)"
          hint="Report % of classes under 20 students vs. over 50 students."
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Inp value={data?.class_under20} onChange={e => set('class_under20', e.target.value)} placeholder="Under 20 students: e.g. 42%" />
            <Inp value={data?.class_over50} onChange={e => set('class_over50', e.target.value)} placeholder="Over 50 students: e.g. 23%" />
          </div>
        </Field>
        <Field label="Admissions Selectivity (CDS C9 — Avg SAT/ACT)" required>
          <Inp value={data?.sat_act} onChange={e => set('sat_act', e.target.value)} placeholder="e.g. SAT 1420–1540 / ACT 32–35" />
        </Field>
        <Field label="Financial Commitment (CDS G — Tuition & Room/Board)" required>
          <Inp value={data?.cost} onChange={e => set('cost', e.target.value)} placeholder="e.g. Tuition: $16,736 (in-state) | R&B: $12,526 | App Fee: $75" />
        </Field>
      </Section>

      {/* ────── PART 2: PROFESSIONAL VIABILITY ────── */}
      <Section
        number="2"
        title="Professional Viability & Prestige Metrics"
        subtitle={'Measures ROI and the "signaling power" of the degree.'}
      >

        {/* 2.1 Endowment */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{
            fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-3)',
          }}>
            2.1 — Capital Resources: Endowment Per Student
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <Field label="Total Endowment ($)" required>
              <Inp value={data?.endowment_total} onChange={e => set('endowment_total', e.target.value)} placeholder="e.g. $17.9 billion" />
            </Field>
            <Field label="Endowment Per Student ($)" required>
              <Inp value={data?.endowment_per_student} onChange={e => set('endowment_per_student', e.target.value)} placeholder="e.g. $236,000" />
            </Field>
          </div>
          <AnalysisBlock
            textKey="endowment_analysis" sourceKey="endowment_source"
            textPlaceholder="1–2 sentences: is this capital sufficient to insulate students from budget cuts and provide elite facilities?"
            sourcePlaceholder="Annual Financial Report or NACUBO rankings URL"
            rows={3} data={data} set={set}
          />
        </div>

        {/* 2.2 Feeder Pipeline */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{
            fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-3)',
          }}>
            2.2 — Workforce Integration: The &ldquo;Feeder&rdquo; Pipeline
          </div>
          <Field
            label="Top 5 Elite Employers (LinkedIn Alumni Insights)" required
            hint="Navigate to the university LinkedIn page → Alumni → Where they work. Search Big 3 consulting, bulge bracket banks, FAANG."
          >
            <BulletList items={bullets('feeder_employers')} onChange={setBullets('feeder_employers')}
              placeholder="Employer name and role type" />
          </Field>
          <AnalysisBlock
            textKey="feeder_analysis" sourceKey="feeder_source"
            textPlaceholder="3 sentences: does the school act as a primary recruitment hub or do graduates apply through cold channels?"
            sourcePlaceholder="LinkedIn Alumni Insights / College Transitions"
            rows={4} data={data} set={set}
          />
        </div>

        {/* 2.3 Unemployment */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{
            fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-3)',
          }}>
            2.3 — Economic Risk: Unemployment & Underemployment
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <Field label="Unemployment Rate (1 yr post-grad)" required hint="Source: College Scorecard">
              <Inp value={data?.unemployment_rate} onChange={e => set('unemployment_rate', e.target.value)} placeholder="e.g. 5.2%" />
            </Field>
            <Field label="Underemployment Rate" required hint="Graduates working jobs that don't require a degree">
              <Inp value={data?.underemployment_rate} onChange={e => set('underemployment_rate', e.target.value)} placeholder="e.g. 34%" />
            </Field>
          </div>
          <AnalysisBlock
            textKey="unemployment_analysis" sourceKey="unemployment_source"
            textPlaceholder="2–3 sentences: evaluate the risk of career stagnation associated with this institution."
            sourcePlaceholder="College Scorecard URL"
            rows={4} data={data} set={set}
          />
        </div>
      </Section>

      {/* ────── PART 3: QUALITATIVE CRITIQUE ────── */}
      <Section
        number="3"
        title="Qualitative Institutional Critique"
        subtitle="Synthesize student feedback from Unigo, Niche, and Reddit (r/ApplyingToCollege)."
      >

        {/* 3.4 Primary Strength */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{
            fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-3)',
          }}>
            3.4 — Primary Institutional Strength
          </div>
          <AnalysisBlock
            textKey="strength_analysis" sourceKey="strength_source"
            textPlaceholder="3–4 sentences: identify the department or network benefit with the highest global prestige. What does a student gain by having this name on their resume — a technical skill or a high-value social network?"
            sourcePlaceholder="Unigo / Niche / Reddit thread URL"
            rows={5} data={data} set={set}
          />
        </div>

        {/* 3.5 Red Flags */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{
            fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-3)',
          }}>
            3.5 — Critical Deficiencies (Red Flags)
          </div>
          <AnalysisBlock
            textKey="redflags_analysis" sourceKey="redflags_source"
            textPlaceholder="2–3 sentences: recurring complaints about administration, safety, or prestige decay. What hinders a Top 20 career trajectory — lack of resources, geographic isolation, weak alumni engagement?"
            sourcePlaceholder="Unigo / Niche / Reddit thread URL"
            rows={4} data={data} set={set}
          />
        </div>
      </Section>

      {/* ────── PART 4: FINAL SYNTHESIS ────── */}
      <Section number="4" title="Final Synthesis">
        <Field
          label="Final Summary" required
          hint={'5–6 sentences: Golden Ticket (guaranteed elite placement) vs. Death Sentence (high risk of underemployment). Evaluate the degree\'s weight in a room of high-net-worth individuals or executive recruiters.'}
        >
          <Txt value={data?.final_summary} onChange={e => set('final_summary', e.target.value)}
            placeholder="Synthesize all data points above…" rows={7} />
        </Field>
        <Field
          label="Overall Prestige Rating (1.0 – 10.0)" required
          hint={'10.0 = Global Hegemony — 1.0 = Total Professional Irrelevance. Based on signaling power of the brand.'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Inp
              type="number"
              value={data?.prestige_rating}
              onChange={e => {
                const val = Math.min(10, Math.max(1, parseFloat(e.target.value) || ''));
                set('prestige_rating', val);
              }}
              placeholder="e.g. 7.5"
              style={{ width: 120 }}
            />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              {data?.prestige_rating
                ? data.prestige_rating >= 9 ? 'Global Hegemony'
                  : data.prestige_rating >= 7 ? 'Elite'
                  : data.prestige_rating >= 5 ? 'Solid'
                  : data.prestige_rating >= 3 ? 'Questionable'
                  : 'Avoid'
                : ''}
            </span>
          </div>
        </Field>
      </Section>

      {/* ────── PART 5: PERSONAL ALIGNMENT ────── */}
      <Section
        number="5"
        title="Personal Alignment & Subjective Fit"
        subtitle="Move from objective data to personal preference. Analysis must be honest and based on your own academic goals."
      >
        <Field
          label="3 Things I Like (Primary Incentives)" required
          hint="Do not list prestige or rankings. Focus on specific curriculum tracks, extracurriculars, or facilities you'd actually use."
        >
          <BulletList items={bullets('likes')} onChange={setBullets('likes')}
            placeholder="Specific feature or benefit…" />
        </Field>
        <Field
          label="3 Things I Dislike (Significant Deterrents)" required
          hint="Focus on variables that would decrease your productivity or mental health: weather, lack of clubs, cutthroat culture, rigid curriculum."
        >
          <BulletList items={bullets('dislikes')} onChange={setBullets('dislikes')}
            placeholder="Specific negative or risk…" />
        </Field>
        <Field
          label="Comparative Alternatives" required
          hint="Name 2 institutions with a similar Prestige Rating but different vibes or requirements. Why are they a better or worse fit? Compare Economic Risk profiles briefly."
        >
          <Txt value={data?.alternatives} onChange={e => set('alternatives', e.target.value)}
            placeholder="2–3 sentences comparing alternatives…" rows={4} />
        </Field>
        <Field label="Alternatives Source / Cross-Reference">
          <Inp value={data?.alternatives_source} onChange={e => set('alternatives_source', e.target.value)}
            placeholder="Cross-reference Part 1 data or URL" />
        </Field>
      </Section>

      {/* ────── PART 6: EXTERNAL VALIDATION ────── */}
      <Section
        number="6"
        title="External Validation"
        subtitle="Every data point and opinion must be traceable. List all URLs and documents used."
      >
        <Field label="Official Institutional Source" required>
          <Inp value={data?.source_official} onChange={e => set('source_official', e.target.value)}
            placeholder="University or College Board page URL" />
        </Field>
        <Field label="Independent Data Source" required>
          <Inp value={data?.source_data} onChange={e => set('source_data', e.target.value)}
            placeholder="College Scorecard / LinkedIn / CDS URL" />
        </Field>
        <Field label="Student / Peer Perspective" required>
          <Inp value={data?.source_student} onChange={e => set('source_student', e.target.value)}
            placeholder="Niche / Unigo / Reddit thread URL" />
        </Field>
        <Field label="Prestige Validation" required>
          <Inp value={data?.source_prestige} onChange={e => set('source_prestige', e.target.value)}
            placeholder="Forbes / QS / Times Higher Ed rankings URL" />
        </Field>
        <Field label="Additional Sources">
          <BulletList items={bullets('sources_extra')} onChange={setBullets('sources_extra')}
            placeholder="Any additional URL or document" />
        </Field>
      </Section>

      {/* ────── PART 7: COLLEGE SEARCH SPREADSHEET ────── */}
      <Section number="7" title="College Search Spreadsheet Screenshot">
        <div style={{
          padding: 'var(--space-4)',
          background: 'var(--color-surface-offset)',
          border: '1px solid var(--color-border)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          lineHeight: 1.7,
          marginBottom: 'var(--space-4)',
        }}>
          Upload a screenshot of your College Search Spreadsheet with this college filled in.
          The image should show the row for <strong style={{ color: 'var(--color-text)' }}>{data?.college_name || 'this college'}</strong> with all data columns visible.
        </div>
        <Field label="Screenshot Notes / Confirmation">
          <Txt value={data?.spreadsheet_notes} onChange={e => set('spreadsheet_notes', e.target.value)}
            placeholder="e.g. Spreadsheet updated on 4/30/2026 — all columns filled through Part 1…"
            rows={2} />
        </Field>
      </Section>

    </div>
  );
}
