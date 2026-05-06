import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import api from '../utils/api';
import TaskWizard from '../components/TaskWizard';

const CATEGORIES = ['all','amc','khan','career','ap','college','redemption','daily','weekly','quarterly'];
const CAT_LABELS = { all:'All Tasks', amc:'AMC', khan:'Khan', career:'Career', ap:'AP', college:'College', redemption:'Redemption', daily:'Daily', weekly:'Weekly', quarterly:'Quarterly' };
const STATUSES   = ['all','pending','pending_review','needs_revision','done','late','missing'];
const STATUS_LABELS = { all:'All Stages', pending:'Pending', pending_review:'In Review', needs_revision:'Revise', done:'Done', late:'Late', missing:'Missing' };
const STATUS_STYLE = {
  done:           { bg: 'var(--color-success-highlight)',      text: 'var(--color-success)'      },
  pending_review: { bg: 'var(--color-gold-highlight)',         text: 'var(--color-gold)'         },
  needs_revision: { bg: 'var(--color-error-highlight)',        text: 'var(--color-error)'        },
  late:           { bg: 'var(--color-warning-highlight)',      text: 'var(--color-warning)'      },
  missing:        { bg: 'var(--color-notification-highlight)', text: 'var(--color-notification)' },
  pending:        { bg: 'var(--color-surface-offset)',         text: 'var(--color-text-muted)'   },
};
const getStatus = s => STATUS_STYLE[s] || STATUS_STYLE.pending;

const BULK_ACTIONS = [
  { value: 'done',    label: 'Mark Done',    cls: 'btn-primary'  },
  { value: 'late',    label: 'Mark Late',    cls: 'btn-outline'  },
  { value: 'missing', label: 'Mark Missing', cls: 'btn-outline'  },
  { value: 'delete',  label: 'Delete',       cls: 'btn-danger'   },
];

const UNDO_MS = 5 * 60 * 1000;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function weekRangeISO() {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now); mon.setDate(now.getDate() - ((day + 6) % 7));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return { from: mon.toISOString().slice(0,10), to: sun.toISOString().slice(0,10) };
}
function monthRangeISO() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last  = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: first.toISOString().slice(0,10), to: last.toISOString().slice(0,10) };
}

const dropdownStyle = {
  padding: '0.35rem 0.55rem',
  fontSize: 'var(--text-xs)',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  minWidth: 120,
  appearance: 'auto',
};

