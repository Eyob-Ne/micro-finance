import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { logAudit } from '../utils/audit.js';

/**
 * List all staff users (excludes password hashes)
 * Constraint: Admin only
 */
export const getUsers = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, full_name, email, role, is_active, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );

    return res.status(200).json({
      count: result.rows.length,
      users: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new staff user
 * Constraint: Admin only, parameterized queries, password hashed, audit log recorded
 */
export const createUser = async (req, res, next) => {
  try {
    const { full_name, email, password, role } = req.body;

    if (!full_name || !email || !password || !role) {
      return res.status(400).json({
        error: 'full_name, email, password, and role are required',
      });
    }

    const validRoles = ['admin', 'manager', 'loan_officer', 'cashier'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long',
      });
    }

    // Check if email is already registered
    const existing = await query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'A user with this email address already exists',
      });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const insertText = `
      INSERT INTO users (full_name, email, password_hash, role, is_active, created_at)
      VALUES ($1, $2, $3, $4, true, NOW())
      RETURNING id, full_name, email, role, is_active, created_at
    `;

    const result = await query(insertText, [
      full_name.trim(),
      email.trim().toLowerCase(),
      passwordHash,
      role,
    ]);

    const newUser = result.rows[0];

    // Record audit log
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    await logAudit(
      req.user.id,
      'CREATE_USER',
      'users',
      newUser.id,
      { full_name: newUser.full_name, email: newUser.email, role: newUser.role },
      clientIp
    );

    return res.status(201).json({
      message: 'Staff user created successfully',
      user: newUser,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update staff user role or active status
 * Constraint: Admin only, parameterized queries, audit log recorded
 */
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, is_active, full_name } = req.body;

    if (role) {
      const validRoles = ['admin', 'manager', 'loan_officer', 'cashier'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        });
      }
    }

    const updateText = `
      UPDATE users
      SET role = COALESCE($1, role),
          is_active = COALESCE($2, is_active),
          full_name = COALESCE($3, full_name)
      WHERE id = $4
      RETURNING id, full_name, email, role, is_active, created_at
    `;

    const result = await query(updateText, [
      role !== undefined ? role : null,
      is_active !== undefined ? is_active : null,
      full_name !== undefined ? full_name : null,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = result.rows[0];

    // Record audit log
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    await logAudit(
      req.user.id,
      'UPDATE_USER',
      'users',
      id,
      { role, is_active, full_name },
      clientIp
    );

    return res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Soft delete staff user by setting is_active = false
 * Constraint: Admin only, audit log recorded
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Safety constraint: Prevent admins from deactivating their own account
    if (req.user.id === id) {
      return res.status(400).json({
        error: 'Safety restriction: You cannot deactivate your own administrative account.',
      });
    }

    const deleteText = `
      UPDATE users
      SET is_active = false
      WHERE id = $1
      RETURNING id, full_name, email, role, is_active, created_at
    `;

    const result = await query(deleteText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const deactivatedUser = result.rows[0];

    // Record audit log
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    await logAudit(
      req.user.id,
      'DELETE_USER',
      'users',
      id,
      { is_active: false },
      clientIp
    );

    return res.status(200).json({
      message: 'User deactivated successfully',
      user: deactivatedUser,
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
