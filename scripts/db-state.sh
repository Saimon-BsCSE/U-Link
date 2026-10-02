#!/usr/bin/env bash
# db-state.sh -> print the full contents of the database, for before/after diffs.
#
# `scripts/test-api.sh` and `scripts/test-access.sh` both claim to leave the demo
# database as they found it, and both used to break that claim in ways a
# COUNT(*)-per-table snapshot cannot see. A row count stays perfectly happy while
# `users.full_name` has been overwritten with a test fixture's value and
# `users.profile_pic` with NULL - which is exactly what happened: both suites
# rewrote a seeded account's name, bio and avatar and never put them back, while
# a snapshot of row counts and a few ids reported "IDENTICAL" on every run.
#
# So this dumps every row of every table, in a fixed order: by id where the
# table has one, and otherwise by every selected column. A composite-key table
# like post_likes (post_id, user_id) has no id, and an unordered read could
# return the same rows two different ways and diff as drift.
#
# The three log tables are left out on purpose: the suites delete their own curl
# rows on the way out, but the browser session that happens to be open while a
# suite runs is neither deleted nor reproducible, and it is not state a suite is
# responsible for.
#
#     ./scripts/db-state.sh > before.txt
#     ./scripts/test-api.sh
#     ./scripts/db-state.sh > after.txt
#     diff before.txt after.txt
#
# Does nothing useful when the database is not reachable, which is the normal
# case for ULINK_BASE_URL pointed at another host.

set -uo pipefail

# shellcheck source=scripts/lib.sh
. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

ulink_db 'SELECT 1' > /dev/null 2>&1 || exit 0

# Alphabetical, so the output reads the same on every run regardless of the order
# the tables were created in.
#
# Three columns are dropped on purpose. `last_seen_at` and `last_activity` are
# written by simply signing in, so every run moves them and a diff that included
# them would report a difference for the one thing the suites are *supposed* to
# do. `updated_at` moves on any write at all, which makes it a second, louder
# copy of the same noise. Everything else is durable state, and a difference
# there is a real difference.
VOLATILE='^(last_seen_at|last_activity|updated_at)$'

for table in $(ulink_db 'SHOW TABLES;' | sort); do
    case "$table" in
        user_activities|user_sessions|login_attempts) continue ;;
    esac

    columns=$(ulink_db "SHOW COLUMNS FROM \`$table\`;" | awk '{ print $1 }' \
        | grep -Ev "$VOLATILE" | sed 's/^/\x60/; s/$/\x60/' | paste -sd, -)

    [ -n "$columns" ] || continue

    printf '== %s\n' "$table"

    # A composite-key table has no `id` to order by, so order by every selected
    # column instead. This comment used to claim exactly that while the code
    # emitted no ORDER BY at all for those tables, and the server is then free to
    # return rows in any order. `post_likes` keys on (post_id, user_id) and has no
    # id, so two identical dumps could still diff - which is a false alarm in the
    # one tool whose whole job is to be trusted about whether anything drifted.
    if ulink_db "SHOW COLUMNS FROM \`$table\`;" | awk '{ print $1 }' | grep -qx id; then
        order=' ORDER BY `id`'
    else
        order=" ORDER BY $columns"
    fi

    # Tabs and newlines inside a value would otherwise make the diff unreadable,
    # so they are escaped rather than emitted raw.
    ulink_db "SELECT $columns FROM \`$table\`$order;" \
        | sed -e 's/\t/\\t/g' -e "s/'/''/g"
done
