const jwt = require('jsonwebtoken');
const { ADMIN_EMAILS, PARENT_EMAILS } = require('../config/roles');

function getRole(email) {
  if (ADMIN_EMAILS.includes(email)) return 'admin';
  if (PARENT_EMAILS.includes(email)) return 'parent';
  return 'student';
}

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole, getRole };
