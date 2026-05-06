/*
  AmcTemplate.jsx — AMC / AIME Topic Deep-Study Log
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
function Section({ num, title, badge, children }) {
  return (
    <div style={{ marginBottom: 'var(--space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', borderBottom: '2px solid var(--color-border)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        {num && <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.06em' }}>{num}.</span>}
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-faint)' }}>{title}</span>
        {badge && <span style={{ fontSize: '0.6rem', fontWeight: 700, background: 'var(--color-surface-offset)', color: 'var(--color-text-muted)', padding: '1px 6px', borderRadius: 2 }}>{badge}</span>}
      </div>
      {children}
    </div>
  );
}
function Grid({ cols = 2, children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 'var(--space-3)' }}>{children}</div>;
}
function SubHead({ children }) {
  return <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 'var(--space-2)', marginTop: 'var(--space-3)' }}>{children}</div>;
}
function Card({ children }) {
  return <div style={{ border: '1px solid var(--color-border)', padding: 'var(--space-3)', marginBottom: 'var(--space-2)', background: 'var(--color-surface)' }}>{children}</div>;
}
function ProbNum({ n }) {
  return <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 'var(--space-3)' }}>Problem {n}</div>;
}

const u = (data, key, val) => ({ ...data, [key]: val });
const updArr = (arr, i, key, val) => arr.map((x, j) => j === i ? { ...x, [key]: val } : x);

export default function AmcTemplate({ data = {}, onChange }) {
  const s = key => val => onChange(u(data, key, val));
  const sources = data.sources || { video1: {}, video2: {}, written1: {}, written2: {}, extra: {} };
  const problems = data.problems || [{}, {}, {}];
  const origProbs = data.origProbs || [{}, {}];
  const setSource = (key, field, val) => onChange({ ...data, sources: { ...sources, [key]: { ...sources[key], [field]: val } } });
  const setProb = (i, f, v) => onChange({ ...data, problems: updArr(problems, i, f, v) });
  const setOrig = (i, f, v) => onChange({ ...data, origProbs: updArr(origProbs, i, f, v) });

  return (
    <div>
      {/* META */}
      <Section title="Topic Info">
        <Grid cols={3}>
          <Field label="Topic Name" required><Inp value={data.topicName} onChange={e => s('topicName')(e.target.value)} placeholder="e.g. Modular Arithmetic" /></Field>
          <Field label="Date"><Inp type="date" value={data.date} onChange={e => s('date')(e.target.value)} /></Field>
          <Field label="Block / Week"><Inp value={data.blockWeek} onChange={e => s('blockWeek')(e.target.value)} placeholder="e.g. Block 2 / Week 5" /></Field>
        </Grid>
      </Section>

      {/* 1. CORE IDEA */}
      <Section num="1" title="Core Idea">
        <Field label="Explain the main idea of this topic (3–5 sentences in your own words)" required hint="Write as if teaching someone who has never seen this topic. Use plain language, then introduce notation.">
          <Txt rows={5} value={data.coreIdea} onChange={e => s('coreIdea')(e.target.value)} placeholder="The main idea of this topic is…" />
        </Field>
        <Field label="What kinds of AMC/AIME problems does this topic appear in?" hint="Describe the problem structure — e.g. 'counting where order matters and repetition is allowed'">
          <Txt rows={3} value={data.whereAppears} onChange={e => s('whereAppears')(e.target.value)} placeholder="This idea usually shows up in problems that ask…" />
        </Field>
        <Field label="What does a typical problem with this idea look like?">
          <Txt rows={3} value={data.typicalProblem} onChange={e => s('typicalProblem')(e.target.value)} placeholder="A typical question looks like: 'Find the remainder when… ' or 'How many integers satisfy…'" />
        </Field>
      </Section>

      {/* 2. SOURCES */}
      <Section num="2" title="Sources Used" badge="≥3 total · ≥1 video · ≥1 written · 1 extra">
        <SubHead>Video 1 — Required</SubHead>
        <Card>
          <Field label="Title" required><Inp value={sources.video1.title} onChange={e => setSource('video1','title',e.target.value)} placeholder="e.g. 3Blue1Brown — Modular Arithmetic Explained" /></Field>
          <Field label="Link"><Inp value={sources.video1.link} onChange={e => setSource('video1','link',e.target.value)} placeholder="YouTube URL…" /></Field>
          <Field label="Key insight I learned" style={{ marginBottom: 0 }}><Txt rows={2} value={sources.video1.insight} onChange={e => setSource('video1','insight',e.target.value)} placeholder="The most important thing this video taught me was…" /></Field>
        </Card>

        <SubHead>Video 2 — Optional</SubHead>
        <Card>
          <Field label="Title"><Inp value={sources.video2.title} onChange={e => setSource('video2','title',e.target.value)} placeholder="Optional second video…" /></Field>
          <Field label="Link"><Inp value={sources.video2.link} onChange={e => setSource('video2','link',e.target.value)} placeholder="URL…" /></Field>
          <Field label="Key insight I learned" style={{ marginBottom: 0 }}><Txt rows={2} value={sources.video2.insight} onChange={e => setSource('video2','insight',e.target.value)} placeholder="Key insight…" /></Field>
        </Card>

        <SubHead>Written Source 1 — Required</SubHead>
        <Card>
          <Field label="Title / Book / Article" required><Inp value={sources.written1.title} onChange={e => setSource('written1','title',e.target.value)} placeholder="e.g. AoPS Introduction to Number Theory, Ch. 4" /></Field>
          <Field label="Link or Page Range"><Inp value={sources.written1.link} onChange={e => setSource('written1','link',e.target.value)} placeholder="URL or 'AoPS Vol 1, pp. 42–48'…" /></Field>
          <Field label="Key insight I learned" style={{ marginBottom: 0 }}><Txt rows={2} value={sources.written1.insight} onChange={e => setSource('written1','insight',e.target.value)} placeholder="Key insight…" /></Field>
        </Card>

        <SubHead>Written Source 2 — Optional</SubHead>
        <Card>
          <Field label="Title"><Inp value={sources.written2.title} onChange={e => setSource('written2','title',e.target.value)} placeholder="Optional second written source…" /></Field>
          <Field label="Link or Page Range"><Inp value={sources.written2.link} onChange={e => setSource('written2','link',e.target.value)} placeholder="URL or page range…" /></Field>
          <Field label="Key insight I learned" style={{ marginBottom: 0 }}><Txt rows={2} value={sources.written2.insight} onChange={e => setSource('written2','insight',e.target.value)} placeholder="Key insight…" /></Field>
        </Card>

        <SubHead>Extra Source — Required (any type: video / article / book / AoPS discussion)</SubHead>
        <Card>
          <Grid cols={2}>
            <Field label="Type" required><Inp value={sources.extra.type} onChange={e => setSource('extra','type',e.target.value)} placeholder="e.g. AoPS forum thread" /></Field>
            <Field label="Link or Description"><Inp value={sources.extra.link} onChange={e => setSource('extra','link',e.target.value)} placeholder="URL or description…" /></Field>
          </Grid>
          <Field label="Key insight I learned" style={{ marginBottom: 0 }}><Txt rows={2} value={sources.extra.insight} onChange={e => setSource('extra','insight',e.target.value)} placeholder="Key insight…" /></Field>
        </Card>
      </Section>

      {/* 3. WORKED EXAMPLES */}
      <Section num="3" title="Worked Examples From Online">
        {problems.map((p, i) => (
          <Card key={i}>
            <ProbNum n={i + 1} />
            <Field label="Source + Problem Statement" required={i === 0}>
              <Txt rows={3} value={p.statement} onChange={e => setProb(i,'statement',e.target.value)} placeholder={`[Source: AMC 8 2019 #${15+i}] In how many ways can…`} />
            </Field>
            <Field label="My Solution Idea">
              <Txt rows={3} value={p.mySolution} onChange={e => setProb(i,'mySolution',e.target.value)} placeholder="My approach: First I noticed… then I tried… My answer was…" />
            </Field>
            <Field label="Official / Alternate Solution Idea">
              <Txt rows={3} value={p.officialSolution} onChange={e => setProb(i,'officialSolution',e.target.value)} placeholder="The official solution works by… The key step I missed was…" />
            </Field>
            <Field label="What I Learned from This Problem" style={{ marginBottom: 0 }}>
              <Txt rows={2} value={p.learned} onChange={e => setProb(i,'learned',e.target.value)} placeholder="The main takeaway for future problems is…" />
            </Field>
          </Card>
        ))}
      </Section>

      {/* 4. HANDWRITTEN NOTES */}
      <Section num="4" title="Handwritten Notes">
        <Field label="Notes Image / Scan Link" required hint="Take notes by hand while studying. Photograph or scan them. Paste the Google Drive link here.">
          <Inp value={data.notesLink} onChange={e => s('notesLink')(e.target.value)} placeholder="Google Drive link to your handwritten notes scan…" />
        </Field>
        <Field label="Summary of What Is on the Notes Page">
          <Txt rows={3} value={data.notesSummary} onChange={e => s('notesSummary')(e.target.value)} placeholder="My notes cover: the definition, 3 worked examples, the CRT diagram, key formulas…" />
        </Field>
      </Section>

      {/* 5. ORIGINAL PROBLEMS */}
      <Section num="5" title="Original Problems I Wrote">
        <SubHead>Problem A — Required</SubHead>
        <Card>
          <Field label="Problem Statement" required hint="Write your own AMC/AIME-style problem. Make it non-trivial — not just a copy of a worked example.">
            <Txt rows={3} value={origProbs[0].statement} onChange={e => setOrig(0,'statement',e.target.value)} placeholder="If n ≡ 3 (mod 7) and n ≡ 5 (mod 11), find the remainder when n² is divided by 77…" />
          </Field>
          <Field label="Solution (outline)">
            <Txt rows={3} value={origProbs[0].solution} onChange={e => setOrig(0,'solution',e.target.value)} placeholder="By CRT, n ≡ … (mod 77). Then n² ≡ …" />
          </Field>
          <Field label="Answer" style={{ marginBottom: 0 }}>
            <Inp value={origProbs[0].answer} onChange={e => setOrig(0,'answer',e.target.value)} placeholder="e.g. 24" />
          </Field>
        </Card>

        <SubHead>Problem B — Optional but Encouraged</SubHead>
        <Card>
          <Field label="Problem Statement">
            <Txt rows={3} value={origProbs[1].statement} onChange={e => setOrig(1,'statement',e.target.value)} placeholder="A harder follow-up problem…" />
          </Field>
          <Field label="Solution (outline)">
            <Txt rows={2} value={origProbs[1].solution} onChange={e => setOrig(1,'solution',e.target.value)} placeholder="Outline solution…" />
          </Field>
          <Field label="Answer" style={{ marginBottom: 0 }}>
            <Inp value={origProbs[1].answer} onChange={e => setOrig(1,'answer',e.target.value)} placeholder="Answer…" />
          </Field>
        </Card>
      </Section>

      {/* 6. REFLECTION */}
      <Section num="6" title="Reflection">
        <Field label="What confused me at first, and how did I fix it?" required>
          <Txt rows={3} value={data.confusion} onChange={e => s('confusion')(e.target.value)} placeholder="At first I didn't understand… I fixed it by… Now it makes sense because…" />
        </Field>
        <Field label="What traps should I watch out for on AMC/AIME using this topic?" hint="Think about common mistakes: misreading conditions, off-by-one errors, forgetting edge cases.">
          <Txt rows={3} value={data.traps} onChange={e => s('traps')(e.target.value)} placeholder="The main trap is… Students often forget to check… I specifically need to watch for…" />
        </Field>
        <Grid cols={2}>
          <Field label="Confidence Now (1–10)" required>
            <Inp type="number" value={data.confidence} onChange={e => s('confidence')(e.target.value)} placeholder="1–10" style={{ maxWidth: 80 }} />
          </Field>
          <Field label="What Should I Review Before the Next Mock?">
            <Inp value={data.reviewPlan} onChange={e => s('reviewPlan')(e.target.value)} placeholder="e.g. Re-do Problem 2 + re-read Written Source 1" />
          </Field>
        </Grid>
      </Section>
    </div>
  );
}
