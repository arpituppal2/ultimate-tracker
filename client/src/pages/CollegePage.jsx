import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import api from '../utils/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLLEGE_STATUSES = [
  { value: 'exploring',   label: 'Exploring',   color: 'var(--color-blue)'    },
  { value: 'applying',    label: 'Applying',    color: 'var(--color-gold)'    },
  { value: 'applied',     label: 'Applied',     color: 'var(--color-warning)' },
  { value: 'admitted',    label: 'Admitted',    color: 'var(--color-success)' },
  { value: 'rejected',    label: 'Rejected',    color: 'var(--color-error)'   },
  { value: 'waitlisted',  label: 'Waitlisted',  color: 'var(--color-purple)'  },
  { value: 'deferred',    label: 'Deferred',    color: 'var(--color-orange)'  },
  { value: 'enrolled',    label: 'Enrolled',    color: 'var(--color-primary)' },
];

const TASK_TYPES = [
  { value: 'general',         label: 'General'         },
  { value: 'email',           label: 'Email'           },
  { value: 'visit',           label: 'Visit'           },
  { value: 'essay',           label: 'Essay'           },
  { value: 'financial_aid',   label: 'Financial Aid'   },
  { value: 'interview',       label: 'Interview'       },
  { value: 'recommendation',  label: 'Rec. Letter'     },
  { value: 'other',           label: 'Other'           },
];

const TASK_STATUSES = [
  { value: 'pending',     label: 'Pending',     color: 'var(--color-text-faint)' },
  { value: 'in_progress', label: 'In Progress', color: 'var(--color-blue)'       },
  { value: 'done',        label: 'Done',        color: 'var(--color-success)'    },
  { value: 'skipped',     label: 'Skipped',     color: 'var(--color-text-faint)' },
];

// Default college-specific tasks seeded when a new college is created
const DEFAULT_COLLEGE_TASKS = [
  { title: 'Overall Review',                    type: 'general',        status: 'pending' },
  { title: 'Email college about program',       type: 'email',          status: 'pending' },
  { title: 'Campus visit / virtual tour',       type: 'visit',          status: 'pending' },
  { title: 'Research financial aid & merit aid', type: 'financial_aid', status: 'pending' },
  { title: 'Interview prep',                    type: 'interview',      status: 'pending' },
  { title: 'Main essay / supplements',          type: 'essay',          status: 'pending' },
  { title: 'Request recommendation letters',   type: 'recommendation',  status: 'pending' },
];

