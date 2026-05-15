#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$SERVER_DIR/.env"
SQL_FILE="$SERVER_DIR/${1:-database.sql}"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required to initialize the database."
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo ".env file not found at $ENV_FILE"
  exit 1
fi

if [ ! -f "$SQL_FILE" ]; then
  echo "database.sql file not found at $SQL_FILE"
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

: "${DB_HOST:?DB_HOST is required}"
: "${DB_PORT:?DB_PORT is required}"
: "${DB_USER:?DB_USER is required}"
: "${DB_PASS:?DB_PASS is required}"
: "${DB_NAME:?DB_NAME is required}"

export PGPASSWORD="$DB_PASS"

SSL_MODE="disable"
if [ "${DB_SSL:-false}" = "true" ]; then
  SSL_MODE="require"
fi

psql \
  "host=$DB_HOST port=$DB_PORT user=$DB_USER dbname=$DB_NAME sslmode=$SSL_MODE" \
  -v ON_ERROR_STOP=1 \
  -f "$SQL_FILE"

echo "Database schema initialized successfully."
