import { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { EmptyState, PageHeader, SectionTitle, StatusChip } from '../components/TaskSurface';

function SubmissionCard({ submission, canReview, onAction }) {
  const [note, setNote] = useState('');
  const [bonus, setBonus] = useState('');
  const latestFeedback = submission.feedbacks?.[0];

  return (
    <div style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
      <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text)' }}>{submission.task?.title}</div>
          <div style={{ marginTop: '0.15rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {submission.task?.category} · {new Date(submission.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>
        <StatusChip status={submission.status === 'approved' ? 'done' : submission.status} />
      </div>

      <div style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-3)' }}>
        {submission.notes && (
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.55 }}>
            {submission.notes}
          </div>
        )}

        {latestFeedback?.note && (
          <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.55 }}>
            {latestFeedback.note}
          </div>
        )}

        {submission.driveLinks?.length > 0 && (
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            {submission.driveLinks.map((link, index) => (
              <a key={index} href={link} target="_blank" rel="noreferrer" className="link-accent">
                {link}
              </a>
            ))}
          </div>
        )}

        {canReview && submission.status === 'pending_review' && (
          <div style={{ display: 'grid', gap: 'var(--space-3)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
            <textarea
              className="input-base"
              rows={3}
              value={note}
              onChange={event => setNote(event.target.value)}
              placeholder="Review note"
              style={{ resize: 'vertical' }}
            />
            <input
              className="input-base"
              value={bonus}
              onChange={event => setBonus(event.target.value)}
              placeholder="Bonus amount in dollars (optional)"
            />
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <button className="btn-primary btn-sm" onClick={() => onAction(submission.id, 'approved', note, bonus)}>Approve</button>
              <button className="btn-outline btn-sm" onClick={() => onAction(submission.id, 'needs_revision', note, bonus)}>Request Revision</button>
              <button className="btn-danger btn-sm" onClick={() => onAction(submission.id, 'missing', note, bonus)}>Mark Missed</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Notes() {
  const { user } = useAuth();
  const canReview = user?.role === 'admin' || user?.role === 'parent';
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/submissions')
      .then(response => setSubmissions(Array.isArray(response.data) ? response.data : []))
      .catch(err => setError(err.response?.data?.error || 'Failed to load notes.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const pending = useMemo(
    () => submissions.filter(submission => submission.status === 'pending_review'),
    [submissions]
  );
  const history = useMemo(
    () => submissions.filter(submission => submission.status !== 'pending_review'),
    [submissions]
  );

  async function handleAction(submissionId, action, note, bonus) {
    if (!canReview) return;
    await api.post('/feedback', {
      submissionId,
      action,
      note,
      ...(action === 'approved' && bonus ? { bonusCents: Math.round(Number(bonus) * 100) } : {}),
    });
    load();
  }

  return (
    <div style={{ paddingTop: 'var(--space-6)' }}>
      <PageHeader
        eyebrow="Notes"
        title={canReview ? 'Review Queue' : 'Notes'}
        submeta={canReview ? '' : 'Submission history and review notes.'}
      />

      {error && (
        <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--color-error)', background: 'var(--color-error-highlight)', color: 'var(--color-error)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {[1, 2].map(item => (
            <div key={item} className="surface-card" style={{ padding: 'var(--space-4)' }}>
              <div className="skeleton skeleton-text" />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
          <section>
            <SectionTitle title={canReview ? 'Pending Review' : 'Recent Submissions'} count={(canReview ? pending : submissions).length} />
            {(canReview ? pending : submissions).length === 0 ? (
              <EmptyState text={canReview ? 'Nothing is waiting for review.' : 'No submissions yet.'} />
            ) : (
              <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                {(canReview ? pending : submissions).map(submission => (
                  <SubmissionCard key={submission.id} submission={submission} canReview={canReview} onAction={handleAction} />
                ))}
              </div>
            )}
          </section>

          {canReview && (
            <section>
              <SectionTitle title="History" count={history.length} />
              {history.length === 0 ? (
                <EmptyState text="No reviewed submissions yet." />
              ) : (
                <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                  {history.map(submission => (
                    <SubmissionCard key={submission.id} submission={submission} canReview={false} onAction={handleAction} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
