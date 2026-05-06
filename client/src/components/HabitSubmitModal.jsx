import { useState, useEffect, useRef } from 'react';

const API = import.meta.env.VITE_API_URL;

// ─── Shared input styles ──────────────────────────────────────────────────────
const inp = {
  width: '100%',
  padding: '0.45rem 0.65rem',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
  fontSize: 'var(--text-sm)',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color var(--transition-interactive)',
};
const ta = { ...inp, resize: 'vertical', lineHeight: 1.6 };

const focus = e => { e.target.style.borderColor = 'var(--color-primary)'; };
const blur  = e => { e.target.style.borderColor = 'var(--color-border)'; };

function Field({ label, required, children }) {
  return (
    <div style={{ marginTop: 'var(--space-4)' }}>
      <label style={{
        display: 'block',
        fontSize: 'var(--text-xs)', fontWeight: 700,
        letterSpacing: '0.09em', textTransform: 'uppercase',
        color: 'var(--color-text-faint)',
        marginBottom: 'var(--space-1)',
      }}>
        {label}{required && <span style={{ color: 'var(--color-error)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Inp({ value, onChange, placeholder, type = 'text', style }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{ ...inp, ...style }}
      onFocus={focus}
      onBlur={blur}
    />
  );
}

function Sel({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{ ...inp, borderRadius: 0 }}
      onFocus={focus}
      onBlur={blur}
    >
      <option value="">Select…</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// ─── Per-habit proof forms ────────────────────────────────────────────────────

function MorningRoutineForm({ v, set }) {
  return (
    <>
      <Field label="Wake Time" required>
        <Inp type="time" value={v('wake_time')} onChange={e => set('wake_time', e.target.value)} />
      </Field>
      <Field label="Quick Note (optional)">
        <textarea
          rows={2}
          value={v('notes')}
          onChange={e => set('notes', e.target.value)}
          placeholder="e.g. Washed face, drank water before phone"
          style={ta}
          onFocus={focus}
          onBlur={blur}
        />
      </Field>
    </>
  );
}

function TwentyMinMoveForm({ v, set }) {
  const activities = ['Workout', 'Yoga', 'Swim', 'Walk / Jog', 'Bike', 'Stretch', 'Dance', 'Sports', 'Other'];
  return (
    <>
      <Field label="Activity Type" required>
        <Sel value={v('activity')} onChange={e => set('activity', e.target.value)} options={activities} />
      </Field>
      <Field label="Duration (minutes)" required>
        <Inp type="number" value={v('duration')} onChange={e => set('duration', e.target.value)} placeholder="e.g. 30" style={{ width: 120 }} />
      </Field>
      <Field label="Notes (optional)">
        <textarea
          rows={2}
          value={v('notes')}
          onChange={e => set('notes', e.target.value)}
          placeholder="e.g. Leg day at the gym, 3 sets squats"
          style={ta}
          onFocus={focus}
          onBlur={blur}
        />
      </Field>
    </>
  );
}

function ScreenCapForm({ v, set }) {
  return (
    <>
      <Field label="Total Social Media Time (minutes)" required>
        <Inp type="number" value={v('total_minutes')} onChange={e => set('total_minutes', e.target.value)} placeholder="e.g. 32" style={{ width: 120 }} />
      </Field>
      <Field label="Apps Used (optional)">
        <Inp value={v('apps')} onChange={e => set('apps', e.target.value)} placeholder="e.g. TikTok 20 min, Instagram 12 min" />
      </Field>
    </>
  );
}

function EatSomethingRealForm({ v, set }) {
  return (
    <>
      <Field label="What You Ate" required>
        <textarea
          rows={3}
          value={v('meal_desc')}
          onChange={e => set('meal_desc', e.target.value)}
          placeholder="Describe your meal(s) today"
          style={ta}
          onFocus={focus}
          onBlur={blur}
        />
      </Field>
      <Field label="Fruit / Vegetable Included" required>
        <Inp value={v('produce')} onChange={e => set('produce', e.target.value)} placeholder="e.g. Apple, broccoli, spinach salad" />
      </Field>
    </>
  );
}

function Creative15Form({ v, set }) {
  const activities = ['Drawing / Sketching', 'Painting', 'Music / Instrument', 'Writing / Poetry', 'Origami', 'Crafting', 'Dance', 'Other'];
  return (
    <>
      <Field label="Creative Activity" required>
        <Sel value={v('activity')} onChange={e => set('activity', e.target.value)} options={activities} />
      </Field>
      <Field label="Duration (minutes)">
        <Inp type="number" value={v('duration')} onChange={e => set('duration', e.target.value)} placeholder="e.g. 20" style={{ width: 120 }} />
      </Field>
      <Field label="What You Made / Did (optional)">
        <textarea
          rows={2}
          value={v('description')}
          onChange={e => set('description', e.target.value)}
          placeholder="e.g. Sketched 2 portrait studies, started music loop"
          style={ta}
          onFocus={focus}
          onBlur={blur}
        />
      </Field>
    </>
  );
}

function LightsOutPrepForm({ v, set }) {
  return (
    <>
      <Field label="Time Phone Was Put Away" required>
        <Inp type="time" value={v('lights_out_time')} onChange={e => set('lights_out_time', e.target.value)} />
      </Field>
      <Field label="Note (optional)">
        <Inp value={v('note')} onChange={e => set('note', e.target.value)} placeholder="e.g. Phone on charger in hallway" />
      </Field>
    </>
  );
}

// Simple confirm (proofRequired: false habits)
function ConfirmForm({ label }) {
  return (
    <div style={{
      marginTop: 'var(--space-4)',
      padding: 'var(--space-3) var(--space-4)',
      background: 'var(--color-surface-offset)',
      fontSize: 'var(--text-sm)',
      color: 'var(--color-text-muted)',
      lineHeight: 1.55,
    }}>
      Tap <strong style={{ color: 'var(--color-text)' }}>Submit</strong> to confirm you completed: <em>{label}</em>.
    </div>
  );
}

// ─── Validation per habit key ─────────────────────────────────────────────────
function isValid(habit, fields) {
  const v = (k) => (fields[k] ?? '').toString().trim();
  switch (habit.key) {
    case 'morning_routine':    return !!v('wake_time');
    case 'twenty_min_move':    return !!v('activity') && !!v('duration');
    case 'screen_cap':         return !!v('total_minutes');
    case 'eat_something_real': return !!v('meal_desc') && !!v('produce');
    case 'creative_15':        return !!v('activity');
    case 'lights_out_prep':    return !!v('lights_out_time');
    default:                   return true;
  }
}

// ─── Build proof note string ──────────────────────────────────────────────────
function buildProofNote(habit, fields) {
  const v = (k) => (fields[k] ?? '').toString().trim();
  switch (habit.key) {
    case 'morning_routine':
      return `Wake time: ${v('wake_time')}` + (v('notes') ? ` | Notes: ${v('notes')}` : '');
    case 'twenty_min_move':
      return `Activity: ${v('activity')} | Duration: ${v('duration')} min` + (v('notes') ? ` | ${v('notes')}` : '');
    case 'screen_cap':
      return `Total social media: ${v('total_minutes')} min` + (v('apps') ? ` | Apps: ${v('apps')}` : '');
    case 'eat_something_real':
      return `Meal: ${v('meal_desc')} | Produce: ${v('produce')}`;
    case 'creative_15':
      return `Activity: ${v('activity')}` + (v('duration') ? ` | ${v('duration')} min` : '') + (v('description') ? ` | ${v('description')}` : '');
    case 'lights_out_prep':
      return `Phone away at: ${v('lights_out_time')}` + (v('note') ? ` | ${v('note')}` : '');
    default:
      return `Confirmed: ${habit.label}`;
  }
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export default function HabitSubmitModal({ habit, date, onClose, onDone }) {
  const token   = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [fields,     setFields]     = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  // Silent timer — invisible to Avni, sent to server, visible only to admins
  const openedAt = useRef(Date.now());

  const set = (key, val) => setFields(f => ({ ...f, [key]: val }));
  const v   = (key)      => (fields[key] ?? '').toString();

  const valid = isValid(habit, fields);

  const handleSubmit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError('');
    const timeSpentSeconds = Math.round((Date.now() - openedAt.current) / 1000);
    try {
      const res = await fetch(`${API}/api/habits/daily/toggle`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          habitKey:         habit.key,
          date,
          checked:          true,
          proofNote:        buildProofNote(habit, fields),
          timeSpentSeconds,
        }),
      });
      if (!res.ok) throw new Error('Server error');
      onDone();
    } catch {
      setError('Submission failed. Try again.');
    }
    setSubmitting(false);
  };

  const handleBackdrop = e => { if (e.target === e.currentTarget) onClose(); };

  const renderForm = () => {
    const props = { v, set };
    switch (habit.key) {
      case 'morning_routine':    return <MorningRoutineForm    {...props} />;
      case 'twenty_min_move':    return <TwentyMinMoveForm     {...props} />;
      case 'screen_cap':         return <ScreenCapForm          {...props} />;
      case 'eat_something_real': return <EatSomethingRealForm  {...props} />;
      case 'creative_15':        return <Creative15Form         {...props} />;
      case 'lights_out_prep':    return <LightsOutPrepForm     {...props} />;
      default:                   return <ConfirmForm label={habit.label} />;
    }
  };

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0,
        background: 'oklch(0 0 0 / 0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 'var(--space-4)',
      }}
    >
      <div style={{
        background: 'var(--color-surface)',
        border:     '1px solid var(--color-border)',
        width: '100%', maxWidth: '480px',
        padding:    'var(--space-6)',
        boxShadow:  'var(--shadow-lg)',
        maxHeight:  '90dvh',
        overflowY:  'auto',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
          <div>
            <div style={{
              fontSize: 'var(--text-xs)', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: habit.proofRequired ? 'var(--color-primary)' : 'var(--color-text-faint)',
              marginBottom: '0.2rem',
            }}>
              {habit.proofRequired ? 'Proof Required' : 'Confirm Completion'}
            </div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text)' }}>
              {habit.emoji} {habit.label}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ color: 'var(--color-text-muted)', fontSize: '1.4rem', lineHeight: 1, padding: '0.1rem 0.3rem' }}
          >
            &times;
          </button>
        </div>

        {/* Description */}
        {habit.description && (
          <p style={{
            fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
            lineHeight: 1.6, marginBottom: 'var(--space-2)',
          }}>
            {habit.description}
          </p>
        )}

        {/* Expected proof hint */}
        {habit.proof && (
          <div style={{
            fontSize: 'var(--text-xs)', fontWeight: 600,
            color: 'var(--color-primary)',
            background: 'var(--color-primary-highlight)',
            padding: '0.3rem 0.6rem',
            marginBottom: 'var(--space-2)',
            lineHeight: 1.5,
          }}>
            Expected: {habit.proof}
          </div>
        )}

        {/* Proof form */}
        {renderForm()}

        {/* Error */}
        {error && (
          <div style={{
            color: 'var(--color-error)', fontSize: 'var(--text-xs)',
            fontWeight: 600, marginTop: 'var(--space-3)',
          }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
          <button
            onClick={handleSubmit}
            disabled={!valid || submitting}
            style={{
              flex: 1,
              padding: '0.55rem 1.2rem',
              background: valid && !submitting ? 'var(--color-primary)' : 'var(--color-surface-dynamic)',
              color:      valid && !submitting ? 'var(--color-text-inverse)' : 'var(--color-text-faint)',
              border: 'none',
              fontWeight: 700,
              fontSize: 'var(--text-sm)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: valid && !submitting ? 'pointer' : 'not-allowed',
              transition: 'background var(--transition-interactive)',
            }}
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '0.55rem 1rem',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              color:  'var(--color-text-muted)',
              fontWeight: 600,
              fontSize:   'var(--text-sm)',
              cursor: 'pointer',
              transition: 'border-color var(--transition-interactive)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-text-muted)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
