// Central config — all org-specific values come from Railway environment variables.
// Set these in your Railway service's Variables tab.

const ALLOWED_EMAIL_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || null; // e.g. "uni.edu"

const ADMIN_EMAILS = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim()).filter(Boolean)
  : [];

const GUEST_EMAIL = process.env.GUEST_EMAIL || null; // e.g. "guest@yourdomain.edu"

const TOPICS = process.env.TOPICS
  ? process.env.TOPICS.split(',').map((t) => t.trim()).filter(Boolean)
  : ['Algebra', 'Combinatorics', 'Number Theory', 'Geometry'];

const APP_NAME = 'P.R.O.S.E.';

module.exports = { ALLOWED_EMAIL_DOMAIN, ADMIN_EMAILS, GUEST_EMAIL, TOPICS, APP_NAME };
