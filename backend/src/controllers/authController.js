import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { logAudit } from '../utils/audit.js';

/**
 * Handle user login, password verification, and JWT creation
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userResult = await query(
      'SELECT id, full_name, email, password_hash, role, is_active FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated. Please contact an administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT signed with JWT_SECRET containing id, role, full_name (1 day expiry)
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        full_name: user.full_name,
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    // Record audit event for successful login
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    await logAudit(user.id, 'LOGIN', 'users', user.id, { email: user.email }, clientIp);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Return current logged-in user's profile (excluding password_hash)
 */
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await query(
      'SELECT id, full_name, email, role, is_active, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    return res.status(200).json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * Validate old password and update with hashed new password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Both oldPassword and newPassword are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const userId = req.user.id;

    const userResult = await query(
      'SELECT id, password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, userResult.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password does not match' });
    }

    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, userId]
    );

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    await logAudit(userId, 'CHANGE_PASSWORD', 'users', userId, { changed: true }, clientIp);

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

export default {
  login,
  getProfile,
  changePassword,
};
