import bcrypt from 'bcryptjs';
import { query } from './db.js';
import { generateTempPassword } from './passwords.js';
import { AccessError } from './errors.js';

const STAFF_ROLES = ['admin', 'moderator'];

// Creates an admin or moderator account with a temporary password — same
// readable-until-changed mechanic as member accounts (see memberAccess.js).
export async function createStaffUser({ fullName, email, role }) {
  if (!STAFF_ROLES.includes(role)) throw new AccessError(400, 'Rôle invalide.');
  const tempPassword = generateTempPassword();
  const hash = await bcrypt.hash(tempPassword, 12);
  try {
    const result = await query(
      `INSERT INTO users (email, password_hash, role, full_name, temp_password, must_change_password)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING id`,
      [email, hash, role, fullName, tempPassword]
    );
    return { id: result.rows[0].id, tempPassword };
  } catch (err) {
    if (err.code === '23505') throw new AccessError(409, 'Cet email est déjà utilisé.');
    throw err;
  }
}

// Regenerates the temporary password for an existing admin/moderator
// account (e.g. they lost it).
export async function resetStaffAccess(userId) {
  const tempPassword = generateTempPassword();
  const hash = await bcrypt.hash(tempPassword, 12);
  const result = await query(
    `UPDATE users SET password_hash=$1, temp_password=$2, must_change_password=true
      WHERE id=$3 AND role IN ('admin', 'moderator') RETURNING id`,
    [hash, tempPassword, userId]
  );
  if (result.rowCount === 0) throw new AccessError(404, 'Compte introuvable.');
  return tempPassword;
}
