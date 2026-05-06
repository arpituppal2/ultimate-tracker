import { useState, useEffect, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import api from '../utils/api';

// ─── Constants ────────────────────────────────────────────────────────────────

// Dynamic MIN_DATE: today or next weekday (no past dates)
function getMinDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  // If weekend, push to Monday
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  if (d.getDay() === 6) d.setDate(d.getDate() + 2);
  return d.toISOString().slice(0, 10);
}
const MIN_DATE = getMinDate();

const TASK_TYPES = [
  { key: 'amc',            label: 'AMC Topic Log',         category: 'amc',           templateType: 'amc'             },
  { key: 'khan',           label: 'Khan Academy',          category: 'khan',          templateType: 'khan'            },
  { key: 'ap_lesson',      label: 'AP Lesson',             category: 'ap',            templateType: 'ap_lesson'       },
  { key: 'ap_frq',         label: 'AP FRQ / Essay',        category: 'ap',            templateType: 'ap_frq'          },
  { key: 'timed_exam',     label: 'Timed Exam',            category: 'ap',            templateType: 'timed_exam'      },
  { key: 'review',         label: 'Error Review',          category: 'ap',            templateType: 'review'          },
  { key: 'sat',            label: 'SAT / ACT Prep',        category: 'test_prep',     templateType: 'sat'             },
  { key: 'career',         label: 'EC / Activity Log',     category: 'career',        templateType: 'career'          },
  { key: 'career_report',  label: 'Career Report',         category: 'career',        templateType: 'career_report'   },
  { key: 'reading',        label: 'Reading Log',           category: 'reading',       templateType: 'reading_log'     },
  { key: 'writing',        label: 'Writing',               category: 'writing',       templateType: 'writing'         },
  { key: 'research',       label: 'Research',              category: 'research',      templateType: 'research'        },
  { key: 'ap_analysis',    label: 'AP Curriculum Analysis',category: 'research',      templateType: 'ap_analysis'     },
  { key: 'college',        label: 'College Prep',          category: 'college',       templateType: 'college'         },
  { key: 'college_research', label: 'College Research',    category: 'college',       templateType: 'college_research'},
  { key: 'interview',      label: 'Interview Prep',        category: 'college',       templateType: 'interview'       },
  { key: 'proof_log',      label: 'Block Proof Log',       category: 'quarterly',     templateType: 'proof_log'       },
  { key: 'weekly',         label: 'Weekly Preview',        category: 'weekly',        templateType: 'weekly_preview'  },
  { key: 'block_review',   label: 'Block Review (4-Week)', category: 'quarterly',     templateType: 'block_review'    },
  { key: 'simple',         label: 'General',               category: 'daily',         templateType: 'simple'          },
];

