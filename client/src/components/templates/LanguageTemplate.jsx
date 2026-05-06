/*
  LanguageTemplate.jsx
  Two modes:
    - duolingo: daily streak task with proof + "what did you learn"
    - michel_thomas: audio-based session log (3x/week), track selector, vocab + grammar
  LAMT design system.
*/

const ARCHIVE_BASE = 'https://archive.org/details/russian-3-1';

const MT_TRACKS = {
  Spanish: [
    '1-1','1-2','1-3','1-4','1-5','1-6','1-7','1-8','1-9',
    '2-1','2-2','2-3','2-4','2-5','2-6','2-7',
    '3-1','3-2',
  ],
  Chinese: [
    '1-1','1-2','1-3','1-4','1-5','1-6','1-7','1-8','1-9','1-10',
    '2-1','2-2','2-3','2-4','2-5','2-6',
    '3-1',
  ],
};

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
function Field({ label, required, children, style }) {
  return (
    <div style={{ marginBottom: 'var(--space-4)', ...style }}>
      {label && <Label required={required}>{label}</Label>}
      {children}
    </div>
  );
}
function Section({ number, title, children }) {
  return (
    <div style={{ marginBottom: 'var(--space-8)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--color-divider)' }} />
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          {number && <span style={{ color: 'var(--color-primary)', marginRight: 5 }}>{number}.</span>}
          {title}
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--color-divider)' }} />
      </div>
      {children}
    </div>
  );
}

function DuolingoForm({ data, set }) {
  return (
    <div>
      {/* 1. Streak */}
      <Section number="1" title="Today's Session">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <Field label="Lesson / skill completed" required style={{ marginBottom: 0 }}>
            <Inp value={data?.duo_lesson} onChange={e => set('duo_lesson', e.target.value)}
              placeholder="e.g. 'Verbs: Present 2', 'Travel — Level 3'" />
          </Field>
          <Field label="XP earned" style={{ marginBottom: 0 }}>
            <Inp type="number" value={data?.duo_xp} onChange={e => set('duo_xp', e.target.value)}
              placeholder="e.g. 50" />
          </Field>
        </div>
      </Section>

      {/* 2. What Did You Learn */}
      <Section number="2" title="What Did You Learn?">
        <Field label="What new words, phrases, or grammar did today's lesson cover?" required>
          <Txt value={data?.duo_learned} onChange={e => set('duo_learned', e.target.value)}
            placeholder="List anything new you encountered — vocab, grammar rules, sentence patterns…" rows={4} />
        </Field>
        <Field label="Write 3 sentences of your own using something from today's lesson" required>
          <Txt value={data?.duo_sentences} onChange={e => set('duo_sentences', e.target.value)}
            placeholder="1. [target language] — [English]\n2. …\n3. …" rows={4} />
        </Field>
      </Section>

      {/* 3. Proof */}
      <Section number="3" title="Proof">
        <Field label="Screenshot of today's completed lesson (Drive link)" required>
          <Inp value={data?.duo_proof} onChange={e => set('duo_proof', e.target.value)}
            placeholder="https://drive.google.com/…" />
        </Field>
      </Section>
    </div>
  );
}

