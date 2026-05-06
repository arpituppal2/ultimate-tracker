const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { getRoleForEmail, isEmailAllowed } = require('../config/roles');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const normalizedEmail = email.toLowerCase().trim();

    if (!isEmailAllowed(normalizedEmail))
      return res.status(403).json({ error: 'This email is not authorized to register.' });

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing)
      return res.status(409).json({ error: 'An account already exists for this email.' });

    const hash = await bcrypt.hash(password, 10);
    const role = getRoleForEmail(normalizedEmail);
    const name = [firstName, lastName].filter(Boolean).join(' ').trim() || null;

    const user = await prisma.user.create({
      data: { email: normalizedEmail, password: hash, role, name }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        isActive: user.isActive,
        disabled: user.disabled,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
    if (user.disabled || user.isActive === false) {
      return res.status(403).json({ error: 'This account is disabled.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        isActive: user.isActive,
        disabled: user.disabled,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        isActive: true,
        disabled: true,
        pageAccess: true,
        createdAt: true,
      }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

module.exports = router;
