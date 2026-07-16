import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { waitForDb } from './db.js';
import { bootstrapDatabase } from './bootstrap-db.js';
import { applyInitialPasswords } from './bootstrap.js';
import { attachUser } from './middleware/auth.js';
import { csrfOriginCheck, globalLimiter } from './middleware/security.js';
import { publicRouter } from './routes/public.js';
import { authRouter } from './routes/auth.js';
import { memberRouter } from './routes/member.js';
import { adminRouter } from './routes/admin.js';

const app = express();

app.disable('x-powered-by');
if (config.trustProxy) app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        // 'unsafe-inline' is required for React inline style attributes
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ['https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        frameSrc: ["'self'", 'https://www.google.com', 'https://maps.google.com'],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: null,
      },
    },
    xFrameOptions: { action: 'deny' },
    // Site images (logo, uploads) are public and referenced from outside
    // the app's origin — e.g. the logo embedded in invitation emails is
    // loaded by webmail clients. The default same-origin policy would
    // block those loads.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(compression());
app.use(express.json({ limit: '64kb' }));
app.use(cookieParser());
app.use('/api', globalLimiter);
app.use(csrfOriginCheck);
app.use(attachUser);

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/public', publicRouter);
app.use('/api/auth', authRouter);
app.use('/api/member', memberRouter);
app.use('/api/admin', adminRouter);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Introuvable' }));

// Uploaded images: validated at upload time, served here with hardened headers
app.use(
  '/uploads',
  express.static(config.uploadDir, {
    index: false,
    dotfiles: 'deny',
    fallthrough: false,
    setHeaders: (res) => {
      res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=86400');
    },
  })
);

// Built React frontend (production). In dev, Vite serves it with a proxy instead.
if (fs.existsSync(config.staticDir)) {
  const indexHtml = path.join(config.staticDir, 'index.html');
  app.use(
    express.static(config.staticDir, {
      index: false,
      setHeaders: (res, filePath) => {
        // Vite emits hashed filenames under /assets — safe to cache forever
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    })
  );
  // SPA fallback for client-side routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
    res.sendFile(indexHtml);
  });
}

app.use((_req, res) => res.status(404).json({ error: 'Introuvable' }));

// Central error handler: log details server-side, never leak them to clients
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.too.large' || err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Requête invalide' });
  }
  if (err.code === '23503') return res.status(400).json({ error: 'Référence invalide' });
  if (err.code === '23505') return res.status(409).json({ error: 'Cette valeur existe déjà.' });
  if (err.statusCode === 404 || err.status === 404) {
    return res.status(404).json({ error: 'Introuvable' });
  }
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

try {
  await bootstrapDatabase();
  await waitForDb();
  await applyInitialPasswords();
  app.listen(config.port, () => {
    console.log(`SBC app listening on :${config.port}`);
  });
} catch (err) {
  console.error('Startup failed:', err);
  process.exit(1);
}
