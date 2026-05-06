import { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import { EmptyState, PageHeader, SectionTitle, TaskRow } from '../components/TaskSurface';
import { getTaskCategoryLabel } from '../utils/taskPresentation';

function weekLabel(task) {
  if (task.week?.weekNumber) return `Week ${task.week.weekNumber}`;
  if (task.weekNum) return `Week ${task.weekNum}`;
  return 'Unassigned';
}

export default function MasterPlan() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/tasks')
      .then(response => setTasks(Array.isArray(response.data) ? response.data : []))
      .catch(err => setError(err.response?.data?.error || 'Failed to load master plan.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(task =>
      String(task.title || '').toLowerCase().includes(q) ||
      String(getTaskCategoryLabel(task) || '').toLowerCase().includes(q) ||
      String(task.week?.label || '').toLowerCase().includes(q)
    );
  }, [tasks, search]);

  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach(task => {
      const key = task.week?.id || task.weekId || weekLabel(task);
      if (!map.has(key)) map.set(key, { label: weekLabel(task), tasks: [] });
      map.get(key).tasks.push(task);
    });
    return Array.from(map.values()).sort((a, b) => {
      const aNum = Number(a.label.replace(/\D+/g, '')) || 0;
      const bNum = Number(b.label.replace(/\D+/g, '')) || 0;
      return aNum - bNum;
    });
  }, [filtered]);

  return (
    <div style={{ paddingTop: 'var(--space-6)' }}>
      <PageHeader eyebrow="Master Plan" title="Master Plan" />

      <div style={{ marginBottom: 'var(--space-5)' }}>
        <input
          className="input-base"
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Search title, category, or week"
          style={{ maxWidth: 360 }}
        />
      </div>

      {error && (
        <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--color-error)', background: 'var(--color-error-highlight)', color: 'var(--color-error)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {[1, 2, 3].map(item => (
            <div key={item} className="surface-card" style={{ padding: 'var(--space-4)' }}>
              <div className="skeleton skeleton-text" />
            </div>
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <EmptyState text="No tasks match the current search." />
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
          {grouped.map(group => (
            <section key={group.label}>
              <SectionTitle
                title={group.label}
                count={group.tasks.length}
                right={group.tasks.length > 12 ? (
                  <button
                    className="btn-ghost btn-sm"
                    onClick={() => setExpandedWeeks(prev => ({ ...prev, [group.label]: !prev[group.label] }))}
                  >
                    {expandedWeeks[group.label] ? 'Collapse' : 'Show All'}
                  </button>
                ) : null}
              />
              <div style={{ display: 'grid', gap: '1px' }}>
                {(expandedWeeks[group.label] ? group.tasks : group.tasks.slice(0, 12)).map(task => (
                  <TaskRow key={task.id} task={task} showWeekday />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