export default function TaskInventory() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isAdmin = user?.role === 'admin';

  const initCat = searchParams.get('category') || 'all';

  const [tasks,      setTasks]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [fetchErr,   setFetchErr]   = useState(null);
  const [cat,        setCat]        = useState(CATEGORIES.includes(initCat) ? initCat : 'all');
  const [status,     setStatus]     = useState('all');
  const [search,     setSearch]     = useState('');
  const [sort,       setSort]       = useState('dueDate');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const [datePreset, setDatePreset] = useState('all');
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');

  const [selected,   setSelected]   = useState(new Set());
  const [bulkAction, setBulkAction] = useState(null);
  const [bulkBusy,   setBulkBusy]   = useState(false);

  const [undoStack, setUndoStack] = useState(null);
  const undoRef = useRef(null);

  // Memoized so useCallback dep array stays stable across renders
  const resolvedDates = useMemo(() => {
    if (datePreset === 'today')  return { from: todayISO(), to: todayISO() };
    if (datePreset === 'week')   return weekRangeISO();
    if (datePreset === 'month')  return monthRangeISO();
    if (datePreset === 'custom') return { from: dateFrom, to: dateTo };
    return { from: '', to: '' };
  }, [datePreset, dateFrom, dateTo]);

  const load = useCallback(() => {
    setLoading(true);
    setFetchErr(null);
    const params = new URLSearchParams();
    if (cat    !== 'all') params.set('category',  cat);
    if (status !== 'all') params.set('status',    status);
    if (resolvedDates.from) params.set('dateFrom', resolvedDates.from);
    if (resolvedDates.to)   params.set('dateTo',   resolvedDates.to);
    api.get(`/tasks?${params}`)
      .then(r => { setTasks(Array.isArray(r.data) ? r.data : []); })
      .catch(e => {
        console.error('TaskInventory fetch failed:', e);
        setFetchErr(e.response?.data?.error || e.message || 'Failed to load tasks.');
        setTasks([]);
      })
      .finally(() => setLoading(false));
  }, [cat, status, resolvedDates.from, resolvedDates.to]);

  useEffect(() => { load(); setSelected(new Set()); }, [load]);
  useEffect(() => () => { if (undoRef.current) clearTimeout(undoRef.current); }, []);

  const filtered = tasks
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'dueDate') return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
      if (sort === 'title')   return a.title.localeCompare(b.title);
      if (sort === 'status')  return a.status.localeCompare(b.status);
      return 0;
    });

  const filteredIds = new Set(filtered.map(t => t.id));
  const allChecked  = filtered.length > 0 && filtered.every(t => selected.has(t.id));
  const someChecked = !allChecked && filtered.some(t => selected.has(t.id));
  const selectedCount = [...selected].filter(id => filteredIds.has(id)).length;

  const toggleOne = (id) => setSelected(s => {
    const next = new Set(s); next.has(id) ? next.delete(id) : next.add(id); return next;
  });
  const toggleAll = () => {
    if (allChecked) {
      setSelected(s => { const next = new Set(s); filtered.forEach(t => next.delete(t.id)); return next; });
    } else {
      setSelected(s => { const next = new Set(s); filtered.forEach(t => next.add(t.id)); return next; });
    }
  };

  const dismissUndo = () => { if (undoRef.current) clearTimeout(undoRef.current); setUndoStack(null); };

  const execUndo = async () => {
    if (!undoStack) return;
    const { snapshots, action } = undoStack;
    dismissUndo();
    try {
      if (action === 'delete') {
        for (const t of snapshots) {
          await api.post('/tasks', {
            title: t.title, category: t.category, templateType: t.templateType,
            dueDate: t.dueDate?.slice(0,10), status: t.status,
            requiresProof: t.requiresProof ?? true,
          });
        }
      } else {
        await api.patch('/tasks/bulk/undo', { snapshots });
      }
      load();
    } catch (e) {
      alert('Undo failed: ' + (e.response?.data?.error || e.message));
    }
  };

  const executeBulk = async (action) => {
    const ids = [...selected].filter(id => filteredIds.has(id));
    if (!ids.length) return;
    setBulkBusy(true);
    setBulkAction(null);

    const affectedTasks = filtered.filter(t => ids.includes(t.id));

    try {
      if (action === 'delete') {
        await api.delete('/tasks/bulk', { data: { ids } });
        const snapshots = affectedTasks.map(t => ({ ...t }));
        const timeoutId = setTimeout(dismissUndo, UNDO_MS);
        undoRef.current = timeoutId;
        if (undoStack?.timeoutId) clearTimeout(undoStack.timeoutId);
        setUndoStack({ action: 'delete', label: `Deleted ${ids.length} task${ids.length > 1 ? 's' : ''}`, snapshots, expiresAt: Date.now() + UNDO_MS, timeoutId });
      } else {
        const { data } = await api.patch('/tasks/bulk', { ids, status: action });
        const snapshots = data.snapshots || affectedTasks.map(t => ({ id: t.id, prevStatus: t.status }));
        const timeoutId = setTimeout(dismissUndo, UNDO_MS);
        undoRef.current = timeoutId;
        if (undoStack?.timeoutId) clearTimeout(undoStack.timeoutId);
        setUndoStack({ action, label: `Marked ${ids.length} task${ids.length > 1 ? 's' : ''} as ${action}`, snapshots, expiresAt: Date.now() + UNDO_MS, timeoutId });
      }
      setSelected(new Set());
      load();
    } catch (e) {
      alert('Bulk action failed: ' + (e.response?.data?.error || e.message));
    } finally {
      setBulkBusy(false);
    }
  };

  const [undoSecsLeft, setUndoSecsLeft] = useState(0);
  useEffect(() => {
    if (!undoStack) return;
    const tick = setInterval(() => {
      setUndoSecsLeft(Math.max(0, Math.ceil((undoStack.expiresAt - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(tick);
  }, [undoStack]);

  const handleDatePreset = (preset) => {
    setDatePreset(preset);
    if (preset !== 'custom') { setDateFrom(''); setDateTo(''); }
    setSelected(new Set());
  };

  const handleTaskCreated = (count) => {
    setWizardOpen(false);
    setSuccessMsg(`${count} task${count !== 1 ? 's' : ''} created.`);
    setTimeout(() => setSuccessMsg(null), 4000);
    load();
  };

  return (
    <div style={{ paddingTop: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
            <span className="gold-rule" />
            <span className="section-label">Tracker</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 800, lineHeight: 1.1 }}>
            Task Inventory
          </h1>
        </div>
        {isAdmin && (
          <button className="btn-primary btn-sm" onClick={() => setWizardOpen(true)}>+ Add Task</button>
        )}
      </div>

      {successMsg && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
          background: 'var(--color-success-highlight)', color: 'var(--color-success)',
          border: '1px solid var(--color-success)', fontSize: 'var(--text-sm)', fontWeight: 600,
        }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Search + Sort */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks"
          className="input-base" style={{ flex: 1, minWidth: 180 }}
        />
        <select value={sort} onChange={e => setSort(e.target.value)} style={dropdownStyle}>
          <option value="dueDate">Due Date</option>
          <option value="title">Title</option>
          <option value="status">Status</option>
        </select>
      </div>

      {/* Filter dropdowns */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <select value={cat} onChange={e => { setCat(e.target.value); setSelected(new Set()); }} style={dropdownStyle}>
          {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setSelected(new Set()); }} style={dropdownStyle}>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select value={datePreset} onChange={e => handleDatePreset(e.target.value)} style={dropdownStyle}>
          <option value="all">All Dates</option>
          <option value="today">Due Today</option>
          <option value="week">Due This Week</option>
          <option value="month">Due This Month</option>
          <option value="custom">Date Range</option>
        </select>
        {datePreset === 'custom' && (
          <>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setSelected(new Set()); }} style={{ ...dropdownStyle, minWidth: 'unset', textTransform: 'none', letterSpacing: 0 }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', fontWeight: 600 }}>to</span>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setSelected(new Set()); }} style={{ ...dropdownStyle, minWidth: 'unset', textTransform: 'none', letterSpacing: 0 }} />
          </>
        )}
      </div>

      {/* Count + bulk action bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)', flexWrap: 'wrap', minHeight: '2rem' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {loading ? 'Loading…' : `${filtered.length} Task${filtered.length !== 1 ? 's' : ''}`}
        </span>
        {isAdmin && selectedCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginLeft: 'auto' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>{selectedCount} selected</span>
            {bulkAction ? (
              <>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)', fontWeight: 700 }}>
                  {bulkAction === 'delete' ? `Delete ${selectedCount} task${selectedCount > 1 ? 's' : ''}?` : `Mark ${selectedCount} as ${bulkAction}?`}
                </span>
                <button className="btn-primary btn-sm" disabled={bulkBusy} onClick={() => executeBulk(bulkAction)}>{bulkBusy ? 'Working…' : 'Confirm'}</button>
                <button className="btn-ghost btn-sm" onClick={() => setBulkAction(null)}>Cancel</button>
              </>
            ) : (
              BULK_ACTIONS.map(a => <button key={a.value} className={`${a.cls} btn-sm`} onClick={() => setBulkAction(a.value)}>{a.label}</button>)
            )}
            <button className="btn-ghost btn-sm" onClick={() => setSelected(new Set())} title="Deselect all">✕ Clear</button>
          </div>
        )}
      </div>

      {/* Undo toast */}
      {undoStack && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-surface-offset)', border: '1px solid var(--ucla-gold)',
          marginBottom: 'var(--space-3)', gap: 'var(--space-4)', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)' }}>
            {undoStack.label}
            <span style={{ marginLeft: '0.5rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>· Undo available for {undoSecsLeft}s</span>
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn-primary btn-sm" onClick={execUndo}>Undo</button>
            <button className="btn-ghost btn-sm" onClick={dismissUndo}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="skeleton" style={{ width: 16, height: 16, flexShrink: 0 }} />
              <div className="skeleton" style={{ width: 56, height: 20 }} />
              <div className="skeleton skeleton-text" style={{ flex: 1 }} />
              <div className="skeleton" style={{ width: 48, height: 14 }} />
            </div>
          ))}
        </div>
      )}

      {/* Fetch error */}
      {!loading && fetchErr && (
        <div style={{
          padding: 'var(--space-4)', background: 'var(--color-error-highlight)',
          border: '1px solid var(--color-error)', color: 'var(--color-error)',
          fontSize: 'var(--text-sm)', fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)',
        }}>
          <span>⚠ Failed to load tasks: {fetchErr}</span>
          <button className="btn-outline btn-sm" onClick={load}>Retry</button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !fetchErr && filtered.length === 0 && (
        <div className="surface-card" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>No tasks match these filters.</p>
        </div>
      )}

      {/* Task rows */}
      {!loading && !fetchErr && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '0.2rem var(--space-4)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)', borderBottom: 'none' }}>
              <input type="checkbox" checked={allChecked} ref={el => { if (el) el.indeterminate = someChecked; }} onChange={toggleAll} style={{ cursor: 'pointer', width: 14, height: 14, accentColor: 'var(--ucla-blue)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {allChecked ? 'Deselect all' : 'Select all'} ({filtered.length})
              </span>
            </div>
          )}
          {filtered.map(task => {
            const st = getStatus(task.status);
            const isChecked = selected.has(task.id);
            return (
              <div key={task.id}
                style={{ display: 'flex', alignItems: 'center', background: isChecked ? 'var(--color-surface-2)' : 'var(--color-surface)', border: `1px solid ${isChecked ? 'var(--ucla-blue)' : 'var(--color-border)'}`, gap: 'var(--space-3)', transition: 'all var(--transition-interactive)' }}
                onMouseEnter={e => { if (!isChecked) { e.currentTarget.style.borderColor = 'var(--color-text-faint)'; e.currentTarget.style.background = 'var(--color-surface-2)'; } }}
                onMouseLeave={e => { if (!isChecked) { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface)'; } }}
              >
                {isAdmin && (
                  <div style={{ paddingLeft: 'var(--space-4)', paddingRight: 0, flexShrink: 0 }} onClick={e => { e.preventDefault(); e.stopPropagation(); toggleOne(task.id); }}>
                    <input type="checkbox" checked={isChecked} onChange={() => toggleOne(task.id)} style={{ cursor: 'pointer', width: 14, height: 14, accentColor: 'var(--ucla-blue)' }} onClick={e => e.stopPropagation()} />
                  </div>
                )}
                <Link to={`/tasks/${task.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-4)', paddingLeft: isAdmin ? 0 : undefined, minWidth: 0 }}>
                  <span style={{ padding: '0.1rem 0.45rem', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', background: st.bg, color: st.text, flexShrink: 0 }}>
                    {STATUS_LABELS[task.status] || task.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span style={{ flex: 1, fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {task.title}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', flexShrink: 0 }}>{CAT_LABELS[task.category] || task.category}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', flexShrink: 0, minWidth: 60, textAlign: 'right' }}>
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {wizardOpen && <TaskWizard onClose={() => setWizardOpen(false)} onCreated={handleTaskCreated} />}
    </div>
  );
}
