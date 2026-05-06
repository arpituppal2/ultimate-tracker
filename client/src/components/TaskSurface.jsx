import { Link } from 'react-router-dom';
import { getTaskCategoryLabel } from '../utils/taskPresentation';

const STATUS_META = {
  pending:        { label: 'Pending',     bg: 'var(--color-surface-offset)',     text: 'var(--color-text-muted)' },
  in_progress:    { label: 'In Progress', bg: 'var(--color-blue-highlight)',      text: 'var(--color-blue)' },
  pending_review: { label: 'Submitted',   bg: 'var(--color-gold-highlight)',      text: 'var(--color-gold)' },
  done:           { label: 'Approved',    bg: 'var(--color-success-highlight)',   text: 'var(--color-success)' },
  needs_revision: { label: 'Rejected',    bg: 'var(--color-error-highlight)',     text: 'var(--color-error)' },
  late:           { label: 'Late',        bg: 'var(--color-warning-highlight)',   text: 'var(--color-warning)' },
  missing:        { label: 'Missed',      bg: 'var(--color-error-highlight)',     text: 'var(--color-error)' },
};

export function formatTaskDate(dateLike, opts = { weekday: 'short', month: 'short', day: 'numeric' }) {
  if (!dateLike) return 'No due date';
  return new Date(dateLike).toLocaleDateString('en-US', opts);
}

export function formatMoney(cents) {
  const numeric = Number(cents || 0);
  const sign = numeric < 0 ? '-' : '';
  return `${sign}$${(Math.abs(numeric) / 100).toFixed(2)}`;
}

export function StatusChip({ status, labelOverride }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return (
    <span
      style={{
        padding: '0.18rem 0.48rem',
        border: '1px solid currentColor',
        background: meta.bg,
        color: meta.text,
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {labelOverride || meta.label}
    </span>
  );
}

export function OverdueChip() {
  return (
    <span
      style={{
        padding: '0.18rem 0.48rem',
        border: '1px solid var(--color-warning)',
        background: 'var(--color-warning-highlight)',
        color: 'var(--color-warning)',
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      Overdue
    </span>
  );
}

export function PageHeader({ eyebrow, title, meta, submeta }) {
  return (
    <div style={{ marginBottom: 'var(--space-6)' }}>
      {eyebrow && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
          <span className="gold-rule" />
          <span className="section-label">{eyebrow}</span>
        </div>
      )}
      <h1 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
        {title}
      </h1>
      {meta && (
        <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
          {meta}
        </div>
      )}
      {submeta && (
        <div style={{ marginTop: '0.35rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          {submeta}
        </div>
      )}
    </div>
  );
}

export function SectionTitle({ title, count, right }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-3)',
        paddingBottom: 'var(--space-2)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--color-text-faint)', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
          {title}
        </span>
        {typeof count === 'number' && (
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)', background: 'var(--color-surface-offset)', padding: '0.08rem 0.45rem' }}>
            {count}
          </span>
        )}
      </div>
      {right}
    </div>
  );
}

export function EmptyState({ text }) {
  return (
    <div
      style={{
        padding: 'var(--space-5)',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        color: 'var(--color-text-muted)',
        fontSize: 'var(--text-sm)',
      }}
    >
      {text}
    </div>
  );
}

export function TaskRow({ task, showWeekday = false }) {
  const dateLabel = formatTaskDate(
    task.dueDate,
    showWeekday
      ? { weekday: 'short', month: 'short', day: 'numeric' }
      : { month: 'short', day: 'numeric' }
  );

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto auto',
        gap: 'var(--space-3)',
        alignItems: 'center',
        padding: 'var(--space-3) var(--space-4)',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {task.title}
        </div>
        <div style={{ marginTop: '0.15rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {getTaskCategoryLabel(task)} · {dateLabel}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <StatusChip status={task.status} />
        {task.isOverdue && <OverdueChip />}
      </div>
      <Link className="btn-outline btn-sm" to={`/tasks/${task.id}`} style={{ whiteSpace: 'nowrap', textDecoration: 'none' }}>
        Open Task
      </Link>
    </div>
  );
}
