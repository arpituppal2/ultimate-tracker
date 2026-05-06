import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Q2_WEEKS, Q2_META } from '../utils/q2plan';

const CAT_CONFIG = [
  { key: 'khan',     label: 'Khan Academy',   color: '#16a34a', desc: 'Math units & exercises' },
  { key: 'amc',      label: 'AMC Math',        color: '#2563eb', desc: 'Competition problems' },
  { key: 'ap',       label: 'AP Courses',      color: '#dc2626', desc: 'AP subject work' },
  { key: 'career',   label: 'Career Research', color: '#d97706', desc: 'Career exploration' },
  { key: 'language', label: 'Language',        color: '#7c3aed', desc: 'Michel Thomas French' },
  { key: 'college',  label: 'College Prep',    color: '#0891b2', desc: 'College research' },
];

const STATUS_STYLE = {
  done:           { bg: 'var(--color-success-highlight)',      text: 'var(--color-success)',      label: 'Done'        },
  pending_review: { bg: 'var(--color-gold-highlight)',         text: 'var(--color-gold)',         label: 'In Review'   },
  needs_revision: { bg: 'var(--color-error-highlight)',        text: 'var(--color-error)',        label: 'Revision'    },
  late:           { bg: 'var(--color-warning-highlight)',      text: 'var(--color-warning)',      label: 'Late'        },
  missing:        { bg: 'var(--color-surface-dynamic)',        text: 'var(--color-text-faint)',   label: 'Missing'     },
  pending:        { bg: 'var(--color-surface-offset)',         text: 'var(--color-text-muted)',   label: 'Pending'     },
  in_progress:    { bg: 'var(--color-blue-highlight)',         text: 'var(--color-blue)',         label: 'In Progress' },
  approved:       { bg: 'var(--color-success-highlight)',      text: 'var(--color-success)',      label: 'Approved'    },
  rejected:       { bg: 'var(--color-notification-highlight)', text: 'var(--color-notification)', label: 'Redo'        },
};

function StatCard({ label, value, sub, color, large }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: '0.2rem',
    }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-faint)' }}>
        {label}
      </div>
      <div style={{ fontSize: large ? 'var(--text-2xl, 2rem)' : 'var(--text-xl)', fontWeight: 800, color: color || 'var(--color-text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>{sub}</div>}
    </div>
  );
}

