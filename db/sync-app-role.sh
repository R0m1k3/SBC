#!/bin/sh
# Runs at every stack start (db-sync service): keeps the sbc_app role's
# password in sync with APP_DB_PASSWORD, even when the database volume was
# initialized with a different value. Idempotent.
set -eu

ESCAPED=$(printf %s "$APP_DB_PASSWORD" | sed "s/'/''/g")

psql -v ON_ERROR_STOP=1 <<EOSQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'sbc_app') THEN
    CREATE ROLE sbc_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
    GRANT USAGE ON SCHEMA public TO sbc_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sbc_app;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sbc_app;
  END IF;
END
\$\$;
ALTER ROLE sbc_app WITH LOGIN PASSWORD '${ESCAPED}' NOSUPERUSER NOCREATEDB NOCREATEROLE;
EOSQL

echo "sbc_app role synchronized."
