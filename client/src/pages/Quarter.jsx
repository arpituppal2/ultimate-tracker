import { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import { EmptyState, PageHeader, SectionTitle } from '../components/TaskSurface';

function formatRange(startDate, endDate) {
  if (!startDate || !endDate) return '';
  const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${start} – ${end}`;
}

export default function Quarter() {
  const [quarter, setQuarter] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const currentQuarter = await api.get('/quarters/current');
        if (!active) return;
        setQuarter(currentQuarter.data || null);
        if (currentQuarter.data?.id) {
          const taskResponse = await api.get(`/tasks?quarterId=${currentQuarter.data.id}`);
          if (!active) return;
          setTasks(Array.isArray(taskResponse.data) ? taskResponse.data : []);
        } else {
          setTasks([]);
        }
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.error || 'Failed to load quarter view.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const weeks = useMemo(() => {
    const map = new Map();
    tasks.forEach(task => {
      const key = task.week?.id || task.weekId || 'unassigned';
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          label: task.week?.label || key,
          weekNumber: task.week?.weekNumber || task.weekNum || null,
          focus: task.week?.focus || '',
          startDate: task.week?.startDate || null,
          endDate: task.week?.endDate || null,
          tasks: [],
        });
      }
      map.get(key).tasks.push(task);
    });

    return Array.from(map.values()).sort((a, b) => (a.weekNumber || 0) - (b.weekNumber || 0));
  }, [tasks]);

  return (
    <div style={{ paddingTop: 'var(--space-6)' }}>
      <PageHeader
        eyebrow="Quarter"
        title={quarter?.label || 'Quarter'}
        meta={formatRange(quarter?.startDate, quarter?.endDate)}
        submeta={quarter?.description || quarter?.focus}
      />

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
      ) : weeks.length === 0 ? (
        <EmptyState text="No tasks in the current quarter." />
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
          {weeks.map(week => (
            <section key={week.id} style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
              <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
                <SectionTitle
                  title={week.weekNumber ? `Week ${week.weekNumber}` : week.label}
                  count={week.tasks.length}
                  right={
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
                      {formatRange(week.startDate, week.endDate)}
                    </span>
                  }
                />
                {week.focus && (
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                    {week.focus}
                  </div>
                )}
              </div>
              <div style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-2)' }}>
                {week.tasks.slice(0, 8).map(task => (
                  <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                    <span style={{ color: 'var(--color-text)' }}>{task.title}</span>
                    <span style={{ color: 'var(--color-text-faint)', whiteSpace: 'nowrap' }}>
                      {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
                {week.tasks.length > 8 && (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>
                    +{week.tasks.length - 8} more
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
