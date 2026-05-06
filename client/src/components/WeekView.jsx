import { useState, useMemo } from 'react';
import { Q2_WEEKS, getWeekByDate } from '../utils/q2plan';
import { CATEGORY_COLORS } from '../utils/habits';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function fmt(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return new Date(+y, +m - 1, +d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Tag({ label, category = 'habit' }) {
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.habit;
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.1rem 0.4rem',
      fontSize: '0.62rem', fontWeight: 700,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      background: color.bg, color: color.text,
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

function WeekBand({ week, isSelected, onClick }) {
  const today = todayStr();
  const isCurrent = today >= week.startDate && today <= week.endDate;
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        padding: '0.3rem 0.5rem',
        border: 'none',
        borderLeft: isSelected ? '2px solid var(--color-primary)' : '2px solid transparent',
        background: isSelected ? 'var(--color-surface-offset)' : 'transparent',
        cursor: 'pointer', textAlign: 'left',
        transition: 'all var(--transition-interactive)',
        width: '100%', flexShrink: 0,
      }}
    >
      <span style={{
        fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.07em',
        textTransform: 'uppercase',
        color: isSelected ? 'var(--color-primary)' : 'var(--color-text-faint)',
        minWidth: 28,
      }}>
        W{String(week.weekNumber).padStart(2, '0')}
      </span>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', flex: 1 }}>
        {fmt(week.startDate)} – {fmt(week.endDate)}
      </span>
      {isCurrent && (
        <span style={{
          fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.1em',
          textTransform: 'uppercase', padding: '0.05rem 0.3rem',
          background: 'var(--color-primary)', color: 'var(--color-text-inverse)',
        }}>
          NOW
        </span>
      )}
    </button>
  );
}

function TopicRow({ label, value, category }) {
  if (!value) return null;
  return (
    <div style={{
      display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start',
      padding: 'var(--space-2) 0',
      borderBottom: '1px solid var(--color-divider)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.07em',
          textTransform: 'uppercase', color: 'var(--color-text-faint)',
          marginBottom: '0.2rem',
        }}>
          {label}
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 1.4 }}>
          {value}
        </div>
      </div>
      {category && <Tag label={category} category={category.toLowerCase()} />}
    </div>
  );
}

function DayRow({ day, isToday }) {
  const tasks = [
    day.amcTask    && { text: day.amcTask,    cat: 'amc'    },
    day.khanTask   && { text: day.khanTask,   cat: 'khan'   },
    day.apTask     && { text: day.apTask,     cat: 'ap'     },
    day.careerTask && { text: day.careerTask, cat: 'career' },
    ...day.otherTasks.map(t => ({ text: t, cat: 'habit' })),
  ].filter(Boolean);

  return (
    <div style={{
      borderTop: `1px solid ${isToday ? 'var(--color-primary)' : 'var(--color-border)'}`,
      background: isToday
        ? 'color-mix(in oklch, var(--color-primary) 4%, var(--color-surface))'
        : 'transparent',
      padding: 'var(--space-2) var(--space-3)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)',
        marginBottom: tasks.length ? 'var(--space-1)' : 0,
      }}>
        <span style={{
          fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: isToday ? 'var(--color-primary)' : 'var(--color-text)',
          minWidth: 28,
        }}>
          {day.dayName.slice(0,3)}
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
          {fmt(day.date)}
        </span>
        {isToday && (
          <span style={{
            fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--color-primary)',
          }}>TODAY</span>
        )}
      </div>

      {tasks.length === 0 ? (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
          —
        </span>
      ) : (
        tasks.map((t, i) => (
          <div key={i} style={{
            display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start',
            paddingTop: i === 0 ? 0 : 'var(--space-1)',
            borderTop: i === 0 ? 'none' : '1px solid var(--color-divider)',
            minWidth: 0,
          }}>
            <span style={{ color: 'var(--color-text-faint)', fontSize: 'var(--text-xs)', marginTop: '0.18rem', flexShrink: 0 }}>—</span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 1.4, flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
              {t.text}
            </span>
            <Tag label={t.cat} category={t.cat} />
          </div>
        ))
      )}
      {day.notes && (
        <div style={{
          marginTop: 'var(--space-2)', padding: 'var(--space-1) var(--space-2)',
          borderLeft: '2px solid var(--color-gold)',
          background: 'color-mix(in oklch, var(--color-gold) 6%, var(--color-surface-offset))',
          fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic',
        }}>
          {day.notes}
        </div>
      )}
    </div>
  );
}

export default function WeekView() {
  const today = todayStr();
  const currentWeek = getWeekByDate(today);
  const [selectedId, setSelectedId] = useState(
    currentWeek ? currentWeek.weekId : Q2_WEEKS[0].weekId
  );

  const week = useMemo(
    () => Q2_WEEKS.find(w => w.weekId === selectedId) || Q2_WEEKS[0],
    [selectedId]
  );

  const hasTopics = week.amcTopic || week.khanLevel || week.apSubject || week.careerTopic || week.creativeProject;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '148px 1fr',
      gap: 'var(--space-4)',
      alignItems: 'start',
      minWidth: 0,         /* prevent grid from overflowing parent */
      overflow: 'hidden',
    }}>
      {/* Left: week selector */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 80,
        maxHeight: 'calc(100vh - 120px)', overflowY: 'auto',
        borderRight: '1px solid var(--color-border)',
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--color-text-faint)',
          padding: '0 0.5rem var(--space-2)',
        }}>
          Q2 2026 · 13 wks
        </div>
        {Q2_WEEKS.map(w => (
          <WeekBand key={w.weekId} week={w} isSelected={w.weekId === selectedId} onClick={() => setSelectedId(w.weekId)} />
        ))}
      </div>

      {/* Right: week detail — minWidth:0 is critical for grid overflow */}
      <div style={{ minWidth: 0, overflow: 'hidden' }}>
        {/* Week header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: 'var(--space-3)',
          paddingBottom: 'var(--space-2)',
          borderBottom: '2px solid var(--color-divider)',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
            <span style={{
              fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--color-text-faint)',
            }}>
              {week.weekId}
            </span>
            <span style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text)' }}>
              Week {week.weekNumber}
            </span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              {fmt(week.startDate)} – {fmt(week.endDate)}
            </span>
          </div>
        </div>

        {/* Topic summary strip — only if there’s content */}
        {hasTopics && (
          <div style={{
            background: 'var(--color-surface-offset)',
            border: '1px solid var(--color-border)',
            padding: 'var(--space-1) var(--space-3) var(--space-2)',
            marginBottom: 'var(--space-4)',
          }}>
            <TopicRow label="AMC Topic"       value={week.amcTopic}        category="amc"      />
            <TopicRow label="Khan Level"       value={week.khanLevel}       category="khan"     />
            <TopicRow label="AP Subject"       value={week.apSubject}       category="ap"       />
            <TopicRow label="Career Deep-Dive" value={week.careerTopic}     category="career"   />
            <TopicRow label="Creative Project" value={week.creativeProject} category="creative" />
          </div>
        )}

        {/* Day rows */}
        <div style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
          {week.days.map(day => (
            <DayRow key={day.date} day={day} isToday={day.date === today} />
          ))}
          <div style={{ borderTop: '1px solid var(--color-border)' }} />
        </div>
      </div>
    </div>
  );
}
