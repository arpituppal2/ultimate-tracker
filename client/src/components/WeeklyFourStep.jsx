import { useEffect, useState } from 'react';
import { WEEKLY_HABITS, WEEKLY_HABIT_CATEGORIES } from '../utils/habits';

const API = import.meta.env.VITE_API_URL;

const SECTION_ACCENT = {
  academic: 'var(--color-blue,   #006494)',
  life:     'var(--color-orange, #da7101)',
};

export default function WeeklyFourStep({ weekId }) {
  const token  = localStorage.getItem('token');
  const user   = JSON.parse(localStorage.getItem('user') || '{}');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const [habits,  setHabits]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!weekId) return;
    fetch(`${API}/api/habits/weekly?weekId=${weekId}`, { headers })
      .then(r => r.json())
      .then(async data => {
        if (!Array.isArray(data) || data.length === 0) {
          // Seed all 8 weekly habits for this week
          const created = await Promise.all(
            WEEKLY_HABITS.map(h =>
              fetch(`${API}/api/habits/weekly`, {
                method: 'POST', headers,
                body: JSON.stringify({
                  planWeekId: weekId,
                  habitKey:   h.key,
                  step:       h.step,
                  category:   h.category,
                }),
              }).then(r => r.json())
            )
          );
          setHabits(created);
        } else {
          setHabits(data);
        }
        setLoading(false);
      });
  }, [weekId]);

  const update = async (id, field, value) => {
    setHabits(h => h.map(x => x.id === id ? { ...x, [field]: value } : x));
    await fetch(`${API}/api/habits/weekly/${id}`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ [field]: value }),
    });
  };

  const isReviewer = ['admin', 'parent'].includes(user.role);

  const totalDone = habits.filter(h => h.approved).length;

  if (loading) return (
    <div style={{ padding: '0.5rem', color: 'var(--color-text-muted,#7a7974)', fontSize: '0.85rem' }}>
      Loading…
    </div>
  );

  return (
    <div style={{ padding: '0.75rem 0' }}>
      {/* overall progress */}
      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted,#7a7974)', marginBottom: '0.85rem' }}>
        <span style={{ fontWeight: 600 }}>{totalDone}</span> / {WEEKLY_HABITS.length} approved
        <div style={{
          height: 4, background: 'var(--color-surface-offset,#e6e4df)',
          borderRadius: 2, marginTop: '0.3rem', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${(totalDone / WEEKLY_HABITS.length) * 100}%`,
            background: totalDone === WEEKLY_HABITS.length
              ? 'var(--color-success,#437a22)'
              : 'var(--color-primary,#01696f)',
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {/* sections */}
      {WEEKLY_HABIT_CATEGORIES.map(section => {
        const accent       = SECTION_ACCENT[section.id] || 'var(--color-text-muted)';
        const sectionMeta  = WEEKLY_HABITS.filter(h => h.category === section.id);
        const sectionRows  = sectionMeta.map(meta => habits.find(h => h.habitKey === meta.key) || null);

        return (
          <div key={section.id} style={{ marginBottom: '1.25rem' }}>
            {/* section header */}
            <div style={{
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: accent,
              marginBottom: '0.45rem', paddingLeft: '0.1rem',
            }}>
              {section.label}
            </div>

            {sectionMeta.map((meta, idx) => {
              const habit  = sectionRows[idx];
              const approved = habit?.approved || false;
              const borderColor = approved ? accent : 'var(--color-border,#d4d1ca)';
              const bgColor     = approved
                ? `color-mix(in oklch, ${accent} 8%, var(--color-surface,#f9f8f5))`
                : 'var(--color-surface,#f9f8f5)';

              return (
                <div key={meta.key} style={{
                  padding: '0.65rem 0.9rem',
                  marginBottom: '0.4rem',
                  background: bgColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 6,
                  transition: 'all 0.15s',
                }}>
                  {/* row header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.87rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span>{meta.emoji}</span>
                      <span style={{ color: approved ? accent : 'var(--color-text,#28251d)' }}>
                        {meta.label}
                      </span>
                    </span>

                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      {/* due day chip */}
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 600,
                        color: 'var(--color-text-faint,#bab9b4)',
                        letterSpacing: '0.04em',
                      }}>
                        {meta.dueDay}
                      </span>

                      {/* approve button (reviewer) or badge (student) */}
                      {isReviewer && habit && (
                        <button
                          onClick={() => update(habit.id, 'approved', !approved)}
                          style={{
                            padding: '0.18rem 0.55rem', borderRadius: 4,
                            border: `1px solid ${approved ? accent : 'var(--color-border,#d4d1ca)'}`,
                            cursor: 'pointer',
                            background: approved ? accent : 'transparent',
                            color: approved ? '#fff' : 'var(--color-text-muted)',
                            fontSize: '0.72rem', fontWeight: 700,
                            transition: 'all 0.15s',
                          }}
                        >
                          {approved ? '✓ Approved' : 'Approve'}
                        </button>
                      )}
                      {!isReviewer && approved && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: accent }}>✓ Approved</span>
                      )}
                    </div>
                  </div>

                  {/* description */}
                  <div style={{
                    fontSize: '0.75rem', color: 'var(--color-text-muted,#7a7974)',
                    marginTop: '0.25rem', lineHeight: 1.4,
                  }}>
                    {meta.description}
                  </div>

                  {/* proof link input */}
                  {meta.proofRequired && (
                    <div style={{ marginTop: '0.45rem' }}>
                      <input
                        value={habit?.proofLink || ''}
                        onChange={e => habit && update(habit.id, 'proofLink', e.target.value)}
                        placeholder="Paste proof link (Drive, photo, etc.)…"
                        disabled={isReviewer || !habit}
                        style={{
                          width: '100%', padding: '0.35rem 0.6rem',
                          border: '1px solid var(--color-border,#d4d1ca)',
                          borderRadius: 4, fontSize: '0.8rem',
                          boxSizing: 'border-box',
                          background: isReviewer ? 'var(--color-surface-offset,#e6e4df)' : 'var(--color-surface-2,#fbfbf9)',
                          color: 'var(--color-text,#28251d)',
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
