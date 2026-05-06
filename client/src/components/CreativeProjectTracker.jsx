import { CREATIVE_PHASES } from '../utils/habits';

// Current quarter — update each quarter
const CURRENT_QUARTER = 'Q2_2026';

// Quarter-over-quarter project log
// Populate as the student commits to a project each quarter
const PROJECT_LOG = [
  {
    quarterId: 'Q2_2026',
    phase:     'exploration',
    medium:    'TBD — trying drawing, music, and journaling',
    tangible:  null,
  },
];

export default function CreativeProjectTracker({ compact = false }) {
  const current = PROJECT_LOG.find(p => p.quarterId === CURRENT_QUARTER);
  const phase   = CREATIVE_PHASES.find(p => current && p.id === current.phase);

  const PHASE_COLOR = {
    exploration: 'var(--color-orange,#da7101)',
    commitment:  'var(--color-purple,#7a39bb)',
    portfolio:   'var(--color-gold,#d19900)',
  };

  const accent = phase ? (PHASE_COLOR[phase.id] || 'var(--color-text-muted)') : 'var(--color-text-muted)';

  if (compact) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.45rem 0.7rem',
        border: '1px solid var(--color-border,#d4d1ca)',
        borderRadius: 6,
        background: 'var(--color-surface,#f9f8f5)',
        fontSize: '0.82rem',
      }}>
        <span style={{ fontSize: '1rem' }}>🎨</span>
        <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Creative 15 —</span>
        <span style={{ color: accent, fontWeight: 600 }}>
          {phase ? phase.label : 'Not started'}
        </span>
        {current?.medium && (
          <span style={{ color: 'var(--color-text-faint)', fontSize: '0.75rem' }}>
            &nbsp;· {current.medium}
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '0.75rem 0' }}>
      {/* header */}
      <div style={{
        fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: accent,
        marginBottom: '0.6rem',
      }}>
        🎨 Creative Project
      </div>

      {/* current quarter card */}
      <div style={{
        padding: '0.75rem 0.9rem',
        border: `1px solid ${accent}`,
        borderRadius: 6,
        background: `color-mix(in oklch, ${accent} 6%, var(--color-surface,#f9f8f5))`,
        marginBottom: '0.75rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: accent }}>
            {phase ? phase.label : 'No phase set'}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)', fontWeight: 600 }}>
            {CURRENT_QUARTER.replace('_', ' ')}
          </span>
        </div>

        {phase && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', lineHeight: 1.4 }}>
            {phase.description}
          </div>
        )}

        <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', fontWeight: 500, color: 'var(--color-text)' }}>
          {current?.medium || <span style={{ color: 'var(--color-text-faint)', fontStyle: 'italic' }}>No medium committed yet</span>}
        </div>

        {current?.tangible && (
          <div style={{ marginTop: '0.3rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            📦 Output: {current.tangible}
          </div>
        )}
      </div>

      {/* phase timeline */}
      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.85rem' }}>
        {CREATIVE_PHASES.map(p => {
          const isActive = phase?.id === p.id;
          const c = PHASE_COLOR[p.id] || 'var(--color-text-faint)';
          return (
            <div key={p.id} style={{
              flex: 1, padding: '0.3rem 0.4rem',
              borderRadius: 4,
              border: `1px solid ${isActive ? c : 'var(--color-border,#d4d1ca)'}`,
              background: isActive ? `color-mix(in oklch, ${c} 10%, var(--color-surface))` : 'transparent',
              textAlign: 'center',
              fontSize: '0.7rem', fontWeight: isActive ? 700 : 500,
              color: isActive ? c : 'var(--color-text-faint)',
              transition: 'all 0.15s',
            }}>
              {p.label}
            </div>
          );
        })}
      </div>

      {/* history log */}
      {PROJECT_LOG.length > 1 && (
        <>
          <div style={{
            fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.07em',
            textTransform: 'uppercase', color: 'var(--color-text-faint)',
            marginBottom: '0.35rem',
          }}>
            History
          </div>
          {[...PROJECT_LOG].reverse().filter(p => p.quarterId !== CURRENT_QUARTER).map(p => (
            <div key={p.quarterId} style={{
              display: 'flex', gap: '0.5rem', alignItems: 'baseline',
              fontSize: '0.78rem', marginBottom: '0.25rem',
              color: 'var(--color-text-muted)',
            }}>
              <span style={{ fontWeight: 600, flexShrink: 0 }}>{p.quarterId.replace('_', ' ')}</span>
              <span>{p.medium}</span>
              {p.tangible && <span style={{ color: 'var(--color-text-faint)' }}>— {p.tangible}</span>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