// Editable pre-fill fields per template (shown in step 3 for admin to fill)
const TEMPLATE_FIELDS = {
  amc:           [ { key: 'problemSet', label: 'Problem Set',        placeholder: 'e.g. AMC 8 2023 #1–10'              } ],
  khan:          [ { key: 'course',     label: 'Course',             placeholder: 'e.g. Pre-Algebra'                   },
                   { key: 'unit',       label: 'Unit',               placeholder: 'e.g. Unit 3'                        } ],
  ap_lesson:     [ { key: 'ap_course',  label: 'AP Course',          placeholder: 'e.g. AP Calculus BC'                },
                   { key: 'unit',       label: 'Unit',               placeholder: 'e.g. Unit 3 — Derivatives'          },
                   { key: 'lesson',     label: 'Lesson / Topic',     placeholder: 'e.g. Chain Rule'                    } ],
  ap_frq:        [ { key: 'ap_course',  label: 'AP Course',          placeholder: 'e.g. AP Biology'                    },
                   { key: 'source',     label: 'Prompt Source',      placeholder: 'e.g. 2022 AP Bio FRQ #2'            } ],
  timed_exam:    [ { key: 'exam_name',  label: 'Exam Name & Year',   placeholder: 'e.g. AP Bio Practice Exam 1'        } ],
  review:        [ { key: 'source',     label: 'Source to Review',   placeholder: 'e.g. AP Bio Unit 3 Progress Check'  } ],
  sat:           [ { key: 'examType',   label: 'Exam / Section',     placeholder: 'e.g. SAT Full Test, Math Section'   },
                   { key: 'source',     label: 'Source',             placeholder: 'e.g. College Board Practice Test 4' } ],
  career:        [ { key: 'activity',   label: 'Activity',           placeholder: 'e.g. Science Olympiad, volunteering' },
                   { key: 'goal',       label: 'Goal',               placeholder: 'What should be accomplished?'       } ],
  reading:       [ { key: 'bookTitle',  label: 'Book Title',         placeholder: 'e.g. The Innovators — W. Isaacson'  },
                   { key: 'genre',      label: 'Genre',              placeholder: 'e.g. Non-Fiction, Biography'        } ],
  writing:       [ { key: 'assignType', label: 'Writing Type',       placeholder: 'e.g. Personal Statement Draft 1'   },
                   { key: 'prompt',     label: 'Prompt / Topic',     placeholder: 'e.g. Describe a challenge you overcame' } ],
  research:      [ { key: 'topic',      label: 'Research Topic',     placeholder: 'e.g. MIT EECS program'              },
                   { key: 'resType',    label: 'Research Type',      placeholder: 'e.g. College / Career / Academic'   } ],
  college:       [ { key: 'schoolTask', label: 'School / Task',      placeholder: 'e.g. Stanford — research visit'     },
                   { key: 'deadline',   label: 'External Deadline',  placeholder: 'e.g. Nov 1'                         } ],
  interview:     [ { key: 'program',    label: 'Program / School',   placeholder: 'e.g. RSI 2029, MIT Alumni Interview' },
                   { key: 'iType',      label: 'Interview Type',     placeholder: 'e.g. Alumni, Panel, Mock'           } ],
  career_report:     [ { key: 'careerTitle', label: 'Career Title',     placeholder: 'e.g. Machine Learning Engineer'           },
                        { key: 'blockWeek',  label: 'Block / Week',     placeholder: 'e.g. Block 2 / Week 5'                   } ],
  ap_analysis:       [ { key: 'courseName', label: 'AP Course Name',   placeholder: 'e.g. AP Calculus BC'                     },
                        { key: 'category',  label: 'Subject Category', placeholder: 'e.g. STEM · Mathematics'                 } ],
  college_research:  [ { key: 'universityName', label: 'University Name', placeholder: 'e.g. Massachusetts Institute of Technology' },
                        { key: 'shortName',  label: 'Abbreviation',    placeholder: 'e.g. MIT'                                } ],
  proof_log:         [ { key: 'blockId',   label: 'Block ID',          placeholder: 'e.g. Block 2'                            },
                        { key: 'dateRange', label: 'Block Date Range',  placeholder: 'e.g. May 26 – Jun 22, 2026'             } ],
  weekly_preview:    [ { key: 'weekGoals', label: 'Week Goals',        placeholder: 'Pre-fill goals for this week', multiline: true } ],
  block_review:      [ { key: 'blockId',   label: 'Block ID',          placeholder: 'e.g. Block 2'                            },
                        { key: 'dateRange', label: 'Block Date Range',  placeholder: 'e.g. May 26 – Jun 22, 2026'             } ],
  simple:            [],
};

