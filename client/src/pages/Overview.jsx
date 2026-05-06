import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import api from '../utils/api';
import { Q2_META, Q2_WEEKS } from '../utils/q2plan';

const today = new Date().toISOString().slice(0, 10);

function fmt(dateStr) {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function weekStatus(week) {
  if (today > week.endDate)   return 'past';
  if (today < week.startDate) return 'future';
  return 'current';
}

const STATUS_PILL = {
  past:    { label: 'Complete', color: 'var(--color-success)',    bg: 'var(--color-success-highlight)' },
  current: { label: 'Current',  color: 'var(--color-gold)',       bg: 'var(--color-gold-highlight)'    },
  future:  { label: 'Upcoming', color: 'var(--color-text-muted)', bg: 'var(--color-surface-offset)'    },
};

const SUBJECT_COLOR = {
  amc:    'var(--color-blue)',
  ap:     'var(--color-error)',
  career: 'var(--color-gold)',
};

const DAYS_SHORT = ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'];

// ── Live task status chip ─────────────────────────────────────────────────────
const LIVE_STATUS = {
  done:           { color: 'var(--color-success)',      dot: true  },
  pending_review: { color: 'var(--color-gold)',         dot: true  },
  needs_revision: { color: 'var(--color-error)',        dot: true  },
  late:           { color: 'var(--color-warning)',      dot: true  },
  missing:        { color: 'var(--color-notification)', dot: true  },
  pending:        { color: 'var(--color-text-faint)',   dot: false },
};

function LiveDot({ status }) {
  if (!status || status === 'pending') return null;
  const s = LIVE_STATUS[status] || LIVE_STATUS.pending;
  if (!s.dot) return null;
  return (
    <span style={{
      display: 'inline-block',
      width: 6, height: 6,
      borderRadius: '50%',
      background: s.color,
      flexShrink: 0,
      marginLeft: '0.2rem',
      verticalAlign: 'middle',
    }} title={status.replace(/_/g, ' ')} />
  );
}

// ── SubjectTag ────────────────────────────────────────────────────────────────
function SubjectTag({ color, label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color }}>{label}</span>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{value}</span>
    </div>
  );
}

