#!/usr/bin/env bash
#
# U-Link one-shot bootstrap.
#
# Brings a fresh checkout to a running, seeded application: checks the
# prerequisites, unpacks the private MariaDB and PHP extensions into .dev/
# (no root, no system packages), creates the database, applies the schema,
# loads the demo data, starts the web server and verifies it answers.
#
#   ./setup.sh              set up, seed and start
#   ./setup.sh --no-seed    set up with an empty database
#   ./setup.sh --reset      drop the database and rebuild it from scratch
#   ./setup.sh --no-start   set up but leave the server stopped
#   ./setup.sh --check      only verify an existing installation
#   ./setup.sh --help       this message
#
# Every step is idempotent, so running it twice is harmless. For day to day
# work use ./scripts/dev.sh start|stop|status|logs instead.
#
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PROJECT_ROOT

DEV="$PROJECT_ROOT/scripts/dev.sh"

DO_SEED=1
DO_RESET=0
DO_START=1
DO_CHECK=0

# ------------------------------------------------------------------ output

if [ -t 1 ] && [ "${NO_COLOR:-}" = "" ]; then
    C_RED=$'\033[1;31m'; C_GREEN=$'\033[1;32m'; C_YELLOW=$'\033[1;33m'
    C_BLUE=$'\033[1;34m'; C_DIM=$'\033[2m';    C_OFF=$'\033[0m'
else
    C_RED=""; C_GREEN=""; C_YELLOW=""; C_BLUE=""; C_DIM=""; C_OFF=""
fi

STEP=0
step() {
    STEP=$((STEP + 1))
    printf '\n%s[%d/%d]%s %s%s%s\n' "$C_BLUE" "$STEP" "$TOTAL_STEPS" "$C_OFF" "$C_BLUE" "$1" "$C_OFF"
}
ok()   { printf '      %s+%s %s\n' "$C_GREEN" "$C_OFF" "$1"; }
warn() { printf '      %s!%s %s\n' "$C_YELLOW" "$C_OFF" "$1"; }
die()  { printf '      %sx%s %s\n' "$C_RED" "$C_OFF" "$1" >&2; exit 1; }

# ------------------------------------------------------------------ args

for arg in "$@"; do
    case "$arg" in
        --no-seed) DO_SEED=0 ;;
        --seed)    DO_SEED=1 ;;
        --reset)   DO_RESET=1 ;;
        --no-start) DO_START=0 ;;
        --check)   DO_CHECK=1 ;;
        -h|--help)
            sed -n '3,18p' "$0" | sed 's/^# \{0,1\}//'
            exit 0
            ;;
        *)
            printf 'error: unknown option %s (try --help)\n' "$arg" >&2
            exit 1
            ;;
    esac
done

if [ "$DO_CHECK" = 1 ]; then DO_SEED=0; DO_START=0; fi
if [ "$DO_RESET" = 1 ]; then DO_CHECK=0; fi

TOTAL_STEPS=6
[ "$DO_RESET" = 1 ] && TOTAL_STEPS=7

printf '\n%s\n' "$C_BLUE╔══════════════════════════════════════════════════════════╗$C_OFF"
printf '%s\n' "$C_BLUE║  U-Link setup                                            ║$C_OFF"
printf '%s\n' "$C_BLUE╚══════════════════════════════════════════════════════════╝$C_OFF"

# ------------------------------------------------------------------ 1

step "Checking prerequisites"

command -v php > /dev/null 2>&1 || die "php is not on PATH. Install PHP 8.1 or newer and try again."
PHP_VER="$(php -r 'echo PHP_VERSION;')"
PHP_OK="$(php -r 'echo PHP_VERSION_ID >= 80100 ? "yes" : "no";')"
[ "$PHP_OK" = "yes" ] || die "PHP $PHP_VER is too old; 8.1 or newer is required."
ok "php $PHP_VER"

command -v curl > /dev/null 2>&1 || die "curl is not on PATH."
ok "curl"

if [ "$DO_RESET" = 1 ]; then
    [ -d "$PROJECT_ROOT/.dev/data" ] || warn "nothing to reset, .dev/data does not exist"
    printf '      %s~%s stopping the server and deleting the database files\n' "$C_YELLOW" "$C_OFF"
    "$DEV" stop > /dev/null 2>&1 || true
    rm -rf "$PROJECT_ROOT/.dev/data"
    ok "database files removed"
