#!/bin/bash
# Creates the restricted application role the API connects with.
# Runs once, on first initialization of the data volume.
set -euo pipefail

# Escape single quotes so an exotic password cannot break the SQL literal
ESCAPED_PASSWORD="${APP_DB_PASSWORD//\'/\'\'}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE ROLE sbc_app LOGIN PASSWORD '${ESCAPED_PASSWORD}' NOSUPERUSER NOCREATEDB NOCREATEROLE;
EOSQL