function SubjectCard({ config, stats }) {
  const { done = 0, total = 0, overdue = 0 } = stats;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ marginBottom: '0.2rem' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--color-text)' }}>{config.label}</span>
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>{config.desc}</div>
        </div>
        <span style={{
          fontSize: 'var(--text-lg)', fontWeight: 800,
          color: pct >= 80 ? 'var(--color-success)' : pct >= 40 ? config.color : 'var(--color-text-muted)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {pct}%
        </span>
      </div>

      <div style={{ height: 6, background: 'var(--color-surface-offset)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: config.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
          <strong style={{ color: 'var(--color-success)', fontVariantNumeric: 'tabular-nums' }}>{done.toLocaleString()}</strong> done
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
          <strong style={{ color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums' }}>{total.toLocaleString()}</strong> total
        </span>
        {overdue > 0 && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)', fontWeight: 700 }}>
            {overdue} overdue
          </span>
        )}
      </div>

      <Link to={`/inventory?category=${config.key}`} style={{
        fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
        color: config.color, textDecoration: 'none',
        borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)',
        display: 'block',
      }}>
        View {config.label} tasks →
      </Link>
    </div>
  );
}

function ActivityFeed({ submissions }) {
  if (!submissions.length) {
    return (
      <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
        No recent submissions.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--color-border)' }}>
      {submissions.map(sub => {
        const s = STATUS_STYLE[sub.status] || STATUS_STYLE.pending_review;
        const date = sub.submittedAt
          ? new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
          : '—';
        return (
          <Link
            key={sub.id}
            to={`/tasks/${sub.taskId}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--color-surface)',
              textDecoration: 'none', color: 'inherit',
              transition: 'background var(--transition-interactive)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}
          >
            <span style={{ padding: '0.1rem 0.45rem', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: s.bg, color: s.text, flexShrink: 0 }}>
              {s.label}
            </span>
            <span style={{ flex: 1, fontSize: 'var(--text-sm)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text)' }}>
              {sub.task?.title || `Submission #${sub.id}`}
            </span>
            {sub.feedbackNote && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                "{sub.feedbackNote}"
              </span>
            )}
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', flexShrink: 0 }}>{date}</span>
          </Link>
        );
      })}
    </div>
  );
}

export default function Progress() {
  const [progressStats, setProgressStats] = useState(null);
  const [submissions,   setSubmissions]   = useState([]);
  const [balance,       setBalance]       = useState(null);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/stats/progress'),
      api.get('/submissions'),
      api.get('/ledger'),
    ]).then(([statsRes, subsRes, ledgerRes]) => {
      setProgressStats(statsRes.data);
      setSubmissions(Array.isArray(subsRes.data) ? subsRes.data : []);
      const d = ledgerRes.data;
      const cents = d.balanceCents ?? null;
      setBalance(cents !== null ? cents / 100 : d.balance ?? null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    if (!progressStats) return { total: 0, done: 0, inReview: 0, overdue: 0, pct: 0 };
    const { total, statusMap = {}, overdue = 0 } = progressStats;
    const done     = statusMap.done || 0;
    const inReview = statusMap.pending_review || 0;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, inReview, overdue, pct };
  }, [progressStats]);

  const catCountMap = useMemo(() => {
    if (!progressStats) return {};
    const map = {};
    (progressStats.catCounts || []).forEach(c => { map[c.cat] = c; });
    return map;
  }, [progressStats]);

  const statusOrder = useMemo(() => {
    if (!progressStats) return [];
    const { statusMap = {}, total = 1 } = progressStats;
    const order = ['done', 'pending_review', 'in_progress', 'needs_revision', 'pending', 'late', 'missing'];
    return order
      .filter(s => (statusMap[s] || 0) > 0)
      .map(s => {
        const st = STATUS_STYLE[s] || STATUS_STYLE.pending;
        const count = statusMap[s] || 0;
        const pct = Math.round((count / (total || 1)) * 100);
        return { s, st, count, pct };
      });
  }, [progressStats]);

  const recentSubs = useMemo(() =>
    [...submissions]
      .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
      .slice(0, 12)
  , [submissions]);

  const pendingReview = submissions.filter(s => s.status === 'pending_review').length;

  const todayISO  = new Date().toISOString().slice(0, 10);
  const pastWeeks = Q2_WEEKS.filter(w => todayISO > w.endDate).length;
  const qPct      = Math.round((pastWeeks / Q2_WEEKS.length) * 100);

  return (
    <div style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-10)' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
          <span className="gold-rule" />
          <span className="section-label">{Q2_META.label}</span>
        </div>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
          Progress Report
        </h1>
      </div>

      {/* ── Alert banners ── */}
      {!loading && (stats.overdue > 0 || pendingReview > 0) && (
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
          {stats.overdue > 0 && (
            <Link to="/today" style={{ textDecoration: 'none', flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-error-highlight)', border: '1px solid var(--color-error)', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--color-error)' }}>
                    {stats.overdue} Overdue Task{stats.overdue !== 1 ? 's' : ''}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)', opacity: 0.8 }}>
                    Needs immediate attention →
                  </div>
                </div>
              </div>
            </Link>
          )}
          {pendingReview > 0 && (
            <Link to="/feedback" style={{ textDecoration: 'none', flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-gold-highlight)', border: '1px solid var(--color-gold)', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--color-gold)' }}>
                    {pendingReview} Submission{pendingReview !== 1 ? 's' : ''} Awaiting Review
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gold)', opacity: 0.8 }}>
                    Open review queue →
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* ── Overall stats ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 88 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          <StatCard label="Total Tasks"  value={stats.total.toLocaleString()} />
          <StatCard label="Completed"    value={stats.done.toLocaleString()} color="var(--color-success)" sub={`${stats.pct}% done`} />
          <StatCard label="In Review"    value={stats.inReview.toLocaleString()} color="var(--color-gold)" />
          <StatCard label="Overdue"      value={stats.overdue.toLocaleString()} color={stats.overdue > 0 ? 'var(--color-error)' : 'var(--color-text-muted)'} />
          <StatCard label="Balance"      value={balance !== null ? `${balance >= 0 ? '+' : ''}$${Math.abs(balance).toFixed(2)}` : '—'} color={balance != null && balance >= 0 ? 'var(--color-success)' : 'var(--color-text-muted)'} />
        </div>
      )}

      {/* ── Q2 progress bar ── */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
          <div>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text)' }}>{Q2_META.label}</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginLeft: '0.5rem' }}>{Q2_META.focus}</span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
              Week {pastWeeks} of {Q2_WEEKS.length}
            </span>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--color-gold)', fontVariantNumeric: 'tabular-nums' }}>
              {qPct}% through quarter
            </span>
          </div>
        </div>
        <div style={{ height: 8, background: 'var(--color-surface-offset)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${qPct}%`, background: 'linear-gradient(90deg, var(--color-primary), var(--color-gold))', borderRadius: 4, transition: 'width 0.6s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem' }}>
          <span style={{ fontSize: '0.6rem', color: 'var(--color-text-faint)' }}>{Q2_META.startDate}</span>
          <span style={{ fontSize: '0.6rem', color: 'var(--color-text-faint)' }}>{Q2_META.endDate}</span>
        </div>
      </div>

      {/* ── Subject breakdown ── */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: 'var(--space-4)' }}>
          <span className="gold-rule" />
          <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text)' }}>
            Subject Breakdown
          </h2>
        </div>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 160 }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
            {CAT_CONFIG.map(cfg => (
              <SubjectCard
                key={cfg.key}
                config={cfg}
                stats={catCountMap[cfg.key] || { total: 0, done: 0, overdue: 0 }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Task status breakdown ── */}
      {!loading && statusOrder.length > 0 && (
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: 'var(--space-4)' }}>
            <span className="gold-rule" />
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text)' }}>
              Overall Task Status
            </h2>
          </div>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: 'var(--space-4)' }}>
            {statusOrder.map(({ s, st, count, pct }) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                <span style={{ width: 80, fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: st.text, flexShrink: 0 }}>
                  {st.label}
                </span>
                <div style={{ flex: 1, height: 8, background: 'var(--color-surface-offset)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: st.text, borderRadius: 4, transition: 'width 0.5s ease' }} />
                </div>
                <span style={{ width: 64, fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', textAlign: 'right', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                  {count.toLocaleString()}
                </span>
                <span style={{ width: 36, fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', textAlign: 'right', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                  {pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent activity ── */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="gold-rule" />
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text)' }}>
              Recent Submissions
            </h2>
          </div>
          <Link to="/feedback" style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Review Queue →
          </Link>
        </div>
        <div style={{ border: '1px solid var(--color-border)' }}>
          {loading
            ? [1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 1 }} />)
            : <ActivityFeed submissions={recentSubs} />
          }
        </div>
      </div>

      {/* ── Quick links ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
        {[
          { to: '/today',    label: "Today's Tasks",   desc: "See what's due now" },
          { to: '/quarters', label: 'Quarters',         desc: 'Week-by-week plan' },
          { to: '/feedback', label: 'Review Queue',     desc: 'Approve submissions' },
          { to: '/balance',  label: 'Balance',          desc: 'Earnings & ledger' },
        ].map(({ to, label, desc }) => (
          <Link key={to} to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              padding: 'var(--space-4)', cursor: 'pointer',
              transition: 'background var(--transition-interactive)',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}
            >
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.2rem' }}>{label}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