fi

# ------------------------------------------------------------------ 2

step "Preparing writable directories"

mkdir -p "$PROJECT_ROOT/logs" "$PROJECT_ROOT/uploads/profiles"
# The web server may run as a different user than this shell, so keep the
# upload directory group-writable rather than trusting the umask.
chmod -R ug+rwX "$PROJECT_ROOT/logs" "$PROJECT_ROOT/uploads" 2> /dev/null || \
    warn "could not change permissions on logs/ or uploads/"

for dir in logs uploads uploads/profiles; do
    [ -w "$PROJECT_ROOT/$dir" ] || die "$dir is not writable by $(id -un)"
done
ok "logs/, uploads/, uploads/profiles/ are writable"

# ------------------------------------------------------------------ 3

step "Preparing the database server and PHP extensions"

# scripts/lib.sh downloads and unpacks both, so nothing has to be installed
# system-wide and no root access is required.
# shellcheck source=scripts/lib.sh
source "$PROJECT_ROOT/scripts/lib.sh"

ulink_ensure_php_extensions || warn "the bundled PHP extensions are incomplete; continuing anyway"
if ulink_php_ext_native; then
    ok "php extensions: pdo_mysql, mbstring (built in)"
else
    ok "php extensions unpacked into .dev/php-ext"
fi

ulink_ensure_database || die "no MariaDB server available and it could not be downloaded"
ok "mariadb available in .dev/mariadb"

ulink_start_database || die "the database did not start; see .dev/logs/mariadb.log"
ok "database running on 127.0.0.1:${ULINK_DB_PORT:-3307}"

# ------------------------------------------------------------------ 4

step "Checking configuration"

if [ ! -f "$PROJECT_ROOT/.env" ]; then
    ulink_ensure_dirs > /dev/null
    ok "created .env with the local development defaults"
else
    ok ".env present"
fi

