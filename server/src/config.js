import crypto from 'node:crypto';

const required = (name) => {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return v;
};

// Session-signing secret: taken from the environment when provided, otherwise
// generated randomly at startup (never committed to the repo). With a generated
// secret, sessions simply expire when the container restarts.
let jwtSecret = process.env.JWT_SECRET || '';
if (jwtSecret.length < 32) {
  jwtSecret = crypto.randomBytes(48).toString('hex');
  console.warn(
    'JWT_SECRET absent or shorter than 32 characters: using a random ephemeral secret. ' +
      'Sessions will not survive a restart — set JWT_SECRET to persist them.'
  );
}

export const config = {
  port: Number(process.env.PORT || 8321),
  db: {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || 'sbc',
    user: process.env.PGUSER || 'sbc_app',
    password: required('PGPASSWORD'),
    // When provided, the app bootstraps the database itself at startup
    // (create database/role, apply schema, seed demo data) — idempotent.
    superuser: process.env.PG_SUPERUSER || 'postgres',
    superuserPassword: process.env.PG_SUPERUSER_PASSWORD || '',
  },
  jwtSecret,
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  // The standard deployment has one reverse-proxy hop. Set this to false
  // only when the app is deliberately exposed without a proxy.
  trustProxy: process.env.TRUST_PROXY !== 'false',
  // when "true" (production behind a TLS proxy), plain-HTTP requests coming
  // through the proxy are 301-redirected to HTTPS. Direct requests without
  // an X-Forwarded-Proto header (e.g. the container healthcheck) are never
  // redirected, so this stays safe to enable.
  forceHttps: process.env.FORCE_HTTPS === 'true',
  uploadDir: process.env.UPLOAD_DIR || '/data/uploads',
  staticDir: process.env.STATIC_DIR || new URL('../public', import.meta.url).pathname,
  adminInitialPassword: process.env.ADMIN_INITIAL_PASSWORD || '',
  memberInitialPassword: process.env.MEMBER_INITIAL_PASSWORD || '',
  sessionTtlSeconds: 12 * 60 * 60,
  cookieName: 'sbc_session',
};
