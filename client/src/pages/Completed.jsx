import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ChevronDown, Search, X } from 'lucide-react';

const DONE_STATUSES = ['done', 'missing', 'late'];

// Maps category/templateType values to readable labels
const TYPE_LABELS = {
  ap_review:       'AP Review',
  ap_exploration:  'AP Exploration',
  ap_study:        'AP Study',
  college_review:  'College Review',
  college:         'College',
  khan:            'Khan Academy',
  homework:        'Homework',
  test_prep:       'Test Prep',
  reading:         'Reading',
  practice:        'Practice',
  simple:          'General',
  other:           'Other',
};

function typeKey(task) {
  // Prefer templateType, fall back to category, then 'other'
  const raw = task.templateType || task.category || 'other';
  return raw.toLowerCase().replace(/[^a-z0-9_]/g, '_');
}

function typeLabel(key) {
  return TYPE_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const STATUS_LABEL = {
  done:    { label: 'Done',    color: 'var(--color-success)', bg: 'var(--color-success-highlight)' },
  missing: { label: 'Missing', color: 'var(--color-error)',   bg: 'var(--color-error-highlight)'   },
  late:    { label: 'Late',    color: 'var(--color-warning)', bg: 'var(--color-warning-highlight)' },
};

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function Completed() {
  const [tasks, setTasks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState('');
  const [activeType, setActiveType] = useState('all');

  useEffect(() => {
    setLoading(true);
    fetch('/api/tasks/completed', { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error('Failed to load'); return r.json(); })
      .then(data => { setTasks(Array.isArray(data) ? data : data.tasks || []); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  // Derive sorted type list from actual data
  const types = useMemo(() => {
    const counts = {};
    tasks.forEach(t => {
      const k = typeKey(t);
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => ({ key: k, label: typeLabel(k), count: n }));
  }, [tasks]);

  const filtered = useMemo(() => {
    let list = tasks;
    if (activeType !== 'all') {
      list = list.filter(t => typeKey(t) === activeType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) =>
      new Date(b.updatedAt || b.dueDate) - new Date(a.updatedAt || a.dueDate)
    );
  }, [tasks, activeType, search]);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 'var(--space-8) var(--space-4)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <CheckCircle size={20} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
          Completed
        </h1>
        {!loading && (
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Type filter pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
        <FilterPill active={activeType === 'all'} onClick={() => setActiveType('all')}>
          All ({tasks.length})
        </FilterPill>
        {types.map(({ key, label, count }) => (
          <FilterPill key={key} active={activeType === key} onClick={() => setActiveType(key)}>
            {label} ({count})
          </FilterPill>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 'var(--space-6)' }}>
        <Search size={14} style={{
          position: 'absolute', left: 'var(--space-3)',
          top: '50%', transform: 'translateY(-50%)',
          color: 'var(--color-text-muted)', pointerEvents: 'none',
        }} />
        <input
          type="text"
          placeholder="Search completed tasks…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            paddingLeft: 'var(--space-8)',
            paddingRight: search ? 'var(--space-8)' : 'var(--space-3)',
            paddingBlock: 'var(--space-2)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            outline: 'none',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 2px var(--color-primary-highlight)'; }}
          onBlur={e =>  { e.target.style.borderColor = 'var(--color-border)';   e.target.style.boxShadow = 'none'; }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            aria-label="Clear search"
            style={{
              position: 'absolute', right: 'var(--space-3)',
              top: '50%', transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)', display: 'flex',
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* States */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              height: 56, borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface-offset)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      )}

      {error && (
        <div style={{
          fontSize: 'var(--text-sm)', color: 'var(--color-error)',
          background: 'var(--color-error-highlight)',
          border: '1px solid var(--color-error)',
          borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)',
        }}>
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: 'var(--space-16) var(--space-8)',
          color: 'var(--color-text-muted)',
        }}>
          <CheckCircle size={36} style={{ margin: '0 auto var(--space-4)', opacity: 0.25 }} />
          <p style={{ fontSize: 'var(--text-sm)' }}>
            {search || activeType !== 'all' ? 'No tasks match that filter.' : 'No completed tasks yet.'}
          </p>
        </div>
      )}

      {/* Task list */}
      {!loading && !error && filtered.length > 0 && (
        activeType === 'all'
          ? <GroupedList tasks={filtered} />
          : <FlatList tasks={filtered} />
      )}
    </div>
  );
}

function FilterPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: 'var(--space-1) var(--space-3)',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        border: '1px solid',
        cursor: 'pointer',
        transition: 'all var(--transition-interactive)',
        background:   active ? 'var(--color-primary)'           : 'var(--color-surface-offset)',
        color:        active ? '#fff'                            : 'var(--color-text-muted)',
        borderColor:  active ? 'var(--color-primary)'           : 'var(--color-border)',
      }}
    >
      {children}
    </button>
  );
}

function GroupedList({ tasks }) {
  const groups = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      const k = typeKey(t);
      if (!map[k]) map[k] = [];
      map[k].push(t);
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [tasks]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {groups.map(([key, items]) => (
        <TypeSection key={key} typeKey={key} items={items} />
      ))}
    </div>
  );
}

function TypeSection({ typeKey: key, items }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-surface-offset)',
          cursor: 'pointer', border: 'none', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text)' }}>
          {typeLabel(key)}
          <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 'var(--space-2)' }}>
            ({items.length})
          </span>
        </span>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--color-text-muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform var(--transition-interactive)',
          }}
        />
      </button>
      {open && <FlatList tasks={items} noBorder />}
    </div>
  );
}

function FlatList({ tasks, noBorder }) {
  const wrapStyle = noBorder ? {} : {
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  };
  return (
    <ul style={wrapStyle}>
      {tasks.map((task, i) => (
        <li key={task.id} style={i > 0 ? { borderTop: '1px solid var(--color-divider)' } : {}}>
          <Link
            to={`/tasks/${task.id}`}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
              padding: 'var(--space-3) var(--space-4)',
              textDecoration: 'none',
              transition: 'background var(--transition-interactive)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-highlight)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <CheckCircle
              size={14}
              style={{ marginTop: 2, flexShrink: 0, color: 'var(--color-success)' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 'var(--text-sm)', fontWeight: 500,
                color: 'var(--color-text)', whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis',
                marginBottom: 0,
              }}>
                {task.title}
              </p>
              {task.category && task.templateType && task.category !== task.templateType && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 1 }}>
                  {task.category}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
              {task.status && STATUS_LABEL[task.status] && (
                <span style={{
                  fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: STATUS_LABEL[task.status].color,
                  background: STATUS_LABEL[task.status].bg,
                  padding: '0.1rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  {STATUS_LABEL[task.status].label}
                </span>
              )}
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                {formatDate(task.dueDate)}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
