import { useEffect, useState } from 'react';
import api from '../utils/api';
import { EmptyState, PageHeader, SectionTitle, TaskRow, formatMoney } from '../components/TaskSurface';

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', padding: 'var(--space-4)' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: '0.3rem' }}>
        {label}
      </div>
      <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: color || 'var(--color-text)' }}>
        {value}
      </div>
      {sub && (
        <div style={{ marginTop: '0.2rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/ledger/summary')
      .then(response => setSummary(response.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  const statusCounts = summary?.statusCounts || {};

  return (
    <div style={{ paddingTop: 'var(--space-6)' }}>
      <PageHeader eyebrow="Analytics" title="Analytics" />

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
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1px', background: 'var(--color-border)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-6)' }}>
            <StatCard label="Current Balance" value={formatMoney(summary?.balanceCents || 0)} color={(summary?.balanceCents || 0) < 0 ? 'var(--color-error)' : 'var(--color-text)'} />
            <StatCard label="Total Earned" value={formatMoney(summary?.totalEarnedCents || 0)} color="var(--color-success)" />
            <StatCard label="Total Penalties" value={formatMoney(summary?.totalPenaltyCents || 0)} color="var(--color-error)" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1px', background: 'var(--color-border)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-6)' }}>
            <StatCard label="Pending" value={statusCounts.pending || 0} />
            <StatCard label="In Progress" value={statusCounts.in_progress || 0} />
            <StatCard label="Submitted" value={statusCounts.pending_review || 0} />
            <StatCard label="Approved" value={statusCounts.done || 0} />
            <StatCard label="Rejected" value={statusCounts.needs_revision || 0} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
            <section>
              <SectionTitle title="Overdue Tasks" count={summary?.overdueTasks?.length || 0} />
              {summary?.overdueTasks?.length ? (
                <div style={{ display: 'grid', gap: '1px' }}>
                  {summary.overdueTasks.map(task => (
                    <TaskRow key={task.id} task={{ ...task, isOverdue: true }} />
                  ))}
                </div>
              ) : (
                <EmptyState text="No overdue tasks." />
              )}
            </section>

            <section>
              <SectionTitle title="Monetary Outcomes" />
              <div style={{ display: 'grid', gap: '1px', border: '1px solid var(--color-border)', background: 'var(--color-border)' }}>
                {[
                  ['On Time', summary?.onTimeCount || 0],
                  ['Late', summary?.lateCount || 0],
                  ['Missed', summary?.missedCount || 0],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface)' }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{label}</span>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
