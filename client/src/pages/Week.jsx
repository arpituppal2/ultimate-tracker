import { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import { EmptyState, PageHeader, TaskRow } from '../components/TaskSurface';
import { getTaskCategoryLabel } from '../utils/taskPresentation';

const PAGE_SIZE = 200;

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

export default function Week() {
  const [payload, setPayload] = useState({ tasks: [], total: 0, take: PAGE_SIZE, skip: 0 });
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        params.set('take', String(PAGE_SIZE));
        params.set('skip', String(pageIndex * PAGE_SIZE));
        if (query.trim()) params.set('q', query.trim());
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (categoryFilter !== 'all') params.set('category', categoryFilter);

        const response = await api.get(`/tasks?${params.toString()}`);
        if (!cancelled) {
          setPayload(response.data || { tasks: [], total: 0, take: PAGE_SIZE, skip: 0 });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || 'Failed to load tasks.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [query, statusFilter, categoryFilter, pageIndex]);

  const categoryOptions = useMemo(() => {
    const options = new Map();
    for (const task of payload.tasks || []) {
      if (!task.category) continue;
      options.set(task.category, displayCategoryLabel(task));
    }

    return [
      { value: 'all', label: 'All Categories' },
      ...Array.from(options.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [payload.tasks]);

  const total = payload.total || 0;
  const pageStart = total === 0 ? 0 : pageIndex * PAGE_SIZE + 1;
  const pageEnd = Math.min(total, (pageIndex + 1) * PAGE_SIZE);
  const hasPrevious = pageIndex > 0;
  const hasNext = pageEnd < total;

  return (
    <div style={{ paddingTop: 'var(--space-6)' }}>
      <PageHeader
        eyebrow="All Tasks"
        title="All Tasks"
        meta={total > 0 ? `${pageStart}-${pageEnd} of ${total}` : '0'}
      />

      {error && (
        <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--color-error)', background: 'var(--color-error-highlight)', color: 'var(--color-error)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gap: 'var(--space-3)', gridTemplateColumns: 'minmax(220px, 1.8fr) repeat(2, minmax(180px, 0.8fr))', marginBottom: 'var(--space-5)' }}>
        <input
          value={query}
          onChange={event => {
            setPageIndex(0);
            setQuery(event.target.value);
          }}
          className="input-base"
          placeholder="Search title, description, category"
        />
        <select
          value={statusFilter}
          onChange={event => {
            setPageIndex(0);
            setStatusFilter(event.target.value);
          }}
          className="input-base"
        >
          {['all', 'pending', 'in_progress', 'pending_review', 'done', 'needs_revision', 'late', 'missing'].map(option => (
            <option key={option} value={option}>
              {option === 'all' ? 'All Statuses' : option}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={event => {
            setPageIndex(0);
            setCategoryFilter(event.target.value);
          }}
          className="input-base"
        >
          {categoryOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
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
      ) : (payload.tasks || []).length === 0 ? (
        <EmptyState text="No tasks match the current filters." />
      ) : (
        <div style={{ display: 'grid', gap: '1px' }}>
          {(payload.tasks || []).map(task => (
            <TaskRow key={task.id} task={{ ...task, categoryLabel: displayCategoryLabel(task) }} showWeekday />
          ))}
        </div>
      )}

      {!loading && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-5)' }}>
          <button className="btn-outline btn-sm" onClick={() => setPageIndex(prev => Math.max(prev - 1, 0))} disabled={!hasPrevious}>
            Previous
          </button>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>
            {pageStart}-{pageEnd} of {total}
          </div>
          <button className="btn-outline btn-sm" onClick={() => setPageIndex(prev => prev + 1)} disabled={!hasNext}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
