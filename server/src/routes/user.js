const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth.js');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/user/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, name: true, role: true,
        disabled: true, pageAccess: true, createdAt: true,
      },
    });
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/user/me
router.patch('/me', authenticate, async (req, res) => {
  const { name } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name },
      select: {
        id: true, email: true, name: true, role: true,
        disabled: true, pageAccess: true,
      },
    });
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
