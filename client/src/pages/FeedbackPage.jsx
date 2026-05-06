import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import api from '../utils/api';
import { ChevronDown, ChevronUp, Clock, ExternalLink } from 'lucide-react';

const STATUS_META = {
  pending_review: { bg: 'var(--color-gold-highlight)',         text: 'var(--color-gold)',          label: 'Pending Review'  },
  approved:       { bg: 'var(--color-success-highlight)',      text: 'var(--color-success)',        label: 'Approved'        },
  needs_revision: { bg: 'var(--color-error-highlight)',        text: 'var(--color-error)',          label: 'Needs Revision'  },
  rejected:       { bg: 'var(--color-notification-highlight)', text: 'var(--color-notification)',   label: 'Redo Required'   },
};
const getMeta = s => STATUS_META[s] || STATUS_META.pending_review;

const FILTER_TABS = [
  { value: 'pending_review', label: 'Pending Review'  },
  { value: 'approved',       label: 'Approved'        },
  { value: 'needs_revision', label: 'Needs Revision'  },
  { value: 'rejected',       label: 'Redo Required'   },
  { value: 'all',            label: 'All'             },
];

const ACTION_FEEDBACK_LABELS = {
  approved:       'Approved',
  needs_revision: 'Requested Changes',
  redo:           'Submitted for Redo',
  rejected:       'Submitted for Redo',
};

function fmtTimeOnTask(secs) {
  if (!secs || secs < 1) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function minResubmitDate() {
  const now = new Date();
  const sixHoursLater = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  const candidate = new Date(sixHoursLater);
  const eod = new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate(), 23, 59, 59);
  return eod.toISOString().slice(0, 10);
}

// ── Student resubmit form ─────────────────────────────────────────────────────
function StudentRevisionForm({ sub, onResubmitted }) {
  const [reflection, setReflection] = useState('');
  const [busy,       setBusy]       = useState(false);
  const [err,        setErr]        = useState(null);

  const latestFeedback = sub.feedbacks?.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  const submit = async () => {
    if (!reflection.trim()) { setErr('Please explain the changes you made before resubmitting.'); return; }
    setBusy(true); setErr(null);
    try {
      await api.post(`/submissions/${sub.id}/resubmit`, { reflection: reflection.trim() });
      onResubmitted(sub.id);
    } catch (e) {
      setErr(e.response?.data?.error || e.message || 'Resubmit failed.');
    } finally { setBusy(false); }
  };

  return (
    <div style={{ marginTop: 'var(--space-5)', borderTop: '1px solid var(--color-divider)', paddingTop: 'var(--space-4)' }}>

      {/* Admin feedback box */}
      {latestFeedback?.note && (
        <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-error-highlight)', borderLeft: '3px solid var(--color-error)' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-error)', marginBottom: 'var(--space-1)' }}>What to fix</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 1.6 }}>{latestFeedback.note}</div>
          {latestFeedback.resubmitDueDate && (
            <div style={{ marginTop: '0.4rem', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-warning)' }}>
              Due by: {new Date(latestFeedback.resubmitDueDate + 'T23:59:59').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}
        </div>
      )}

      {/* Your previous work — read-only, preserved */}
      {Object.keys(sub.templateData || {}).length > 0 && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-faint)', marginBottom: 'var(--space-2)' }}>Your previous submission</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {Object.entries(sub.templateData).map(([field, val]) => (
              <div key={field} style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-faint)', marginBottom: '0.2rem' }}>
                  {field.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reflection textarea */}
      <div style={{ marginBottom: 'var(--space-3)' }}>
        <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--color-text-faint)', marginBottom: '0.4rem' }}>
          Explain the changes you made and what you learned
        </label>
        <textarea
          className="input-base"
          rows={4}
          placeholder="Describe what you changed and why, and what this revision taught you…"
          value={reflection}
          onChange={e => { setReflection(e.target.value); setErr(null); }}
          style={{ resize: 'vertical', width: '100%' }}
        />
      </div>

      {err && (
        <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--color-error-highlight)', color: 'var(--color-error)', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-3)', border: '1px solid var(--color-error)' }}>
          {err}
        </div>
      )}

      <button className="btn-primary btn-sm" disabled={busy || !reflection.trim()} onClick={submit}>
        {busy ? 'Submitting…' : 'Submit Revision'}
      </button>
    </div>
  );
}

