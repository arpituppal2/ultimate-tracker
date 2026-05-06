import { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../utils/api';

const STATUS_STYLE = {
  done:           { label: 'Done',        color: 'var(--color-success)',      bg: 'var(--color-success-highlight)'  },
  in_progress:    { label: 'In Progress', color: 'var(--color-blue)',         bg: 'var(--color-blue-highlight)'    },
  pending_review: { label: 'In Review',   color: 'var(--color-gold)',         bg: 'var(--color-gold-highlight)'    },
  needs_revision: { label: 'Revision',    color: 'var(--color-error)',        bg: 'var(--color-error-highlight)'   },
  late:           { label: 'Late',        color: 'var(--color-warning)',      bg: 'var(--color-warning-highlight)' },
  missing:        { label: 'Missing',     color: 'var(--color-notification)', bg: 'var(--color-notification-highlight)' },
  pending:        { label: 'Pending',     color: 'var(--color-text-muted)',   bg: 'var(--color-surface-offset)'    },
};

const CHART_SERIES = [
  { key: 'done',           stroke: '#437a22', fill: '#6daa45' },
  { key: 'pending_review', stroke: '#C08400', fill: '#FFB81C' },
  { key: 'late',           stroke: '#964219', fill: '#bb653b' },
  { key: 'missing',        stroke: '#a13544', fill: '#dd6974' },
  { key: 'pending',        stroke: '#005587', fill: '#8BB8E8' },
];

const CATEGORIES = ['all','amc','khan','career','ap','college','redemption','daily','weekly','quarterly'];
const CAT_LABELS  = { all:'All Categories', amc:'AMC', khan:'Khan', career:'Career', ap:'AP', college:'College', redemption:'Redemption', daily:'Daily', weekly:'Weekly', quarterly:'Quarterly' };

function todayISO() { return new Date().toISOString().slice(0, 10); }
function weekRangeISO() {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now); mon.setDate(now.getDate() - ((day + 6) % 7));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return { from: mon.toISOString().slice(0,10), to: sun.toISOString().slice(0,10) };
}
function monthRangeISO() {
  const now   = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last  = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: first.toISOString().slice(0,10), to: last.toISOString().slice(0,10) };
}

const dropdownStyle = {
  padding: '0.35rem 0.55rem',
  fontSize: 'var(--text-xs)',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  minWidth: 120,
  appearance: 'auto',
  borderRadius: 0,
};

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      padding: 'var(--space-4)',
    }}>
      <div style={{
        fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--color-text-faint)',
        marginBottom: '0.35rem',
      }}>
        {label}
      </div>
      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: color || 'var(--color-text)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginTop: '0.15rem' }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function isDarkMode() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

