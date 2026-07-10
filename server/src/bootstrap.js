import bcrypt from 'bcryptjs';
import { query } from './db.js';
import { config } from './config.js';

// Seeded accounts carry the unusable placeholder hash '*seed*'.
// On startup we give them a real bcrypt hash from environment variables —
// but never overwrite a password that has already been changed.
export async function applyInitialPasswords() {
  if (config.adminInitialPassword) {
    const hash = await bcrypt.hash(config.adminInitialPassword, 12);
    const r = await query(
      `UPDATE users SET password_hash = $1 WHERE role = 'admin' AND password_hash = '*seed*'`,
      [hash]
    );
    if (r.rowCount > 0) console.log(`Initialized password for ${r.rowCount} admin account(s).`);
  }
  if (config.memberInitialPassword) {
    const hash = await bcrypt.hash(config.memberInitialPassword, 12);
    const r = await query(
      `UPDATE users SET password_hash = $1 WHERE role = 'member' AND password_hash = '*seed*'`,
      [hash]
    );
    if (r.rowCount > 0) console.log(`Initialized password for ${r.rowCount} member account(s).`);
  }
  const locked = await query(`SELECT COUNT(*)::int AS n FROM users WHERE password_hash = '*seed*'`);
  if (locked.rows[0].n > 0) {
    console.warn(
      `${locked.rows[0].n} account(s) still locked (no initial password provided). ` +
        'Set ADMIN_INITIAL_PASSWORD / MEMBER_INITIAL_PASSWORD to activate them.'
    );
  }
}