# Read the effective connection out of the app rather than guessing from .env,
# so a stale environment variable cannot make this report the wrong database.
( cd "$PROJECT_ROOT" && ulink_php_run -r '
    require "config/config.php";
    echo "driver    : " . ULINK_DB_DRIVER . "\n";
    echo "database  : " . ULINK_DB_NAME . "\n";
    echo "location  : " . (ULINK_DB_DRIVER === "sqlite" ? ULINK_DB_NAME : ULINK_DB_HOST . ":" . ULINK_DB_PORT) . "\n";
' ) | while IFS= read -r line; do ok "$line"; done

# ------------------------------------------------------------------ 5

if [ "$DO_CHECK" = 1 ]; then
    step "Verifying the installation"
    ( cd "$PROJECT_ROOT" && ulink_php_run -r '
        $missing = 0;
        foreach ([
            "index.html", "ulink_script.js", "backend_integration.js", "utilities.js",
            "ulink.css", "router.php", "config/bootstrap.php", "config/database.php",
            "config/schema.sql", "config/install.php", "api/bootstrap.php"
        ] as $f) {
            if (!file_exists($f)) {
                fwrite(STDERR, "      x missing: $f\n");
                $missing++;
            }
        }
        if ($missing === 0) {
            echo "      + every required file is present\n";
        }
        exit($missing === 0 ? 0 : 1);
    ' ) || die "required files are missing; run ./setup.sh without --check"

    # Static checks, run here because they are cheap and because each one has
    # already caught something real. lint-sql in particular exists to catch a
    # named placeholder used twice, which only fails at execute time - and it
    # stayed silent about exactly that for months while the demo seed died half
    # way through every fresh install. Its own self-test runs first so a linter
    # that has quietly stopped recognising statements is caught before its
    # "clean" verdict is believed.
    LINT_BAD=0

    if ! ulink_php_run -r '
        $bad = 0;
        $files = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator(".", RecursiveDirectoryIterator::SKIP_DOTS)
        );
        foreach ($files as $file) {
            $path = (string) $file;
            if (substr($path, -4) !== ".php" || str_contains($path, "/.dev/")) {
                continue;
            }
            $out = [];
            exec("php -l " . escapeshellarg($path) . " 2>&1", $out, $code);
            if ($code !== 0) {
                fwrite(STDERR, "      x syntax error: $path\n");
                $bad++;
            }
        }
        if ($bad === 0) {
            echo "      + every PHP file parses\n";
        }
        exit($bad === 0 ? 0 : 1);
    '; then
        LINT_BAD=1
    fi

    if command -v python3 > /dev/null 2>&1; then
        if python3 "$PROJECT_ROOT/scripts/lint-sql-selftest.py" > /dev/null 2>&1; then
            ok "the SQL linter detects what it is meant to detect"
        else
            warn "lint-sql self-test failed; its clean result would not be trustworthy"
            LINT_BAD=1
        fi

        if python3 "$PROJECT_ROOT/scripts/lint-sql.py" "$PROJECT_ROOT" > /tmp/.ulink_lint_sql 2>&1; then
            ok "every statement survives native prepared statements"
        else
            warn "statements that will fail at execute time:"
            sed 's/^/      /' /tmp/.ulink_lint_sql
            LINT_BAD=1
        fi

        if python3 "$PROJECT_ROOT/scripts/lint-theme.py" "$PROJECT_ROOT" > /tmp/.ulink_lint_theme 2>&1; then
            ok "the theme tokens line up across both colour schemes"
        else
            warn "theme problems:"
            sed 's/^/      /' /tmp/.ulink_lint_theme
            LINT_BAD=1
        fi
    else
        warn "python3 is not available; skipping the static checks"
    fi

    if command -v node > /dev/null 2>&1; then
        for js in "$PROJECT_ROOT"/*.js "$PROJECT_ROOT"/scripts/*.js; do
            [ -f "$js" ] || continue
            node --check "$js" > /dev/null 2>&1 || {
                warn "$(basename "$js") does not parse"
                LINT_BAD=1
            }
        done
        ok "every JavaScript file parses"
    fi

    # Fatal, unlike the "web server not running" warning below: a missing server
    # is a legitimate state to check in, whereas a parse error or an unusable
    # statement is a defect in the checkout.
    [ "$LINT_BAD" = 0 ] || die "static checks failed - see above"

    if curl -fsS "http://${ULINK_HTTP_HOST:-127.0.0.1}:${ULINK_HTTP_PORT:-8080}/api/test/health-check.php" > /dev/null 2>&1; then
        ok "the web server is answering"
    else
        warn "the web server is not running (./scripts/dev.sh start)"
    fi
else
    if [ "$DO_SEED" = 1 ]; then
        step "Installing the schema and demo data"
    else
        step "Installing the schema"
    fi

    if [ "$DO_SEED" = 1 ]; then
        ulink_php_run "$PROJECT_ROOT/config/install.php" --seed > /dev/null \
            || die "the installer failed; run ./scripts/dev.sh php config/install.php --seed to see the error"
        ok "schema applied and demo data loaded"
    else
        ulink_php_run "$PROJECT_ROOT/config/install.php" > /dev/null \
            || die "the installer failed; run ./scripts/dev.sh php config/install.php to see the error"
        ok "schema applied (empty database)"
    fi
fi

# ------------------------------------------------------------------ 6

step "Starting the web server"

if [ "$DO_START" = 1 ]; then
    ulink_start_web
    sleep 1

    URL="http://${ULINK_HTTP_HOST:-127.0.0.1}:${ULINK_HTTP_PORT:-8080}"
    for _ in $(seq 1 20); do
        curl -fsS "$URL/api/test/health-check.php" > /dev/null 2>&1 && break
        sleep 0.5
    done

    if curl -fsS "$URL/api/test/health-check.php" > /dev/null 2>&1; then
        ok "the web server is answering on $URL"
    else
        die "the web server did not come up; see logs/web.log"
    fi

    if [ "$DO_SEED" = 1 ]; then
        printf '\n      %sSign in with%s  saimon@uiu.ac.bd  /  password123\n' "$C_GREEN" "$C_OFF"
        printf '      %sAlso%s        nusrat@uiu.ac.bd  /  password123\n\n' "$C_GREEN" "$C_OFF"
    fi
else
    ok "skipped (--no-start)"
fi

# ------------------------------------------------------------------ done

printf '%s\n' "$C_GREEN  Setup complete.$C_OFF"
printf '  App      http://%s:%s/\n' "${ULINK_HTTP_HOST:-127.0.0.1}" "${ULINK_HTTP_PORT:-8080}"
printf '  Stop     ./scripts/dev.sh stop\n'
printf '  Logs     ./scripts/dev.sh logs\n'
printf '  Tests    ./scripts/test-api.sh  ./scripts/test-access.sh\n'
printf '\n'
