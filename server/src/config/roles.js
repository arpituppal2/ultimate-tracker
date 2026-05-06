// All email lists come from Railway environment variables.
// Set these in your Railway service's Variables tab before deploying.
//
//   ADMIN_EMAILS   = arpituppal2@gmail.com
//   PARENT_EMAILS  = suresh.uppal@gmail.com,priyankauppal15@gmail.com
//   STUDENT_EMAILS = 1074649@lammersvilleusd.net

const DEFAULT_ADMIN_EMAILS = ['arpituppal2@gmail.com'];
const DEFAULT_PARENT_EMAILS = ['suresh.uppal@gmail.com', 'priyankauppal15@gmail.com'];
const DEFAULT_STUDENT_EMAILS = ['1074649@lammersvilleusd.net'];

const ADMIN_EMAILS = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  : DEFAULT_ADMIN_EMAILS;

const PARENT_EMAILS = process.env.PARENT_EMAILS
  ? process.env.PARENT_EMAILS.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  : DEFAULT_PARENT_EMAILS;

const STUDENT_EMAILS = process.env.STUDENT_EMAILS
  ? process.env.STUDENT_EMAILS.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  : DEFAULT_STUDENT_EMAILS;

const ALLOWED_EMAILS = [...ADMIN_EMAILS, ...PARENT_EMAILS, ...STUDENT_EMAILS];

function isEmailAllowed(email) {
  return ALLOWED_EMAILS.includes((email || '').toLowerCase().trim());
}

function getRoleForEmail(email) {
  const e = (email || '').toLowerCase().trim();
  if (ADMIN_EMAILS.includes(e))   return 'admin';
  if (PARENT_EMAILS.includes(e))  return 'parent';
  if (STUDENT_EMAILS.includes(e)) return 'student';
  return 'student';
}

module.exports = { ALLOWED_EMAILS, ADMIN_EMAILS, PARENT_EMAILS, STUDENT_EMAILS, isEmailAllowed, getRoleForEmail };
