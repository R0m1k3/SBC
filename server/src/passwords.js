import crypto from 'node:crypto';

// Ambiguous characters (0/O, 1/l/I) excluded for readability when the admin
// relays this password to a member by phone or in person.
const LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
const DIGITS = '23456789';
const ALPHABET = LETTERS + DIGITS;

const randomChar = (set) => set[crypto.randomBytes(1)[0] % set.length];

// ~69 bits of entropy, guaranteed to contain at least one letter and one
// digit (satisfies the app's own password policy even though this value
// bypasses it — it is written straight to a bcrypt hash).
export function generateTempPassword(length = 12) {
  const chars = Array.from({ length }, () => randomChar(ALPHABET));
  chars[0] = randomChar(LETTERS);
  chars[1] = randomChar(DIGITS);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomBytes(1)[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
