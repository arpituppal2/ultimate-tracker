import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const CAT_COLOR = {
  amc:        '#2563eb',
  khan:       '#16a34a',
  ap:         '#dc2626',
  career:     '#d97706',
  language:   '#7c3aed',
  college:    '#0891b2',
  redemption: '#db2777',
  daily:      '#6b7280',
  weekly:     '#6b7280',
  quarterly:  '#6b7280',
};

const STATUS_DOT = {
  done:           '#16a34a',
  pending_review: '#C08400',
  needs_revision: '#dc2626',
  late:           '#b45309',
  missing:        '#6b7280',
  in_progress:    '#2563eb',
  pending:        null,
};

const STATUS_LABEL = {
  done: 'Done', pending_review: 'In Review', needs_revision: 'Revision',
  late: 'Late', missing: 'Missing', in_progress: 'In Progress', pending: 'Pending',
};

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function buildCalendar(year, month) {
  const first  = new Date(year, month, 1);
  const last   = new Date(year, month + 1, 0);
  const offset = first.getDay();
  const days   = [];
  for (let i = 0; i < offset; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function toISO(d) {
  if (!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function DayCell({ date, tasks, isToday, isOtherMonth, onSelect, selected }) {
  if (!date) return <div style={{ background: 'var(--color-surface-offset)', minHeight: 90 }} />;

  const iso = toISO(date);
  const isSelected = selected === iso;
  const hasOverdue = tasks.some(t => !['done','missing','late'].includes(t.status));
  const doneCount  = tasks.filter(t => t.status === 'done' || t.status === 'pending_review').length;
  const cats = [...new Set(tasks.map(t => (t.category||'').toLowerCase()))].slice(0, 4);

  return (
    <div
      onClick={() => onSelect(iso)}
      style={{
        background: isSelected
          ? 'color-mix(in oklch, var(--color-primary) 10%, var(--color-surface))'
          : isToday
            ? 'color-mix(in oklch, var(--color-gold) 8%, var(--color-surface))'
            : 'var(--color-surface)',
        border: isSelected
          ? '1px solid var(--color-primary)'
          : isToday
            ? '1px solid var(--color-gold)'
            : '1px solid transparent',
        minHeight: 90,
        padding: 'var(--space-2)',
        cursor: 'pointer',
        transition: 'background var(--transition-interactive)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--color-surface-2)'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'color-mix(in oklch, var(--color-gold) 8%, var(--color-surface))' : 'var(--color-surface)'; }}
    >
      {/* Day number */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <span style={{
          fontSize: 'var(--text-xs)', fontWeight: isToday ? 800 : 600,
          color: isToday ? 'var(--color-gold)' : isOtherMonth ? 'var(--color-text-faint)' : 'var(--color-text)',
          lineHeight: 1,
        }}>
          {date.getDate()}
        </span>
        {tasks.length > 0 && (
          <span style={{
            fontSize: '0.55rem', fontWeight: 800,
            color: hasOverdue ? 'var(--color-error)' : doneCount === tasks.length ? 'var(--color-success)' : 'var(--color-text-faint)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {doneCount}/{tasks.length}
          </span>
        )}
      </div>

      {/* Category color strips */}
      {cats.length > 0 && (
        <div style={{ display: 'flex', gap: 2, marginBottom: '0.3rem', flexWrap: 'wrap' }}>
          {cats.map(cat => (
            <span key={cat} style={{ width: 16, height: 3, background: CAT_COLOR[cat] || '#6b7280', borderRadius: 1, display: 'block' }} />
          ))}
        </div>
      )}

      {/* Task previews */}
      {tasks.slice(0, 3).map(t => {
        const dot = STATUS_DOT[t.status];
        const cat = (t.category||'').toLowerCase();
        return (
          <div key={t.id} style={{
            fontSize: '0.6rem', color: 'var(--color-text-muted)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            lineHeight: 1.3, marginBottom: '0.15rem',
            display: 'flex', alignItems: 'center', gap: '0.25rem',
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
              background: dot || CAT_COLOR[cat] || 'var(--color-border)',
            }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</span>
          </div>
        );
      })}
      {tasks.length > 3 && (
        <div style={{ fontSize: '0.55rem', color: 'var(--color-text-faint)', fontWeight: 700 }}>
          +{tasks.length - 3} more
        </div>
      )}
    </div>
  );
}

function DayPanel({ iso, tasks, onClose }) {
  if (!iso) return null;
  const d = new Date(iso + 'T12:00:00');
  const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div style={{
      border: '1px solid var(--color-border)',
      background: 'var(--color-surface)',
      padding: 'var(--space-4)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--color-text)' }}>{label}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginTop: '0.2rem' }}>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            {tasks.filter(t => t.status === 'done').length > 0 && ` · ${tasks.filter(t => t.status === 'done').length} done`}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-faint)', fontSize: '1.2rem', lineHeight: 1, padding: '0.2rem' }}
        >
          ×
        </button>
      </div>

      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          Nothing scheduled.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {[...tasks]
            .sort((a, b) => {
              const order = ['in_progress','needs_revision','pending','late','missing','pending_review','done'];
              return (order.indexOf(a.status) + 1 || 99) - (order.indexOf(b.status) + 1 || 99);
            })
            .map(t => {
              const dot  = STATUS_DOT[t.status];
              const cat  = (t.category||'').toLowerCase();
              const color = CAT_COLOR[cat] || 'var(--color-text-faint)';
              return (
                <Link
                  key={t.id}
                  to={`/tasks/${t.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                    padding: 'var(--space-2) var(--space-3)',
                    background: 'var(--color-surface-offset)',
                    borderLeft: `3px solid ${color}`,
                    textDecoration: 'none', color: 'inherit',
                    transition: 'background var(--transition-interactive)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface-offset)'}
                >
                  {dot && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                  )}
                  <span style={{ flex: 1, fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.title}
                  </span>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color, flexShrink: 0 }}>
                    {t.category}
                  </span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--color-text-faint)', flexShrink: 0 }}>
                    {STATUS_LABEL[t.status] || t.status}
                  </span>
                </Link>
              );
            })}
        </div>
      )}
    </div>
  );
}

export default function CalendarView() {
  const today = new Date();
  const todayISO = toISO(today);

  const [year,     setYear]     = useState(today.getFullYear());
  const [month,    setMonth]    = useState(today.getMonth());
  const [allTasks, setAllTasks] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(todayISO);

  useEffect(() => {
    api.get('/tasks')
      .then(r => setAllTasks(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tasksByDate = useMemo(() => {
    const map = {};
    allTasks.forEach(t => {
      if (!t.dueDate) return;
      const iso = t.dueDate.slice(0, 10);
      (map[iso] = map[iso] || []).push(t);
    });
    return map;
  }, [allTasks]);

  const calDays = useMemo(() => buildCalendar(year, month), [year, month]);

  const goMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 0)  { m = 11; y--; }
    if (m > 11) { m = 0;  y++; }
    setMonth(m);
    setYear(y);
  };

  const selectedTasks = selected ? (tasksByDate[selected] || []) : [];

  const monthStats = useMemo(() => {
    const prefix = `${year}-${String(month+1).padStart(2,'0')}`;
    const monthTasks = allTasks.filter(t => t.dueDate?.startsWith(prefix));
    return {
      total:   monthTasks.length,
      done:    monthTasks.filter(t => t.status === 'done').length,
      overdue: monthTasks.filter(t => {
        const today = new Date().toISOString().slice(0,10);
        return t.dueDate?.slice(0,10) < today && !['done','missing','late'].includes(t.status);
      }).length,
    };
  }, [allTasks, year, month]);

  return (
    <div style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
            <span className="gold-rule" />
            <span className="section-label">Calendar</span>
          </div>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
            {MONTHS[month]} {year}
          </h1>
          {!loading && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginTop: '0.2rem' }}>
              {monthStats.total} tasks this month
              {monthStats.done > 0 && ` · ${monthStats.done} done`}
              {monthStats.overdue > 0 && <span style={{ color: 'var(--color-error)' }}> · {monthStats.overdue} overdue</span>}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <button
            onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelected(todayISO); }}
            style={{ padding: '0.35rem 0.8rem', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer' }}
          >
            Today
          </button>
          <button
            onClick={() => goMonth(-1)}
            style={{ padding: '0.35rem 0.65rem', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer', fontSize: 'var(--text-sm)', lineHeight: 1 }}
          >
            ‹
          </button>
          <button
            onClick={() => goMonth(1)}
            style={{ padding: '0.35rem 0.65rem', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer', fontSize: 'var(--text-sm)', lineHeight: 1 }}
          >
            ›
          </button>
        </div>
      </div>

      {/* Category legend */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        {Object.entries(CAT_COLOR).filter(([k]) => !['daily','weekly','quarterly'].includes(k)).map(([cat, color]) => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-faint)' }}>
              {cat}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--color-border)', marginBottom: '1px' }}>
          {DOW.map(d => (
            <div key={d} style={{
              background: 'var(--color-surface-offset)',
              padding: '0.35rem',
              textAlign: 'center',
              fontSize: '0.6rem', fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              color: 'var(--color-text-faint)',
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--color-border)', border: '1px solid var(--color-border)' }}>
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 90 }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--color-border)', border: '1px solid var(--color-border)' }}>
            {calDays.map((day, i) => {
              const iso     = day ? toISO(day) : null;
              const tasks   = iso ? (tasksByDate[iso] || []) : [];
              const isToday = iso === todayISO;
              return (
                <DayCell
                  key={i}
                  date={day}
                  tasks={tasks}
                  isToday={isToday}
                  isOtherMonth={day && day.getMonth() !== month}
                  onSelect={setSelected}
                  selected={selected}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Day detail panel */}
      {selected && (
        <DayPanel
          iso={selected}
          tasks={selectedTasks}
          onClose={() => setSelected(null)}
        />
      )}

    </div>
  );
}
