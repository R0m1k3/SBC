import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { waitForDb } from './db.js';
import { applyInitialPasswords } from './bootstrap.js';
import { attachUser } from './middleware/auth.js';
import { csrfOriginCheck, globalLimiter } from './middleware/security.js';
import { publicRouter } from './routes/public.js';
import { authRouter } from './routes/auth.js';
import { memberRouter } from './routes/member.js';
import { adminRouter } from './routes/admin.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1); // behind nginx
app.use(helmet());
app.use(express.json({ limit: '64kb' }));
app.use(cookieParser());
app.use(globalLimiter);
app.use(csrfOriginCheck);
app.use(attachUser);

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/public', publicRouter);
app.use('/api/auth', authRouter);
app.use('/api/member', memberRouter);
app.use('/api/admin', adminRouter);

app.use((_req, res) => res.status(404).json({ error: 'Introuvable' }));

// Central error handler: log details server-side, never leak them to clients
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.too.large' || err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Requête invalide' });
  }
  if (err.code === '23503') return res.status(400).json({ error: 'Référence invalide' });
  if (err.code === '23505') return res.status(409).json({ error: 'Cette valeur existe déjà.' });
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

try {
  await waitForDb();
  await applyInitialPasswords();
  app.listen(config.port, () => {
    console.log(`SBC API listening on :${config.port}`);
  });
} catch (err) {
  console.error('Startup failed:', err);
  process.exit(1);
}
