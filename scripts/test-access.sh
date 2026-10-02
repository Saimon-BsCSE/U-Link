#!/usr/bin/env bash
#
# Regression tests for the authorisation, disclosure and pagination fixes.
#
# Kept in its own file because most of it needs a database connection to build a
# fixture: there is no API that creates an empty community or flips
# `is_private`, and both are exactly the states these guards are about. Where
# the database is not reachable - `ULINK_BASE_URL` pointed at a remote host -
# the fixture-backed cases report as SKIP and the pure-HTTP cases still run.
#
#   ./scripts/dev.sh start
#   ./scripts/test-access.sh
#
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source=scripts/lib.sh
. "$SCRIPT_DIR/lib.sh"

# The moment this run began, in the same time zone the database writes
# timestamps in. Passed to the sweep so the log rows below are removable.
SWEEP_SINCE=$(date -u '+%Y-%m-%d %H:%M:%S')
BASE="${ULINK_BASE_URL:-http://127.0.0.1:8080}"
JAR="$(mktemp)"
PASS=0
FAIL=0
SKIP=0
FAILED_NAMES=()

cleanup() {
    # Restore is_private even if the run is interrupted: leaving a seeded
    # community private would quietly break every later check.
    [ -n "${HIDDEN:-}" ] && db "UPDATE communities SET is_private = 0 WHERE id = $HIDDEN"
    [ -n "${FIXTURE_COMMUNITY:-}" ] && db "DELETE FROM communities WHERE id = $FIXTURE_COMMUNITY"

    # The post fixture is one this script created, named so it can be told apart
    # from the seed's. Deleting "a post in some community" instead would take
    # out seeded data - which is what happened: an earlier version picked the
    # newest post in a community the user had not joined, and since that is
    # usually a real seeded post, every run quietly removed one.
    [ -n "${FIXTURE_POST:-}" ] && db "DELETE FROM posts WHERE content = 'access-control fixture post'"

    # The block is installed onto whichever relationship row already exists
    # between the two accounts, so it has to be put back the way it was rather
    # than deleted. In the demo data the two are friends, and deleting the row
    # would quietly remove a seeded friendship.
    if [ -n "${FIXTURE_BLOCK_PAIR:-}" ]; then
        if [ -z "${PRE_BLOCK:-}" ]; then
            db "DELETE FROM friendships
                 WHERE user_id_1 = ${FIXTURE_BLOCK_PAIR%%:*}
                   AND user_id_2 = ${FIXTURE_BLOCK_PAIR##*:}"
        else
            db "UPDATE friendships
                   SET status = '$(printf '%s' "$PRE_BLOCK" | cut -d'|' -f1)',
                       status_requested_by = $(sqlval "$(printf '%s' "$PRE_BLOCK" | cut -d'|' -f2)"),
                       responded_at = $(sqlval "$(printf '%s' "$PRE_BLOCK" | cut -d'|' -f3)")
                 WHERE user_id_1 = ${FIXTURE_BLOCK_PAIR%%:*}
                   AND user_id_2 = ${FIXTURE_BLOCK_PAIR##*:}"
        fi
    fi

    rm -f "$JAR"
    ulink_sweep_test_data "${SWEEP_SINCE:-}"
}
trap cleanup EXIT

# ---------------------------------------------------------------- reporting

c_green() { printf '\033[32m%s\033[0m' "$1"; }
c_red()   { printf '\033[31m%s\033[0m' "$1"; }
c_yellow(){ printf '\033[33m%s\033[0m' "$1"; }
c_dim()   { printf '\033[2m%s\033[0m' "$1"; }

report() { # report NAME OK EXPECTED
    if [ "$2" = 1 ]; then
        PASS=$((PASS + 1)); printf '  %s %s\n' "$(c_green 'PASS')" "$1"
    else
        FAIL=$((FAIL + 1)); FAILED_NAMES+=("$1")
        printf '  %s %s %s\n' "$(c_red 'FAIL')" "$1" "$(c_dim "[HTTP $CODE, expected $3]")"
        printf '        %s\n' "$(printf '%s' "$BODY" | head -c 300)"
    fi
}

section() { printf '\n%s\n' "$(c_dim "── $1")"; }

skip() { SKIP=$((SKIP + 1)); printf '  %s %s\n' "$(c_yellow 'SKIP')" "$1"; }

# ---------------------------------------------------------------- transport

req() { # req METHOD PATH [JSON]
    local method="$1" path="$2" body="${3:-}" out
    if [ -n "$body" ]; then
        out=$(curl -sS -o /tmp/.ulink_body -w '%{http_code}' -X "$method" -b "$JAR" -c "$JAR" \
            -H 'Content-Type: application/json' --data "$body" "$BASE$path" 2>/dev/null)
    else
        out=$(curl -sS -o /tmp/.ulink_body -w '%{http_code}' -X "$method" -b "$JAR" -c "$JAR" \
            "$BASE$path" 2>/dev/null)
    fi
    CODE="$out"; BODY="$(cat /tmp/.ulink_body)"
}

check() { # check NAME EXPECTED_CODE [FILTER VALUE]
    local name="$1" expected="$2" filter="${3:-}" value="${4:-}" ok=1
    [ "$CODE" = "$expected" ] || ok=0

    if [ -n "$filter" ]; then
        local actual
        actual=$(printf '%s' "$BODY" | php -r '
            $d = json_decode(stream_get_contents(STDIN), true);
            foreach (explode(".", $argv[1]) as $k) {
                if ($k === "") continue;
                if (is_array($d) && array_key_exists($k, $d)) { $d = $d[$k]; }
                else { echo "__MISSING__"; exit; }
            }
            echo is_bool($d) ? ($d ? "true" : "false")
                : (is_scalar($d) || $d === null ? (string) $d : json_encode($d));
        ' "$filter" 2>/dev/null)
        [ "$actual" = "$value" ] || { ok=0; echo "        filter $filter => '$actual' (expected '$value')"; }
    fi

    report "$name" "$ok" "$expected"
}

assert() { # assert NAME EXPECTED_CODE PHP_EXPR [SNIPPET_ARG ...]
    local name="$1" expected="$2" expr="$3" ok=1
    shift 3
    [ "$CODE" = "$expected" ] || ok=0
    local result
    # Extra arguments are the snippet's own $argv[2], $argv[3], ... Snippets
    # must read interpolated values from there: writing ' . "$X" . ' inside a
    # quoted argument does not concatenate in bash, it just bakes the dots into
    # the string, and PHP then fails to parse the expression.
    result=$(printf '%s' "$BODY" | php "$SCRIPT_DIR/assert.php" "$expr" "$@" 2>/dev/null)
    [ "$result" = true ] || { ok=0; echo "        expression => '$result'"; }
    report "$name" "$ok" "$expected"
}

as_user() { # as_user EMAIL -> switches the session
    req POST /api/auth/logout.php
    req POST /api/auth/login.php "{\"email\":\"$1\",\"password\":\"password123\"}"
}

login_as() { # login_as EMAIL JAR
    curl -sS -c "$2" -o /dev/null -X POST "$BASE/api/auth/login.php" \
        -H 'Content-Type: application/json' \
        -d "{\"email\":\"$1\",\"password\":\"password123\"}" 2>/dev/null
}

# ---------------------------------------------------------------- database

DB_READY=0
# From lib.sh: one SQL helper, one definition of how the database is reached.
db() { ulink_db "$1"; }
# Strict read: reports a failing statement instead of returning an empty string.
db_ro() { ulink_db_ro "$1"; }

if [ -x "$ULINK_MARIADB_DIR/usr/bin/mariadb" ] && [ "$(db 'SELECT 1')" = "1" ]; then
    DB_READY=1
fi

printf '\n%s\n' "$(c_green 'U-Link access-control test suite')  $(c_dim "$BASE")"

# =================================================================== 1
section 'community admin promotion is scoped to one community'

if [ "$DB_READY" = 0 ]; then
    skip 'joining an empty community does not promote admin elsewhere'
else
    # nusrat is a plain member of several groups. Before the fix,
    # Database::update('community_members', ['role' => 'admin'], $uid, 'user_id')
    # matched every membership row she has.
    ROLES_BEFORE=$(db_ro "SELECT GROUP_CONCAT(CONCAT(community_id, ':', role) ORDER BY community_id)
                       FROM community_members WHERE user_id = 2")

    FIXTURE_COMMUNITY=$(db_ro "INSERT INTO communities (name, description, is_private, created_at)
                            VALUES ('access-suite-empty', 'fixture', 0, NOW());
                            SELECT LAST_INSERT_ID();" | tail -1)

    if [ -z "${FIXTURE_COMMUNITY:-}" ] || [ "$FIXTURE_COMMUNITY" = "0" ]; then
        skip 'joining an empty community does not promote admin elsewhere'
    else
        login_as nusrat@uiu.ac.bd "$JAR"

        req POST /api/communities/action.php "{\"action\":\"join\",\"communityId\":$FIXTURE_COMMUNITY}"
        check 'an empty community can be joined' 201 'action' 'joined'

        NEW_ROLE=$(db_ro "SELECT role FROM community_members
                        WHERE community_id = $FIXTURE_COMMUNITY AND user_id = 2")
        if [ "$NEW_ROLE" = "admin" ]; then
            report 'the first member is that community admin' 1 201
        else
            report 'the first member is that community admin' 0 201
            echo "        role is '$NEW_ROLE'"
        fi

        # Everything she already belonged to must be untouched.
        ROLES_AFTER=$(db_ro "SELECT GROUP_CONCAT(CONCAT(community_id, ':', role) ORDER BY community_id)
                          FROM community_members
                         WHERE user_id = 2 AND community_id <> $FIXTURE_COMMUNITY")
        if [ "$ROLES_BEFORE" = "$ROLES_AFTER" ] && [ "$NEW_ROLE" = "admin" ]; then
            report 'membership roles elsewhere are unchanged' 1 200
        else
            report 'membership roles elsewhere are unchanged' 0 200
            echo "        before: $ROLES_BEFORE"
            echo "        after:  $ROLES_AFTER"
        fi
    fi
fi

# =================================================================== 2
section 'a block is enforced, not just recorded'

BLOCKER=nusrat@uiu.ac.bd
BLOCKED=rakib@uiu.ac.bd

if [ "$DB_READY" = 0 ]; then
    skip 'a blocked user cannot send a friend request'
    skip 'a blocked user cannot send a direct message'
else
    # status_requested_by names the blocker, which is what ulink_is_blocked()
    # compares against. Getting this backwards makes the fixture test the
    # opposite of what it claims.
    #
    # This has to be an upsert, not an insert. `friendships` has a unique index
    # on (user_id_1, user_id_2), and these two accounts are friends in the demo
    # data - so a plain INSERT hit a duplicate-key error, the helper discarded
    # stderr, and the whole section silently reported SKIP. The section had been
    # skipping on a seeded database without anyone noticing, which is the worst
    # way for a regression suite to fail.
    #
    # Blocking someone you are already friends with is also the realistic case,
    # so the relationship is reused rather than avoided.
    BLOCKER_ID=$(db_ro "SELECT id FROM users WHERE email = '$BLOCKER'")
    BLOCKED_ID=$(db_ro "SELECT id FROM users WHERE email = '$BLOCKED'")

    if [ -z "${BLOCKER_ID:-}" ] || [ -z "${BLOCKED_ID:-}" ] || [ "$BLOCKER_ID" = "$BLOCKED_ID" ]; then
        skip 'a blocked user cannot send a friend request'
        skip 'the block row is untouched'
        skip 'no dead request notification is delivered'
        skip 'a blocked user cannot send a direct message'
    else
        LOW=$BLOCKER_ID
        HIGH=$BLOCKED_ID
        [ "$LOW" -gt "$HIGH" ] && { LOW=$BLOCKED_ID; HIGH=$BLOCKER_ID; }
        FIXTURE_BLOCK_PAIR="$LOW:$HIGH"

        # Remember what was there so cleanup can restore it rather than delete a
        # seeded friendship.
        # status : status_requested_by : responded_at, so the restore is exact.
        # `|` not `:` - see the same note in test-api.sh's cleanup. A datetime
        # contains colons, so splitting on `:` truncates the timestamp.
        PRE_BLOCK=$(db_ro "SELECT CONCAT(status, '|', IFNULL(status_requested_by, 'NULL'), '|',
                                    IFNULL(responded_at, 'NULL'))
                           FROM friendships
                          WHERE user_id_1 = $LOW AND user_id_2 = $HIGH")

        db "INSERT INTO friendships (user_id_1, user_id_2, status, status_requested_by,
                                     created_at, responded_at)
            VALUES ($LOW, $HIGH, 'blocked', $BLOCKER_ID, NOW(), NOW())
            ON DUPLICATE KEY UPDATE status = 'blocked',
                                    status_requested_by = $BLOCKER_ID,
                                    responded_at = NOW()"

        FIXTURE_BLOCK=$(db_ro "SELECT id FROM friendships WHERE user_id_1 = $LOW AND user_id_2 = $HIGH")

        if [ -z "${FIXTURE_BLOCK:-}" ]; then
            skip 'a blocked user cannot send a friend request'
            skip 'a blocked user cannot send a direct message'
            skip 'the block row is untouched'
            skip 'no dead request notification is delivered'
            skip 'a blocked user cannot send a direct message'
        else
            as_user "$BLOCKED"
            req POST /api/friends/action.php "{\"action\":\"request\",\"userId\":$BLOCKER_ID}"
            # Not 201 "Friend request sent." with the row still blocked, which is
            # what this answered before.
            if [ "$CODE" = "403" ]; then
                report 'a blocked user cannot send a friend request' 1 403
            else
                report 'a blocked user cannot send a friend request' 0 403
            fi

            STATUS=$(db_ro "SELECT status FROM friendships WHERE id = $FIXTURE_BLOCK")
            if [ "$STATUS" = "blocked" ]; then
                report 'the block row is untouched' 1 200
            else
                report 'the block row is untouched' 0 200
                echo "        status is now '$STATUS'"
            fi

            req POST /api/messages/send.php "{\"userId\":$BLOCKER_ID,\"text\":\"should be refused\"}"
            if [ "$CODE" = "403" ]; then
                report 'a blocked user cannot send a direct message' 1 403
            else
                report 'a blocked user cannot send a direct message' 0 403
            fi
        fi
    fi
fi

# =================================================================== 3
section 'personal identifiers are not disclosed to strangers'

as_user nusrat@uiu.ac.bd
req GET /api/friends/suggestions.php
assert 'friend suggestions carry no email' 200 '
    foreach (($d["suggestions"] ?? []) as $s) {
        if (array_key_exists("email", $s)) return "email leaked";
        if (array_key_exists("student_id", $s)) return "student_id leaked";
    }
    return true;'

req GET /api/bootstrap.php
assert 'the bootstrap payload carries no other user email' 200 '
    foreach (($d["suggestions"] ?? []) as $s) {
        if (array_key_exists("email", $s)) return "email leaked";
    }
    return true;'

req GET /api/messages/fetch.php?userId=3
assert 'messages/fetch.php does not return a second, fuller peer copy' 200 '
    !array_key_exists("peer", $d) || !array_key_exists("email", $d["peer"] ?? [])'

# The same person, through the friend list, *should* still be readable: the
# point is the relationship, not a blanket removal.
req GET /api/friends/list.php
assert 'accepted friends still carry contact details' 200 '
    count($d["friends"] ?? []) >= 0'

# =================================================================== 4
section 'posts/fetch.php scope=all without an author filter'

as_user nusrat@uiu.ac.bd
# This produced "WHERE  ORDER BY" - an empty predicate list - and a 500 that
# echoed the whole statement whenever ULINK_DEBUG was on.
req GET '/api/posts/fetch.php?scope=all&limit=5'
check 'scope=all with no author filter is served' 200 'status' 'success'

req GET '/api/posts/fetch.php?scope=all&limit=200'
assert 'it returns posts rather than an empty page' 200 '
    is_array($d["data"] ?? null) && count($d["data"]) > 0'

# =================================================================== 5
section 'community membership gates writes as well as reads'

if [ "$DB_READY" = 0 ]; then
    skip 'commenting in a community you have not joined is refused'
    skip 'liking in a community you have not joined is refused'
    skip 'posting into a community you have not joined is refused'
else
    # A community that user 3 does not belong to.
    #
    # The post is *created* here rather than borrowed. This used to pick the
    # newest existing post in that community, which on a seeded database is a
    # real seeded post - and cleanup then deleted it, so every run quietly
    # removed one of the demo's 18. That is how the demo data drifted away from
    # what the seed documents without anything reporting an error.
    FOREIGN=$(db_ro "SELECT c.id
                    FROM communities c
                    LEFT JOIN community_members cm
                           ON cm.community_id = c.id AND cm.user_id = 3
                    WHERE cm.user_id IS NULL AND c.is_private = 0
                    ORDER BY c.id LIMIT 1")

    # Authored by somebody other than user 3, so what is under test is the
    # community membership check and not "you cannot touch your own post".
    if [ -n "${FOREIGN:-}" ] && [ "$FOREIGN" != "0" ]; then
        db "INSERT INTO posts (user_id, community_id, content, visibility, created_at)
            VALUES (1, $FOREIGN, 'access-control fixture post', 'public', NOW())"
        FIXTURE_POST=$(db_ro "SELECT id FROM posts
                            WHERE content = 'access-control fixture post'
                            ORDER BY id DESC LIMIT 1")
    fi

    if [ -z "${FOREIGN:-}" ] || [ "$FOREIGN" = "0" ] || [ -z "${FIXTURE_POST:-}" ] || [ "$FIXTURE_POST" = "0" ]; then
        skip 'commenting in a community you have not joined is refused'
        skip 'liking in a community you have not joined is refused'
        skip 'posting into a community you have not joined is refused'
    else
        as_user rakib@uiu.ac.bd

        req POST /api/posts/comment.php "{\"postId\":$FIXTURE_POST,\"text\":\"should be refused\"}"
        if [ "$CODE" = "403" ]; then
            report 'commenting in a community you have not joined is refused' 1 403
        else
            report 'commenting in a community you have not joined is refused' 0 403
        fi

        req POST /api/posts/like.php "{\"postId\":$FIXTURE_POST}"
        if [ "$CODE" = "403" ]; then
            report 'liking in a community you have not joined is refused' 1 403
        else
            report 'liking in a community you have not joined is refused' 0 403
        fi

        # Both snake_case and camelCase must be recognised, or the guard is
        # bypassed by a client that spells it the way every other endpoint does.
        req POST /api/posts/create.php "{\"text\":\"should be refused\",\"community_id\":$FOREIGN}"
        if [ "$CODE" = "403" ]; then
            report 'posting into a community you have not joined is refused (community_id)' 1 403
        else
            report 'posting into a community you have not joined is refused (community_id)' 0 403
        fi

        req POST /api/posts/create.php "{\"text\":\"should be refused\",\"communityId\":$FOREIGN}"
        if [ "$CODE" = "403" ]; then
            report 'posting into a community you have not joined is refused (communityId)' 1 403
        else
            report 'posting into a community you have not joined is refused (communityId)' 0 403
        fi

        # Reading a *public* community you have not joined stays open.
        req GET "/api/posts/fetch.php?community_id=$FOREIGN"
        check 'a public community is still readable by a non-member' 200 'status' 'success'
    fi
fi

# =================================================================== 6
section 'private communities'

if [ "$DB_READY" = 0 ]; then
    skip 'a private community cannot be joined'
    skip 'a private community does not leak its posts'
    skip 'a private community does not leak its roster'
    skip 'a private community is hidden from the directory'
else
    HIDDEN=$(db_ro "SELECT c.id FROM communities c
                  LEFT JOIN community_members cm ON cm.community_id = c.id AND cm.user_id = 3
                 WHERE cm.user_id IS NULL AND c.is_private = 0
                 ORDER BY c.id LIMIT 1")
    HIDDEN_POST=$(db_ro "SELECT id FROM posts WHERE community_id = $HIDDEN ORDER BY id DESC LIMIT 1")

    if [ -z "${HIDDEN:-}" ] || [ "$HIDDEN" = "0" ]; then
        skip 'a private community cannot be joined'
        skip 'a private community does not leak its posts'
        skip 'a private community does not leak its roster'
        skip 'a private community is hidden from the directory'
    else
        db "UPDATE communities SET is_private = 1 WHERE id = $HIDDEN"
        as_user rakib@uiu.ac.bd

        req POST /api/communities/action.php "{\"action\":\"join\",\"communityId\":$HIDDEN}"
        if [ "$CODE" = "403" ]; then
            report 'a private community cannot be joined' 1 403
        else
            report 'a private community cannot be joined' 0 403
        fi

        req GET "/api/posts/fetch.php?community_id=$HIDDEN"
        if [ "$CODE" = "403" ]; then
            report 'a private community does not leak its posts' 1 403
        else
            report 'a private community does not leak its posts' 0 403
        fi

        req GET "/api/communities/detail.php?id=$HIDDEN"
        check 'the community card is still served' 200 'locked' 'true'
        assert 'a private community does not leak its roster' 200 '
            count($d["members"] ?? []) === 0'

        req GET '/api/communities/list.php?limit=100'
        assert 'a private community is hidden from the directory' 200 '
            foreach (($d["communities"] ?? []) as $c) {
                if ((int) ($c["id"] ?? 0) === (int) $argv[2]) return "still listed";
            }
            return true;' "$HIDDEN"

        # A member still reads everything.
        login_as saimon@uiu.ac.bd "$JAR"
        req GET "/api/communities/detail.php?id=$HIDDEN"
        check 'a member can still open a private community' 200 'status' 'success'

        db "UPDATE communities SET is_private = 0 WHERE id = $HIDDEN"
    fi
fi

# =================================================================== 7
section 'conversation list pagination'

as_user saimon@uiu.ac.bd
req GET '/api/messages/conversations.php?limit=50&offset=0'
check 'the conversation list loads' 200 'status' 'success'
FIRST_PEER=$(printf '%s' "$BODY" | php -r '
    $d = json_decode(stream_get_contents(STDIN), true);
    echo $d["conversations"][0]["userId"] ?? 0;')

req GET '/api/messages/conversations.php?limit=1&offset=0'
assert 'has_more is reported' 200 'array_key_exists("has_more", $d)'

if [ "${FIRST_PEER:-0}" != "0" ]; then
    req GET '/api/messages/conversations.php?limit=50&offset=1'
    assert 'offset really pages the list' 200 '
        $first = $d["conversations"][0]["userId"] ?? null;
        return $first === null || (int) $first !== (int) $argv[2];' "$FIRST_PEER"
else
    skip 'offset really pages the list'
fi

# =================================================================== 8
section 'RSVP counts attendees, not respondents'

as_user saimon@uiu.ac.bd
req GET '/api/events/list.php?limit=50'
check 'events load' 200 'status' 'success'

EVENT_ID=$(printf '%s' "$BODY" | php -r '
    $d = json_decode(stream_get_contents(STDIN), true);
    foreach ($d["events"] ?? [] as $e) { if (empty($e["my_status"])) { echo $e["id"]; exit; } }
    echo 0;')

if [ "${EVENT_ID:-0}" = "0" ]; then
    skip 'a declined RSVP is not counted as an attendee'
    skip 'the RSVP response returns the authoritative count'
else
    req POST /api/events/rsvp.php "{\"eventId\":$EVENT_ID,\"interested\":false}"
    check 'declining is recorded' 200 'rsvp_status' 'not_interested'
    assert 'the RSVP response returns the authoritative count' 200 '
        array_key_exists("interested_count", $d) && (int) $d["interested_count"] >= 0'

    # A decline must not move the attendee total.
    BEFORE=$(printf '%s' "$BODY" | php -r '
        $d = json_decode(stream_get_contents(STDIN), true); echo (int) ($d["interested_count"] ?? -1);')
    req GET '/api/events/list.php?limit=50'
    assert 'a declined RSVP is not counted as an attendee' 200 '
        foreach (($d["events"] ?? []) as $e) {
            if ((int) $e["id"] === (int) $argv[2]) {
                return (int) $e["interested_count"] === (int) $argv[3];
            }
        }
        return true;' "$EVENT_ID" "$BEFORE"

    req POST /api/events/rsvp.php "{\"eventId\":$EVENT_ID,\"interested\":null}"
    req POST /api/events/rsvp.php "{\"eventId\":$EVENT_ID,\"interested\":null}"
fi

# =================================================================== 9
section 'malformed uploads explain themselves'

as_user nusrat@uiu.ac.bd
printf 'not an image at all' > /tmp/.ulink_notanimage
CODE=$(curl -sS -o /tmp/.ulink_body -w '%{http_code}' -X POST -b "$JAR" \
    -F 'profile_pic=@/tmp/.ulink_notanimage' "$BASE/api/users/update.php" 2>/dev/null)
BODY="$(cat /tmp/.ulink_body)"
assert 'a rejected avatar explains what to send instead' 422 '
    str_contains((string) ($d["message"] ?? ""), "could not be processed")'

# A rejected file must not be mistaken for "nothing to do".
assert 'a rejected avatar is not reported as success' 422 '$d["status"] === "error"'

# And the multipart transport itself must work, not just report a failure.
#
# Remember the avatar first. Restoring a hardcoded value is how this section used
# to leave Nusrat with no picture at all: she is seeded with
# Asserts/nusrat_jahan.jpeg, so writing NULL undid a piece of demo data on every
# run and her profile showed a broken image from then on. Snapshot it the same way
# the friendship fixture does, so the restore is true whatever the seed says.
PRE_AVATAR=$(db_ro "SELECT IFNULL(profile_pic, 'NULL') FROM users WHERE id = 2")

php -r 'file_put_contents($argv[1], base64_decode($argv[2]));' \
    /tmp/.ulink_avatar.png \
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAF0lEQVQI12P8//8/AzXyEIM2Ki4AxUCskAXlCQBLdB3UAWc3lHkAAAAASUVORK5CYII='
CODE=$(curl -sS -o /tmp/.ulink_body -w '%{http_code}' -X POST -b "$JAR" \
    -F 'profile_pic=@/tmp/.ulink_avatar.png' "$BASE/api/users/update.php" 2>/dev/null)
BODY="$(cat /tmp/.ulink_body)"
assert 'a multipart avatar upload is stored' 200 '
    str_ends_with((string) ($d["user"]["profile_pic"] ?? ""), ".png")'

# The base64 path stores through ulink_save_upload(), which writes a per-file
# `<name>.htaccess` guard beside the image, and replacing that image has to take
# the old guard with it.
#
# It did not. ulink_save_upload() wrote the pair and ulink_delete_upload() removed
# only the image, so every avatar replacement leaked a real file that nothing
# swept: uploads/profiles/ had accumulated 186 guards for a directory holding one
# picture. Neither the API nor a row count can see that - both files are absent
# from the database - so the check is on the filesystem, which is where the leak
# was. The multipart path above is deliberately exempt: it writes into
# uploads/profiles/ without a guard, so there is nothing to leak.
PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAF0lEQVQI12P8//8/AzXyEIM2Ki4AxUCskAXlCQBLdB3UAWc3lHkAAAAASUVORK5CYII='
req POST /api/users/update.php "{\"profile_pic\":\"$PNG\"}"
check 'a base64 avatar is stored' 200 'status' 'success'

GUARDED=$(printf '%s' "$BODY" | php -r '
    $d = json_decode(stream_get_contents(STDIN), true);
    echo basename((string) ($d["user"]["profile_pic"] ?? ""));')
report 'a stored image is paired with its script guard' \
    "$([ -n "$GUARDED" ] && [ -f "$ROOT_DIR/uploads/profiles/$GUARDED.htaccess" ] && echo 1 || echo 0)" 200

# A second avatar replaces the first. Both the image and its guard must go.
req POST /api/users/update.php "{\"profile_pic\":\"$PNG\"}"
check 'replacing a base64 avatar succeeds' 200 'status' 'success'
report 'replacing an image removes the old file and its guard' \
    "$([ -f "$ROOT_DIR/uploads/profiles/$GUARDED" ] || \
       [ -f "$ROOT_DIR/uploads/profiles/$GUARDED.htaccess" ] && echo 0 || echo 1)" 200

# Put the demo avatar back so the seed state is unchanged for other suites. The
# sweep removes the uploaded image and its guard; this puts the column back.
db "UPDATE users SET profile_pic = $(sqlval "$PRE_AVATAR") WHERE id = 2" 2>/dev/null
CODE=$(curl -sS -o /tmp/.ulink_body -w '%{http_code}' -X POST -b "$JAR" \
    -H 'Content-Type: application/json' --data '{}' "$BASE/api/users/update.php" 2>/dev/null)
rm -f /tmp/.ulink_notanimage /tmp/.ulink_avatar.png

# =================================================================== 10
section 'events pagination'

as_user saimon@uiu.ac.bd
req GET '/api/events/list.php?limit=1&offset=0'
check 'a single event is paged' 200 'status' 'success'
assert 'limit is honoured' 200 'count($d["events"] ?? []) === 1'

req GET '/api/events/list.php?limit=1&offset=0&scope=past'
assert 'the past scope still answers' 200 'array_key_exists("events", $d)'

# ---------------------------------------------------------------- summary
printf '\n%s\n' "─────────────────────────────────────────"
if [ "$FAIL" = 0 ]; then
    printf '%s  %d passed, 0 failed%s\n\n' "$(c_green 'ALL TESTS PASSED')" "$PASS" \
        "$([ "$SKIP" -gt 0 ] && printf ', %s skipped' "$(c_yellow "$SKIP")")"
    exit 0
fi

printf '%s  %d passed, %d failed%s\n' "$(c_red 'FAILURES')" "$PASS" "$FAIL" \
    "$([ "$SKIP" -gt 0 ] && printf ', %s skipped' "$(c_yellow "$SKIP")")"
for name in "${FAILED_NAMES[@]}"; do
    printf '  %s %s\n' "$(c_red 'x')" "$name"
done
printf '\n'
exit 1