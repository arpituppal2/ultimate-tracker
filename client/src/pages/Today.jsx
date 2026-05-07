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

function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function endOfToday() {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  return now;
}

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const dueA = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    const dueB = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    if (dueA !== dueB) return dueA - dueB;
    return String(a.title).localeCompare(String(b.title));
  });
}

function displayCategoryLabel(task) {
  const templateType = String(task?.templateType || '').toLowerCase();
  const source = String(task?.templatePrefill?.source || '').toLowerCase();
  const title = String(task?.title || '').toLowerCase();
  const assignment = String(task?.templatePrefill?.assignment || '').toLowerCase();

  if (templateType.includes('khan') || source.includes('khan') || title.includes('khan') || assignment.includes('khan')) {
    return 'Khan Academy';
  }
  if (title.includes('ap exploration')) {
    return 'AP Exploration';
  }

  return getTaskCategoryLabel(task);
}

function groupByCategory(tasks) {
  const groups = new Map();
  for (const task of sortTasks(tasks)) {
    const label = displayCategoryLabel(task);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(task);
  }

  return Array.from(groups.entries())
    .map(([label, groupedTasks]) => ({ label, tasks: groupedTasks }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function weekdayLabel(dateLike) {
  return new Date(dateLike).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function groupUpcomingByDay(tasks) {
  const groups = new Map();
  for (const task of sortTasks(tasks)) {
    const label = weekdayLabel(task.dueDate);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(task);
  }

  return Array.from(groups.entries()).map(([label, groupedTasks]) => ({
    label,
    tasks: groupedTasks,
  }));
}

export default function Today() {
  const [todayPayload, setTodayPayload] = useState({ tasks: [], week: null, quarter: null, focusLine: '' });
  const [weekPayload, setWeekPayload] = useState({ tasks: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const [todayResponse, weekResponse] = await Promise.all([
          api.get('/tasks/today?take=500'),
          api.get('/tasks/week?take=500'),
        ]);

        if (cancelled) return;
        setTodayPayload(todayResponse.data || { tasks: [] });
        setWeekPayload(weekResponse.data || { tasks: [] });
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || 'Failed to load dashboard.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const todayStart = useMemo(() => startOfToday(), []);
  const todayEnd = useMemo(() => endOfToday(), []);

  const dueTodayTasks = useMemo(() => {
    return sortTasks((todayPayload.tasks || []).filter(task => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) <= todayEnd;
    }));
  }, [todayPayload.tasks, todayEnd]);

  const dueTodayGroups = useMemo(() => groupByCategory(dueTodayTasks), [dueTodayTasks]);

  const upcomingTasks = useMemo(() => {
    const seen = new Set();
    return sortTasks((weekPayload.tasks || []).filter(task => {
      if (!task.dueDate || seen.has(task.id)) return false;
      const dueAt = new Date(task.dueDate);
      if (dueAt <= todayEnd) return false;
      seen.add(task.id);
      return true;
    }));
  }, [weekPayload.tasks, todayEnd]);

  const upcomingGroups = useMemo(() => groupUpcomingByDay(upcomingTasks), [upcomingTasks]);
  const overdueCount = dueTodayTasks.filter(task => task.isOverdue || (task.dueDate && new Date(task.dueDate) < todayStart)).length;

  return (
    <div style={{ paddingTop: 'var(--space-6)' }}>
      <PageHeader
        eyebrow="Dashboard"
        title="Dashboard"
        meta={weekQuarterLabel(todayPayload.week, todayPayload.quarter)}
        submeta={todayPayload.focusLine}
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
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
          <section>
            <SectionTitle title="Due Today" count={dueTodayTasks.length} />
            {dueTodayGroups.length === 0 ? (
              <EmptyState text="Nothing due today." />
            ) : (
              <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
                {dueTodayGroups.map(group => (
                  <section key={group.label}>
                    <SectionTitle title={group.label} count={group.tasks.length} />
                    <div style={{ display: 'grid', gap: '1px' }}>
                      {group.tasks.map(task => (
                        <TaskRow key={task.id} task={{ ...task, categoryLabel: displayCategoryLabel(task) }} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionTitle title="Coming 7 Days" count={upcomingTasks.length} />
            {upcomingGroups.length === 0 ? (
              <EmptyState text="Nothing queued in the next 7 days." />
            ) : (
              <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
                {upcomingGroups.map(group => (
                  <section key={group.label}>
                    <SectionTitle title={group.label} count={group.tasks.length} />
                    <div style={{ display: 'grid', gap: '1px' }}>
                      {group.tasks.map(task => (
                        <TaskRow key={task.id} task={{ ...task, categoryLabel: displayCategoryLabel(task) }} showWeekday />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {!loading && overdueCount > 0 && (
        <div style={{ marginTop: 'var(--space-5)', fontSize: 'var(--text-xs)', color: 'var(--color-warning)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>
          {overdueCount} overdue
        </div>
      )}
    </div>
  );
}
