import { useState } from 'react';
import { QUARTERLY_HABITS } from '../utils/habits';

const STATUS_META = {
  pending:   { label: 'Pending',   color: 'var(--color-text-faint,#bab9b4)',   bg: 'transparent' },
  submitted: { label: 'Submitted', color: 'var(--color-gold,#d19900)',          bg: 'rgba(209,153,0,0.08)' },
  approved:  { label: 'Approved',  color: 'var(--color-success,#437a22)',       bg: 'rgba(67,122,34,0.08)'  },
};

const GRADE_OPTIONS = ['A', 'B', 'C', 'D', 'F'];

// Each quarterly habit row manages its own local state;
// a real implementation would persist via the API.
export default function QuarterlyHabits({ quarterId, readOnly = false }) {
  const [rows, setRows] = useState(
    QUARTERLY_HABITS.map(h => ({
      key:        h.key,
      status:     'pending',
      proofLink:  '',
      selfGrades: {},  // { goal_1: 'A', goal_2: 'B', ... }
    }))
  );

  const setField = (key, field, value) =>
    setRows(r => r.map(x => x.key === key ? { ...x, [field]: value } : x));

  const setGrade = (key, gradeField, value) =>
    setRows(r => r.map(x =>
      x.key === key ? { ...x, selfGrades: { ...x.selfGrades, [gradeField]: value } } : x
    ));

  return (
    <div style={{ padding: '0.75rem 0' }}>
      <div style={{
        fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--color-text-muted,#7a7974)',
        marginBottom: '0.6rem',
      }}>
        Quarterly Habits
      </div>

      {QUARTERLY_HABITS.map(meta => {
        const row    = rows.find(r => r.key === meta.key);
        const sm     = STATUS_META[row.status] || STATUS_META.pending;
        const approved = row.status === 'approved';

        return (
          <div key={meta.key} style={{
            padding: '0.8rem 1rem',
            marginBottom: '0.5rem',
            border: `1px solid ${
              approved
                ? 'var(--color-success,#437a22)'
                : 'var(--color-border,#d4d1ca)'
            }`,
            borderRadius: 6,
            background: sm.bg || 'var(--color-surface,#f9f8f5)',
            transition: 'all 0.15s',
          }}>

            {/* header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <span>{meta.emoji}</span>
                  <span style={{ color: approved ? 'var(--color-success,#437a22)' : 'var(--color-text,#28251d)' }}>
                    {meta.label}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted,#7a7974)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                  {meta.description}
                </div>
                {meta.dueWhen && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-faint,#bab9b4)', marginTop: '0.2rem' }}>
                    Due: {meta.dueWhen}
                  </div>
                )}
              </div>

              {/* status selector */}
              {!readOnly && (
                <select
                  value={row.status}
                  onChange={e => setField(meta.key, 'status', e.target.value)}
                  style={{
                    padding: '0.2rem 0.5rem',
                    border: `1px solid ${sm.color}`,
                    borderRadius: 4,
                    fontSize: '0.75rem', fontWeight: 700,
                    color: sm.color,
                    background: 'var(--color-surface-2,#fbfbf9)',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {Object.entries(STATUS_META).map(([val, m]) => (
                    <option key={val} value={val}>{m.label}</option>
                  ))}
                </select>
              )}
              {readOnly && (
                <span style={{
                  fontSize: '0.72rem', fontWeight: 700,
                  color: sm.color, flexShrink: 0,
                }}>
                  {sm.label}
                </span>
              )}
            </div>

            {/* proof link */}
            {meta.proofRequired && (
              <div style={{ marginTop: '0.5rem' }}>
                <input
                  value={row.proofLink}
                  onChange={e => setField(meta.key, 'proofLink', e.target.value)}
                  placeholder={`Proof link${meta.proof ? ` — ${meta.proof}` : ''}`}
                  disabled={readOnly}
                  style={{
                    width: '100%', padding: '0.35rem 0.6rem',
                    border: '1px solid var(--color-border,#d4d1ca)',
                    borderRadius: 4, fontSize: '0.8rem',
                    boxSizing: 'border-box',
                    background: readOnly ? 'var(--color-surface-offset,#e6e4df)' : 'var(--color-surface-2,#fbfbf9)',
                    color: 'var(--color-text,#28251d)',
                  }}
                />
              </div>
            )}

            {/* self-grade fields (goal_setting only) */}
            {meta.hasSelfGrade && meta.selfGradeFields && (
              <div style={{ marginTop: '0.6rem' }}>
                <div style={{
                  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted,#7a7974)',
                  marginBottom: '0.35rem',
                }}>
                  Self-Grade
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {meta.selfGradeFields.map(field => (
                    <div key={field} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                        {field.replace(/_/g, ' ')}
                      </span>
                      <select
                        value={row.selfGrades[field] || ''}
                        onChange={e => setGrade(meta.key, field, e.target.value)}
                        disabled={readOnly}
                        style={{
                          padding: '0.15rem 0.4rem',
                          border: '1px solid var(--color-border,#d4d1ca)',
                          borderRadius: 4, fontSize: '0.75rem',
                          background: 'var(--color-surface-2,#fbfbf9)',
                          color: 'var(--color-text,#28251d)',
                          cursor: readOnly ? 'default' : 'pointer',
                        }}
                      >
                        <option value="">—</option>
                        {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
