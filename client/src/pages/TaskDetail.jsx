import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { PageHeader, StatusChip, formatMoney } from '../components/TaskSurface';
import { getRequiredFieldKeys, getTaskFormSpec } from '../utils/taskFormSpecs';
import { collectProofLinks, getTemplateDescriptor } from '../utils/templateRegistry';

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 'var(--space-1)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function renderInput(field, value, onChange) {
  if (field.type === 'textarea') {
    return (
      <textarea
        className="input-base"
        value={value ?? ''}
        onChange={event => onChange(event.target.value)}
        rows={field.rows || 3}
        style={{ resize: 'vertical', width: '100%' }}
      />
    );
  }

  if (field.type === 'checkbox') {
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
        <input type="checkbox" checked={Boolean(value)} onChange={event => onChange(event.target.checked)} />
        {field.label}
      </label>
    );
  }

  if (field.type === 'select') {
    return (
      <select className="input-base" value={value ?? ''} onChange={event => onChange(event.target.value)}>
        <option value="">Select</option>
        {(field.options || []).map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  }

  return (
    <input
      className="input-base"
      value={value ?? ''}
      onChange={event => onChange(event.target.value)}
      type={field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'}
    />
  );
}

function weekQuarterLabel(task) {
  const parts = [];
  if (task.week?.weekNumber) parts.push(`Week ${task.week.weekNumber}`);
  if (task.quarter?.label) parts.push(task.quarter.label);
  return parts.join(' · ');
}

function shouldHideResourceLink(task, descriptor) {
  if (descriptor?.hideAssignmentLink) return true;
  const url = String(task?.resourceUrl || '');
  if (!url) return false;
  return url.includes('khanacademy.org/search?page_search_query=')
    || url.includes('score%20distributions%20AP%20Central');
}

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const canEditTask = user?.role === 'admin' || user?.role === 'parent';

  const [task, setTask] = useState(null);
  const [formData, setFormData] = useState({});
  const [proofLinksText, setProofLinksText] = useState('');
  const [notes, setNotes] = useState('');
  const [adminFields, setAdminFields] = useState({ dueDate: '', status: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [deletingTask, setDeletingTask] = useState(false);
  const loadedRef = useRef(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    api.get(`/tasks/${id}`)
      .then(response => {
        const nextTask = response.data;
        const latestSubmission = nextTask.submissions?.[0];

        setTask(nextTask);
        setFormData(
          nextTask.savedData && Object.keys(nextTask.savedData).length > 0
            ? nextTask.savedData
            : latestSubmission?.templateData && Object.keys(latestSubmission.templateData).length > 0
              ? latestSubmission.templateData
              : nextTask.templatePrefill || {}
        );
        setProofLinksText((latestSubmission?.driveLinks || []).join('\n'));
        setNotes(latestSubmission?.notes || '');
        setAdminFields({
          dueDate: nextTask.dueDate ? nextTask.dueDate.slice(0, 10) : '',
          status: nextTask.status || 'pending',
        });
        loadedRef.current = true;
        dirtyRef.current = false;
      })
      .catch(() => navigate('/dashboard', { replace: true }));
  }, [id, navigate]);

  const descriptor = useMemo(() => getTemplateDescriptor(task), [task]);
  const TemplateComponent = descriptor?.Component || null;
  const spec = useMemo(() => (TemplateComponent ? null : getTaskFormSpec(task)), [task, TemplateComponent]);
  const requiredKeys = useMemo(
    () => descriptor?.requiredKeys || getRequiredFieldKeys(task),
    [descriptor, task]
  );
  const missingKeys = useMemo(
    () => requiredKeys.filter(key => {
      const value = formData?.[key];
      if (Array.isArray(value)) return value.filter(Boolean).length === 0;
      return !value;
    }),
    [requiredKeys, formData]
  );

  useEffect(() => {
    if (!isStudent || !loadedRef.current || !task) return;
    if (!dirtyRef.current) return;
    if (['pending_review', 'done', 'missing'].includes(task.status)) return;
    const timer = window.setTimeout(() => {
      api.patch(`/tasks/${id}/save`, { savedData: formData }).catch(() => {});
    }, 700);
    return () => window.clearTimeout(timer);
  }, [formData, id, isStudent, task]);

  function updateFormValue(key, value) {
    dirtyRef.current = true;
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  function updateTemplateData(nextData) {
    dirtyRef.current = true;
    setFormData(nextData || {});
  }

  const latestSubmission = task?.submissions?.[0] || null;
  const templateHeading = descriptor
    ? (task.templatePrefill?.templateLabel || descriptor.key.replace(/_/g, ' '))
    : spec.title;

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      if (!TemplateComponent && missingKeys.length > 0) {
        throw new Error(`Complete: ${missingKeys.join(', ')}`);
      }

      const combinedLinks = Array.from(new Set([
        ...collectProofLinks(formData),
        ...proofLinksText.split('\n').map(item => item.trim()).filter(Boolean),
      ]));

      if (task?.requiresProof && combinedLinks.length === 0) {
        throw new Error('Add at least one proof link.');
      }

      await api.post('/submissions', {
        taskId: id,
        templateData: formData,
        driveLinks: combinedLinks,
        notes,
      });
      setProofLinksText(combinedLinks.join('\n'));
      setMessage('Submitted for review.');
      const refreshed = await api.get(`/tasks/${id}`);
      setTask(refreshed.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAdminSave() {
    setSavingAdmin(true);
    setError('');
    setMessage('');
    try {
      await api.patch(`/tasks/${id}`, {
        dueDate: adminFields.dueDate || null,
        status: adminFields.status,
      });
      const refreshed = await api.get(`/tasks/${id}`);
      setTask(refreshed.data);
      setMessage('Task updated.');
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed.');
    } finally {
      setSavingAdmin(false);
    }
  }

  async function handleDeleteTask() {
    if (!canEditTask) return;
    const confirmed = window.confirm('Delete this task?');
    if (!confirmed) return;

    setDeletingTask(true);
    setError('');
    setMessage('');
    try {
      await api.delete(`/tasks/${id}`);
      navigate('/week', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed.');
      setDeletingTask(false);
    }
  }

  if (!task) {
    return (
      <div style={{ paddingTop: 'var(--space-6)' }}>
        <div className="skeleton skeleton-heading" style={{ width: '40%', marginBottom: 'var(--space-3)' }} />
        <div className="skeleton skeleton-text" style={{ width: '60%' }} />
      </div>
    );
  }

  const hideResourceLink = shouldHideResourceLink(task, descriptor);

  return (
    <div style={{ paddingTop: 'var(--space-6)' }}>
      <button onClick={() => navigate(-1)} className="btn-ghost btn-sm" style={{ marginBottom: 'var(--space-5)' }}>
        Back
      </button>

      <PageHeader
        title={task.title}
        meta={weekQuarterLabel(task)}
        submeta={task.description}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
        <StatusChip status={task.status} />
        <span style={{ padding: '0.18rem 0.48rem', border: '1px solid var(--color-border)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-faint)' }}>
          Reward {formatMoney(task.rewardCents)}
        </span>
        <span style={{ padding: '0.18rem 0.48rem', border: '1px solid var(--color-border)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-faint)' }}>
          Late {formatMoney(-task.penaltyLateCents)}
        </span>
        <span style={{ padding: '0.18rem 0.48rem', border: '1px solid var(--color-border)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-faint)' }}>
          Miss {formatMoney(-task.penaltyMissCents)}
        </span>
      </div>

      {(task.templatePrefill?.assignment || task.templatePrefill?.instructions || task.templatePrefill?.checklist?.length || (!hideResourceLink && task.resourceUrl)) && (
        <div style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 'var(--space-2)' }}>
            Assignment
          </div>
          {task.templatePrefill?.assignment && (
            <div style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 1.55 }}>
              {task.templatePrefill.assignment}
            </div>
          )}
          {task.templatePrefill?.instructions && (
            <div style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.55 }}>
              {task.templatePrefill.instructions}
            </div>
          )}
          {Array.isArray(task.templatePrefill?.checklist) && task.templatePrefill.checklist.length > 0 && (
            <div style={{ display: 'grid', gap: '0.2rem', marginBottom: 'var(--space-2)' }}>
              {task.templatePrefill.checklist.map(item => (
                <div key={item} style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
                  {item}
                </div>
              ))}
            </div>
          )}
          {!hideResourceLink && task.resourceUrl && (
            <a href={task.resourceUrl} target="_blank" rel="noreferrer" className="link-accent">
              {task.resourceUrl}
            </a>
          )}
        </div>
      )}

      {canEditTask && (
        <div style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 'var(--space-3)' }}>
            Admin
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <Field label="Due date">
              <input className="input-base" type="date" value={adminFields.dueDate} onChange={event => setAdminFields(prev => ({ ...prev, dueDate: event.target.value }))} />
            </Field>
            <Field label="Status">
              <select className="input-base" value={adminFields.status} onChange={event => setAdminFields(prev => ({ ...prev, status: event.target.value }))}>
                {['pending', 'in_progress', 'pending_review', 'done', 'needs_revision', 'late', 'missing'].map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn-primary btn-sm" onClick={handleAdminSave} disabled={savingAdmin}>
              {savingAdmin ? 'Saving…' : 'Save'}
            </button>
            <button className="btn-outline btn-sm" onClick={handleDeleteTask} disabled={deletingTask}>
              {deletingTask ? 'Deleting…' : 'Delete task'}
            </button>
          </div>
        </div>
      )}

      <div style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 'var(--space-4)' }}>
          {templateHeading}
        </div>

        {TemplateComponent ? (
          <TemplateComponent data={formData} onChange={updateTemplateData} task={task} />
        ) : (
          spec.sections.map(section => (
            <section key={section.title} style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ marginBottom: 'var(--space-3)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-faint)' }}>
                {section.title}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
                {section.fields.map(field => (
                  <div key={field.key} style={field.type === 'textarea' ? { gridColumn: '1 / -1' } : undefined}>
                    <Field label={field.type === 'checkbox' ? 'Checklist' : field.required ? `${field.label} *` : field.label}>
                      {renderInput(field, formData[field.key], value => updateFormValue(field.key, value))}
                    </Field>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}

        <Field label="Proof Links">
          <textarea
            className="input-base"
            rows={3}
            value={proofLinksText}
            onChange={event => setProofLinksText(event.target.value)}
            placeholder="One link per line"
            style={{ resize: 'vertical', width: '100%' }}
          />
        </Field>

        <Field label="Notes">
          <textarea
            className="input-base"
            rows={3}
            value={notes}
            onChange={event => setNotes(event.target.value)}
            style={{ resize: 'vertical', width: '100%' }}
          />
        </Field>
      </div>

      {latestSubmission && (
        <div style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 'var(--space-3)' }}>
            Latest Submission
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <StatusChip status={latestSubmission.status === 'approved' ? 'done' : latestSubmission.status} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
              {new Date(latestSubmission.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          {latestSubmission.feedbacks?.length > 0 && (
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              {latestSubmission.feedbacks.map(feedback => (
                <div key={feedback.id} style={{ padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--color-border)', background: 'var(--color-surface-offset)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  {feedback.note}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--color-error)', background: 'var(--color-error-highlight)', color: 'var(--color-error)' }}>
          {error}
        </div>
      )}
      {message && (
        <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--color-success)', background: 'var(--color-success-highlight)', color: 'var(--color-success)' }}>
          {message}
        </div>
      )}

      {isStudent && (
        <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit for review'}
        </button>
      )}
    </div>
  );
}
