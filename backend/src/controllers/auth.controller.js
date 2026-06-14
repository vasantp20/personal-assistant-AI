const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const validate = require('../middleware/validate');

// ── Helpers ───────────────────────────────────────────────────────────────────

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

// Parses a duration string like "7d", "24h", "60m" into milliseconds.
function parseDuration(str) {
  const match = String(str).match(/^(\d+)(d|h|m|s)$/);
  if (!match) throw new Error(`Invalid duration format: "${str}". Use e.g. 7d, 24h, 60m.`);
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const ms = { d: 86400000, h: 3600000, m: 60000, s: 1000 }[unit];
  return value * ms;
}

async function createRefreshToken(userId) {
  const token = crypto.randomBytes(64).toString('hex');
  const duration = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
  const expiresAt = new Date(Date.now() + parseDuration(duration));
  await RefreshToken.create({ token, userId, expiresAt });
  return token;
}

// ── Auth: register ────────────────────────────────────────────────────────────

exports.registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
];

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use', code: 'CONFLICT' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    const token = signToken(user._id);
    const refreshToken = await createRefreshToken(user._id);

    res.status(201).json({ user, token, refreshToken });
  } catch (err) {
    next(err);
  }
};

// ── Auth: login ───────────────────────────────────────────────────────────────

exports.loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials', code: 'UNAUTHORIZED' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials', code: 'UNAUTHORIZED' });
    }

    const token = signToken(user._id);
    const refreshToken = await createRefreshToken(user._id);

    res.json({ user, token, refreshToken });
  } catch (err) {
    next(err);
  }
};

// ── Auth: refresh ─────────────────────────────────────────────────────────────

exports.refreshValidation = [
  body('refreshToken').notEmpty().withMessage('refreshToken is required'),
  validate,
];

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    const stored = await RefreshToken.findOne({ token: refreshToken });
    if (!stored || stored.expiresAt < new Date()) {
      // Also clean up if found but expired (TTL index may not have fired yet)
      if (stored) await stored.deleteOne();
      return res.status(401).json({ error: 'Invalid or expired refresh token', code: 'UNAUTHORIZED' });
    }

    const user = await User.findById(stored.userId);
    if (!user) {
      await stored.deleteOne();
      return res.status(401).json({ error: 'User not found', code: 'UNAUTHORIZED' });
    }

    // Rotate: delete old token and issue a fresh pair
    await stored.deleteOne();
    const token = signToken(user._id);
    const newRefreshToken = await createRefreshToken(user._id);

    res.json({ token, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
};

// ── Auth: logout ──────────────────────────────────────────────────────────────

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken });
    }
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

// ── Auth: me ──────────────────────────────────────────────────────────────────

exports.me = (req, res) => {
  res.json(req.user);
};