// Template field labels shown in the right-panel preview (read-only skeleton)
const TEMPLATE_PREVIEW_SCHEMA = {
  amc:           [ { label: 'Problem Set',         adminSet: true  }, { label: 'Score',              adminSet: false },
                   { label: 'Time Taken',           adminSet: false }, { label: 'Notes / Mistakes',   adminSet: false } ],
  khan:          [ { label: 'Course',               adminSet: true  }, { label: 'Unit',               adminSet: true  },
                   { label: 'Mastery %',            adminSet: false }, { label: 'Time Spent',         adminSet: false } ],
  ap_lesson:     [ { label: 'AP Course',            adminSet: true  }, { label: 'Unit',               adminSet: true  },
                   { label: 'Lesson / Topic',       adminSet: true  }, { label: 'Study Source',       adminSet: false },
                   { label: 'Key Concepts (×5)',    adminSet: false }, { label: 'Practice Score',     adminSet: false },
                   { label: 'Notes Photo Link',     adminSet: false }, { label: 'Reflection',         adminSet: false } ],
  ap_frq:        [ { label: 'AP Course',            adminSet: true  }, { label: 'Prompt Source',      adminSet: true  },
                   { label: 'FRQ Prompt',           adminSet: false }, { label: 'Outline',            adminSet: false },
                   { label: 'Response Link',        adminSet: false }, { label: 'Self-Score',         adminSet: false },
                   { label: 'Reflection',           adminSet: false } ],
  timed_exam:    [ { label: 'Exam Name & Year',     adminSet: true  },
                   { label: 'Conditions Check',     adminSet: false }, { label: 'Raw Score',          adminSet: false },
                   { label: 'Exam Scan Link',       adminSet: false }, { label: 'Section Breakdown',  adminSet: false },
                   { label: 'Reflection',           adminSet: false } ],
  review:        [ { label: 'Source Reviewed',      adminSet: true  },
                   { label: 'Problem Corrections (×5)', adminSet: false },
                   { label: 'Root Cause',           adminSet: false }, { label: 'Fix Plan',           adminSet: false } ],
  sat:           [ { label: 'Exam / Section',       adminSet: true  }, { label: 'Source',             adminSet: true  },
                   { label: 'Math Score',           adminSet: false }, { label: 'R&W Score',          adminSet: false },
                   { label: 'Total Score',          adminSet: false }, { label: 'Error Log (×5)',     adminSet: false },
                   { label: 'Drill Plan',           adminSet: false } ],
  career:        [ { label: 'Activity',             adminSet: true  }, { label: 'Goal',               adminSet: true  },
                   { label: 'Outcome',              adminSet: false } ],
  reading:       [ { label: 'Book Title',           adminSet: true  }, { label: 'Genre',              adminSet: true  },
                   { label: 'Summary',              adminSet: false }, { label: '3 Key Takeaways',    adminSet: false },
                   { label: 'College Connection',   adminSet: false } ],
  writing:       [ { label: 'Writing Type',         adminSet: true  }, { label: 'Prompt / Topic',     adminSet: true  },
                   { label: 'Draft Link',           adminSet: false }, { label: 'Strongest Part',     adminSet: false },
                   { label: 'Next Steps',           adminSet: false } ],
  research:      [ { label: 'Research Topic',       adminSet: true  }, { label: 'Research Type',      adminSet: true  },
                   { label: 'Sources (×3)',         adminSet: false }, { label: 'Key Findings',       adminSet: false },
                   { label: 'Next Steps',           adminSet: false } ],
  college:       [ { label: 'School / Task',        adminSet: true  }, { label: 'Ext. Deadline',      adminSet: true  },
                   { label: 'Notes',                adminSet: false } ],
  interview:     [ { label: 'Program / School',     adminSet: true  }, { label: 'Interview Type',     adminSet: true  },
                   { label: 'Prep Q&A (×5)',        adminSet: false }, { label: 'Actual Questions',   adminSet: false },
                   { label: 'Confidence (1–10)',    adminSet: false }, { label: 'Follow-Up Sent',     adminSet: false } ],
  career_report:     [ { label: 'Career Title',          adminSet: true  }, { label: 'Block / Week',       adminSet: true  },
                        { label: 'Executive Overview',   adminSet: false }, { label: 'Job Description',    adminSet: false },
                        { label: 'Education Required',   adminSet: false }, { label: 'Skills',             adminSet: false },
                        { label: 'Compensation Range',   adminSet: false }, { label: 'Personal Fit',       adminSet: false },
                        { label: 'References',           adminSet: false } ],
  ap_analysis:       [ { label: 'AP Course Name',        adminSet: true  }, { label: 'Pass Rate (3+)',     adminSet: false },
                        { label: 'Elite Rate (5.0)',      adminSet: false }, { label: 'Credit Policy',      adminSet: false },
                        { label: 'Strategic Value',      adminSet: false }, { label: 'Rigor Rating',       adminSet: false },
                        { label: 'Personal Fit',         adminSet: false }, { label: 'Sources',            adminSet: false } ],
  college_research:  [ { label: 'University Name',       adminSet: true  }, { label: 'Acceptance Rate',    adminSet: false },
                        { label: 'Endowment/Student',    adminSet: false }, { label: 'Top Employers',      adminSet: false },
                        { label: 'Prestige Rating',      adminSet: false }, { label: 'Personal Fit',       adminSet: false },
                        { label: 'Sources',              adminSet: false } ],
  proof_log:         [ { label: 'Block ID',              adminSet: true  }, { label: 'Drive Folder Link',  adminSet: false },
                        { label: 'Habit Screenshots',    adminSet: false }, { label: 'Khan Completed',     adminSet: false },
                        { label: 'AMC Topics',           adminSet: false }, { label: 'Career Reports',     adminSet: false },
                        { label: 'Parent Check Notes',   adminSet: false } ],
  weekly_preview:    [ { label: 'Block ID / Week',       adminSet: true  }, { label: 'Khan Targets',       adminSet: false },
                        { label: 'AMC Topics',           adminSet: false }, { label: 'Career Deep-Dives',  adminSet: false },
                        { label: 'AP Exploration',       adminSet: false }, { label: 'Mindset Check-In',   adminSet: false } ],
  block_review:      [ { label: 'Block ID',              adminSet: true  }, { label: 'Date Range',         adminSet: true  },
                        { label: 'Khan Academy Units',   adminSet: false }, { label: 'AMC Topics',         adminSet: false },
                        { label: 'Careers Explored',     adminSet: false }, { label: 'Habit Rate',         adminSet: false },
                        { label: 'Money Summary',        adminSet: false }, { label: 'Reflection',         adminSet: false } ],
  simple:            [ { label: 'Proof Document',        adminSet: false }, { label: 'Notes',              adminSet: false } ],
};

