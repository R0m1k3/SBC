const required = (name) => {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return v;
};

export const config = {
  port: Number(process.env.PORT || 3000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  // set to "true" only when running behind a reverse proxy (TLS termination)
  trustProxy: process.env.TRUST_PROXY === 'true',
  uploadDir: process.env.UPLOAD_DIR || '/data/uploads',
  staticDir: process.env.STATIC_DIR || new URL('../public', import.meta.url).pathname,
  adminInitialPassword: process.env.ADMIN_INITIAL_PASSWORD || '',
  memberInitialPassword: process.env.MEMBER_INITIAL_PASSWORD || '',
  sessionTtlSeconds: 12 * 60 * 60,
  cookieName: 'sbc_session',
};

if (config.jwtSecret.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters long.');
  process.exit(1);
}
