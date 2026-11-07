#!/usr/bin/env bash
# ==============================================================================
# SuperApp V2 - Safe database migration wrapper
#
# Usage:
#   ./scripts/db-migrate.sh check
#   ./scripts/db-migrate.sh backup
#   ./scripts/db-migrate.sh baseline <migration-id> [migration-id...]
#   ./scripts/db-migrate.sh apply
#
# The script never prints the connection string. It refuses to apply migrations
# until the EF migrations history table exists, so a database that was created
# with inline DDL must be baselined explicitly first.
# ==============================================================================
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/SuperApp_V2}"
BACKUP_DIR="${BACKUP_DIR:-/var/lib/postgresql}"
API_PROJECT="$APP_ROOT/backend/SuperApp.API/SuperApp.API.csproj"
STARTUP_PROJECT="$APP_ROOT/backend/SuperApp.API/SuperApp.API.csproj"
PRODUCT_VERSION="10.0.12"

MODE="${1:-check}"
shift || true

usage() {
    sed -n '3,16p' "$0" | sed 's/^# \{0,1\}//'
}

require_command() {
    command -v "$1" >/dev/null 2>&1 || {
        echo "ERROR: required command '$1' is not installed." >&2
        exit 1
    }
}

if [ -f "$APP_ROOT/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    . "$APP_ROOT/.env"
    set +a
fi

CONN="${ConnectionStrings__DefaultConnection:-${DATABASE_CONNECTION_STRING:-${POSTGRES_CONNECTION:-}}}"
if [ -z "$CONN" ]; then
    echo "ERROR: no database connection string found in the environment or $APP_ROOT/.env." >&2
    exit 1
fi

# Npgsql connection strings use ';' separators. Translate the common keys into
# libpq environment variables so psql/pg_dump can consume them without ever
# echoing the password.
USE_CONN_ARG=1
if [[ "$CONN" != *"://"* ]]; then
    USE_CONN_ARG=0
    IFS=';' read -ra CONN_PARTS <<< "$CONN"
    for part in "${CONN_PARTS[@]}"; do
        key="${part%%=*}"
        value="${part#*=}"
        key="$(printf '%s' "$key" | tr '[:upper:]' '[:lower:]' | tr -d ' ')"
        case "$key" in
            host|server) export PGHOST="$value" ;;
            port) export PGPORT="$value" ;;
            database|initialcatalog) export PGDATABASE="$value" ;;
            username|userid|user) export PGUSER="$value" ;;
            password|pwd) export PGPASSWORD="$value" ;;
            sslmode) export PGSSLMODE="$value" ;;
        esac
    done
fi

psql_cmd() {
    if [ "$USE_CONN_ARG" -eq 1 ]; then
        psql "$CONN" "$@"
    else
        psql "$@"
    fi
}

pg_dump_cmd() {
    if [ "$USE_CONN_ARG" -eq 1 ]; then
        pg_dump "$CONN" "$@"
    else
        pg_dump "$@"
    fi
}

history_exists() {
    local result
    result=$(psql_cmd -tAc "SELECT to_regclass('public.\"__EFMigrationsHistory\"') IS NOT NULL")
    [ "$result" = "t" ]
}

create_backup() {
    require_command pg_dump
    require_command pg_restore
    mkdir -p "$BACKUP_DIR"
    local stamp backup_file
    stamp=$(date +%Y%m%d-%H%M%S)
    backup_file="$BACKUP_DIR/superapp-pre-migrate-$stamp.dump"
    echo "Creating database backup: $backup_file"
    pg_dump_cmd -Fc -f "$backup_file"
    pg_restore --list "$backup_file" >/dev/null
    echo "$backup_file"
}

case "$MODE" in
    check)
        require_command psql
        if history_exists; then
            echo "EF migrations history: present"
            psql_cmd -tAc 'SELECT "MigrationId" FROM public."__EFMigrationsHistory" ORDER BY "MigrationId";'
        else
            echo "EF migrations history: absent"
            echo "The database must be baselined before migrations can be applied."
            exit 2
        fi
        ;;

    backup)
        create_backup
        ;;

    baseline)
        require_command psql
        if [ "$#" -eq 0 ]; then
            echo "ERROR: baseline requires at least one migration id." >&2
            usage >&2
            exit 1
        fi
        if history_exists; then
            echo "ERROR: migrations history already exists; refusing to baseline again." >&2
            exit 1
        fi
        create_backup
        for migration_id in "$@"; do
            psql_cmd -v ON_ERROR_STOP=1 -v migration_id="$migration_id" -v product_version="$PRODUCT_VERSION" <<'SQL'
CREATE TABLE IF NOT EXISTS public."__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL PRIMARY KEY,
    "ProductVersion" character varying(32) NOT NULL
);
INSERT INTO public."__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES (:'migration_id', :'product_version')
ON CONFLICT ("MigrationId") DO NOTHING;
SQL
        done
        echo "Baseline recorded. Run './scripts/db-migrate.sh check' to verify."
        ;;

    apply)
        require_command psql
        require_command dotnet
        if ! history_exists; then
            echo "ERROR: migrations history is absent. Baseline the database first." >&2
            exit 1
        fi
        if ! dotnet ef --version >/dev/null 2>&1; then
            echo "ERROR: dotnet-ef is not installed. Install it with:" >&2
            echo "  dotnet tool install --global dotnet-ef --version $PRODUCT_VERSION" >&2
            exit 1
        fi
        create_backup
        echo "Applying pending EF migrations..."
        dotnet ef database update \
            --project "$API_PROJECT" \
            --startup-project "$STARTUP_PROJECT"
        echo "Migrations applied. Run './scripts/db-migrate.sh check' to verify."
        ;;

    *)
        usage >&2
        exit 1
        ;;
esac
