import { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import { EmptyState, PageHeader, SectionTitle, TaskRow } from '../components/TaskSurface';
import { getTaskCategoryLabel } from '../utils/taskPresentation';

function weekQuarterLabel(week, quarter) {
  const parts = [];
  if (week?.weekNumber) parts.push(`Week ${week.weekNumber}`);
  if (quarter?.label) parts.push(quarter.label);
  return parts.join(' · ');
}

export default function Today() {
  const [payload, setPayload] = useState({ tasks: [], week: null, quarter: null, focusLine: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/tasks/today')
      .then(response => setPayload(response.data || { tasks: [] }))
      .catch(err => setError(err.response?.data?.error || 'Failed to load tasks.'))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const groups = new Map();
    const tasks = Array.isArray(payload.tasks) ? payload.tasks : [];
    tasks.forEach(task => {
      const label = getTaskCategoryLabel(task);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(task);
    });

    return Array.from(groups.entries())
      .map(([label, tasks]) => ({
        label,
        tasks: [...tasks].sort((a, b) => {
          const dueA = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
          const dueB = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
          if (dueA !== dueB) return dueA - dueB;
          return String(a.title).localeCompare(String(b.title));
        }),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [payload.tasks]);

  const overdueCount = (payload.tasks || []).filter(task => task.isOverdue).length;

  return (
    <div style={{ paddingTop: 'var(--space-6)' }}>
      <PageHeader
        eyebrow="Today"
        title="Today"
        meta={weekQuarterLabel(payload.week, payload.quarter)}
        submeta={payload.focusLine}
      />

      {error && (
        <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--color-error)', background: 'var(--color-error-highlight)', color: 'var(--color-error)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {[1, 2, 3, 4].map(item => (
            <div key={item} className="surface-card" style={{ padding: 'var(--space-4)' }}>
              <div className="skeleton skeleton-text" />
            </div>
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <EmptyState text="Nothing due today." />
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
          {grouped.map(group => (
            <section key={group.label}>
              <SectionTitle title={group.label} count={group.tasks.length} />
              <div style={{ display: 'grid', gap: '1px' }}>
                {group.tasks.map(task => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {!loading && grouped.length > 0 && overdueCount > 0 && (
        <div style={{ marginTop: 'var(--space-5)', fontSize: 'var(--text-xs)', color: 'var(--color-warning)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>
          {overdueCount} overdue
        </div>
      )}
    </div>
  );
}