function buildDueDates(form) {
  if (form.recurrence === 'none') return [form.dueDate];
  const stepDays = form.recurrence === 'daily' ? 1 : form.recurrence === 'weekly' ? 7 : parseInt(form.interval, 10) || 1;
  const start = new Date(form.dueDate);
  if (isNaN(start)) return [];
  const dates = [];
  if (form.endType === 'count') {
    const n = Math.min(parseInt(form.count, 10) || 1, 365);
    for (let i = 0; i < n; i++) {
      const d = new Date(start); d.setDate(d.getDate() + i * stepDays);
      dates.push(d.toISOString().slice(0, 10));
    }
  } else {
    const end = new Date(form.endDate);
    if (isNaN(end) || end < start) return [form.dueDate];
    let cur = new Date(start);
    while (cur <= end && dates.length < 365) {
      dates.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + stepDays);
    }
  }
  return dates;
}

function timeUntil(expiresAt) {
  const ms = new Date(expiresAt) - Date.now();
  if (ms <= 0) return 'expired';
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

// ─── Guard ────────────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const { user } = useAuth();
  if (!user || (user.role !== 'admin' && user.role !== 'parent')) return <Navigate to="/today" replace />;
  return <AdminPanelInner />;
}

// ─── Main panel ───────────────────────────────────────────────────────────────