export default function Balance() {
  const [dark, setDark] = useState(isDarkMode);
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(isDarkMode()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  const [tasks,         setTasks]         = useState([]);
  const [balance,       setBalance]       = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading,       setLoading]       = useState(true);

  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy,       setSortBy]       = useState('dueDate');

  const [catFilter,   setCatFilter]   = useState('all');
  const [datePreset,  setDatePreset]  = useState('all');
  const [dateFrom,    setDateFrom]    = useState('');
  const [dateTo,      setDateTo]      = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/tasks'),
      api.get('/ledger'),
    ]).then(([tasksRes, ledgerRes]) => {
      setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      const d = ledgerRes.data;
      setBalance(d.balance ?? null);
      setLedgerEntries(Array.isArray(d.entries) ? d.entries : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const resolvedDates = useMemo(() => {
    if (datePreset === 'today') return { from: todayISO(), to: todayISO() };
    if (datePreset === 'week')  return weekRangeISO();
    if (datePreset === 'month') return monthRangeISO();
    if (datePreset === 'custom') return { from: dateFrom, to: dateTo };
    return { from: '', to: '' };
  }, [datePreset, dateFrom, dateTo]);

  const counts = useMemo(() => {
    const c = { done: 0, in_progress: 0, pending_review: 0, late: 0, missing: 0, pending: 0 };
    tasks.forEach(t => { if (c[t.status] !== undefined) c[t.status]++; else c.pending++; });
    return c;
  }, [tasks]);

  const chartData = useMemo(() => {
    const daily = {};
    [...tasks]
      .filter(t => t.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .forEach(t => {
        const date = new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!daily[date]) daily[date] = { date, done: 0, pending_review: 0, late: 0, missing: 0, pending: 0 };
        const s = t.status || 'pending';
        if (daily[date][s] !== undefined) daily[date][s]++;
        else daily[date].pending++;
      });
    let totals = { done: 0, pending_review: 0, late: 0, missing: 0, pending: 0 };
    return Object.values(daily).map(day => {
      Object.keys(totals).forEach(k => { totals[k] += day[k] || 0; });
      return { date: day.date, ...totals };
    });
  }, [tasks]);

  const filtered = useMemo(() => {
    let res = tasks.filter(t => {
      const q = search.toLowerCase();
      const matchSearch = !q || (t.title || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchCat    = catFilter === 'all' || (t.category || '').toLowerCase() === catFilter;
      let   matchDate   = true;
      if (resolvedDates.from || resolvedDates.to) {
        const due = t.dueDate ? t.dueDate.slice(0, 10) : null;
        if (!due) matchDate = false;
        else {
          if (resolvedDates.from && due < resolvedDates.from) matchDate = false;
          if (resolvedDates.to   && due > resolvedDates.to)   matchDate = false;
        }
      }
      return matchSearch && matchStatus && matchCat && matchDate;
    });
    res.sort((a, b) => {
      if (sortBy === 'dueDate') return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
      if (sortBy === 'newest')  return new Date(b.dueDate || 0) - new Date(a.dueDate || 0);
      if (sortBy === 'az')      return (a.title || '').localeCompare(b.title || '');
      return 0;
    });
    return res;
  }, [tasks, search, statusFilter, catFilter, resolvedDates, sortBy]);

  const handleDatePreset = (v) => {
    setDatePreset(v);
    if (v !== 'custom') { setDateFrom(''); setDateTo(''); }
  };

  const balanceDisplay = balance != null ? `${balance >= 0 ? '+' : ''}$${Math.abs(balance).toFixed(2)}` : '\u2014';
  const balanceColor   = balance == null ? 'var(--color-text-muted)'
    : balance < 0 ? 'var(--color-error)' : 'var(--color-success)';

  const cc = {
    grid:    dark ? 'rgba(255,255,255,0.06)' : 'rgba(139,184,232,0.35)',
    axis:    dark ? '#64748b' : '#005587',
    tooltip: {
      bg:     dark ? '#0a0a0a' : '#fff',
      border: dark ? 'rgba(255,255,255,0.10)' : 'rgba(39,116,174,0.18)',
      text:   dark ? '#DAEBFE' : '#003B5C',
    },
  };

  if (loading) return (
    <div style={{ paddingTop: 'var(--space-6)' }}>
      {[1,2,3,4,5].map(i => (
        <div key={i} className="skeleton skeleton-text" style={{ marginBottom: 'var(--space-3)' }} />
      ))}
    </div>
  );

  return (
    <div style={{ paddingTop: 'var(--space-6)' }}>

      {/* Page header */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
          <span className="gold-rule" />
          <span className="section-label">Finance</span>
        </div>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
          Balance
        </h1>
      </div>

      {/* Stat cards — 7 fixed columns, no ghost cell */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1px',
        background: 'var(--color-border)',
        border: '1px solid var(--color-border)',
        marginBottom: 'var(--space-5)',
      }}>
        <StatCard label="Balance"   value={balanceDisplay}        color={balanceColor}                    />
        <StatCard label="Done"      value={counts.done}           color="var(--color-success)"             />
        <StatCard label="In Review" value={counts.pending_review} color="var(--color-gold)"               />
        <StatCard label="Late"      value={counts.late}           color="var(--color-warning)"             />
        <StatCard label="Missing"   value={counts.missing}        color="var(--color-notification)"       />
        <StatCard label="Pending"   value={counts.pending}        color="var(--color-text-muted)"         />
        <StatCard label="Total"     value={tasks.length}          color="var(--color-text)"               />
      </div>

      {/* Chart */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        padding: 'var(--space-5)',
        marginBottom: 'var(--space-5)',
      }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 'var(--space-4)' }}>
          Task Status — Cumulative by Due Date
        </div>
        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%" key={String(dark)}>
            <AreaChart data={chartData} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={cc.grid} />
              <XAxis dataKey="date" stroke={cc.axis} fontSize={11} tickLine={false} axisLine={false} dy={6} />
              <YAxis stroke={cc.axis} fontSize={11} tickLine={false} axisLine={false}
                label={{ value: 'Tasks', angle: -90, position: 'insideLeft', offset: -2, style: { fontSize: 10, fill: cc.axis } }}
              />
              <Tooltip contentStyle={{ backgroundColor: cc.tooltip.bg, border: `1px solid ${cc.tooltip.border}`, borderRadius: 0, fontSize: 12, color: cc.tooltip.text }} />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: 12, fontSize: 11, color: cc.axis }} />
              {CHART_SERIES.map(s => (
                <Area key={s.key} type="monotone" dataKey={s.key} stackId="s"
                  stroke={s.stroke} fill={s.fill} fillOpacity={0.38}
                  dot={false} strokeWidth={1.5}
                  name={STATUS_STYLE[s.key]?.label || s.key}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ledger */}
      {ledgerEntries.length > 0 && (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          marginBottom: 'var(--space-5)',
        }}>
          <div style={{
            padding: 'var(--space-3) var(--space-4)',
            borderBottom: '1px solid var(--color-border)',
            fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--color-text-faint)',
          }}>
            Ledger
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-offset)' }}>
                {['Date','Description','Amount'].map(h => (
                  <th key={h} style={{
                    padding: '0.4rem var(--space-4)',
                    fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: 'var(--color-text-faint)',
                    textAlign: h === 'Amount' ? 'right' : 'left',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ledgerEntries.map((e, i) => {
                const amt = e.amount ?? (e.amountCents != null ? e.amountCents / 100 : null);
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.35rem var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                      {e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '\u2014'}
                    </td>
                    <td style={{ padding: '0.35rem var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                      {e.reason || e.description || 'Entry'}
                    </td>
                    <td style={{ padding: '0.35rem var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 700, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: amt == null ? 'var(--color-text-faint)' : amt >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                      {amt != null ? `${amt >= 0 ? '+' : ''}$${Math.abs(amt).toFixed(2)}` : '\u2014'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Filter bar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center',
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderBottom: 'none',
        padding: 'var(--space-3) var(--space-4)',
      }}>
        <input
          type="text"
          placeholder="Search tasks\u2026"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 160,
            padding: '0.35rem 0.6rem',
            fontSize: 'var(--text-sm)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            outline: 'none',
            borderRadius: 0,
          }}
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{ ...dropdownStyle, textTransform: 'none', letterSpacing: 0, minWidth: 140 }}
        >
          <option value="dueDate">Due Date (asc)</option>
          <option value="newest">Due Date (desc)</option>
          <option value="az">A\u2013Z</option>
        </select>
      </div>

      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center',
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        padding: 'var(--space-3) var(--space-4)',
        marginBottom: 'var(--space-2)',
      }}>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={dropdownStyle}>
          {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
        </select>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={dropdownStyle}>
          <option value="all">All Stages</option>
          {Object.entries(STATUS_STYLE).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <select value={datePreset} onChange={e => handleDatePreset(e.target.value)} style={dropdownStyle}>
          <option value="all">All Dates</option>
          <option value="today">Due Today</option>
          <option value="week">Due This Week</option>
          <option value="month">Due This Month</option>
          <option value="custom">Date Range</option>
        </select>

        {datePreset === 'custom' && (
          <>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ ...dropdownStyle, minWidth: 'unset', textTransform: 'none', letterSpacing: 0 }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', fontWeight: 600 }}>to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ ...dropdownStyle, minWidth: 'unset', textTransform: 'none', letterSpacing: 0 }} />
          </>
        )}

        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginLeft: 'auto' }}>
          {filtered.length} Task{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tasks table */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-offset)' }}>
              {['Task','Category','Status','Due'].map(h => (
                <th key={h} style={{
                  padding: '0.4rem var(--space-4)',
                  fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--color-text-faint)',
                  textAlign: 'left',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 'var(--space-10)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-faint)' }}>
                  No tasks match.
                </td>
              </tr>
            ) : filtered.map(t => {
              const s = STATUS_STYLE[t.status] || STATUS_STYLE.pending;
              return (
                <tr key={t.id}
                  style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background var(--transition-interactive)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                  onClick={() => window.location.href = `/tasks/${t.id}`}
                >
                  <td style={{ padding: '0.4rem var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', maxWidth: 320 }}>
                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                  </td>
                  <td style={{ padding: '0.4rem var(--space-4)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-faint)' }}>
                    {t.category || '\u2014'}
                  </td>
                  <td style={{ padding: '0.4rem var(--space-4)' }}>
                    <span style={{ padding: '0.1rem 0.4rem', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', background: s.bg, color: s.color }}>
                      {s.label}
                    </span>
                  </td>
                  <td style={{ padding: '0.4rem var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '\u2014'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
