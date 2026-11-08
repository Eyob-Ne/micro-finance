import bcrypt from 'bcryptjs';
import { query, pool } from '../config/db.js';

async function seedAdmin() {
  try {
    console.log('--- Starting DMMS Database Seeding ---');

    const adminEmail = 'admin@dmms.com';
    const adminPassword = 'Admin@123';
    const adminFullName = 'System Admin';
    const adminRole = 'admin';

    // Check if admin user already exists
    const existing = await query('SELECT id, email, role FROM users WHERE email = $1', [adminEmail]);

    if (existing.rows.length > 0) {
      console.log(`Admin user (${adminEmail}) already exists. Skipping insertion.`);
    } else {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

      const insertText = `
        INSERT INTO users (full_name, email, password_hash, role, is_active, created_at)
        VALUES ($1, $2, $3, $4, true, NOW())
        RETURNING id, full_name, email, role, created_at;
      `;
      const res = await query(insertText, [adminFullName, adminEmail, passwordHash, adminRole]);
      console.log('Default Admin user successfully seeded:');
      console.log(res.rows[0]);
    }

    console.log('--- Database Seeding Completed ---');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seedAdmin();
