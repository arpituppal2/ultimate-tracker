import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import WeekView        from '../components/WeekView';
import QuarterlyHabits from '../components/QuarterlyHabits';

const TABS = [
  { id: 'week',      label: 'Week Plan'       },
  { id: 'quarterly', label: 'Quarterly Habits' },
  { id: 'tasks',     label: 'All Tasks'        },
];

const STATUS_STYLE = {
  done:           { bg: 'var(--color-success-highlight)',  text: 'var(--color-success)'    },
  pending_review: { bg: 'var(--color-gold-highlight)',     text: 'var(--color-gold)'        },
  needs_revision: { bg: 'var(--color-error-highlight)',    text: 'var(--color-error)'       },
  late:           { bg: 'var(--color-warning-highlight)',  text: 'var(--color-warning)'     },
  missing:        { bg: 'var(--color-surface-dynamic)',    text: 'var(--color-text-faint)'  },
  pending:        { bg: 'var(--color-surface-offset)',     text: 'var(--color-text-muted)'  },
};

function statusChip(status) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return (
    <span style={{
      padding: '0.12rem 0.45rem',
      fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em',
      textTransform: 'uppercase',
      background: s.bg, color: s.text, whiteSpace: 'nowrap',
    }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export default function QuarterView() {
  const { quarterId } = useParams();

  const [quarters,  setQuarters]  = useState([]);
  const [selectedQ, setSelectedQ] = useState(quarterId || '');
  const [quarter,   setQuarter]   = useState(null);
  const [tasks,     setTasks]     = useState([]);
  const [tab,       setTab]       = useState('week');
  const [loading,   setLoading]   = useState(false);
  const [catFilter, setCatFilter] = useState('all');

  useEffect(() => {
    api.get('/quarters')
      .then(r => {
        const arr = Array.isArray(r.data) ? r.data : [];
        setQuarters(arr);
        if (!selectedQ && arr.length) setSelectedQ(arr[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedQ) return;
    setLoading(true);
    Promise.all([
      api.get(`/quarters/${selectedQ}`),
      api.get(`/tasks?quarterId=${selectedQ}`),
    ]).then(([qRes, tRes]) => {
      setQuarter(qRes.data);
      setTasks(Array.isArray(tRes.data) ? tRes.data : []);
    }).catch(() => {
      setQuarter(null);
      setTasks([]);
    }).finally(() => setLoading(false));
  }, [selectedQ]);

  const stats = {
    total:   tasks.length,
    done:    tasks.filter(t => t.status === 'done').length,
    late:    tasks.filter(t => t.status === 'late').length,
    missing: tasks.filter(t => t.status === 'missing').length,
    pending: tasks.filter(t => ['pending','pending_review','needs_revision'].includes(t.status)).length,
  };
  const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

  const CAT_FILTERS = ['all', 'daily', 'weekly', 'quarterly'];
  const filteredTasks = catFilter === 'all' ? tasks
    : tasks.filter(t => t.category === catFilter);

  return (
    <div style={{ paddingTop: 'var(--space-6)' }}>

      {/* Page header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '1.25rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="gold-rule" />
          <h1 style={{
            margin: 0,
            fontSize: 'var(--text-xl)', fontWeight: 800,
            color: 'var(--color-text)',
            fontFamily: 'var(--font-display)',
          }}>
            Quarter View
          </h1>
        </div>
        <select
          value={selectedQ}
          onChange={e => setSelectedQ(e.target.value)}
          style={{
            padding: '0.4rem 0.65rem',
            border: '1px solid var(--color-border)',
            fontSize: 'var(--text-sm)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            cursor: 'pointer',
            borderRadius: 0,
          }}
        >
          {quarters.map(q => <option key={q.id} value={q.id}>{q.label}</option>)}
        </select>
      </div>

      {/* Quarter summary card */}
      {quarter && stats.total > 0 && (
        <div className="surface-card" style={{ padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.3rem' }}>
            <span style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text)' }}>
              {quarter.label}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
              {quarter.startDate} – {quarter.endDate}
            </span>
          </div>
          {quarter.focus && (
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
              {quarter.focus}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>
            <span>Progress</span>
            <span>{stats.done}/{stats.total} tasks · {pct}%</span>
          </div>
          <div style={{ height: 4, background: 'var(--color-surface-dynamic)', overflow: 'hidden', marginBottom: '0.55rem' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: 'var(--ucla-blue)',
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: 'var(--text-xs)' }}>
            <span style={{ color: 'var(--color-success)' }}>{stats.done} done</span>
            <span style={{ color: 'var(--color-warning)' }}>{stats.late} late</span>
            <span style={{ color: 'var(--color-error)'   }}>{stats.missing} missing</span>
            <span style={{ color: 'var(--color-text-faint)' }}>{stats.pending} pending</span>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: '0.25rem',
        borderBottom: '1px solid var(--color-divider)',
        marginBottom: '1.25rem',
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={['btn-tab', tab === t.id ? 'btn-tab--active' : ''].join(' ')}
            onClick={() => setTab(t.id)}
            style={{ marginBottom: -1 }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[1,2,3].map(i => (
            <div key={i} className="surface-card" style={{ padding: 'var(--space-4)' }}>
              <div className="skeleton skeleton-heading" style={{ width: '35%' }} />
              <div className="skeleton skeleton-text"   style={{ width: '55%' }} />
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'week'      && <WeekView />}
      {!loading && tab === 'quarterly' && <QuarterlyHabits />}

      {!loading && tab === 'tasks' && (
        <>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: '0.85rem' }}>
            {CAT_FILTERS.map(c => (
              <button
                key={c}
                className={['btn-tab', catFilter === c ? 'btn-tab--active' : ''].join(' ')}
                onClick={() => setCatFilter(c)}
              >
                {c.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {filteredTasks.length === 0 ? (
              <div className="surface-card" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                  No tasks for this filter.
                </p>
              </div>
            ) : filteredTasks.map(task => (
              <div
                key={task.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                  padding: '0.45rem 0.75rem',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {statusChip(task.status)}
                <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                  {task.title}
                </span>
                {task.category && (
                  <span style={{
                    fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)',
                    fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '0.1rem 0.35rem', border: '1px solid var(--color-border)',
                  }}>
                    {task.category}
                  </span>
                )}
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', minWidth: 70, textAlign: 'right' }}>
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : '—'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
