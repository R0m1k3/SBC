import pg from 'pg';
import { config } from './config.js';

export const pool = new pg.Pool({
  ...config.db,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export const query = (text, params) => pool.query(text, params);

export async function waitForDb(retries = 30, delayMs = 1000) {
  console.log(
    `Connecting to PostgreSQL: host=${config.db.host} port=${config.db.port} ` +
      `db=${config.db.database} user=${config.db.user}`
  );
  for (let i = 1; i <= retries; i++) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (err) {
      if (i === retries) {
        if (err.code === '28P01') {
          console.error(
            'Authentication failed: the sbc_app password in PostgreSQL does not match ' +
              'PGPASSWORD/APP_DB_PASSWORD. The db-sync service realigns it at every stack ' +
              'start — make sure it ran against this same database.'
          );
        }
        throw err;
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}