function MichelThomasForm({ data, set }) {
  const language = data?.mt_language || 'Spanish';
  const tracks = MT_TRACKS[language] || [];

  return (
    <div>
      {/* Archive link banner */}
      <div style={{
        marginBottom: 'var(--space-6)',
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--color-surface-offset)',
        border: '1px solid var(--color-border)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
      }}>
        <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-faint)' }}>Michel Thomas Archive</span>
        <a href={ARCHIVE_BASE} target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--color-primary)', fontWeight: 700, wordBreak: 'break-all' }}>
          {ARCHIVE_BASE}
        </a>
      </div>

      {/* Track selector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)' }}>
        <Field label="Language" required style={{ marginBottom: 0 }}>
          <select value={language} onChange={e => set('mt_language', e.target.value)} style={base} onFocus={focus} onBlur={blur}>
            {Object.keys(MT_TRACKS).map(l => <option key={l}>{l}</option>)}
          </select>
        </Field>
        <Field label="Track" required style={{ marginBottom: 0 }}>
          <select value={data?.mt_track || ''} onChange={e => set('mt_track', e.target.value)} style={base} onFocus={focus} onBlur={blur}>
            <option value="">Select track…</option>
            {tracks.map(t => (
              <option key={t} value={t}>{language} {t}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* What did you learn */}
      <Section number="1" title="What Did You Learn?">
        <Field label="What did this track cover? Summarize in your own words." required>
          <Txt value={data?.mt_summary} onChange={e => set('mt_summary', e.target.value)}
            placeholder="Grammar rules, vocabulary, constructions, patterns — what was the core content of this track?" rows={4} />
        </Field>
      </Section>

      {/* Vocab */}
      <Section number="2" title="New Vocabulary">
        {[1,2,3,4,5,6,7,8].map(n => (
          <div key={n} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <Field label={n === 1 ? 'Word / phrase' : undefined} style={{ marginBottom: 0 }}>
              <Inp value={data?.[`mt_vocab_${n}_word`]} onChange={e => set(`mt_vocab_${n}_word`, e.target.value)}
                placeholder={`Word ${n}`} />
            </Field>
            <Field label={n === 1 ? 'English meaning' : undefined} style={{ marginBottom: 0 }}>
              <Inp value={data?.[`mt_vocab_${n}_meaning`]} onChange={e => set(`mt_vocab_${n}_meaning`, e.target.value)}
                placeholder={`Meaning ${n}`} />
            </Field>
          </div>
        ))}
      </Section>

      {/* Grammar */}
      <Section number="3" title="Grammar Focus">
        <Field label="What grammar rule or structure was the focus of this track?" required>
          <Txt value={data?.mt_grammar} onChange={e => set('mt_grammar', e.target.value)}
            placeholder="Describe in plain English…" rows={3} />
        </Field>
        <Field label="3 example sentences using this rule" required>
          <Txt value={data?.mt_examples} onChange={e => set('mt_examples', e.target.value)}
            placeholder="1. [target language] — [English]\n2. …\n3. …" rows={4} />
        </Field>
      </Section>

      {/* Original sentences */}
      <Section number="4" title="Your Original Sentences">
        <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.65, marginBottom: 'var(--space-4)' }}>
          Write 5 sentences of your own using vocabulary and grammar from this track.
        </div>
        {[1,2,3,4,5].map(n => (
          <Field key={n} label={n === 1 ? 'Sentence (target language) → English' : undefined} style={{ marginBottom: 'var(--space-2)' }}>
            <Inp value={data?.[`mt_sent_${n}`]} onChange={e => set(`mt_sent_${n}`, e.target.value)}
              placeholder={`Sentence ${n}`} />
          </Field>
        ))}
      </Section>
    </div>
  );
}

export default function LanguageTemplate({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });
  const mode = data?.language_mode || 'duolingo';

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 'var(--space-1)' }}>Language Learning</div>
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-text)', lineHeight: 1.2, marginBottom: 'var(--space-4)' }}>
          {mode === 'duolingo' ? 'Duolingo — Daily Session' : 'Michel Thomas — Audio Track'}
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'inline-flex', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          {['duolingo', 'michel_thomas'].map(m => (
            <button key={m} onClick={() => set('language_mode', m)}
              style={{
                padding: '0.35rem 0.85rem',
                fontSize: 'var(--text-xs)', fontWeight: 700,
                letterSpacing: '0.07em', textTransform: 'uppercase',
                background: mode === m ? 'var(--color-primary)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--color-text-muted)',
                border: 'none', cursor: 'pointer',
                borderRight: m === 'duolingo' ? '1px solid var(--color-border)' : 'none',
                transition: 'background var(--transition-interactive), color var(--transition-interactive)',
              }}
            >
              {m === 'duolingo' ? 'Duolingo' : 'Michel Thomas'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'duolingo'
        ? <DuolingoForm data={data} set={set} />
        : <MichelThomasForm data={data} set={set} />
      }
    </div>
  );
}
