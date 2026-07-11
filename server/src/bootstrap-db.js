import fs from 'node:fs';
import pg from 'pg';
import { config } from './config.js';

const read = (name) => fs.readFileSync(new URL(`./sql/${name}`, import.meta.url), 'utf8');

const escLiteral = (v) => String(v).replace(/'/g, "''");
const escIdent = (v) => `"${String(v).replace(/"/g, '""')}"`;

async function connectWithRetry(options, retries = 30, delayMs = 1000) {
  for (let i = 1; i <= retries; i++) {
    const client = new pg.Client({ ...options, connectionTimeoutMillis: 5000 });
    try {
      await client.connect();
      return client;
    } catch (err) {
      await client.end().catch(() => {});
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

// Fully idempotent bootstrap, run at every startup with the PostgreSQL
// superuser: heals ANY volume state (missing database, missing role, wrong
// role password, missing schema, empty data). No init scripts, no bind
// mounts, no extra container required.
export async function bootstrapDatabase() {
  if (!config.db.superuserPassword) {
    console.log('PG_SUPERUSER_PASSWORD not set: skipping automatic database bootstrap.');
    return;
  }
  const su = {
    host: config.db.host,
    port: config.db.port,
    user: config.db.superuser,
    password: config.db.superuserPassword,
  };

  // 1) Maintenance database: ensure application database and role exist
  const admin = await connectWithRetry({ ...su, database: 'postgres' });
  try {
    const dbExists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      config.db.database,
    ]);
    if (dbExists.rowCount === 0) {
      await admin.query(`CREATE DATABASE ${escIdent(config.db.database)}`);
      console.log(`Database "${config.db.database}" created.`);
    }
    const roleExists = await admin.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [
      config.db.user,
    ]);
    if (roleExists.rowCount === 0) {
      await admin.query(
        `CREATE ROLE ${escIdent(config.db.user)} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE`
      );
      console.log(`Role "${config.db.user}" created.`);
    }
    // Always realign the password with the current environment value
    await admin.query(
      `ALTER ROLE ${escIdent(config.db.user)} WITH LOGIN PASSWORD '${escLiteral(config.db.password)}' NOSUPERUSER NOCREATEDB NOCREATEROLE`
    );
  } finally {
    await admin.end().catch(() => {});
  }

  // 2) Application database: schema, demo seed (once), grants
  const db = await connectWithRetry({ ...su, database: config.db.database });
  try {
    await db.query(read('schema.sql'));
    const seeded = await db.query('SELECT COUNT(*)::int AS n FROM categories');
    if (seeded.rows[0].n === 0) {
      await db.query(read('seed.sql'));
      console.log('Demo data seeded.');
    }
    await db.query(`
      GRANT USAGE ON SCHEMA public TO ${escIdent(config.db.user)};
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${escIdent(config.db.user)};
      GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${escIdent(config.db.user)};
    `);
  } finally {
    await db.end().catch(() => {});
  }
  console.log('Database bootstrap complete.');
}
