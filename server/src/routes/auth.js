import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { issueSession, clearSession, requireAuth } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/security.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, changePasswordSchema } from '../schemas.js';

export const authRouter = Router();

const publicUser = (u) => ({ id: u.id, email: u.email, role: u.role, memberId: u.member_id });

authRouter.post('/login', loginLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.data;
    const result = await query(
      'SELECT id, email, password_hash, role, member_id FROM users WHERE email = $1',
      [email]
    );
    // Always run a bcrypt comparison to keep timing uniform
    const user = result.rows[0];
    const hash = user?.password_hash?.startsWith('$2') ? user.password_hash : '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva';
    const ok = await bcrypt.compare(password, hash);
    if (!user || !ok || !user.password_hash.startsWith('$2')) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }
    issueSession(res, { sub: user.id, role: user.role, memberId: user.member_id });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout', (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

authRouter.get('/me', async (req, res, next) => {
  try {
    if (!req.user) return res.json({ user: null });
    const result = await query(
      'SELECT id, email, role, member_id FROM users WHERE id = $1',
      [req.user.sub]
    );
    if (result.rowCount === 0) return res.json({ user: null });
    res.json({ user: publicUser(result.rows[0]) });
  } catch (err) {
    next(err);
  }
});

authRouter.post(
  '/change-password',
  requireAuth(),
  validate(changePasswordSchema),
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.data;
      const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.sub]);
      if (result.rowCount === 0) return res.status(401).json({ error: 'Session invalide' });
      const ok = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
      if (!ok) return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
      const hash = await bcrypt.hash(newPassword, 12);
      await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.sub]);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);
