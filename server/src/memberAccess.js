import bcrypt from 'bcryptjs';
import { query } from './db.js';
import { generateTempPassword } from './passwords.js';

export class AccessError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Creates the member's login if it doesn't exist yet, or resets it if it
// does — same operation either way, used for "create member" and for
// "member lost their password". Returns the generated temporary password
// so the admin can relay it; it also stays readable via GET /members until
// the member changes it (temp_password / must_change_password columns).
export async function ensureMemberAccess(memberId, email) {
  if (!email) {
    throw new AccessError(400, "Cette entreprise n'a pas d'adresse email — ajoutez-en une d'abord.");
  }
  const tempPassword = generateTempPassword();
  const hash = await bcrypt.hash(tempPassword, 12);
  try {
    const existing = await query('SELECT id FROM users WHERE member_id = $1', [memberId]);
    if (existing.rowCount > 0) {
      await query(
        `UPDATE users SET email=$1, password_hash=$2, temp_password=$3, must_change_password=true
          WHERE member_id=$4`,
        [email, hash, tempPassword, memberId]
      );
    } else {
      await query(
        `INSERT INTO users (email, password_hash, role, member_id, temp_password, must_change_password)
         VALUES ($1, $2, 'member', $3, $4, true)`,
        [email, hash, memberId, tempPassword]
      );
    }
  } catch (err) {
    if (err.code === '23505') {
      throw new AccessError(409, 'Cet email est déjà utilisé par un autre compte.');
    }
    throw err;
  }
  return tempPassword;
}
