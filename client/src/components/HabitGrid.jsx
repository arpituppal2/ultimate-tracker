import { useEffect, useState } from 'react';
import { DAILY_HABITS, DAILY_HABIT_GROUPS } from '../utils/habits';
import HabitSubmitModal from './HabitSubmitModal';

const API = import.meta.env.VITE_API_URL;

export default function HabitGrid({ date }) {
  const token   = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const today   = date || new Date().toISOString().slice(0, 10);

  const [habits,  setHabits]  = useState({});
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // habit object | null

  useEffect(() => {
    fetch(`${API}/api/habits/daily?date=${today}`, { headers })
      .then(r => r.json())
      .then(data => { setHabits(data.habits || {}); setLoading(false); });
  }, [today]);

  // Uncheck directly; check always opens proof modal
  const uncheck = async (key) => {
    setHabits(h => ({ ...h, [key]: { checked: false, checkedAt: null } }));
    await fetch(`${API}/api/habits/daily/toggle`, {
      method: 'POST', headers,
      body: JSON.stringify({ habitKey: key, date: today, checked: false }),
    });
  };

  const handleDone = (key) => {
    setHabits(h => ({ ...h, [key]: { checked: true, checkedAt: new Date().toISOString() } }));
    setModal(null);
  };

  const total     = DAILY_HABITS.length;
  const doneCount = DAILY_HABITS.filter(h => habits[h.key]?.checked).length;
  const pct       = total > 0 ? (doneCount / total) * 100 : 0;

  const GROUP_ACCENT = {
    academic: 'var(--color-blue,   #006494)',
    wellness: 'var(--color-primary,#01696f)',
    physical: 'var(--color-success,#437a22)',
    creative: 'var(--color-purple, #7a39bb)',
  };

  return (
    <>
      <div style={{ padding: '0.75rem 0' }}>
        {/* progress bar */}
        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
          <span style={{ fontWeight: 600 }}>{doneCount}</span> / {total} completed
          <div style={{
            height: 4, background: 'var(--color-surface-offset)',
            borderRadius: 2, marginTop: '0.3rem', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: pct === 100 ? 'var(--color-success)' : 'var(--color-primary)',
              transition: 'width 0.3s',
            }} />
          </div>
        </div>

        {/* groups */}
        {DAILY_HABIT_GROUPS.map(group => {
          const groupHabits = DAILY_HABITS.filter(h => group.keys.includes(h.key));
          const accent = GROUP_ACCENT[group.id] || 'var(--color-text-muted)';
          return (
            <div key={group.id} style={{ marginBottom: '1rem' }}>
              <div style={{
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: accent,
                marginBottom: '0.4rem', paddingLeft: '0.1rem',
              }}>
                {group.label}
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '0.35rem',
              }}>
                {groupHabits.map((habit) => {
                  const { key, emoji, label } = habit;
                  const checked = habits[key]?.checked || false;
                  return (
                    <button
                      key={key}
                      onClick={() => checked ? uncheck(key) : setModal(habit)}
                      title={checked ? 'Click to uncheck' : (habit.proofRequired ? 'Proof required' : 'Click to confirm')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.45rem 0.7rem',
                        border: `1px solid ${checked ? accent : 'var(--color-border)'}`,
                        borderRadius: 6, cursor: 'pointer', textAlign: 'left',
                        background: checked
                          ? `color-mix(in oklch, ${accent} 10%, var(--color-surface))`
                          : 'var(--color-surface)',
                        transition: 'all 0.15s',
                        fontSize: '0.83rem', fontWeight: 500,
                        position: 'relative',
                      }}
                    >
                      <span style={{ fontSize: '0.95rem', lineHeight: 1 }}>
                        {checked ? '✅' : emoji}
                      </span>
                      <span style={{ color: checked ? accent : 'var(--color-text)', flex: 1 }}>
                        {label}
                      </span>
                      {/* proof badge */}
                      {habit.proofRequired && !checked && (
                        <span style={{
                          fontSize: '0.6rem', fontWeight: 700,
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                          color: 'var(--color-text-faint)',
                          border: '1px solid var(--color-border)',
                          padding: '0.05rem 0.3rem',
                          borderRadius: 3,
                          flexShrink: 0,
                        }}>
                          proof
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Proof modal */}
      {modal && (
        <HabitSubmitModal
          habit={modal}
          date={today}
          onClose={() => setModal(null)}
          onDone={() => handleDone(modal.key)}
        />
      )}
    </>
  );
}