export default function FeedbackPage() {
  const { user }       = useAuth();
  const [searchParams] = useSearchParams();
  const focusSubId     = searchParams.get('sub');
  const isAdmin        = user?.role === 'admin';
  const canView        = user?.role === 'admin' || user?.role === 'parent';
  const isStudent      = !canView;

  const [subs,     setSubs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [expanded, setExpanded] = useState(focusSubId || null);
  const [noteMap,  setNoteMap]  = useState({});
  const [bonusMap, setBonusMap] = useState({});
  const [resubMap, setResubMap] = useState({});
  const [saving,   setSaving]   = useState({});
  const [saveErr,  setSaveErr]  = useState({});
  const [filter,   setFilter]   = useState('pending_review');

  const load = () => {
    setLoading(true);
    api.get('/submissions')
      .then(r => setSubs(Array.isArray(r.data) ? r.data : []))
      .catch(e => setError(e.response?.data?.error || e.message || 'Failed to load submissions'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // ── Student sort: needs_revision first, then re-reviews (rejected), then rest ──
  const studentSorted = (arr) => {
    const needsRevision = arr.filter(s => s.status === 'needs_revision');
    const reReview      = arr.filter(s => s.status === 'rejected' && s.feedbacks?.some(f => f.action === 'redo'));
    const rest          = arr.filter(s => !needsRevision.includes(s) && !reReview.includes(s));
    return [...needsRevision, ...reReview, ...rest];
  };

  const filtered = (() => {
    let arr = subs;
    if (canView) {
      arr = filter === 'all' ? subs : subs.filter(s => s.status === filter);
    }
    if (isStudent) arr = studentSorted(arr);
    return arr;
  })();

  const handleDecision = async (subId, action) => {
    if (!isAdmin) return;
    const note  = (noteMap[subId]  || '').trim();
    const bonus = parseFloat(bonusMap[subId] || 0);
    const resub = resubMap[subId] || '';
    if ((action === 'needs_revision' || action === 'redo') && !note) return;
    if (action === 'needs_revision') {
      if (!resub) { setSaveErr(s => ({ ...s, [subId]: 'Please set a resubmission due date.' })); return; }
      const minDate = minResubmitDate();
      if (resub < minDate) { setSaveErr(s => ({ ...s, [subId]: `Resubmission date must be at least ${minDate} (6 hours from now).` })); return; }
    }
    setSaving(s  => ({ ...s, [subId]: true }));
    setSaveErr(s => ({ ...s, [subId]: null }));
    try {
      await api.post('/feedback', {
        submissionId: subId,
        note: note || '',
        action,
        ...(action === 'approved' && bonus > 0 && { bonusCents: Math.round(bonus * 100) }),
        ...(action === 'needs_revision' && resub && { resubmitDueDate: resub }),
      });
      const newStatus = { approved: 'approved', needs_revision: 'needs_revision', redo: 'rejected' }[action] || 'pending_review';
      setSubs(prev => prev.map(s => s.id === subId ? { ...s, status: newStatus } : s));
      setNoteMap(m  => ({ ...m, [subId]: '' }));
      setBonusMap(m => ({ ...m, [subId]: '' }));
      setResubMap(m => ({ ...m, [subId]: '' }));
    } catch (e) {
      setSaveErr(s => ({ ...s, [subId]: e.response?.data?.error || e.message || 'Action failed' }));
    }
    setSaving(s => ({ ...s, [subId]: false }));
  };

  const handleStudentResubmitted = (subId) => {
    setSubs(prev => prev.map(s => s.id === subId ? { ...s, status: 'pending_review' } : s));
    setExpanded(null);
  };

  return (
    <div style={{ paddingTop: 'var(--space-6)' }}>

      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
          <span className="gold-rule" />
          <span className="section-label">Review</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 800, lineHeight: 1.1 }}>
            {canView ? 'Review Queue' : 'My Submissions'}
          </h1>
          {canView && !loading && subs.filter(s => s.status === 'pending_review').length > 0 && (
            <span style={{
              fontSize: 'var(--text-sm)', fontWeight: 800,
              background: 'var(--color-gold-highlight)', color: 'var(--color-gold)',
              border: '1px solid var(--color-gold)', padding: '0.2rem 0.75rem',
            }}>
              {subs.filter(s => s.status === 'pending_review').length} awaiting review
            </span>
          )}
          {isStudent && subs.filter(s => s.status === 'needs_revision').length > 0 && (
            <span style={{
              fontSize: 'var(--text-sm)', fontWeight: 800,
              background: 'var(--color-error-highlight)', color: 'var(--color-error)',
              border: '1px solid var(--color-error)', padding: '0.2rem 0.75rem',
            }}>
              {subs.filter(s => s.status === 'needs_revision').length} need{subs.filter(s => s.status === 'needs_revision').length === 1 ? 's' : ''} revision
            </span>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: 'var(--space-4)', background: 'var(--color-error-highlight)', border: '1px solid var(--color-error)', color: 'var(--color-error)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
          <strong>Could not load submissions:</strong> {error}
        </div>
      )}

      {/* Admin filter tabs */}
      {canView && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
          {FILTER_TABS.map(opt => (
            <button
              key={opt.value}
              className={['btn-tab', filter === opt.value ? 'btn-tab--active' : ''].join(' ')}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
              <span className="btn-tab__count">
                {opt.value === 'all' ? subs.length : subs.filter(s => s.status === opt.value).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[1,2,3].map(i => (
            <div key={i} className="surface-card" style={{ padding: 'var(--space-4)' }}>
              <div className="skeleton skeleton-heading" style={{ width: '40%' }} />
              <div className="skeleton skeleton-text"   style={{ width: '60%' }} />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="surface-card" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            {canView && filter === 'pending_review' ? 'No pending submissions.' : 'No submissions match this filter.'}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {filtered.map(sub => {
            const isOpen     = expanded === sub.id;
            const meta       = getMeta(sub.status);
            const isBusy     = !!saving[sub.id];
            const actionErr  = saveErr[sub.id];
            const links      = [...(sub.driveLinks || []), ...(sub.uploadUrls || [])];
            const tmpl       = sub.templateData || {};
            const hasTmpl    = Object.keys(tmpl).length > 0;
            const noteVal    = noteMap[sub.id]  || '';
            const bonusVal   = bonusMap[sub.id] || '';
            const resubVal   = resubMap[sub.id] || '';
            const baseReward = sub.task?.rewardCents ?? 2;
            const bonusNum   = parseFloat(bonusVal || 0);
            const totalPayout = ((baseReward + Math.round(bonusNum * 100)) / 100).toFixed(2);
            const timeLabel  = fmtTimeOnTask(sub.timeSpentSeconds);
            const minResub   = minResubmitDate();

            // Is this a re-review (student submitted a revision on a previously-rejected task)?
            const isReReview = isStudent && sub.status === 'pending_review' &&
              sub.feedbacks?.some(f => f.action === 'redo' || f.action === 'needs_revision');
            const needsRevisionStudent = isStudent && sub.status === 'needs_revision';

            return (
              <div key={sub.id} className="surface-card" id={`sub-${sub.id}`}
                style={{
                  border: needsRevisionStudent ? '1px solid var(--color-error)'
                    : isReReview ? '1px solid var(--color-gold)'
                    : undefined,
                }}
              >
                {/* Re-review banner */}
                {isReReview && (
                  <div style={{ padding: '0.25rem var(--space-4)', background: 'var(--color-gold-highlight)', borderBottom: '1px solid var(--color-gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-gold)' }}>Re-Review</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--color-text-faint)' }}>· Previously requested changes</span>
                  </div>
                )}

                {/* Needs revision banner for student */}
                {needsRevisionStudent && (
                  <div style={{ padding: '0.25rem var(--space-4)', background: 'var(--color-error-highlight)', borderBottom: '1px solid var(--color-error)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-error)' }}>Revision Required</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--color-text-faint)' }}>· See feedback below and resubmit</span>
                  </div>
                )}

                <button
                  onClick={() => setExpanded(isOpen ? null : sub.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-4)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left', gap: 'var(--space-3)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text)', marginBottom: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sub.task?.title || 'Untitled Task'}
                    </p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
                      {new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      {sub.isLate && (
                        <span style={{ marginLeft: '0.5rem', fontWeight: 700, color: 'var(--color-notification)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Late</span>
                      )}
                      {sub.task?.category && (
                        <span style={{ marginLeft: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{sub.task.category}</span>
                      )}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, padding: '0.2em 0.55em', background: meta.bg, color: meta.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {meta.label}
                    </span>
                    {isOpen ? <ChevronUp size={14} style={{ color: 'var(--color-text-faint)' }} /> : <ChevronDown size={14} style={{ color: 'var(--color-text-faint)' }} />}
                  </div>
                </button>

                {isOpen && (
                  <div style={{ padding: '0 var(--space-4) var(--space-5)', borderTop: '1px solid var(--color-divider)' }}>

                    {sub.notes && (
                      <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--color-surface-2)', borderLeft: '2px solid var(--color-primary)' }}>
                        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-faint)', marginBottom: 'var(--space-1)' }}>Submission Notes</p>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{sub.notes}</p>
                      </div>
                    )}

                    {hasTmpl && !needsRevisionStudent && (
                      <div style={{ marginTop: 'var(--space-4)' }}>
                        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-faint)', marginBottom: 'var(--space-2)' }}>Submission Content</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                          {Object.entries(tmpl).map(([field, val]) => (
                            <div key={field} style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                              <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-faint)', marginBottom: '0.2rem' }}>
                                {field.replace(/_/g, ' ')}
                              </p>
                              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                {typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {links.length > 0 && (
                      <div style={{ marginTop: 'var(--space-4)' }}>
                        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-faint)', marginBottom: 'var(--space-2)' }}>Submitted Links</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                          {links.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: 'var(--text-sm)', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}
                            >
                              <ExternalLink size={12} />
                              {url.length > 60 ? url.slice(0, 60) + '\u2026' : url}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {sub.feedbacks?.length > 0 && (
                      <div style={{ marginTop: 'var(--space-4)' }}>
                        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-faint)', marginBottom: 'var(--space-2)' }}>Feedback History</p>
                        {sub.feedbacks.map(fb => (
                          <div key={fb.id} style={{ padding: 'var(--space-3)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-2)' }}>
                            {fb.note && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 'var(--space-1)' }}>{fb.note}</p>}
                            <p style={{ fontSize: '0.65rem', color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              {ACTION_FEEDBACK_LABELS[fb.action] || fb.action}{' · '}{new Date(fb.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                            {fb.resubmitDueDate && (
                              <p style={{ fontSize: '0.62rem', marginTop: '0.2rem', color: 'var(--color-warning)', fontWeight: 700 }}>
                                Resubmit by: {new Date(fb.resubmitDueDate + 'T23:59:59').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── ADMIN decision panel ── */}
                    {isAdmin && (
                      <div style={{ marginTop: 'var(--space-5)', borderTop: '1px solid var(--color-divider)', paddingTop: 'var(--space-4)' }}>
                        <p style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 'var(--space-3)' }}>Review Decision</p>

                        {actionErr && (
                          <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--color-error-highlight)', border: '1px solid var(--color-error)', color: 'var(--color-error)', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                            {actionErr}
                          </div>
                        )}

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.6rem', marginBottom: 'var(--space-3)', background: timeLabel ? 'var(--color-surface-2)' : 'var(--color-surface-offset)', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)' }}>
                          <Clock size={11} style={{ color: 'var(--color-text-faint)', flexShrink: 0 }} />
                          <span style={{ color: 'var(--color-text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Time on task:</span>
                          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: timeLabel ? 'var(--color-text)' : 'var(--color-text-faint)' }}>
                            {timeLabel ?? 'not recorded'}
                          </span>
                        </div>

                        <textarea
                          className="input-base" rows={3}
                          placeholder="Comment (required for Request Changes and Submit for Redo)"
                          value={noteVal}
                          onChange={e => setNoteMap(m => ({ ...m, [sub.id]: e.target.value }))}
                          style={{ marginBottom: 'var(--space-3)', resize: 'vertical', width: '100%' }}
                        />

                        <div style={{ marginBottom: 'var(--space-3)' }}>
                          <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--color-text-faint)', marginBottom: '0.35rem' }}>
                            Resubmission Due Date
                            <span style={{ marginLeft: '0.4rem', color: 'var(--color-text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                              (required for Request Changes · must be ≥ 6 hrs from now · due at 11:59 PM)
                            </span>
                          </label>
                          <input type="date" min={minResub} value={resubVal}
                            onChange={e => setResubMap(m => ({ ...m, [sub.id]: e.target.value }))}
                            style={{ padding: '0.35rem 0.6rem', fontSize: 'var(--text-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', borderRadius: 0, width: '100%' }}
                          />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-4)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Standard reward: <strong style={{ color: 'var(--color-text)' }}>${(baseReward / 100).toFixed(2)}</strong></span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>+ Bonus: $</span>
                            <input type="number" min="0" step="0.01" value={bonusVal}
                              onChange={e => setBonusMap(m => ({ ...m, [sub.id]: e.target.value }))}
                              placeholder="0.00"
                              style={{ width: '72px', padding: '0.2rem 0.4rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-body)' }}
                            />
                          </div>
                          {bonusNum > 0 && <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-success)' }}>Total payout: ${totalPayout}</span>}
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                          <button className="btn-primary btn-sm" disabled={isBusy} onClick={() => handleDecision(sub.id, 'approved')}>Approve</button>
                          <button className="btn-outline btn-sm" disabled={isBusy || !noteVal.trim()} onClick={() => handleDecision(sub.id, 'needs_revision')} title={!noteVal.trim() ? 'A comment is required' : undefined}>Request Changes</button>
                          <button className="btn-danger btn-sm"  disabled={isBusy || !noteVal.trim()} onClick={() => handleDecision(sub.id, 'redo')}           title={!noteVal.trim() ? 'A comment is required' : undefined}>Submit for Redo</button>
                        </div>
                      </div>
                    )}

                    {/* ── STUDENT revision form (needs_revision only) ── */}
                    {needsRevisionStudent && (
                      <StudentRevisionForm sub={sub} onResubmitted={handleStudentResubmitted} />
                    )}

                    <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-divider)', display: 'flex', justifyContent: canView ? 'flex-end' : 'flex-start' }}>
                      {sub.task?.id && (
                        <Link to={`/tasks/${sub.task.id}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none', padding: '0.3rem 0.75rem', border: '1px solid var(--color-primary)', transition: 'background var(--transition-interactive)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-highlight)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <ExternalLink size={12} /> View Task
                        </Link>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