// ── DayGrid ───────────────────────────────────────────────────────────────────
function DayGrid({ days, liveByDate }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
      gap: '1px', background: 'var(--color-border)',
      border: '1px solid var(--color-border)', marginTop: 'var(--space-4)',
    }}>
      {DAYS_SHORT.map((d, i) => {
        const day     = days[i];
        const isToday = day.date === today;
        const liveTasks = liveByDate[day.date] || [];
        const tasks   = [day.amcTask, day.apTask, day.careerTask, ...day.otherTasks].filter(Boolean);

        return (
          <div key={d} style={{
            background: isToday ? 'var(--color-primary-highlight)' : day.isWeekend ? 'var(--color-surface-offset)' : 'var(--color-surface)',
            padding: 'var(--space-2)', minHeight: 90,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: 'var(--space-1)' }}>
              <span style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: isToday ? 'var(--color-primary)' : 'var(--color-text-faint)' }}>{d}</span>
              {isToday && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0 }} />}
              <span style={{ marginLeft: 'auto', fontSize: '0.55rem', color: 'var(--color-text-faint)', fontVariantNumeric: 'tabular-nums' }}>{fmt(day.date)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              {tasks.slice(0, 4).map((t, ti) => {
                // match live task by fuzzy title prefix
                const live = liveTasks.find(lt => lt.title.toLowerCase().startsWith(t.toLowerCase().slice(0, 8)));
                return (
                  <div key={ti} style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', fontSize: '0.58rem', color: 'var(--color-text-muted)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</span>
                    {live && <LiveDot status={live.status} />}
                  </div>
                );
              })}
              {tasks.length > 4 && (
                <div style={{ fontSize: '0.55rem', color: 'var(--color-text-faint)' }}>+{tasks.length - 4} more</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── WeekCard ──────────────────────────────────────────────────────────────────
function WeekCard({ week, defaultOpen, liveByDate, liveStats }) {
  const [open, setOpen] = useState(defaultOpen);
  const st   = weekStatus(week);
  const pill = STATUS_PILL[st];

  const subjectPills = [
    { color: SUBJECT_COLOR.amc,    text: week.amcTopic    ? week.amcTopic.split('—')[0].trim()    : null },
    { color: SUBJECT_COLOR.ap,     text: week.apSubject   ? week.apSubject.split('—')[1]?.trim()  || week.apSubject : null },
    { color: SUBJECT_COLOR.career, text: week.careerTopic ? week.careerTopic.split('—')[0].trim() : null },
  ].filter(p => p.text);

  const subjectTags = [
    week.amcTopic    && { color: SUBJECT_COLOR.amc,    label: 'AMC',    value: week.amcTopic    },
    week.apSubject   && { color: SUBJECT_COLOR.ap,     label: 'AP',     value: week.apSubject   },
    week.careerTopic && { color: SUBJECT_COLOR.career, label: 'Career', value: week.careerTopic },
  ].filter(Boolean);

  // live completion for this week's date range
  const weekDates = week.days.map(d => d.date);
  const weekTasks = weekDates.flatMap(d => liveByDate[d] || []);
  const weekDone  = weekTasks.filter(t => t.status === 'done' || t.status === 'pending_review').length;
  const weekTotal = weekTasks.length;

  return (
    <div style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', marginBottom: '1px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)',
          background: open ? 'var(--color-surface-2)' : 'transparent',
          cursor: 'pointer', border: 'none',
          borderBottom: open ? '1px solid var(--color-border)' : 'none',
          transition: 'background var(--transition-interactive)',
          textAlign: 'left',
        }}
      >
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--color-text)', minWidth: 28, flexShrink: 0 }}>
          W{String(week.weekNumber).padStart(2, '0')}
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {fmt(week.startDate)} – {fmt(week.endDate)}
        </span>
        <span style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: pill.bg, color: pill.color, padding: '0.1rem 0.4rem', flexShrink: 0 }}>
          {pill.label}
        </span>

        {/* Live completion badge */}
        {weekTotal > 0 && (
          <span style={{
            fontSize: '0.58rem', fontWeight: 700,
            color: weekDone === weekTotal ? 'var(--color-success)' : 'var(--color-text-faint)',
            flexShrink: 0,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {weekDone}/{weekTotal}
          </span>
        )}

        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '0.35rem', minWidth: 0, overflow: 'hidden' }}>
          {subjectPills.map(({ color, text }, i) => (
            <span key={i}
              className="subject-pill"
              style={{ fontSize: '0.58rem', fontWeight: 600, color, background: 'transparent', border: `1px solid ${color}`, padding: '0.05rem 0.35rem', whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', display: 'none' }}
            >{text}</span>
          ))}
        </div>
        <span style={{ color: 'var(--color-text-faint)', flexShrink: 0 }}>
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </span>
      </button>

      {open && (
        <div style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${subjectTags.length}, 1fr)`, gap: 'var(--space-3)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
            {subjectTags.map(tag => <SubjectTag key={tag.label} color={tag.color} label={tag.label} value={tag.value} />)}
          </div>
          <DayGrid days={week.days} liveByDate={liveByDate} />
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Overview() {
  const [filter,      setFilter]      = useState('all');
  const [liveTasks,   setLiveTasks]   = useState([]);
  const [liveLoading, setLiveLoading] = useState(true);

  // Fetch all tasks once to overlay real status onto the plan grid
  useEffect(() => {
    api.get('/tasks')
      .then(r => setLiveTasks(Array.isArray(r.data) ? r.data : []))
      .catch(() => setLiveTasks([]))
      .finally(() => setLiveLoading(false));
  }, []);

  // Index live tasks by due date for O(1) lookup in day cells
  const liveByDate = useMemo(() => {
    const map = {};
    liveTasks.forEach(t => {
      if (!t.dueDate) return;
      const d = t.dueDate.slice(0, 10);
      if (!map[d]) map[d] = [];
      map[d].push(t);
    });
    return map;
  }, [liveTasks]);

  // Live completion stats across all tracked weeks
  const liveStats = useMemo(() => {
    const allTracked = Q2_WEEKS.flatMap(w => w.days.map(d => d.date));
    const tracked = liveTasks.filter(t => t.dueDate && allTracked.includes(t.dueDate.slice(0, 10)));
    return {
      done:    tracked.filter(t => t.status === 'done').length,
      review:  tracked.filter(t => t.status === 'pending_review').length,
      total:   tracked.length,
    };
  }, [liveTasks]);

  const currentWeekIdx = useMemo(() => Q2_WEEKS.findIndex(w => today >= w.startDate && today <= w.endDate), []);

  const visible = useMemo(() =>
    filter === 'all' ? Q2_WEEKS : Q2_WEEKS.filter(w => weekStatus(w) === filter),
  [filter]);

  const filterBtns = [
    { key: 'all',     label: `All (${Q2_WEEKS.length})` },
    { key: 'past',    label: `Past (${Q2_WEEKS.filter(w => weekStatus(w) === 'past').length})` },
    { key: 'current', label: 'Current' },
    { key: 'future',  label: `Upcoming (${Q2_WEEKS.filter(w => weekStatus(w) === 'future').length})` },
  ];

  const pastCount    = Q2_WEEKS.filter(w => weekStatus(w) === 'past').length;
  const currentCount = Q2_WEEKS.filter(w => weekStatus(w) === 'current').length;
  const doneCount    = pastCount + currentCount;
  const planPct      = Math.round((doneCount / Q2_WEEKS.length) * 100);
  const livePct      = liveStats.total
    ? Math.round(((liveStats.done + liveStats.review) / liveStats.total) * 100)
    : null;

  return (
    <div style={{ paddingTop: 'var(--space-6)' }}>

      {/* Page header */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
          <span className="gold-rule" />
          <span className="section-label">{Q2_META.label}</span>
        </div>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>Quarter Overview</h1>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginTop: '0.25rem', lineHeight: 1.6 }}>{Q2_META.focus}</p>
      </div>

      {/* Progress card */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        {/* Plan progress */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginBottom: 'var(--space-2)' }}>
          <span>Quarter Progress (weeks)</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>Wk {currentWeekIdx + 1} of {Q2_WEEKS.length} · {planPct}%</span>
        </div>
        <div style={{ height: 5, background: 'var(--color-surface-offset)', overflow: 'hidden', marginBottom: 'var(--space-2)' }}>
          <div style={{ height: '100%', width: `${planPct}%`, background: 'var(--color-primary)', transition: 'width 0.6s ease' }} />
        </div>

        {/* Live task completion */}
        {!liveLoading && liveStats.total > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginBottom: 'var(--space-1)', marginTop: 'var(--space-3)' }}>
              <span>Task Completion (live)</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {liveStats.done} done · {liveStats.review} in review · {liveStats.total} total · {livePct}%
              </span>
            </div>
            <div style={{ height: 5, background: 'var(--color-surface-offset)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${livePct}%`, background: 'var(--color-success)', transition: 'width 0.6s ease' }} />
            </div>
          </>
        )}
        {liveLoading && (
          <div className="skeleton" style={{ height: 14, width: '100%', marginTop: 'var(--space-3)' }} />
        )}

        {/* Stat grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--color-border)', border: '1px solid var(--color-border)', marginTop: 'var(--space-3)' }}>
          {[
            { label: 'Start',      value: new Date(Q2_META.startDate + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
            { label: 'End',        value: new Date(Q2_META.endDate   + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
            { label: 'Weeks Done', value: doneCount },
            { label: 'Weeks Left', value: Q2_WEEKS.length - doneCount },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--color-surface)', padding: 'var(--space-2) var(--space-3)' }}>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--color-text-faint)' }}>{label}</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text)', marginTop: '0.1rem' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '1px', background: 'var(--color-border)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-3)' }}>
        {filterBtns.map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            flex: 1, padding: 'var(--space-2) var(--space-3)',
            fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.07em',
            textTransform: 'uppercase', cursor: 'pointer', border: 'none',
            background: filter === key ? 'var(--color-primary)' : 'var(--color-surface)',
            color: filter === key ? '#fff' : 'var(--color-text-muted)',
            transition: 'background var(--transition-interactive)',
          }}>{label}</button>
        ))}
      </div>

      {/* Week cards */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        {visible.map(week => (
          <WeekCard
            key={week.weekId}
            week={week}
            defaultOpen={weekStatus(week) === 'current'}
            liveByDate={liveByDate}
            liveStats={liveStats}
          />
        ))}
      </div>

      <style>{`@media (min-width: 640px) { .subject-pill { display: inline-block !important; } }`}</style>
    </div>
  );
}