function statusMeta(value) {
  return COLLEGE_STATUSES.find(s => s.value === value) || COLLEGE_STATUSES[0];
}
function taskTypeMeta(value) {
  return TASK_TYPES.find(t => t.value === value) || TASK_TYPES[0];
}
function taskStatusMeta(value) {
  return TASK_STATUSES.find(s => s.value === value) || TASK_STATUSES[0];
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CollegePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'parent';

  const [colleges, setColleges]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedId, setSelectedId]     = useState(null);
  const [addOpen, setAddOpen]           = useState(false);
  const [addForm, setAddForm]           = useState({ name: '', shortName: '', status: 'exploring', notes: '' });
  const [addBusy, setAddBusy]           = useState(false);
  const [addErr, setAddErr]             = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/colleges');
      setColleges(Array.isArray(data) ? data : []);
      if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
    } catch { setColleges([]); }
    finally { setLoading(false); }
  }, [selectedId]);

  useEffect(() => { load(); }, []);    // eslint-disable-line react-hooks/exhaustive-deps

  const selected = colleges.find(c => c.id === selectedId) || null;

  const updateCollege = async (id, patch) => {
    try {
      const { data } = await api.patch(`/colleges/${id}`, patch);
      setColleges(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    } catch { /* silent */ }
  };

  const deleteCollege = async (id) => {
    if (!window.confirm('Delete this college and all its tasks? This cannot be undone.')) return;
    try {
      await api.delete(`/colleges/${id}`);
      setColleges(prev => {
        const next = prev.filter(c => c.id !== id);
        setSelectedId(next.length > 0 ? next[0].id : null);
        return next;
      });
    } catch { alert('Failed to delete.'); }
  };

  const handleAddCollege = async () => {
    if (!addForm.name.trim() || !addForm.shortName.trim()) {
      setAddErr('Name and abbreviation are required.'); return;
    }
    setAddBusy(true); setAddErr(null);
    try {
      const { data: college } = await api.post('/colleges', addForm);
      // Seed default tasks
      for (const t of DEFAULT_COLLEGE_TASKS) {
        try { await api.post(`/colleges/${college.id}/tasks`, t); } catch { /* ignore */ }
      }
      // Reload to get tasks
      const { data: fresh } = await api.get('/colleges');
      setColleges(Array.isArray(fresh) ? fresh : []);
      setSelectedId(college.id);
      setAddOpen(false);
      setAddForm({ name: '', shortName: '', status: 'exploring', notes: '' });
    } catch (err) {
      setAddErr(err.response?.data?.error || 'Failed to create college.');
    } finally { setAddBusy(false); }
  };

  const addTask = async (collegeId, taskData) => {
    try {
      const { data } = await api.post(`/colleges/${collegeId}/tasks`, taskData);
      setColleges(prev => prev.map(c =>
        c.id === collegeId ? { ...c, tasks: [...(c.tasks || []), data] } : c
      ));
    } catch { /* silent */ }
  };

  const updateTask = async (collegeId, taskId, patch) => {
    try {
      const { data } = await api.patch(`/colleges/${collegeId}/tasks/${taskId}`, patch);
      setColleges(prev => prev.map(c =>
        c.id === collegeId
          ? { ...c, tasks: (c.tasks || []).map(t => t.id === taskId ? { ...t, ...data } : t) }
          : c
      ));
    } catch { /* silent */ }
  };

  const deleteTask = async (collegeId, taskId) => {
    try {
      await api.delete(`/colleges/${collegeId}/tasks/${taskId}`);
      setColleges(prev => prev.map(c =>
        c.id === collegeId ? { ...c, tasks: (c.tasks || []).filter(t => t.id !== taskId) } : c
      ));
    } catch { /* silent */ }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────

  const s = {
    page: {
      paddingTop: 'var(--space-6)',
      paddingBottom: 'var(--space-8)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    },
    layout: {
      display: 'grid',
      gridTemplateColumns: '240px 1fr',
      gap: 'var(--space-5)',
      flex: 1,
      minHeight: 0,
    },
    sidebar: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
    },
    sidebarItem: (active) => ({
      padding: 'var(--space-3) var(--space-4)',
      background: active ? 'var(--color-surface-2)' : 'var(--color-surface)',
      border: active ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
      cursor: 'pointer',
      textAlign: 'left',
      width: '100%',
      transition: 'all var(--transition-interactive)',
    }),
    sectionLabel: {
      fontSize: 'var(--text-xs)',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: 'var(--color-text-faint)',
      marginBottom: 'var(--space-3)',
    },
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
          <span className="gold-rule" />
          <span className="section-label">Administration</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 800, lineHeight: 1.1 }}>
            College Tracker
          </h1>
          {isAdmin && (
            <button className="btn-primary btn-sm" onClick={() => setAddOpen(true)}>
              + Add College
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 52 }} />)}
        </div>
      ) : colleges.length === 0 ? (
        <div style={{ padding: 'var(--space-16)', textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>🎓</div>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>No colleges yet</div>
          {isAdmin
            ? <button className="btn-primary btn-sm" onClick={() => setAddOpen(true)}>+ Add First College</button>
            : <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>No colleges have been added yet.</p>
          }
        </div>
      ) : (
        <div style={s.layout}>
          {/* Sidebar */}
          <div style={s.sidebar}>
            {colleges.map(c => {
              const sm = statusMeta(c.status);
              const done  = (c.tasks || []).filter(t => t.status === 'done').length;
              const total = (c.tasks || []).length;
              return (
                <button
                  key={c.id}
                  style={s.sidebarItem(c.id === selectedId)}
                  onClick={() => setSelectedId(c.id)}
                  onMouseEnter={e => { if (c.id !== selectedId) e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                  onMouseLeave={e => { if (c.id !== selectedId) e.currentTarget.style.background = 'var(--color-surface)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text)' }}>
                      {c.shortName}
                    </span>
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase',
                      letterSpacing: '0.06em', padding: '0.1rem 0.4rem',
                      background: 'var(--color-surface-offset)',
                      color: sm.color,
                      border: `1px solid ${sm.color}`,
                    }}>
                      {sm.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </div>
                  {total > 0 && (
                    <div style={{ marginTop: '0.4rem', height: 3, background: 'var(--color-surface-offset)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(done / total) * 100}%`, background: 'var(--color-success)', borderRadius: 2 }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          {selected && (
            <CollegeDetail
              college={selected}
              isAdmin={isAdmin}
              onUpdateCollege={(patch) => updateCollege(selected.id, patch)}
              onDeleteCollege={() => deleteCollege(selected.id)}
              onAddTask={(t) => addTask(selected.id, t)}
              onUpdateTask={(taskId, patch) => updateTask(selected.id, taskId, patch)}
              onDeleteTask={(taskId) => deleteTask(selected.id, taskId)}
            />
          )}
        </div>
      )}

      {/* Add College Modal */}
      {addOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'oklch(0 0 0 / 0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'var(--space-4)',
        }} onClick={e => e.target === e.currentTarget && setAddOpen(false)}>
          <div style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            width: '100%', maxWidth: 480,
            boxShadow: 'var(--shadow-lg)',
            padding: 'var(--space-6)',
            display: 'flex', flexDirection: 'column', gap: 'var(--space-4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)' }}>Add College</div>
              <button className="btn-ghost btn-sm" onClick={() => setAddOpen(false)}>✕</button>
            </div>

            <FieldRow label="University Name">
              <input
                className="input-base" autoFocus
                placeholder="e.g. Massachusetts Institute of Technology"
                value={addForm.name}
                onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
              />
            </FieldRow>

            <FieldRow label="Abbreviation">
              <input
                className="input-base"
                placeholder="e.g. MIT"
                value={addForm.shortName}
                onChange={e => setAddForm(f => ({ ...f, shortName: e.target.value }))}
              />
            </FieldRow>

            <FieldRow label="Initial Status">
              <select
                className="input-base"
                value={addForm.status}
                onChange={e => setAddForm(f => ({ ...f, status: e.target.value }))}
              >
                {COLLEGE_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </FieldRow>

            <FieldRow label="Notes (optional)">
              <textarea
                className="input-base" rows={2}
                placeholder="Any initial notes…"
                value={addForm.notes}
                onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                style={{ resize: 'vertical' }}
              />
            </FieldRow>

            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', background: 'var(--color-surface-offset)', padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--color-border)' }}>
              Default tasks (email, visit, essay, etc.) will be automatically added.
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
              <button className="btn-primary btn-sm" onClick={handleAddCollege} disabled={addBusy}>
                {addBusy ? 'Creating…' : 'Create College'}
              </button>
              <button className="btn-ghost btn-sm" onClick={() => setAddOpen(false)}>Cancel</button>
              {addErr && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)', fontWeight: 600 }}>{addErr}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── College Detail Panel ─────────────────────────────────────────────────────

function CollegeDetail({ college, isAdmin, onUpdateCollege, onDeleteCollege, onAddTask, onUpdateTask, onDeleteTask }) {
  const [editNotes, setEditNotes]   = useState(false);
  const [notesVal, setNotesVal]     = useState(college.notes || '');
  const [addTaskOpen, setAddTaskOpen] = useState(false);

  // Sync notes when college changes
  useEffect(() => { setNotesVal(college.notes || ''); setEditNotes(false); }, [college.id]);

  const tasks = college.tasks || [];
  // Split: "specific" types go in the table; 'general' tasks stay in general area
  const generalTasks  = tasks.filter(t => t.type === 'general');
  const specificTasks = tasks.filter(t => t.type !== 'general');

  const sm = statusMeta(college.status);

  const saveNotes = async () => {
    await onUpdateCollege({ notes: notesVal });
    setEditNotes(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', minWidth: 0 }}>

      {/* ── College header ── */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        padding: 'var(--space-5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 800, lineHeight: 1.1, marginBottom: '0.25rem' }}>
              {college.name}
            </h2>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              {college.shortName}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {isAdmin ? (
              <select
                className="input-base"
                value={college.status}
                onChange={e => onUpdateCollege({ status: e.target.value })}
                style={{ fontSize: 'var(--text-xs)', fontWeight: 700, padding: '0.3rem 0.6rem', color: sm.color }}
              >
                {COLLEGE_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            ) : (
              <span style={{
                fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.08em', padding: '0.2rem 0.6rem',
                border: `1px solid ${sm.color}`, color: sm.color,
              }}>
                {sm.label}
              </span>
            )}
            {isAdmin && (
              <button
                className="btn-danger btn-sm"
                onClick={onDeleteCollege}
                title="Delete college"
                style={{ padding: '0.3rem 0.6rem', fontSize: 'var(--text-xs)' }}
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Exploration task row */}
        <div style={{
          marginTop: 'var(--space-4)',
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-surface-offset)',
          border: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
        }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-faint)' }}>
            Exploration
          </span>
          {college.explorationTaskId ? (
            <Link
              to={`/tasks/${college.explorationTaskId}`}
              style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}
            >
              View College Research Task →
            </Link>
          ) : isAdmin ? (
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              No exploration task yet — create a{' '}
              <Link to="/admin" style={{ color: 'var(--color-primary)' }}>
                College Research task
              </Link>{' '}
              for {college.shortName}, then link it here.
            </span>
          ) : (
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-faint)' }}>Not assigned yet.</span>
          )}
        </div>

        {/* Notes */}
        <div style={{ marginTop: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-faint)' }}>Notes</span>
            {isAdmin && !editNotes && (
              <button className="btn-ghost btn-sm" onClick={() => setEditNotes(true)}>Edit</button>
            )}
          </div>
          {editNotes ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <textarea
                className="input-base"
                rows={3}
                value={notesVal}
                onChange={e => setNotesVal(e.target.value)}
                placeholder="Admin notes about this college…"
                style={{ resize: 'vertical' }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button className="btn-primary btn-sm" onClick={saveNotes}>Save</button>
                <button className="btn-ghost btn-sm" onClick={() => { setEditNotes(false); setNotesVal(college.notes || ''); }}>Cancel</button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 'var(--text-sm)', color: college.notes ? 'var(--color-text)' : 'var(--color-text-faint)', margin: 0, whiteSpace: 'pre-wrap' }}>
              {college.notes || 'No notes.'}
            </p>
          )}
        </div>
      </div>

      {/* ── General Tasks ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-faint)' }}>
            General Tasks
          </span>
          {isAdmin && (
            <button className="btn-outline btn-sm" onClick={() => setAddTaskOpen('general')}>+ Add</button>
          )}
        </div>
        {generalTasks.length === 0 ? (
          <div style={{ padding: 'var(--space-4)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-faint)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
            No general tasks.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {generalTasks.map(t => (
              <TaskRow
                key={t.id}
                task={t}
                isAdmin={isAdmin}
                onUpdate={patch => onUpdateTask(t.id, patch)}
                onDelete={() => onDeleteTask(t.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── College-Specific Tasks Table ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-faint)' }}>
            College-Specific Tasks
          </span>
          {isAdmin && (
            <button className="btn-outline btn-sm" onClick={() => setAddTaskOpen('specific')}>+ Add</button>
          )}
        </div>

        {specificTasks.length === 0 ? (
          <div style={{ padding: 'var(--space-4)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-faint)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
            No tasks yet.
          </div>
        ) : (
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
          }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 110px 110px 100px 60px',
              gap: 'var(--space-3)',
              padding: 'var(--space-2) var(--space-4)',
              background: 'var(--color-surface-offset)',
              borderBottom: '1px solid var(--color-border)',
            }}>
              {['Task', 'Type', 'Status', 'Due Date', ''].map(h => (
                <span key={h} style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-faint)' }}>
                  {h}
                </span>
              ))}
            </div>
            {/* Rows */}
            {specificTasks.map((t, i) => (
              <TaskTableRow
                key={t.id}
                task={t}
                isAdmin={isAdmin}
                isLast={i === specificTasks.length - 1}
                onUpdate={patch => onUpdateTask(t.id, patch)}
                onDelete={() => onDeleteTask(t.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {addTaskOpen && (
        <AddTaskModal
          defaultType={addTaskOpen === 'general' ? 'general' : 'email'}
          lockGeneral={addTaskOpen === 'general'}
          onClose={() => setAddTaskOpen(false)}
          onAdd={async (taskData) => {
            await onAddTask(taskData);
            setAddTaskOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Task Row (general area) ──────────────────────────────────────────────────

function TaskRow({ task, isAdmin, onUpdate, onDelete }) {
  const [editing, setEditing]   = useState(false);
  const [title, setTitle]       = useState(task.title);
  const [notes, setNotes]       = useState(task.notes || '');
  const sm = taskStatusMeta(task.status);

  useEffect(() => { setTitle(task.title); setNotes(task.notes || ''); }, [task.id]);

  const save = async () => {
    await onUpdate({ title, notes: notes || null });
    setEditing(false);
  };

  return (
    <div style={{
      padding: 'var(--space-3) var(--space-4)',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
    }}>
      {editing ? (
        <>
          <input className="input-base" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          <textarea className="input-base" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes…" style={{ resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn-primary btn-sm" onClick={save}>Save</button>
            <button className="btn-ghost btn-sm" onClick={() => { setEditing(false); setTitle(task.title); setNotes(task.notes || ''); }}>Cancel</button>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {isAdmin ? (
            <select
              value={task.status}
              onChange={e => onUpdate({ status: e.target.value })}
              style={{
                fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.06em', padding: '0.15rem 0.4rem',
                background: 'var(--color-surface-offset)',
                border: `1px solid ${sm.color}`,
                color: sm.color,
                cursor: 'pointer',
              }}
            >
              {TASK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          ) : (
            <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0.15rem 0.4rem', background: 'var(--color-surface-offset)', border: `1px solid ${sm.color}`, color: sm.color }}>
              {sm.label}
            </span>
          )}
          <span style={{ flex: 1, fontSize: 'var(--text-sm)', fontWeight: 600, color: task.status === 'done' ? 'var(--color-text-muted)' : 'var(--color-text)', textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
            {task.title}
          </span>
          {task.notes && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', fontStyle: 'italic', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.notes}
            </span>
          )}
          {isAdmin && (
            <div style={{ display: 'flex', gap: 'var(--space-1)', marginLeft: 'auto' }}>
              <button className="btn-ghost btn-sm" onClick={() => setEditing(true)} style={{ fontSize: 'var(--text-xs)' }}>Edit</button>
              <button className="btn-danger btn-sm" onClick={onDelete} style={{ fontSize: 'var(--text-xs)' }}>✕</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Task Table Row (specific tasks) ─────────────────────────────────────────

function TaskTableRow({ task, isAdmin, isLast, onUpdate, onDelete }) {
  const [editTitle, setEditTitle] = useState(false);
  const [titleVal, setTitleVal]   = useState(task.title);
  const tm = taskTypeMeta(task.type);
  const sm = taskStatusMeta(task.status);

  useEffect(() => { setTitleVal(task.title); }, [task.id]);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 110px 110px 100px 60px',
      gap: 'var(--space-3)',
      padding: 'var(--space-3) var(--space-4)',
      borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
      alignItems: 'center',
      transition: 'background var(--transition-interactive)',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-offset)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Title */}
      {editTitle ? (
        <input
          className="input-base"
          value={titleVal}
          autoFocus
          onChange={e => setTitleVal(e.target.value)}
          onBlur={async () => { await onUpdate({ title: titleVal }); setEditTitle(false); }}
          onKeyDown={e => { if (e.key === 'Enter') { onUpdate({ title: titleVal }); setEditTitle(false); } if (e.key === 'Escape') { setTitleVal(task.title); setEditTitle(false); } }}
          style={{ fontSize: 'var(--text-sm)' }}
        />
      ) : (
        <span
          style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: task.status === 'done' ? 'var(--color-text-muted)' : 'var(--color-text)', textDecoration: task.status === 'done' ? 'line-through' : 'none', cursor: isAdmin ? 'text' : 'default' }}
          onClick={() => isAdmin && setEditTitle(true)}
          title={isAdmin ? 'Click to edit' : undefined}
        >
          {task.title}
        </span>
      )}

      {/* Type */}
      {isAdmin ? (
        <select
          value={task.type}
          onChange={e => onUpdate({ type: e.target.value })}
          style={{ fontSize: 'var(--text-xs)', fontWeight: 700, padding: '0.2rem 0.4rem', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', cursor: 'pointer' }}
        >
          {TASK_TYPES.filter(t => t.value !== 'general').map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      ) : (
        <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-faint)' }}>
          {tm.label}
        </span>
      )}

      {/* Status */}
      {isAdmin ? (
        <select
          value={task.status}
          onChange={e => onUpdate({ status: e.target.value })}
          style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0.2rem 0.4rem', background: 'var(--color-surface-offset)', border: `1px solid ${sm.color}`, color: sm.color, cursor: 'pointer' }}
        >
          {TASK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      ) : (
        <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: sm.color }}>
          {sm.label}
        </span>
      )}

      {/* Due Date */}
      {isAdmin ? (
        <input
          type="date"
          className="input-base"
          value={task.dueDate || ''}
          onChange={e => onUpdate({ dueDate: e.target.value || null })}
          style={{ fontSize: 'var(--text-xs)', padding: '0.2rem 0.4rem' }}
        />
      ) : (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
          {task.dueDate ? new Date(task.dueDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
        </span>
      )}

      {/* Actions */}
      {isAdmin ? (
        <button className="btn-danger btn-sm" onClick={onDelete} style={{ fontSize: 'var(--text-xs)', padding: '0.2rem 0.5rem' }}>✕</button>
      ) : (
        <span />
      )}
    </div>
  );
}

// ─── Add Task Modal ───────────────────────────────────────────────────────────

function AddTaskModal({ defaultType, lockGeneral, onClose, onAdd }) {
  const [form, setForm] = useState({
    title: '',
    type: defaultType || 'general',
    status: 'pending',
    dueDate: '',
    notes: '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState(null);

  const submit = async () => {
    if (!form.title.trim()) { setErr('Title is required.'); return; }
    setBusy(true); setErr(null);
    try {
      await onAdd({ ...form, dueDate: form.dueDate || null, notes: form.notes || null });
    } catch { setErr('Failed to add task.'); setBusy(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1001,
      background: 'oklch(0 0 0 / 0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-4)',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        width: '100%', maxWidth: 440,
        boxShadow: 'var(--shadow-lg)',
        padding: 'var(--space-6)',
        display: 'flex', flexDirection: 'column', gap: 'var(--space-4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>Add Task</div>
          <button className="btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <FieldRow label="Title">
          <input
            className="input-base" autoFocus
            placeholder="e.g. Email admissions about CS program"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
        </FieldRow>

        <FieldRow label="Type">
          <select
            className="input-base"
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            disabled={lockGeneral}
          >
            {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </FieldRow>

        <FieldRow label="Status">
          <select
            className="input-base"
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
          >
            {TASK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </FieldRow>

        <FieldRow label="Due Date (optional)">
          <input
            type="date" className="input-base"
            value={form.dueDate}
            onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
          />
        </FieldRow>

        <FieldRow label="Notes (optional)">
          <textarea
            className="input-base" rows={2}
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Any details…"
            style={{ resize: 'vertical' }}
          />
        </FieldRow>

        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <button className="btn-primary btn-sm" onClick={submit} disabled={busy}>
            {busy ? 'Adding…' : 'Add Task'}
          </button>
          <button className="btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          {err && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)', fontWeight: 600 }}>{err}</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function FieldRow({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