function AdminPanelInner() {
  const [ledgerForm, setLedgerForm] = useState({ amount: '', reason: '' });
  const [ledgerMsg,  setLedgerMsg]  = useState(null);
  const [ledgerBusy, setLedgerBusy] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [batches,        setBatches]        = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [restoringId,    setRestoringId]    = useState(null);
  const [purgingId,      setPurgingId]      = useState(null);
  const [successMsg,     setSuccessMsg]     = useState(null);

  const loadBatches = useCallback(async () => {
    try { const { data } = await api.get('/admin/deleted-batches'); setBatches(Array.isArray(data) ? data : []); }
    catch { setBatches([]); } finally { setBatchesLoading(false); }
  }, []);

  useEffect(() => { loadBatches(); }, [loadBatches]);

  const submitLedger = async () => {
    setLedgerBusy(true); setLedgerMsg(null);
    try {
      const { data } = await api.post('/ledger', { ...ledgerForm, amount: parseFloat(ledgerForm.amount) });
      setLedgerMsg({ ok: true, text: `Entry saved: $${data.amount}` });
      setLedgerForm({ amount: '', reason: '' });
    } catch (err) {
      setLedgerMsg({ ok: false, text: err.response?.data?.error || 'Failed.' });
    } finally { setLedgerBusy(false); }
  };

  const restoreBatch = async (id) => {
    setRestoringId(id);
    try {
      const { data } = await api.post(`/admin/deleted-batches/${id}/restore`);
      alert(`Restored ${data.restored} task${data.restored !== 1 ? 's' : ''}.`);
      loadBatches();
    } catch (err) { alert('Restore failed: ' + (err.response?.data?.error || err.message)); }
    finally { setRestoringId(null); }
  };

  const purgeBatch = async (id) => {
    if (!window.confirm('Permanently delete this batch? Cannot be undone.')) return;
    setPurgingId(id);
    try { await api.delete(`/admin/deleted-batches/${id}`); loadBatches(); }
    catch (err) { alert('Purge failed: ' + (err.response?.data?.error || err.message)); }
    finally { setPurgingId(null); }
  };

  const handleTaskCreated = (count) => {
    setWizardOpen(false);
    setSuccessMsg(`${count} task${count !== 1 ? 's' : ''} created successfully.`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const s = {
    card: { background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: 'var(--space-5)' },
    sectionLabel: { fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-faint)', marginBottom: 'var(--space-3)' },
  };

  return (
    <div style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
          <span className="gold-rule" />
          <span className="section-label">Administration</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 800, lineHeight: 1.1 }}>Admin Panel</h1>
      </div>

      {successMsg && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          marginBottom: 'var(--space-4)',
          background: 'var(--color-success-highlight)',
          color: 'var(--color-success)',
          border: '1px solid var(--color-success)',
          fontSize: 'var(--text-sm)', fontWeight: 600,
        }}>
          ✓ {successMsg}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

        <div style={s.card}>
          <p style={s.sectionLabel}>Tasks</p>
          <button className="btn-primary btn-sm" onClick={() => setWizardOpen(true)}>+ Add New Task</button>
        </div>

        <div style={s.card}>
          <p style={s.sectionLabel}>Manual Finance Entry</p>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Amount ($)</label>
              <input type="number" step="0.01" className="input-base" value={ledgerForm.amount} onChange={e => setLedgerForm(f => ({ ...f, amount: e.target.value }))} placeholder="5.00 or −2.00" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Reason</label>
              <input className="input-base" value={ledgerForm.reason} onChange={e => setLedgerForm(f => ({ ...f, reason: e.target.value }))} placeholder="e.g. Quarter bonus" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button className="btn-primary btn-sm" disabled={ledgerBusy} onClick={submitLedger}>{ledgerBusy ? 'Saving…' : 'Add Entry'}</button>
            {ledgerMsg && <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: ledgerMsg.ok ? 'var(--color-success)' : 'var(--color-error)' }}>{ledgerMsg.text}</span>}
          </div>
        </div>

        <div style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <p style={{ ...s.sectionLabel, marginBottom: 0 }}>Recently Deleted</p>
            <button className="btn-ghost btn-sm" onClick={loadBatches}>↻ Refresh</button>
          </div>
          {batchesLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 44 }} />)}
            </div>
          ) : batches.length === 0 ? (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-faint)' }}>No recent bulk deletions.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {batches.map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>{b.label}</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', margin: '0.15rem 0 0' }}>
                      {new Date(b.deletedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      {' · '}<span style={{ color: 'var(--color-warning)' }}>{timeUntil(b.expiresAt)}</span>
                    </p>
                  </div>
                  <button className="btn-outline btn-sm" onClick={() => restoreBatch(b.id)} disabled={restoringId === b.id}>{restoringId === b.id ? 'Restoring…' : 'Restore'}</button>
                  <button className="btn-danger btn-sm" onClick={() => purgeBatch(b.id)} disabled={purgingId === b.id} title="Permanently delete">{purgingId === b.id ? '…' : '✕'}</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={s.card}>
          <p style={s.sectionLabel}>Quick Links</p>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Link to="/feedback"  className="btn-outline btn-sm">Review Queue</Link>
            <Link to="/inventory" className="btn-outline btn-sm">Task Inventory</Link>
          </div>
        </div>

      </div>

      {wizardOpen && <TaskWizard onClose={() => setWizardOpen(false)} onCreated={handleTaskCreated} />}
    </div>
  );
}

// ─── Task Wizard — full two-panel layout ──────────────────────────────────────

