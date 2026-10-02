#!/usr/bin/env bash
#
# U-Link local development server.
#
# Starts a PHP dev server and a private MariaDB instance. Everything lives
# inside .dev/ and runs as your own user, so no root and no system packages are
# required.
#
#   ./scripts/dev.sh start     start the database and the web server
#   ./scripts/dev.sh setup     create the database and apply the schema
#   ./scripts/dev.sh seed      load the demo data set
#   ./scripts/dev.sh status    show what is running
#   ./scripts/dev.sh stop      stop everything
#   ./scripts/dev.sh logs      tail the application log
#   ./scripts/dev.sh php ...   run PHP with the bundled extensions loaded
#
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PROJECT_ROOT

HTTP_HOST="${ULINK_HTTP_HOST:-127.0.0.1}"
HTTP_PORT="${ULINK_HTTP_PORT:-8080}"
DB_PORT="${ULINK_DB_PORT:-3307}"

# shellcheck source=lib.sh
source "$PROJECT_ROOT/scripts/lib.sh"

ulink_ensure_dirs

print_urls() {
    echo
    echo "  U-Link is running:"
    echo "    App       http://$HTTP_HOST:$HTTP_PORT/"
    echo "    Health    http://$HTTP_HOST:$HTTP_PORT/api/test/health-check.php"
    echo "    Database  127.0.0.1:$DB_PORT (socket .dev/run/mysqld.sock)"
    echo
    echo "  Sign in with  saimon@uiu.ac.bd / password123"
    echo "  Stop with    ./scripts/dev.sh stop"
    echo
}

case "${1:-start}" in
    start)
        ulink_ensure_php_extensions || true
        ulink_start_database
        ulink_start_web
        print_urls
        ;;
    stop)
        ulink_stop_process "$PROJECT_ROOT/.dev/web.pid" "web server"
        ulink_stop_process "$PROJECT_ROOT/.dev/run/mysqld.pid" "database"
        ;;
    restart)
        "$0" stop
        sleep 1
        "$0" start
        ;;
    status)
        if ulink_process_alive "$PROJECT_ROOT/.dev/run/mysqld.pid"; then
            echo "database : running (port $DB_PORT)"
        else
            echo "database : stopped"
        fi
        if ulink_process_alive "$PROJECT_ROOT/.dev/web.pid"; then
            echo "web      : running (http://$HTTP_HOST:$HTTP_PORT)"
        else
            echo "web      : stopped"
        fi
        ;;
    setup)
        ulink_ensure_php_extensions || true
        ulink_start_database
        ulink_php_run "$PROJECT_ROOT/config/install.php" "${@:2}"
        ;;
    seed)
        ulink_ensure_php_extensions || true
        ulink_start_database
        ulink_php_run "$PROJECT_ROOT/config/install.php" --seed-only
        ;;
    logs)
        tail -f "$PROJECT_ROOT/logs/app.log" 2>/dev/null || echo "No log file yet."
        ;;
    web)
        ulink_ensure_php_extensions || true
        ulink_start_web
        print_urls
        ;;
    php)
        shift
        ulink_ensure_php_extensions || true
        ulink_php_run "$@"
        ;;
    *)
        sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'
        exit 1
        ;;
esac
