import { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import { EmptyState, PageHeader, SectionTitle, TaskRow } from '../components/TaskSurface';
import { getTaskCategoryLabel } from '../utils/taskPresentation';

function weekdayLabel(dateLike) {
  return new Date(dateLike).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function weekQuarterLabel(week, quarter) {
  const parts = [];
  if (week?.weekNumber) parts.push(`Week ${week.weekNumber}`);
  if (quarter?.label) parts.push(quarter.label);
  return parts.join(' · ');
}

export default function Week() {
  const [payload, setPayload] = useState({ tasks: [], week: null, quarter: null, focusLine: '' });
  const [groupMode, setGroupMode] = useState('day');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/tasks/week')
      .then(response => setPayload(response.data || { tasks: [] }))
      .catch(err => setError(err.response?.data?.error || 'Failed to load weekly tasks.'))
      .finally(() => setLoading(false));
  }, []);

  const categoryOptions = useMemo(() => {
    const labels = new Set((payload.tasks || []).map(task => getTaskCategoryLabel(task)));
    return ['all', ...Array.from(labels).sort((a, b) => a.localeCompare(b))];
  }, [payload.tasks]);

  const filteredTasks = useMemo(() => {
    return (payload.tasks || []).filter(task => {
      if (statusFilter === 'overdue' && !task.isOverdue) return false;
      if (statusFilter === 'on_track' && task.isOverdue) return false;
      if (categoryFilter !== 'all' && getTaskCategoryLabel(task) !== categoryFilter) return false;
      return true;
    });
  }, [payload.tasks, statusFilter, categoryFilter]);

  const grouped = useMemo(() => {
    const keyForTask = task => groupMode === 'day' ? weekdayLabel(task.dueDate) : getTaskCategoryLabel(task);
    const map = new Map();
    filteredTasks.forEach(task => {
      const key = keyForTask(task);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(task);
    });

    return Array.from(map.entries())
      .map(([label, tasks]) => ({
        label,
        tasks: [...tasks].sort((a, b) => {
          const dueA = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
          const dueB = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
          if (dueA !== dueB) return dueA - dueB;
          return String(a.title).localeCompare(String(b.title));
        }),
      }))
      .sort((a, b) => a.tasks[0]?.dueDate && b.tasks[0]?.dueDate
        ? new Date(a.tasks[0].dueDate) - new Date(b.tasks[0].dueDate)
        : a.label.localeCompare(b.label));
  }, [filteredTasks, groupMode]);

  return (
    <div style={{ paddingTop: 'var(--space-6)' }}>
      <PageHeader
        eyebrow="Week"
        title="This Week"
        meta={weekQuarterLabel(payload.week, payload.quarter)}
        submeta={payload.focusLine}
      />

      {error && (
        <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--color-error)', background: 'var(--color-error-highlight)', color: 'var(--color-error)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
        {[
          { key: 'all', label: 'All' },
          { key: 'overdue', label: 'Overdue' },
          { key: 'on_track', label: 'On Track' },
        ].map(option => (
          <button
            key={option.key}
            className={['btn-tab', statusFilter === option.key ? 'btn-tab--active' : ''].join(' ')}
            onClick={() => setStatusFilter(option.key)}
          >
            {option.label}
          </button>
        ))}

        <div style={{ width: 1, background: 'var(--color-border)', marginInline: '0.15rem' }} />

        {[
          { key: 'day', label: 'By Day' },
          { key: 'category', label: 'By Category' },
        ].map(option => (
          <button
            key={option.key}
            className={['btn-tab', groupMode === option.key ? 'btn-tab--active' : ''].join(' ')}
            onClick={() => setGroupMode(option.key)}
          >
            {option.label}
          </button>
        ))}

        <select
          value={categoryFilter}
          onChange={event => setCategoryFilter(event.target.value)}
          className="input-base"
          style={{ maxWidth: 220, marginLeft: 'auto' }}
        >
          {categoryOptions.map(option => (
            <option key={option} value={option}>
              {option === 'all' ? 'All Categories' : option}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {[1, 2, 3, 4].map(item => (
            <div key={item} className="surface-card" style={{ padding: 'var(--space-4)' }}>
              <div className="skeleton skeleton-text" />
            </div>
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <EmptyState text="No tasks match the current filters." />
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
          {grouped.map(group => (
            <section key={group.label}>
              <SectionTitle title={group.label} count={group.tasks.length} />
              <div style={{ display: 'grid', gap: '1px' }}>
                {group.tasks.map(task => (
                  <TaskRow key={task.id} task={task} showWeekday={groupMode === 'category'} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
