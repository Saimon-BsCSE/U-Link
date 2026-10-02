#!/usr/bin/env bash
# Count the SQL a single endpoint issues, using MariaDB's general log.
#   ./scripts/dev.sh start && ./scripts/query-count.sh /api/bootstrap.php
set -uo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
. scripts/lib.sh

PATH_="${1:-/api/bootstrap.php}"
JAR="$(mktemp)"
LOG="$ULINK_DEV_DIR/logs/gen.log"

dbx() {
  LD_LIBRARY_PATH="$ULINK_MARIADB_LIB" \
    "$ULINK_MARIADB_DIR/usr/bin/mariadb" --socket="$ULINK_MARIADB_RUN/mysqld.sock" \
    -u root -e "$1" 2>/dev/null
}

cleanup() {
  dbx "SET GLOBAL general_log = 0;"
  rm -f "$JAR"
}
trap cleanup EXIT

curl -sS -c "$JAR" -o /dev/null -X POST http://127.0.0.1:8080/api/auth/login.php \
  -H 'Content-Type: application/json' \
  -d '{"email":"saimon@uiu.ac.bd","password":"password123"}'

rm -f "$LOG"
dbx "SET GLOBAL general_log_file = '$LOG'; SET GLOBAL general_log = 1;"
curl -sS -o /dev/null -b "$JAR" "http://127.0.0.1:8080$PATH_"
sleep 1
dbx "SET GLOBAL general_log = 0;"

# PDO prepares server-side, so most statements land as Prepare/Execute pairs
# rather than as a plain Query line.
total=$(grep -cE 'Query|Prepare|Execute' "$LOG" 2>/dev/null || echo 0)
printf '\n%s\n' "$(printf '\033[1m%s\033[0m' "$PATH_ -> $total queries")"
grep -E 'Query|Prepare|Execute' "$LOG" 2>/dev/null \
  | sed -E 's/.*(Query|Prepare|Execute)[[:space:]]+//' \
  | cut -c1-78 \
  | sed 's/[0-9][0-9]*/N/g' \
  | sort | uniq -c | sort -rn
