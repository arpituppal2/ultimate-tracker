/*
  TaskWizard.jsx
  Quick-add modal for creating a single task.
  Used by TaskInventory's "+ Add Task" button (admin only).
*/
import { useState } from 'react';
import api from '../utils/api';

const CATEGORIES = ['amc','khan','ap','career','college','redemption','daily','weekly','quarterly'];
const TEMPLATE_TYPES = [
  'default','math_problem_set','reading_log','essay_draft','sat_practice',
  'college_essay','career_project','language_drill','redemption_task',
];

const base = {
  width: '100%', padding: '0.4rem 0.65rem',
  fontSize: 'var(--text-sm)', border: '1px solid var(--color-border)',
  borderRadius: 0, background: 'var(--color-surface)', color: 'var(--color-text)',
  boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
  transition: 'border-color var(--transition-interactive)',
};
const focus = e => { e.target.style.borderColor = 'var(--color-primary)'; };
const blur  = e => { e.target.style.borderColor = 'var(--color-border)'; };

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <label style={{
        display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700,
        letterSpacing: '0.07em', textTransform: 'uppercase',
        color: 'var(--color-text-faint)', marginBottom: 'var(--space-1)',
      }}>
        {label}{required && <span style={{ color: 'var(--color-error)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export default function TaskWizard({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '', category: 'amc', templateType: 'default',
    dueDate: '', requiresProof: true,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState(null);

  const s = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.title.trim()) { setErr('Title is required.'); return; }
    setBusy(true); setErr(null);
    try {
      await api.post('/tasks', {
        title:        form.title.trim(),
        category:     form.category,
        templateType: form.templateType,
        dueDate:      form.dueDate || undefined,
        requiresProof: form.requiresProof,
      });
      onCreated(1);
    } catch (e) {
      setErr(e.response?.data?.error || e.message || 'Failed to create task.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 1000, backdropFilter: 'blur(2px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1001, width: '100%', maxWidth: 480,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        padding: 'var(--space-6)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-faint)' }}>
            Add Task
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-faint)', fontSize: '1.1rem', lineHeight: 1, padding: '0.2rem 0.4rem' }}>
            ✕
          </button>
        </div>

        {err && (
          <div style={{ padding: 'var(--space-2) var(--space-3)', marginBottom: 'var(--space-4)', background: 'var(--color-error-highlight)', color: 'var(--color-error)', fontSize: 'var(--text-xs)', fontWeight: 600, border: '1px solid var(--color-error)' }}>
            {err}
          </div>
        )}

        <Field label="Title" required>
          <input
            value={form.title} onChange={s('title')} placeholder="Task title…"
            style={base} onFocus={focus} onBlur={blur}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            autoFocus
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <Field label="Category" required>
            <select value={form.category} onChange={s('category')} style={{ ...base, cursor: 'pointer' }} onFocus={focus} onBlur={blur}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </Field>
          <Field label="Due Date">
            <input type="date" value={form.dueDate} onChange={s('dueDate')} style={base} onFocus={focus} onBlur={blur} />
          </Field>
        </div>

        <Field label="Template Type">
          <select value={form.templateType} onChange={s('templateType')} style={{ ...base, cursor: 'pointer' }} onFocus={focus} onBlur={blur}>
            {TEMPLATE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
        </Field>

        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-5)' }}>
          <input
            type="checkbox" checked={form.requiresProof}
            onChange={e => setForm(f => ({ ...f, requiresProof: e.target.checked }))}
            style={{ width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--color-primary)' }}
          />
          Requires proof / submission
        </label>

        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
          <button className="btn-ghost btn-sm" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn-primary btn-sm" onClick={submit} disabled={busy}>
            {busy ? 'Creating…' : 'Create Task'}
          </button>
        </div>
      </div>
    </>
  );
}
