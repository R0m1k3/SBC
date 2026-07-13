import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function issueSession(res, payload) {
  const token = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.sessionTtlSeconds,
    algorithm: 'HS256',
  });
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.cookieSecure,
    maxAge: config.sessionTtlSeconds * 1000,
    path: '/',
  });
}

export function clearSession(res) {
  res.clearCookie(config.cookieName, { path: '/' });
}

export function attachUser(req, _res, next) {
  const token = req.cookies?.[config.cookieName];
  if (token) {
    try {
      req.user = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    } catch {
      req.user = null;
    }
  }
  next();
}

// `roles` may be a single role string, an array of allowed roles, or
// omitted to just require any authenticated session.
export function requireAuth(roles) {
  const allowed = roles ? (Array.isArray(roles) ? roles : [roles]) : null;
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentification requise' });
    if (allowed && !allowed.includes(req.user.role)) return res.status(403).json({ error: 'Accès refusé' });
    next();
  };
}