function TemplatePreviewPanel({ selectedType, form, prefill, dueDates }) {
  const schema = selectedType ? (TEMPLATE_PREVIEW_SCHEMA[selectedType.templateType] || TEMPLATE_PREVIEW_SCHEMA.simple) : null;
  const count = dueDates.length;

  return (
    <div style={{
      flex: '0 0 60%', maxWidth: '60%',
      background: 'var(--color-surface)',
      borderLeft: '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      <div style={{
        padding: 'var(--space-4) var(--space-5)',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface-offset)',
      }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: '0.2rem' }}>Template Preview</div>
        {selectedType ? (
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)' }}>{selectedType.label}</div>
        ) : (
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-faint)' }}>Select a type to preview</div>
        )}
      </div>

      <div style={{ padding: 'var(--space-5)', flex: 1 }}>
        {!selectedType ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 'var(--space-3)', color: 'var(--color-text-faint)', textAlign: 'center', paddingTop: 'var(--space-12)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="0"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>No type selected</span>
          </div>
        ) : (
          <>
            <div style={{
              padding: 'var(--space-4)',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              marginBottom: 'var(--space-5)',
            }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-faint)', marginBottom: '0.2rem' }}>
                {selectedType.label} · {count > 1 ? `${count} tasks` : (form.dueDate ? new Date(form.dueDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date')}
              </div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                {form.title || <span style={{ color: 'var(--color-text-faint)', fontStyle: 'italic' }}>Untitled task</span>}
              </div>
              {count > 1 && form.dueDate && dueDates[dueDates.length - 1] && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                  {form.dueDate} → {dueDates[dueDates.length - 1]}
                </div>
              )}
            </div>

            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--color-text-faint)', marginBottom: 'var(--space-3)' }}>Submission form fields</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {schema.map((field, i) => {
                const tFields = TEMPLATE_FIELDS[selectedType.templateType] || [];
                const tField  = tFields.find(f => f.label === field.label);
                const liveVal = tField ? prefill[tField.key] : null;
                return (
                  <div key={i} style={{
                    padding: 'var(--space-3)',
                    background: field.adminSet ? 'var(--color-surface)' : 'var(--color-surface-offset)',
                    border: '1px solid var(--color-border)',
                    display: 'flex', flexDirection: 'column', gap: '0.2rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text)' }}>
                        {field.label}
                      </span>
                      <span style={{
                        fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.06em', padding: '0.1rem 0.4rem',
                        background: field.adminSet ? 'rgba(39,116,174,0.10)' : 'var(--color-surface-offset)',
                        color: field.adminSet ? 'var(--ucla-blue)' : 'var(--color-text-faint)',
                        border: `1px solid ${field.adminSet ? 'rgba(39,116,174,0.20)' : 'var(--color-border)'}`,
                      }}>
                        {field.adminSet ? 'You set' : 'Avni fills'}
                      </span>
                    </div>
                    {liveVal ? (
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', fontWeight: 500 }}>{liveVal}</span>
                    ) : (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', fontStyle: 'italic' }}>
                        {field.adminSet ? 'Fill in the left panel' : 'Filled in by Avni'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TaskWizard({ onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [form, setForm] = useState({
    title: '', dueDate: MIN_DATE,
    recurrence: 'none', interval: 1,
    endType: 'date', endDate: '', count: 5,
  });
  const [prefill,  setPrefill]  = useState({});
  const [proofDoc, setProofDoc] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg,  setMsg]  = useState(null);

  const tf = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const dueDates = buildDueDates(form);
  const count = dueDates.length;

  const selectType = (t) => {
    setSelectedType(t);
    setPrefill({});
    setMsg(null);
    setForm(f => ({ ...f, title: f.title || t.label }));
    setStep(2);
  };

  const isSimple = selectedType?.templateType === 'simple';
  const templateFields = selectedType ? (TEMPLATE_FIELDS[selectedType.templateType] || []) : [];
  const totalSteps = isSimple ? 2 : 3;

  const submit = async () => {
    if (!form.title.trim() || !form.dueDate) { setMsg({ ok: false, text: 'Title and date are required.' }); return; }
    if (form.dueDate < MIN_DATE) { setMsg({ ok: false, text: `Date must be ${MIN_DATE} or later.` }); return; }
    setBusy(true); setMsg(null);
    try {
      for (const d of dueDates) {
        await api.post('/tasks', {
          title: form.title.trim(),
          category: selectedType.category,
          templateType: selectedType.templateType,
          dueDate: d,
          requiresProof: true,
          templatePrefill: Object.keys(prefill).length > 0 ? prefill : undefined,
          ...(isSimple && proofDoc.trim() ? { description: proofDoc.trim() } : {}),
        });
      }
      onCreated(count);
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.error || 'Failed to create task(s).' });
      setBusy(false);
    }
  };

  const labelStyle   = { fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)', display: 'block' };
  const sublabelStyle = { fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginTop: '0.2rem' };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'oklch(0 0 0 / 0.60)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-4)',
    }} onClick={e => e.target === e.currentTarget && onClose()}>

      <div style={{
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        width: '100%', maxWidth: '900px',
        maxHeight: '90vh',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Modal header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.15rem' }}>
              Step {step} of {totalSteps}
            </div>
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)' }}>
              {step === 1 ? 'Select Type' : step === 2 ? 'Task Details' : 'Pre-fill Template'}
            </div>
          </div>
          <button className="btn-ghost btn-sm" onClick={onClose} style={{ fontSize: '1.1rem', padding: 'var(--space-1)' }}>✕</button>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', flexShrink: 0 }}>
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map(n => (
            <div key={n} style={{ flex: 1, height: 3, background: n <= step ? 'var(--ucla-gold)' : 'var(--color-surface-offset)', transition: 'background 250ms ease' }} />
          ))}
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

          {/* LEFT PANEL */}
          <div style={{ flex: '0 0 40%', maxWidth: '40%', overflowY: 'auto', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

            {/* Step 1: Type picker */}
            {step === 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                {TASK_TYPES.map(t => (
                  <button key={t.key} onClick={() => selectType(t)} style={{
                    padding: 'var(--space-3) var(--space-4)',
                    background: selectedType?.key === t.key ? 'var(--color-surface-2)' : 'var(--color-surface)',
                    border: selectedType?.key === t.key ? '1px solid var(--ucla-blue)' : '1px solid var(--color-border)',
                    cursor: 'pointer', textAlign: 'left',
                    fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text)',
                    transition: 'all var(--transition-ui)',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ucla-gold)'; e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = selectedType?.key === t.key ? 'var(--ucla-blue)' : 'var(--color-border)';
                      e.currentTarget.style.background  = selectedType?.key === t.key ? 'var(--color-surface-2)' : 'var(--color-surface)';
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && selectedType && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>{selectedType.label}</span>
                  <button className="btn-ghost btn-sm" onClick={() => { setStep(1); setMsg(null); }} style={{ marginLeft: 'auto' }}>Change</button>
                </div>

                <div>
                  <label style={labelStyle}>Task Name</label>
                  <input className="input-base" value={form.title} onChange={e => { tf('title', e.target.value); setMsg(null); }} placeholder={`e.g. ${selectedType.label}`} autoFocus style={{ fontSize: 'var(--text-base)' }} />
                </div>

                <div>
                  <label style={labelStyle}>{form.recurrence === 'none' ? 'Due Date' : 'Start Date'}</label>
                  <input type="date" className="input-base" min={MIN_DATE} value={form.dueDate} onChange={e => { tf('dueDate', e.target.value); setMsg(null); }} style={{ maxWidth: '200px' }} />
                  <span style={sublabelStyle}>Earliest: {new Date(MIN_DATE + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>

                <div>
                  <label style={labelStyle}>Repeats?</label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {[{v:'none',l:'One-time'},{v:'daily',l:'Daily'},{v:'weekly',l:'Weekly'},{v:'custom',l:'Custom'}].map(r => (
                      <button key={r.v} onClick={() => tf('recurrence', r.v)}
                        className={form.recurrence === r.v ? 'btn-tab btn-sm btn-tab--active' : 'btn-tab btn-sm'}
                      >{r.l}</button>
                    ))}
                  </div>

                  {form.recurrence === 'custom' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Every</span>
                      <input type="number" min="1" max="365" className="input-base" style={{ width: '70px' }} value={form.interval} onChange={e => tf('interval', e.target.value)} />
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>days</span>
                    </div>
                  )}

                  {form.recurrence !== 'none' && (
                    <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: 'var(--space-3)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                        {[{v:'date',l:'End by date'},{v:'count',l:'# of times'}].map(o => (
                          <label key={o.v} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                            <input type="radio" name="endType" checked={form.endType === o.v} onChange={() => tf('endType', o.v)} /> {o.l}
                          </label>
                        ))}
                      </div>
                      {form.endType === 'date' ? (
                        <input type="date" className="input-base" style={{ maxWidth: '190px' }} min={MIN_DATE} value={form.endDate} onChange={e => tf('endDate', e.target.value)} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <input type="number" min="1" max="365" className="input-base" style={{ width: '75px' }} value={form.count} onChange={e => tf('count', e.target.value)} />
                          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>times</span>
                        </div>
                      )}
                      {count > 0 && (
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)', fontWeight: 600, margin: 0 }}>
                          {count} task{count !== 1 ? 's' : ''}
                          {count > 1 && form.dueDate && ` · ${form.dueDate} → ${dueDates[dueDates.length - 1]}`}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {isSimple && (
                  <div>
                    <label style={labelStyle}>Proof Document <span style={{ fontWeight: 400, color: 'var(--color-text-faint)' }}>(optional)</span></label>
                    <input className="input-base" value={proofDoc} onChange={e => setProofDoc(e.target.value)} placeholder="https://docs.google.com/…" />
                  </div>
                )}

                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', paddingTop: 'var(--space-2)' }}>
                  <button className="btn-ghost btn-sm" onClick={() => { setStep(1); setMsg(null); }}>← Back</button>
                  {isSimple ? (
                    <button className="btn-primary btn-sm" onClick={submit} disabled={busy}>
                      {busy ? 'Creating…' : `Create ${count > 1 ? count + ' Tasks' : 'Task'}`}
                    </button>
                  ) : (
                    <button className="btn-primary btn-sm" onClick={() => {
                      if (!form.title.trim() || !form.dueDate) { setMsg({ ok: false, text: 'Fill in task name and date.' }); return; }
                      setMsg(null); setStep(3);
                    }}>Pre-fill →</button>
                  )}
                  {msg && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)', fontWeight: 600 }}>{msg.text}</span>}
                </div>
              </>
            )}

            {/* Step 3: Pre-fill */}
            {step === 3 && selectedType && !isSimple && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-1)' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>{form.title}</span>
                  <button className="btn-ghost btn-sm" onClick={() => { setStep(2); setMsg(null); }} style={{ marginLeft: 'auto' }}>← Edit</button>
                </div>

                {templateFields.length > 0 ? (
                  <>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
                      These values will be pre-filled when Avni opens the task. Leave blank for her to fill in.
                    </p>
                    {templateFields.map(f => (
                      <div key={f.key}>
                        <label style={labelStyle}>{f.label}</label>
                        {f.multiline ? (
                          <textarea className="input-base" rows={3} value={prefill[f.key] || ''}
                            onChange={e => { setPrefill(p => ({ ...p, [f.key]: e.target.value })); setMsg(null); }}
                            placeholder={f.placeholder} style={{ resize: 'vertical' }} />
                        ) : (
                          <input className="input-base" value={prefill[f.key] || ''}
                            onChange={e => { setPrefill(p => ({ ...p, [f.key]: e.target.value })); setMsg(null); }}
                            placeholder={f.placeholder} />
                        )}
                      </div>
                    ))}
                  </>
                ) : (
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>No pre-fillable fields for this template.</p>
                )}

                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-border)' }}>
                  <button className="btn-ghost btn-sm" onClick={() => { setStep(2); setMsg(null); }}>← Back</button>
                  <button className="btn-primary btn-sm" onClick={submit} disabled={busy}>
                    {busy ? 'Creating…' : `Create ${count > 1 ? count + ' Tasks' : 'Task'}`}
                  </button>
                  {msg && <span style={{ fontSize: 'var(--text-xs)', color: msg.ok ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 600 }}>{msg.text}</span>}
                </div>
              </>
            )}

          </div>

          {/* RIGHT PANEL */}
          <TemplatePreviewPanel
            selectedType={step >= 1 ? selectedType : null}
            form={form}
            prefill={prefill}
            dueDates={dueDates}
          />

        </div>
      </div>
    </div>
  );
}
