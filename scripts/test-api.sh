#!/usr/bin/env bash
#
# End-to-end API smoke test.
#
# Exercises every endpoint against a running dev server, with a cookie jar so
# the session is carried between calls.
#
#   ./scripts/dev.sh start
#   ./scripts/test-api.sh
#
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib.sh
. "$SCRIPT_DIR/lib.sh"

# The moment this run began, in the same time zone the database writes
# timestamps in. Passed to the sweep so the log rows below are removable.
SWEEP_SINCE=$(date -u '+%Y-%m-%d %H:%M:%S')
BASE="${ULINK_BASE_URL:-http://127.0.0.1:8080}"
JAR="$(mktemp)"
PASS=0
FAIL=0
FAILED_NAMES=()

cleanup() {
    rm -f "$JAR"
    # The upload fixtures live in a temp directory created further down. It is
    # unset until then, hence the default.
    rm -rf "${UPLOAD_DIR:-}"

    # `user_settings` rows are created on demand, so the seed has none for a
    # fresh database while a developer's own database has whatever they chose.
    # Both are handled the same way: restore the exact snapshot the settings
    # tests took, or delete the row if there was no snapshot.
    _restore_settings() {
        local uid="$1" row="$2"
        db "DELETE FROM user_settings WHERE user_id = $uid"
        [ -n "$row" ] || return 0

        local a b c d e f g h i j k l
        a=$(printf '%s' "$row" | cut -d'|' -f1)
        b=$(printf '%s' "$row" | cut -d'|' -f2)
        c=$(printf '%s' "$row" | cut -d'|' -f3)
        d=$(printf '%s' "$row" | cut -d'|' -f4)
        e=$(printf '%s' "$row" | cut -d'|' -f5)
        f=$(printf '%s' "$row" | cut -d'|' -f6)
        g=$(printf '%s' "$row" | cut -d'|' -f7)
        h=$(printf '%s' "$row" | cut -d'|' -f8)
        i=$(printf '%s' "$row" | cut -d'|' -f9)
        j=$(printf '%s' "$row" | cut -d'|' -f10)
        k=$(printf '%s' "$row" | cut -d'|' -f11)
        l=$(printf '%s' "$row" | cut -d'|' -f12)

        db "INSERT INTO user_settings
                (user_id, compact_feed, reduce_motion, profile_visibility,
                 show_online_status, allow_search_by_id, message_privacy,
                 notify_likes, notify_comments, notify_friend_requests,
                 notify_events, updated_at)
            VALUES ($a, $b, $c, $(sqlval "$d"), $e, $f, $(sqlval "$g"),
                    $h, $i, $j, $k, $(sqlval "$l"))"
    }

    # The suite creates posts, comments, likes, messages and attachments that no
    # endpoint can take back. Sweeping keeps the demo database matching what the
    # seed describes, and keeps this suite's own assertions from being thrown off
    # by rows left behind by earlier runs. Silently does nothing when the
    # database is not reachable from here.
    # Put back the demo data the suite legitimately has to disturb in order to
    # test a transition, or nothing here is needed. Leaving any of it changed
    # means every run drifts further from what the seed describes.
    #
    # `cut -d|` rather than `-d:` because the snapshot packs a datetime into one
    # of the fields, and a datetime is full of colons. Splitting on `:` produced
    # `2026-10-03 01` where a timestamp belonged, the restore wrote nonsense into
    # `responded_at`, and the friendship stayed deleted - so the restore appeared
    # to work while the demo lost a friend every run.
    if [ -n "${PRE_FRIENDSHIP:-}" ]; then
        PRE_FID=$(printf '%s' "$PRE_FRIENDSHIP" | cut -d'|' -f1)
        PRE_STATUS=$(printf '%s' "$PRE_FRIENDSHIP" | cut -d'|' -f2)
        PRE_BY=$(printf '%s' "$PRE_FRIENDSHIP" | cut -d'|' -f3)
        PRE_AT=$(printf '%s' "$PRE_FRIENDSHIP" | cut -d'|' -f4)
        PRE_FMADE=$(printf '%s' "$PRE_FRIENDSHIP" | cut -d'|' -f5-)

        # Delete-then-insert rather than upsert, so the row's id is the one that
        # was there before and not whatever the auto-increment counter hands out.
        #
        # `created_at` comes along too. It is not a column anyone reads for this
        # row, and the point is not that a reader would notice: it is that the
        # suite claims the database ends the run as it started, and "everything
        # except the handful of columns the restore remembered to copy" is a much
        # weaker claim than it sounds.
        db "DELETE FROM friendships
              WHERE user_id_1 = LEAST(1, 2) AND user_id_2 = GREATEST(1, 2)"
        db "INSERT INTO friendships (id, user_id_1, user_id_2, status, status_requested_by, responded_at, created_at)
            VALUES ($(sqlval "$PRE_FID"), LEAST(1, 2), GREATEST(1, 2),
                    '$PRE_STATUS', $(sqlval "$PRE_BY"), $(sqlval "$PRE_AT"),
                    $(sqlval "$PRE_FMADE"))"
    fi

    # `like.php` is a toggle, so the suite has to like a seeded post in order to
    # test unliking it - and whether the run adds or removes the like depends on
    # whether it was already there. Both directions have to be undone, and the
    # row has to come back exactly as it was.
    if [ -n "${OTHER_POST:-}" ] && [ -n "${PRE_LIKED+x}" ]; then
        db "DELETE FROM post_likes WHERE post_id = $OTHER_POST AND user_id = 1"
        if [ -n "$PRE_LIKED" ]; then
            # The key is (post_id, user_id), so restoring those two plus the
            # timestamp rebuilds the identical row. There is no id to carry.
            db "INSERT INTO post_likes (post_id, user_id, created_at)
                VALUES ($OTHER_POST, 1, $(sqlval "$PRE_LIKED"))"
        fi
    fi

    # ...and that like raised a notification for the post's author. Notifications
    # carry no marker of their own, so the one this run created is identified by
    # what it points at and when it was written.
    #
    # Put the profile fields back too. The profile section has to write to a real
    # row to have anything to assert, so this is the fixture's restore - and the
    # one whose absence no row-count snapshot would ever notice.
    if [ -n "${PRE_PROFILE:-}" ]; then
        _n=$(printf '%s' "$PRE_PROFILE" | cut -d'|' -f1)
        _b=$(printf '%s' "$PRE_PROFILE" | cut -d'|' -f2)
        _p=$(printf '%s' "$PRE_PROFILE" | cut -d'|' -f3)
        _c=$(printf '%s' "$PRE_PROFILE" | cut -d'|' -f4)
        _d=$(printf '%s' "$PRE_PROFILE" | cut -d'|' -f5)
        _t=$(printf '%s' "$PRE_PROFILE" | cut -d'|' -f6)

        db "UPDATE users SET full_name = $(sqlval "$_n"), bio = $(sqlval "$_b"),
                             profile_pic = $(sqlval "$_p"), cover_pic = $(sqlval "$_c"),
                             department = $(sqlval "$_d"), batch = $(sqlval "$_t")
               WHERE id = 2"
    fi

    # The optional About fields the profile tests write to user 1. Snapshotted
    # with IFNULL so NULL and '' are both representable; sqlval turns an empty
    # field back into NULL on restore.
    if [ -n "${PRE_ABOUT_1+x}" ]; then
        _ah=$(printf '%s' "$PRE_ABOUT_1" | cut -d'|' -f1)
        _al=$(printf '%s' "$PRE_ABOUT_1" | cut -d'|' -f2)
        _aw=$(printf '%s' "$PRE_ABOUT_1" | cut -d'|' -f3)
        _ai=$(printf '%s' "$PRE_ABOUT_1" | cut -d'|' -f4)
        db "UPDATE users SET headline = $(sqlval "$_ah"), location = $(sqlval "$_al"),
                             website = $(sqlval "$_aw"), interests = $(sqlval "$_ai")
               WHERE id = 1"
    fi

    # The membership the join/leave cycle rebuilt. The suite has rejoined by the
    # time this runs, so the row is there to correct - if it is not, the cycle
    # failed earlier and there is nothing to do.
    if [ -n "${PRE_COMMUNITY_ROLE:-}" ] && [ -n "${TARGET_COMMUNITY:-}" ]; then
        db "UPDATE community_members
                   SET role = $(sqlval "$(printf '%s' "$PRE_COMMUNITY_ROLE" | cut -d'|' -f1)"),
                       joined_at = $(sqlval "$(printf '%s' "$PRE_COMMUNITY_ROLE" | cut -d'|' -f2-)")
                 WHERE community_id = $TARGET_COMMUNITY AND user_id = 1"
    fi

    # The seeded unread state of the bell.
    if [ -n "${PRE_NOTIFS:-}" ]; then
        for _pair in $PRE_NOTIFS; do
            db "UPDATE notifications SET is_read = ${_pair#*.} WHERE id = ${_pair%%.*}"
        done
    fi
    if [ -n "${OTHER_POST:-}" ]; then
        db "DELETE FROM notifications
               WHERE type = 'like' AND reference_id = $OTHER_POST AND from_user_id = 1
                 AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)"
    fi

    # Settings rows are created lazily the first time an account's preferences
    # are read (bootstrap/session), so merely signing in as a seed user can leave
    # a new default row behind. Remove any that did not exist before the run,
    # then restore the values of the ones that did.
    if [ -n "${PRE_SETTINGS_IDS+x}" ]; then
        if [ -z "$PRE_SETTINGS_IDS" ]; then
            db "DELETE FROM user_settings"
        else
            db "DELETE FROM user_settings
                   WHERE FIND_IN_SET(user_id, $(sqlval "$PRE_SETTINGS_IDS")) = 0"
        fi
    fi

    # Settings rows and the password the security tests round-trip. Restoring the
    # password hash directly (rather than through the API) means a run that dies
    # between the two changes still leaves the documented password working.
    if [ -n "${PRE_SETTINGS_1+x}" ]; then _restore_settings 1 "$PRE_SETTINGS_1"; fi
    if [ -n "${PRE_SETTINGS_2+x}" ]; then _restore_settings 2 "$PRE_SETTINGS_2"; fi
    if [ -n "${PRE_PASSWORD_HASH:-}" ]; then
        db "UPDATE users SET password_hash = $(sqlval "$PRE_PASSWORD_HASH") WHERE id = 1"
    fi

    ulink_sweep_test_data "${SWEEP_SINCE:-}"
}
# Set once, here. A second `trap ... EXIT` *replaces* the first rather than
# adding to it, so the upload fixtures used to install a trap of their own and
# quietly cancel this one - which is why every run leaked its posts, comments,
# likes, messages, attachments, throwaway accounts and log rows without anyone
# noticing.
trap cleanup EXIT

# ---------------------------------------------------------------- helpers

# From lib.sh. Used to snapshot demo data the suite is about to disturb, so
# cleanup can put it back; see the restore calls in cleanup().
db() { ulink_db "$1"; }
# Strict read: reports a failing statement instead of returning an empty string.
db_ro() { ulink_db_ro "$1"; }

c_green() { printf '\033[32m%s\033[0m' "$1"; }
c_red()   { printf '\033[31m%s\033[0m' "$1"; }
c_dim()   { printf '\033[2m%s\033[0m' "$1"; }

# req METHOD PATH [JSON_BODY] -> sets $BODY and $CODE
req() {
    local method="$1" path="$2" body="${3:-}"
    local out

    if [ -n "$body" ]; then
        out=$(curl -sS -o /tmp/.ulink_body -D /tmp/.ulink_headers -w '%{http_code}' -X "$method" \
            -b "$JAR" -c "$JAR" \
            -H 'Content-Type: application/json' \
            --data "$body" \
            "$BASE$path" 2>/dev/null)
    else
        out=$(curl -sS -o /tmp/.ulink_body -D /tmp/.ulink_headers -w '%{http_code}' -X "$method" \
            -b "$JAR" -c "$JAR" \
            "$BASE$path" 2>/dev/null)
    fi

    CODE="$out"
    BODY="$(cat /tmp/.ulink_body)"
}

# check DESCRIPTION EXPECTED_CODE [JQ_FILTER EXPECTED_VALUE]
check() {
    local name="$1" expected="$2"
    local filter="${3:-}" value="${4:-}"

    local ok=1
    if [ "$CODE" != "$expected" ]; then
        ok=0
    fi

    if [ -n "$filter" ]; then
        local actual
        actual=$(printf '%s' "$BODY" | php -r '
            $d = json_decode(stream_get_contents(STDIN), true);
            $p = explode(".", $argv[1]);
            foreach ($p as $k) {
                if ($k === "") continue;
                if (is_array($d) && array_key_exists($k, $d)) { $d = $d[$k]; }
                else { echo "__MISSING__"; exit; }
            }
            echo is_bool($d) ? ($d ? "true" : "false") : (is_scalar($d) || $d === null ? (string) $d : json_encode($d));
        ' "$filter" 2>/dev/null)

        if [ "$actual" != "$value" ]; then
            ok=0
            echo "        filter $filter => '$actual' (expected '$value')"
        fi
    fi

    _report "$name" "$ok" "$expected"
}

# assert DESCRIPTION EXPECTED_CODE PHP_EXPRESSION [ARG...]
#
# $d is the decoded response body and $path('a.b') walks it. Extra arguments are
# exposed to the expression as $argv[2], $argv[3], ... Use this for assertions
# that cannot be expressed as a single key/value comparison, such as "some
# element of this array has field X equal to Y".
assert() {
    local name="$1" expected="$2" expr="$3"
    shift 3

    local ok=1
    if [ "$CODE" != "$expected" ]; then
        ok=0
    fi

    local result
    result=$(printf '%s' "$BODY" | php "$SCRIPT_DIR/assert.php" "$expr" "$@" 2>/dev/null)

    if [ "$result" != "true" ]; then
        ok=0
        echo "        expression => '$result' (expected true)"
    fi

    _report "$name" "$ok" "$expected"
}

# check_code DESCRIPTION EXPECTED_CODE -- no body inspection at all.
check_code() {
    local ok=1
    [ "$CODE" = "$2" ] || ok=0
    _report "$1" "$ok" "$2"
}

_report() {
    local name="$1" ok="$2" expected="$3"
    if [ "$ok" = 1 ]; then
        PASS=$((PASS + 1))
        printf '  %s %s\n' "$(c_green 'PASS')" "$name"
    else
        FAIL=$((FAIL + 1))
        FAILED_NAMES+=("$name")
        printf '  %s %s %s\n' "$(c_red 'FAIL')" "$name" "$(c_dim "[HTTP $CODE, expected $expected]")"
        printf '        %s\n' "$(printf '%s' "$BODY" | head -c 300)"
    fi
}

# Emit a tiny valid PNG as a data URI.
PNG="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

# Scratch space for the attachment fixtures. Removed on exit.
UPLOAD_DIR="$(mktemp -d)"

# A real 2x2 PNG. The server sniffs bytes, so a file that is merely named like a
# picture is rejected - the fixtures have to be genuinely what they claim, and
# decoding has to happen here rather than in the heredoc.
php -r 'file_put_contents($argv[1], base64_decode($argv[2]));' \
    "$UPLOAD_DIR/pixel.png" \
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAF0lEQVQI12P8//8/AzXyEIM2Ki4AxUCskAXlCQBLdB3UAWc3lHkAAAAASUVORK5CYII='

printf 'plain text attachment\n' > "$UPLOAD_DIR/notes.txt"

# A minimal but structurally real .docx: OOXML files are zip containers, and
# the server tells the three Office types apart by an entry name inside one.
php -r '
    $out = fopen($argv[1], "wb");
    foreach ([["[Content_Types].xml", "<Types/>"], ["word/document.xml", "<w:document/>"]] as [$name, $data]) {
        fwrite($out, "PK\x03\x04");
        fwrite($out, pack("vvvvvVVVvv", 20, 0, 0, 8, 0, 0, crc32($name), crc32($data), strlen($name), 0, 0));
        fwrite($out, $name . $data);
    }
    fclose($out);
' "$UPLOAD_DIR/report.docx"

# Things the server must refuse no matter what they are called.
printf '<script>alert(1)</script>' > "$UPLOAD_DIR/evil.html"
printf '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>' > "$UPLOAD_DIR/vector.svg"
printf '<?php system($_GET["c"]); ?>' > "$UPLOAD_DIR/shell.php"

# upload [TEXT] [FILE] [FILENAME] -> multipart POST to /api/messages/send.php
#
# ulink_input() falls back to $_POST, so the field names are the same as the
# JSON path - which is exactly what is being exercised here.
upload() {
    local text="${1:-}"
    local file="${2:-}" filename="${3:-}"
    local user="${UPLOAD_USER_ID:-3}"

    local args=(-sS -o /tmp/.ulink_body -D /tmp/.ulink_headers -w '%{http_code}'
        -X POST -b "$JAR" -c "$JAR")

    if [ -n "$file" ]; then
        # filename is set explicitly because the server derives the stored
        # extension from the bytes and keeps this value only as a display label,
        # so the suite can prove a .php is not honoured just by renaming it.
        args+=(-F "attachment=@$file;filename=$filename;type=application/octet-stream")
    fi

    CODE="$(curl "${args[@]}" -F "userId=$user" -F "text=$text" \
        "$BASE/api/messages/send.php" 2>/dev/null)"
    BODY="$(cat /tmp/.ulink_body)"
}

# attachment_url -> the download URL of the last uploaded message
attachment_url() {
    printf '%s' "$BODY" | php -r '
        $d = json_decode(stream_get_contents(STDIN), true);
        echo $d["message"]["attachment"]["url"] ?? "";
    '
}

section() { printf '\n%s\n' "$(c_dim "── $1")"; }

# ---------------------------------------------------------------- run

printf '\n%s\n' "$(c_green 'U-Link API test suite')  $(c_dim "$BASE")"

# `user_settings` rows are created lazily the first time an account's
# preferences are read, so simply signing in as a seed user can leave a new
# default row behind. Remember which rows existed before anything ran; cleanup
# removes any that appeared during the run.
PRE_SETTINGS_IDS=$(db_ro "SELECT IFNULL(GROUP_CONCAT(user_id ORDER BY user_id), '') FROM user_settings")

# ---------------------------------------------------------------- health
section 'health'
req GET /api/test/health-check.php
check 'health check reports ok' 200 'report.ok' 'true'

# ---------------------------------------------------------------- session
section 'auth - session'
req GET /api/auth/session.php
check 'no session is rejected' 401 'status' 'error'

# ---------------------------------------------------------------- register
section 'auth - register'
EMAIL="tester_$(date +%s)@example.com"
req POST /api/auth/register.php "{\"name\":\"Test Student\",\"email\":\"$EMAIL\",\"password\":\"password123\",\"student_id\":\"T$(date +%s)\",\"department\":\"Computer Science & Engineering\",\"batch\":\"24\"}"
check 'registration succeeds' 201 'status' 'success'

req POST /api/auth/register.php "{\"name\":\"Dup\",\"email\":\"$EMAIL\",\"password\":\"password123\"}"
check 'duplicate email is rejected' 409 'status' 'error'

req POST /api/auth/register.php '{"name":"X","email":"not-an-email","password":"password123"}'
check 'invalid email is rejected' 422 'status' 'error'

req POST /api/auth/register.php '{"name":"Valid Name","email":"short@example.com","password":"abc"}'
check 'short password is rejected' 422 'status' 'error'

req POST /api/auth/register.php "{\"name\":\"Pic User\",\"email\":\"pic_$(date +%s)@example.com\",\"password\":\"password123\",\"profile_pic\":\"$PNG\"}"
assert 'base64 avatar is stored' 201 'str_starts_with((string)($d["user"]["profile_pic"] ?? ""), "uploads/profiles/")'

# ---------------------------------------------------------------- login
section 'auth - login'
req POST /api/auth/login.php "{\"email\":\"$EMAIL\",\"password\":\"wrongpass\"}"
check 'wrong password is rejected' 401 'status' 'error'

# The identifier must be unique per run: login throttling counts failures per
# identifier, so reusing a fixed address would lock itself out after 8 runs.
req POST /api/auth/login.php "{\"email\":\"nobody_$(date +%s)@example.com\",\"password\":\"password123\"}"
check 'unknown user is rejected' 401 'status' 'error'

req POST /api/auth/login.php '{"email":"saimon@uiu.ac.bd","password":"password123"}'
check 'login by email works' 200 'status' 'success'
check 'login returns the full name' 200 'user.full_name' 'Saimon Rahman'

# The UI offers "10 Digit Numeric ID Or Valid UIU E-mail".
req POST /api/auth/logout.php
req POST /api/auth/login.php '{"email":"201011301","password":"password123"}'
check 'login by student ID works' 200 'user.full_name' 'Saimon Rahman'

# Brute force protection: the identifier locks once 8 failures have accumulated
# inside 15 minutes. The counter is checked before the attempt is recorded, so
# the 8th bad password is still refused normally and the *next* request is the
# one that gets 429 -- including one with the correct password.
THROTTLE_ID="throttle_$(date +%s)@example.com"
for _ in $(seq 1 7); do
    req POST /api/auth/login.php "{\"email\":\"$THROTTLE_ID\",\"password\":\"nope\"}"
done
check 'failures below the limit are still refused' 401 'status' 'error'

req POST /api/auth/login.php "{\"email\":\"$THROTTLE_ID\",\"password\":\"nope\"}"
check 'the 8th failure is still refused' 401 'status' 'error'

req POST /api/auth/login.php "{\"email\":\"$THROTTLE_ID\",\"password\":\"nope\"}"
check 'the next attempt is locked out' 429 'status' 'error'

req POST /api/auth/login.php "{\"email\":\"$THROTTLE_ID\",\"password\":\"password123\"}"
check 'the correct password is refused while locked out' 429 'status' 'error'

# The lock is scoped to one identifier: a real account is unaffected.
req POST /api/auth/login.php '{"email":"saimon@uiu.ac.bd","password":"password123"}'
check 'the lock does not spill to other accounts' 200 'status' 'success'

req GET /api/auth/session.php
check 'session is active' 200 'status' 'success'
check 'session exposes dept for updateUI' 200 'user.dept' 'Computer Science & Engineering'

# The seeded account owns content, so the counters must be real numbers rather
# than the literal "undefined" the UI used to render.
SESSION_POSTS=$(printf '%s' "$BODY" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo (int)($d["user"]["postsCount"] ?? -1);')
SESSION_FRIENDS=$(printf '%s' "$BODY" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo (int)($d["user"]["friendsCount"] ?? -1);')
assert 'session exposes postsCount' 200 "\$d['user']['postsCount'] >= 1"
assert 'session exposes friendsCount' 200 "\$d['user']['friendsCount'] >= 1"

# ---------------------------------------------------------------- posts
section 'posts'
req GET /api/posts/fetch.php
check 'feed loads' 200 'status' 'success'

# The frontend renders these keys directly, so assert the whole contract rather
# than one row: another account may have posted since the suite last ran.
assert 'feed returns posts' 200 'count($d["data"] ?? []) > 0'
assert 'feed rows match the frontend contract' 200 '
    $r = $hasKeys($d, "data", ["id","userId","name","pic","text","image","likes","comments","liked","commentsList"]);
    if ($r !== true) return $r;
    foreach ($d["data"] as $row) {
        if (!is_bool($row["liked"])) return "post {$row["id"]}: liked must be a bool";
        if (!is_array($row["commentsList"])) return "post {$row["id"]}: commentsList must be an array";
    }
    return true;'

# The author of the newest post must be present on the row itself; the old code
# only returned the id and rendered "undefined" in the byline.
NEWEST_AUTHOR=$(printf '%s' "$BODY" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo (string)($d["data"][0]["name"] ?? "");')
assert 'feed includes author name' 200 '$d["data"][0]["name"] !== "" && $d["data"][0]["name"] !== null'
assert 'feed includes an avatar url' 200 'str_starts_with((string)($d["data"][0]["pic"] ?? ""), "http")'

# The byline needs the author's dept and batch too, otherwise a post by anyone
# outside the signed-in user's friend list renders as "undefined - undefined".
assert 'feed rows carry the author byline fields' 200 '
    foreach ($d["data"] as $row) {
        if (!array_key_exists("dept", $row))  return "post {$row["id"]}: no dept";
        if (!array_key_exists("batch", $row)) return "post {$row["id"]}: no batch";
        if (!array_key_exists("role", $row))  return "post {$row["id"]}: no role";
    }
    return true;'

# The newsfeed excludes community posts; a profile includes them, because the
# post count in the profile header counts both.
req GET '/api/posts/fetch.php?limit=50'
assert 'the feed contains no community posts' 200 '
    foreach ($d["data"] ?? [] as $row) {
        if (($row["communityId"] ?? null) !== null) return "post {$row["id"]} belongs to a community";
    }
    return true;'

req GET '/api/posts/fetch.php?mine=1&limit=50&scope=all'
assert 'a profile listing includes community posts' 200 '
    $feed = 0; $community = 0;
    foreach ($d["data"] ?? [] as $row) {
        if (($row["communityId"] ?? null) === null) { $feed++; } else { $community++; }
    }
    return ($feed > 0 && $community > 0) ? true : "feed={$feed} community={$community}";'

# `scope` also resolves the community name, so the profile can label the chip.
assert 'community posts name their community' 200 '
    foreach ($d["data"] ?? [] as $row) {
        if (($row["communityId"] ?? null) !== null && ($row["communityName"] ?? "") === "") {
            return "post {$row["id"]} has a community id but no name";
        }
    }
    return true;'

# The profile header count has to match the list it sits above.
#
# `posts_count` is an unbounded total while the list is one page, so comparing
# the two directly only holds while the user has fewer posts than the page size.
# Once they have more, `count` stops at the limit and the comparison fails for a
# reason that has nothing to do with the code - which is exactly what happened
# here. The invariant is: the page is full only when there is more to come, and
# it is short only when it reached the end.
req GET '/api/users/profile.php'
PROFILE_POSTS=$(printf '%s' "$BODY" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo (string)($d["user"]["posts_count"] ?? 0);')
req GET '/api/posts/fetch.php?mine=1&limit=50&scope=all'
assert 'the listed posts agree with the profile post count' 200 '
    $listed  = (int) $d["count"];
    $limit   = (int) ($d["limit"] ?? $listed);
    $total   = (int) $argv[2];
    $more    = (bool) ($d["hasMore"] ?? false);
    if ($more && $listed !== $limit) {
        return "claims more pages but listed $listed of a $limit page";
    }
    if (!$more && $listed !== $total) {
        return "last page listed $listed but the profile header says $total";
    }
    return true;' "$PROFILE_POSTS"

req GET '/api/posts/fetch.php?scope=bogus'
check_code 'an unknown scope is rejected' 422

req GET '/api/posts/fetch.php?limit=5&offset=0'
check 'feed paginates' 200 'count' '5'

req POST /api/posts/create.php '{"text":"Automated test post from the API suite.","image":""}'
check 'post is created' 201 'post.text' 'Automated test post from the API suite.'
check 'created post carries the author' 201 'post.name' 'Saimon Rahman'
NEW_POST_ID=$(printf '%s' "$BODY" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["post"]["id"] ?? 0;')

req POST /api/posts/create.php '{"text":""}'
check 'empty post is rejected' 422 'status' 'error'

req POST /api/posts/like.php "{\"postId\":$NEW_POST_ID}"
check 'own post like is recorded' 200 'action' 'liked'

# liked is resolved per viewer, so re-read the feed and find this exact post.
req GET /api/posts/fetch.php
assert 'feed marks a liked post' 200 '
    $row = null;
    foreach ($d["data"] as $p) { if ((int) $p["id"] === (int) $argv[2]) { $row = $p; break; } }
    return $row !== null && $row["liked"] === true;' "$NEW_POST_ID"

req POST /api/posts/like.php "{\"postId\":$NEW_POST_ID}"
check 'like toggles off' 200 'action' 'unliked'

# Comment on somebody else's post so the notification path is exercised. The
# endpoint exposes no `user_id` filter, so pick any post by another author from
# the public feed. The like below is a toggle, so its direction depends on
# whether an earlier run already liked that post; assert the shape, not a value.
req GET '/api/posts/fetch.php?limit=50'
OTHER_POST=$(printf '%s' "$BODY" | php -r '
    $d = json_decode(stream_get_contents(STDIN), true);
    foreach ($d["data"] ?? [] as $p) {
        if ((int) $p["userId"] !== 1) { echo $p["id"]; exit; }
    }
    echo 0;')

if [ "$OTHER_POST" != "0" ]; then
    # `like.php` is a toggle, so liking a post that is already liked *removes* the
    # like. On the demo data that post is already liked, so the run used to end
    # with a seeded like gone.
    #
    # `post_likes` has no `id` column - its key is (post_id, user_id) - so the
    # snapshot is `created_at`, the one column that says when the like was made. A
    # first attempt to snapshot `id` alongside it selected a column that does not
    # exist, the strict read failed, an empty `PRE_LIKED` looked like "there was
    # no like", and the restore deleted the seeded row without putting one back.
    PRE_LIKED=$(db_ro "SELECT IFNULL(created_at, '') FROM post_likes
                     WHERE post_id = $OTHER_POST AND user_id = 1")
    req POST /api/posts/like.php "{\"postId\":$OTHER_POST}"
    assert 'liking another post works' 200 '
        is_bool($d["liked"] ?? null)
        && in_array($d["action"] ?? "", ["liked", "unliked"], true)
        && isset($d["likes"])'
else
    printf '  %s no post by another author, skipping\n' "$(c_dim 'SKIP')"
fi

if [ "$OTHER_POST" != "0" ]; then
    req POST /api/posts/comment.php "{\"postId\":$OTHER_POST,\"text\":\"Automated comment.\"}"
    check 'comment is created' 201 'comment.text' 'Automated comment.'
    COMMENT_ID=$(printf '%s' "$BODY" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["comment"]["id"] ?? 0;')
fi

# The comment must come back attached to the post it belongs to.
req GET '/api/posts/fetch.php?limit=50'
if [ "$OTHER_POST" != "0" ]; then
assert 'feed includes comments' 200 '
    foreach ($d["data"] as $p) {
        if ((int) $p["id"] !== (int) $argv[2]) continue;
        foreach ($p["commentsList"] as $c) {
            if ((int) $c["id"] === (int) $argv[3]) { return true; }
        }
        return "post {$p["id"]} did not carry comment {$argv[3]}";
    }
    return "post {$argv[2]} missing from feed";' "$OTHER_POST" "$COMMENT_ID"
fi

req POST /api/posts/comment.php "{\"postId\":$OTHER_POST,\"text\":\"   \"}"
check 'empty comment is rejected' 422 'status' 'error'

req POST /api/posts/like.php '{"postId":999999}'
check 'liking a missing post 404s' 404 'status' 'error'

# The liker/commenter is Saimon; confirm the author was notified. Look for a
# comment notification anywhere in the list rather than assuming it is first.
req POST /api/auth/logout.php
req POST /api/auth/login.php '{"email":"nusrat@uiu.ac.bd","password":"password123"}'
req GET /api/notifications/list.php
assert 'comment notification exists' 200 '$find($d, "notifications", ["type", "comment"])'

# ---------------------------------------------------------------- profile
section 'profile'

# The section below rewrites a real account's name, bio and avatar, because an
# update endpoint cannot be tested without updating something. Remember what they
# were first.
#
# This was missing for a long time, and the symptom was quiet: the suite left
# Nusrat called "Nusrat Jahan Mim" with no picture and no bio, so after a test run
# the demo showed a half-wiped profile. Every snapshot taken to check for exactly
# this said the database was unchanged, because all of them compared row *counts*
# - and the row count is identical whether the column says "Nusrat Jahan" or
# "Nusrat Jahan Mim". A count is blind to exactly the kind of damage a write test
# does. ./scripts/db-state.sh dumps the rows instead.
PRE_PROFILE=$(db_ro "SELECT CONCAT_WS('|',
                      IFNULL(full_name, 'NULL'), IFNULL(bio, 'NULL'),
                      IFNULL(profile_pic, 'NULL'), IFNULL(cover_pic, 'NULL'),
                      IFNULL(department, 'NULL'), IFNULL(batch, 'NULL'))
                 FROM users WHERE id = 2")

req GET /api/users/profile.php
check 'own profile loads' 200 'status' 'success'
check 'own profile includes email' 200 'user.email' 'nusrat@uiu.ac.bd'
assert 'own profile has a name' 200 '($d["user"]["name"] ?? "") !== ""'

req GET '/api/users/profile.php?id=1'
check 'other profile hides email' 200 'user.email' '__MISSING__'
check 'other profile shows a name' 200 'user.name' 'Saimon Rahman'

req POST /api/users/update.php '{"name":"Nusrat Jahan Mim","bio":"Compilers and coffee."}'
check 'profile update works' 200 'user.full_name' 'Nusrat Jahan Mim'
check 'profile update returns bio' 200 'user.bio' 'Compilers and coffee.'

req POST /api/users/update.php "{\"profile_pic\":\"$PNG\"}"
assert 'avatar upload returns the path' 200 '
    str_starts_with((string)($d["profile_pic"] ?? ""), "uploads/profiles/")
    && ($d["user"]["profile_pic"] ?? "") !== ""'

req POST /api/users/update.php '{"bio":""}'
check 'bio can be cleared' 200 'user.bio' ''

req POST /api/users/update.php '{"name":""}'
check 'empty name is rejected' 422 'status' 'error'

# ---------------------------------------------------------------- friends
section 'friends'
req GET /api/friends/list.php
check 'friend list loads' 200 'status' 'success'
assert 'friend count matches the friend list' 200 '
    count($d["friends"] ?? []) === (int) ($d["counts"]["friends"] ?? -1)'
assert 'friend rows match the frontend contract' 200 '
    $hasKeys($d, "friends", ["id", "name", "pic", "is_friend"])'

req GET /api/friends/suggestions.php
check 'suggestions load' 200 'status' 'success'
assert 'suggestions are real users' 200 'count($d["suggestions"] ?? []) > 0'

# `id` on a person-shaped row is the user id everywhere, never a friendship id.
# The Accept button on a request card passes it straight to friends/action.php as
# the target user, so a friendship id there means the accept never happens.
assert 'request rows carry the user id, not the friendship id' 200 '
    foreach (["requests", "sent", "friends"] as $key) {
        foreach ($d[$key] ?? [] as $row) {
            if ((int) ($row["id"] ?? 0) !== (int) ($row["userId"] ?? -1)) {
                return "$key row: id={$row["id"]} but userId={$row["userId"]}";
            }
        }
    }
    return true;'
assert 'request rows expose the friendship id separately' 200 '
    foreach ($d["requests"] ?? [] as $row) {
        if (!isset($row["friendshipId"])) return "request {$row["id"]} has no friendshipId";
        if ((int) $row["friendshipId"] === (int) $row["id"]) {
            return "request {$row["id"]} has friendshipId == id, which is the old broken shape";
        }
    }
    return true;'

# Nusrat is already friends with Saimon in the demo data, and the cycle below
# needs real transitions, so the link is dropped first. Remember what was there:
# without this the run ends with one seeded friendship gone, and "safe to run
# repeatedly" quietly stops being true.
# `id` is part of the snapshot. The link is torn down and rebuilt, so restoring
# only its columns left the *row* different: same pair, same status, a fresh
# auto-increment id. That is invisible to anything that reads the friendship, and
# still shows up the moment you compare the table to a fresh seed - so the
# suite's "leaves no trace" claim was only true of the columns someone thought to
# look at.
PRE_FRIENDSHIP=$(db_ro "SELECT CONCAT(id, '|', status, '|', IFNULL(status_requested_by, 'NULL'), '|',
                             IFNULL(responded_at, 'NULL'), '|', created_at)
                        FROM friendships
                       WHERE user_id_1 = LEAST(1, 2) AND user_id_2 = GREATEST(1, 2)")

req POST /api/friends/action.php '{"action":"remove","userId":1}'

req POST /api/friends/action.php '{"action":"request","userId":1}'
# Creating a request is a 201; re-sending to an existing pending request is a 200.
assert 'friend request is sent' "$CODE" '
    (in_array((int) $argv[2], [200, 201], true) && ($d["request_pending"] ?? false) === true)
        ? true : "http {$argv[2]} pending=" . var_export($d["request_pending"] ?? null, true)' "$CODE"

req GET /api/friends/list.php
assert 'outgoing request is tracked' 200 '$find($d, "sent", ["userId", 1])'

# Accept from the other side.
req POST /api/auth/logout.php
req POST /api/auth/login.php '{"email":"saimon@uiu.ac.bd","password":"password123"}'
req GET /api/friends/list.php
assert 'incoming request is visible' 200 '$find($d, "requests", ["userId", 2])'

# Accept the request exactly the way the Friends > Requests card does: take the
# row's own `id` as the target user. This is what returned 409 when `id` was a
# friendship id.
REQUEST_ROW_ID=$(printf '%s' "$BODY" | php -r '
    $d = json_decode(stream_get_contents(STDIN), true);
    foreach ($d["requests"] ?? [] as $r) { if ((int) $r["userId"] === 2) { echo (int) $r["id"]; return; } }
    echo 0;')
assert 'a request row is directly usable as an accept target' 200 '
    (int) ($argv[2] ?? 0) === 2 ? true : "the row id is {$argv[2]}, expected the user id 2"' "$REQUEST_ROW_ID"

req POST /api/friends/action.php '{"action":"accept","userId":2}'
check 'request is accepted' 200 'is_friend' 'true'

req POST /api/friends/action.php '{"action":"accept","userId":2}'
check 'double accept is rejected' 409 'status' 'error'

req POST /api/friends/action.php '{"action":"remove","userId":2}'
check 'friend is removed' 200 'is_friend' 'false'

req POST /api/friends/action.php '{"action":"request","userId":1}'
check 'self-request is rejected' 422 'status' 'error'

req POST /api/friends/action.php '{"action":"nonsense","userId":2}'
check 'unknown action is rejected' 422 'status' 'error'

# ---------------------------------------------------------------- notifications
section 'notifications'

# `read.php` is destructive to the demo's unread badge and is called with
# {"all":true} twice below, so the seeded read state is snapshotted and put back.
# Without this the bell shows nothing unread after a test run - a visible change
# to the demo, and one no row count would have reported.
#
# `id.is_read` pairs, because only the unread ones matter and GROUP_CONCAT over
# a handful of seeded rows is far inside its 1024-byte default.
PRE_NOTIFS=$(db_ro "SELECT IFNULL(GROUP_CONCAT(CONCAT(id, '.', is_read) ORDER BY id), '')
                   FROM notifications WHERE user_id = 1")

req GET /api/notifications/list.php
check 'notifications load' 200 'status' 'success'

req POST /api/notifications/read.php '{"all":true}'
check 'mark all read returns zero' 200 'unread' '0'

# The frontend marks a single row read when it is clicked, and that click used
# to only flip a local flag, so the unread state came back on every reload.
# Generate a fresh unread row first - everything is read by now on a repeat run,
# so there would otherwise be nothing to mark.
MY_POST=$(php -r '
    $d = json_decode(file_get_contents("php://stdin"), true);
    echo (int) ($d["data"][0]["id"] ?? 0);' <<< "$(curl -sS -b "$JAR" "$BASE/api/posts/fetch.php?mine=1&limit=1")")

req POST /api/auth/logout.php
req POST /api/auth/login.php '{"email":"nusrat@uiu.ac.bd","password":"password123"}'
req POST /api/posts/comment.php "{\"postId\":$MY_POST,\"text\":\"Comment to raise an unread notification.\"}"
# Two, so marking one can be shown to leave the other alone.
req POST /api/posts/comment.php "{\"postId\":$MY_POST,\"text\":\"A second unread one.\"}"
req POST /api/auth/logout.php
req POST /api/auth/login.php '{"email":"saimon@uiu.ac.bd","password":"password123"}'

req GET '/api/notifications/list.php?tab=all'
FIRST_NOTIF=$(printf '%s' "$BODY" | php -r '
    $d=json_decode(stream_get_contents(STDIN),true);
    foreach (($d["notifications"] ?? []) as $n) {
        if ((int) $n["is_read"] === 0) { echo (int) $n["id"]; exit; }
    }
    echo 0;')
assert 'a fresh notification arrives unread' 200 '
    (int) $argv[2] > 0 ? true : "nothing unread in the list"' "$FIRST_NOTIF"

if [ "$FIRST_NOTIF" != "0" ]; then
    req POST /api/notifications/read.php "{\"id\":$FIRST_NOTIF}"
    check 'a single notification can be marked read' 200 'status' 'success'
    assert 'marking one read reports it and leaves the rest unread' 200 '
        (int) ($d["marked"] ?? 0) === 1 && (int) $d["unread"] >= 1
            ? true
            : "marked={$d["marked"]} unread={$d["unread"]}"'

    req GET '/api/notifications/list.php?tab=all'
    assert 'the row really is read on the server now' 200 '
        foreach (($d["notifications"] ?? []) as $n) {
            if ((int) $n["id"] === (int) $argv[2]) {
                return (int) $n["is_read"] === 1 ? true : "still unread";
            }
        }
        return "notification {$argv[2]} is not in the list";' "$FIRST_NOTIF"
else
    printf '  %s nothing unread to mark individually\n' "$(c_dim 'SKIP')"
fi

# Mark everything read again so the tab filters below see a known state.
req POST /api/notifications/read.php '{"all":true}'

req GET '/api/notifications/list.php?tab=activity'
check 'activity tab loads' 200 'status' 'success'
assert 'activity tab filters requests out' 200 '
    foreach (($d["notifications"] ?? []) as $n) {
        if (in_array($n["type"], ["request", "request_accepted"], true)) {
            return "leaked a {$n["type"]} notification";
        }
    }
    return true;'

req GET '/api/notifications/list.php?tab=requests'
assert 'requests tab only holds request notifications' 200 '
    foreach (($d["notifications"] ?? []) as $n) {
        if (!in_array($n["type"], ["request", "request_accepted"], true)) {
            return "leaked a {$n["type"]} notification";
        }
    }
    return true;'

# ---------------------------------------------------------------- communities
section 'communities'
req GET /api/communities/list.php
check 'communities load' 200 'status' 'success'
assert 'communities are returned' 200 'count($d["communities"] ?? []) > 0'
assert 'communities report membership' 200 '
    $hasKeys($d, "communities", ["id", "name", "joined", "memberCount"])'
assert 'the seeded demo account is in a community' 200 '
    foreach (($d["communities"] ?? []) as $c) { if ($c["joined"]) return true; }
    return "joined nothing";'

# Pick a community the viewer belongs to, then post into it so the group feed
# has a row that definitely exists.
req GET /api/communities/list.php
JOINED_COMMUNITY=$(printf '%s' "$BODY" | php -r '
    $d=json_decode(stream_get_contents(STDIN),true);
    foreach ($d["communities"] as $c) { if ($c["joined"]) { echo $c["id"]; exit; } }
    echo 0;')

if [ "$JOINED_COMMUNITY" != "0" ]; then
    req GET "/api/communities/detail.php?id=$JOINED_COMMUNITY&feed=1"
    check 'community detail loads' 200 'status' 'success'
    check 'community feed loads' 200 'status' 'success'
    assert 'community detail reports its posts' 200 'array_key_exists("posts", $d)'

    req POST /api/posts/create.php "{\"text\":\"Posted into a community from the API suite.\",\"community_id\":$JOINED_COMMUNITY}"
    check 'community post is created' 201 'post.communityId' "$JOINED_COMMUNITY"

    req GET "/api/communities/detail.php?id=$JOINED_COMMUNITY&feed=1"
    assert 'community feed returns the new post' 200 '
        foreach (($d["posts"] ?? []) as $p) {
            if (str_contains((string) $p["text"], "Posted into a community")) return true;
        }
        return "post missing from the group feed";'
else
    printf '  %s not in any community, skipping group feed\n' "$(c_dim 'SKIP')"
fi

# The join / leave cycle. The demo account starts as a member of every
# community, so pick one it is in and leave it first - otherwise this whole
# branch is skipped and the most-used membership path goes untested.
req GET /api/communities/list.php
TARGET_COMMUNITY=$(printf '%s' "$BODY" | php -r '
    $d=json_decode(stream_get_contents(STDIN),true);
    foreach ($d["communities"] as $c) { if ($c["joined"]) { echo $c["id"]; exit; } }
    echo 0;')

if [ "$TARGET_COMMUNITY" != "0" ]; then
    # Leaving drops the membership row, and joining writes a plain `member` one.
    # The picked community is the first joined one, which on the demo data is
    # community 1 - where this account is the *admin*. So the cycle quietly
    # demoted the seeded admin to a member, and nothing about the membership list
    # made that obvious. Remember the role and put it back.
    # The join date comes along with the role. Rejoining writes a new row, and a
    # new row is stamped now - so the account silently "joined" this community
    # during the test run unless the original date is carried back.
    # `joined_at`, not `created_at` - this table does not have a created_at, and
    # writing the wrong name here is what made the restore a no-op for as long as
    # nobody diffed the actual rows. db_ro reports the mistake instead of
    # returning an empty string.
    PRE_COMMUNITY_ROLE=$(db_ro "SELECT CONCAT(role, '|', joined_at) FROM community_members
                                 WHERE community_id = $TARGET_COMMUNITY AND user_id = 1")

    # Only one member may not leave, and that is a different test below.
    req POST /api/communities/action.php "{\"action\":\"leave\",\"communityId\":$TARGET_COMMUNITY}"
    assert 'leaving a community you are in works' 200 '
        ($d["joined"] ?? null) === false ? true : "joined=" . var_export($d["joined"] ?? null, true)'

    req GET /api/communities/list.php
    NOT_JOINED=$(printf '%s' "$BODY" | php -r '
        $d=json_decode(stream_get_contents(STDIN),true);
        foreach ($d["communities"] as $c) { if (!$c["joined"]) { echo $c["id"]; exit; } }
        echo 0;')
    [ "$NOT_JOINED" != "0" ] || NOT_JOINED="$TARGET_COMMUNITY"
    req POST /api/communities/action.php "{\"action\":\"join\",\"communityId\":$NOT_JOINED}"
    # 201 for a new membership, 200 when the account was already a member.
    check_code 'joining a community answers 201' 201
    check 'community join works' 201 'joined' 'true'
    # The frontend repaints the "N Members" line from this, so a stale count
    # would show the old number above the feed straight after leaving.
    JOIN_MEMBERS=$(printf '%s' "$BODY" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo (int)($d["members"] ?? -1);')
    assert 'joining reports the new member count' 201 '
        array_key_exists("members", $d) && (int) $d["members"] === (int) $argv[2] && (int) $argv[2] > 0
            ? true
            : "members=" . var_export($d["members"] ?? null, true)' "$JOIN_MEMBERS"

    req POST /api/posts/create.php "{\"text\":\"Posted from the API suite.\",\"community_id\":$NOT_JOINED}"
    check 'community post is created' 201 'post.communityId' "$NOT_JOINED"

    req POST /api/communities/action.php "{\"action\":\"leave\",\"communityId\":$NOT_JOINED}"
    check 'community leave works' 200 'joined' 'false'
    assert 'leaving drops the member count by one' 200 '
        (int) ($d["members"] ?? -1) === (int) $argv[2] - 1
            ? true
            : "members={$d["members"]}, was " . $argv[2]' "$JOIN_MEMBERS"

    req POST /api/posts/create.php "{\"text\":\"Should be blocked.\",\"community_id\":$NOT_JOINED}"
    check 'posting after leaving is blocked' 403 'status' 'error'

    # Rejoin so the next run starts from the same state.
    req POST /api/communities/action.php "{\"action\":\"join\",\"communityId\":$NOT_JOINED}"
    check 'the suite re-joins what it left' 201 'joined' 'true'
else
    printf '  %s not in any community, skipping the join/leave cycle\n' "$(c_dim 'SKIP')"
fi

# ---------------------------------------------------------------- messages
section 'messages'
req GET /api/messages/conversations.php
check 'conversations load' 200 'status' 'success'
assert 'conversation rows match the frontend contract' 200 '
    $hasKeys($d, "conversations", ["userId", "name", "pic", "lastMessage"])'

# The nested user object used to be built from the joined message row, so it
# came back with "id": 0 and the message timestamp as created_at.
assert 'the conversation peer resolves to a real account' 200 '
    foreach ($d["conversations"] ?? [] as $c) {
        if ((int) ($c["user"]["id"] ?? 0) !== (int) $c["userId"]) {
            return "row for user {$c["userId"]} carries user.id " . var_export($c["user"]["id"] ?? null, true);
        }
        if (($c["user"]["created_at"] ?? "") > ($c["created_at"] ?? "")) {
            return "account created_at {$c["user"]["created_at"]} is later than its message {$c["created_at"]}";
        }
    }
    return true;'

req POST /api/messages/send.php '{"userId":3,"text":"Hello from the API suite."}'
check 'message is sent' 201 'message.text' 'Hello from the API suite.'
check 'sent message is marked mine' 201 'message.mine' 'true'

# `message` is accepted as an alias for the documented `text` key.
req POST /api/messages/send.php '{"userId":3,"message":"Sent with the alias key."}'
check 'the message key is accepted as an alias' 201 'message.text' 'Sent with the alias key.'

req GET '/api/messages/fetch.php?userId=3'
check 'thread loads' 200 'status' 'success'
assert 'thread contains the message' 200 '
    $find($d, "messages", ["text", "Hello from the API suite."])
    && ($d["user"]["id"] ?? 0) == 3'

req POST /api/messages/send.php "{\"userId\":$(printf '%s' "$BODY" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["user"]["id"] ?? 1;'),\"text\":\"\"}"
check 'empty message is rejected' 422 'status' 'error'

# A private conversation must not be readable by a third party. The suite above
# ran as Saimon (id 1) against user 3, so this logs in as an uninvolved account
# and asks for the same thread. The previous version passed `&as=nusrat`, which
# no endpoint reads - the request was still Saimon's and passed for the wrong
# reason.
req POST /api/auth/logout.php
req POST /api/auth/login.php '{"email":"nusrat@uiu.ac.bd","password":"password123"}'
req GET '/api/messages/fetch.php?userId=3'
assert 'thread is scoped to its participants' 200 '
    $find($d, "messages", ["text", "Hello from the API suite."]) === false'
check 'an outsider gets an empty thread' 200 'count' 0

req POST /api/auth/logout.php
req POST /api/auth/login.php '{"email":"saimon@uiu.ac.bd","password":"password123"}'
req GET '/api/messages/fetch.php?userId=3&markRead=1'
check 'messages are marked read' 200 'status' 'success'

# ------------------------------------------------------- message attachments
section 'messages - attachments'

upload '' "$UPLOAD_DIR/pixel.png" 'pixel.png'
check 'a picture can be sent on its own' 201 'status' 'success'
check 'the picture is stored as an image' 201 'message.attachment.type' 'image'
check 'the picture keeps its label' 201 'message.attachment.name' 'pixel.png'
check 'the picture is typed from its bytes' 201 'message.attachment.mime' 'image/png'
assert 'the picture has a non-zero size' 201 '($d["message"]["attachment"]["size"] ?? 0) > 0'

# The stored path must never reach the client: a URL that leaks once stays
# leaked, so every read is re-checked by api/messages/attachment.php.
assert 'the server path is not published' 201 '
    $a = $d["message"]["attachment"] ?? [];
    foreach (array_keys($a) as $k) {
        if (str_contains($k, "path")) return "attachment exposes $k";
    }
    if (empty($a["url"])) return "no download url";
    return true;'

upload 'here are my notes' "$UPLOAD_DIR/report.docx" 'report.docx'
check 'a document can accompany text' 201 'message.text' 'here are my notes'
check 'the document is stored as a file' 201 'message.attachment.type' 'file'
assert 'the Office type is sniffed from the container' 201 '
    $m = $d["message"]["attachment"]["mime"] ?? "";
    if (!str_contains($m, "wordprocessingml.document")) return "mime was $m";
    return true;'

upload '' "$UPLOAD_DIR/notes.txt" 'notes.txt'
check 'a text document is accepted' 201 'message.attachment.type' 'file'

# Content sniffing, not the name: each of these is refused on what it contains.
for fixture in evil.html vector.svg shell.php; do
    upload 'x' "$UPLOAD_DIR/$fixture" "innocent.$fixture"
    check "$fixture is refused on its content" 422 'status' 'error'
done

# ...and the name alone is not enough either: a real PDF renamed to .php.
cp "$UPLOAD_DIR/pixel.png" "$UPLOAD_DIR/actually.png"
upload '' "$UPLOAD_DIR/actually.png" 'payload.php'
check 'the stored extension comes from the bytes' 201 'message.attachment.name' 'payload.php'
assert 'a renamed picture is still stored as a picture' 201 '
    $m = $d["message"]["attachment"]["mime"] ?? "";
    if ($m !== "image/png") return "mime was $m";
    return true;'

stored_count() { ls -1 uploads/messages 2>/dev/null | grep -v '^\.htaccess$' | wc -l | tr -d ' '; }
EMPTY_BEFORE="$(stored_count)"

# A rejected file must not leave bytes behind: nothing points at an orphan, so
# it would sit in the directory forever.
for fixture in evil.html shell.php; do
    upload 'x' "$UPLOAD_DIR/$fixture" 'bad.bin'
    check "$fixture leaves nothing on disk" 422 'status' 'error'
done
EMPTY_AFTER="$(stored_count)"

if [ "$EMPTY_BEFORE" = "$EMPTY_AFTER" ]; then
    PASS=$((PASS + 1)); printf '  %s rejected uploads store no file\n' "$(c_green 'PASS')"
else
    FAIL=$((FAIL + 1)); FAILED_NAMES+=("rejected uploads store no file")
    printf '  %s rejected uploads store no file %s\n' "$(c_red 'FAIL')" \
        "$(c_dim "[count went $EMPTY_BEFORE -> $EMPTY_AFTER]")"
fi

# Reading the thread back has to carry the attachment, or a reload silently
# drops it from the conversation.
req GET '/api/messages/fetch.php?userId=3'
assert 'the thread returns attachments' 200 '
    $found = false;
    foreach ($d["messages"] ?? [] as $m) {
        if (!empty($m["attachment"]["url"])) $found = true;
    }
    return $found ? true : "no message carried an attachment";'

# Downloading. Content-Type and disposition are what keep an uploaded document
# from being rendered as markup on this origin.
IMG_ID="$(printf '%s' "$BODY" | php -r '
    $d = json_decode(stream_get_contents(STDIN), true);
    foreach ($d["messages"] ?? [] as $m) {
        if (($m["attachment"]["type"] ?? "") === "image") { echo (int) $m["id"]; return; }
    }
')"
DOC_ID="$(printf '%s' "$BODY" | php -r '
    $d = json_decode(stream_get_contents(STDIN), true);
    foreach ($d["messages"] ?? [] as $m) {
        if (($m["attachment"]["type"] ?? "") === "file") { echo (int) $m["id"]; return; }
    }
')"

curl -sS -b "$JAR" -o /dev/null -D /tmp/.ulink_dl "$BASE/api/messages/attachment.php?id=$IMG_ID"
CODE=200
assert 'a picture is served inline' 200 '
    $h = file_get_contents("/tmp/.ulink_dl");
    if (!preg_match("/^Content-Type:\s*image\/png/mi", $h)) return "not image/png";
    if (!preg_match("/^Content-Disposition:\s*inline/mi", $h)) return "not inline";
    if (!preg_match("/^X-Content-Type-Options:\s*nosniff/mi", $h)) return "nosniff missing";
    return true;'

curl -sS -b "$JAR" -o /dev/null -D /tmp/.ulink_dl "$BASE/api/messages/attachment.php?id=$DOC_ID"
CODE=200
assert 'a document is served as a download' 200 '
    $h = file_get_contents("/tmp/.ulink_dl");
    if (!preg_match("/^Content-Disposition:\s*attachment/mi", $h)) return "not attachment";
    if (preg_match("/^Content-Type:\s*(text|application\/pdf)/mi", $h)) return "a renderable type was advertised";
    return true;'

# A third party must not be able to read either of them. The fixtures above were
# sent to user 3, so the outsider here has to be somebody else entirely.
req POST /api/auth/logout.php
req POST /api/auth/login.php '{"email":"mehedi@uiu.ac.bd","password":"password123"}'
curl -sS -b "$JAR" -o /dev/null -w '%{http_code}' "$BASE/api/messages/attachment.php?id=$IMG_ID" > /tmp/.ulink_code
CODE="$(cat /tmp/.ulink_code)"
check_code 'an outsider cannot read a picture attachment' 404

curl -sS -b "$JAR" -o /dev/null -w '%{http_code}' "$BASE/api/messages/attachment.php?id=$DOC_ID" > /tmp/.ulink_code
CODE="$(cat /tmp/.ulink_code)"
check_code 'an outsider cannot read a document attachment' 404

req POST /api/auth/logout.php
req POST /api/auth/login.php '{"email":"saimon@uiu.ac.bd","password":"password123"}'
curl -sS -b "$JAR" -o /dev/null -w '%{http_code}' "$BASE/api/messages/attachment.php?id=$IMG_ID" > /tmp/.ulink_code
CODE="$(cat /tmp/.ulink_code)"
check_code 'a participant still can' 200

req POST /api/auth/logout.php
curl -sS -o /dev/null -w '%{http_code}' "$BASE/api/messages/attachment.php?id=$IMG_ID" > /tmp/.ulink_code
CODE="$(cat /tmp/.ulink_code)"
check_code 'an anonymous reader is refused' 401

req POST /api/auth/login.php '{"email":"saimon@uiu.ac.bd","password":"password123"}'
req GET '/api/messages/attachment.php?id=0'
check 'a missing attachment is a 404' 404 'status' 'error'
req GET '/api/messages/attachment.php?id=abc'
check 'a nonsense id is a 404' 404 'status' 'error'

# The uploads directory must not be readable directly, or the participant check
# above would be decoration.
STORED="$(ls -1 uploads/messages 2>/dev/null | grep -v '^\.htaccess$' | head -1)"
if [ -n "$STORED" ]; then
    curl -sS -o /dev/null -w '%{http_code}' "$BASE/uploads/messages/$STORED" > /tmp/.ulink_code
    CODE="$(cat /tmp/.ulink_code)"
    check_code 'an attachment is not served straight from uploads/' 404
else
    printf '  %s no stored attachment to probe\n' "$(c_dim 'SKIP')"
fi

# ---------------------------------------------------------------- events
section 'events'
req GET /api/events/list.php
check 'events load' 200 'status' 'success'
assert 'events are returned' 200 'count($d["events"] ?? []) > 0'
assert 'event rows match the frontend contract' 200 '
    $hasKeys($d, "events", ["id", "title", "event_date", "location", "interested"])'

req POST /api/events/rsvp.php '{"eventId":3,"interested":true}'
check 'rsvp is recorded' 200 'interested' 'true'
# The RSVP state is `rsvp_status`, not `status`: `status` is the response
# envelope and ulink_ok() drops a payload key that would collide with it.
check 'the rsvp state is reported separately from the envelope' 200 'rsvp_status' 'interested'
req POST /api/events/rsvp.php '{"eventId":3,"interested":false}'
check 'rsvp can be withdrawn' 200 'interested' 'false'
check 'the withdrawn rsvp state is reported' 200 'rsvp_status' 'not_interested'
req POST /api/events/rsvp.php '{"eventId":3,"action":"clear"}'
check 'rsvp can be cleared' 200 'interested' ''
check 'a cleared rsvp state is reported as null' 200 'rsvp_status' ''

# Every documented spelling of "no response" has to delete the row. `interested`
# is coerced to a boolean before it is interpreted, and the coercion maps every
# unrecognised string to false, so "clear" was recorded as a decline - the exact
# opposite of the request, and indistinguishable from a deliberate "not going"
# in the response. The SPA passes `action: clear` so it never hit this, which is
# why it survived as long as it did.
# Event 3 already has other attendees, so the assertions below compare against
# a baseline read from the same response rather than against zero.
req POST /api/events/rsvp.php '{"eventId":3,"action":"clear"}'
RSVP_BASE=$(printf '%s' "$BODY" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo (int)($d["interested_count"]??-1);')

req POST /api/events/rsvp.php '{"eventId":3,"interested":"clear"}'
check 'rsvp can be cleared with the word "clear"' 200 'rsvp_status' ''
assert 'and that spelling does not count you as an attendee' 200 '
    (int) ($d["interested_count"] ?? -1) === (int) $argv[2]' "$RSVP_BASE"

req POST /api/events/rsvp.php '{"eventId":3,"interested":"remove"}'
check 'rsvp can be cleared with "remove"' 200 'rsvp_status' ''
req POST /api/events/rsvp.php '{"eventId":3,"interested":null}'
check 'rsvp can be cleared with a json null' 200 'rsvp_status' ''

# ...but a decline is still a decline, and still not an attendee.
req POST /api/events/rsvp.php '{"eventId":3,"interested":false}'
check 'a decline is still recorded as a decline' 200 'rsvp_status' 'not_interested'
assert 'a decline is not counted as an attendee' 200 '
    (int) ($d["interested_count"] ?? -1) === (int) $argv[2]' "$RSVP_BASE"
req POST /api/events/rsvp.php '{"eventId":3,"interested":true}'
assert 'going is counted as an attendee' 200 '
    (int) ($d["interested_count"] ?? -1) === (int) $argv[2] + 1' "$RSVP_BASE"
req POST /api/events/rsvp.php '{"eventId":3,"action":"clear"}'
assert 'clearing again restores the baseline' 200 '
    (int) ($d["interested_count"] ?? -1) === (int) $argv[2]' "$RSVP_BASE"

# The store has to be able to tell "no response yet" from a boolean false.
req GET '/api/events/list.php'
assert 'events expose my_status and interested_count' 200 '
    $hasKeys($d, "events", ["id", "title", "interested", "my_status", "interested_count"])'

# ---------------------------------------------------------------- search
section 'search'
req GET '/api/users/search.php?q=Nusrat'
assert 'search finds a user' 200 '
    ($d["count"] ?? 0) > 0 && $find($d, "users", ["name", "Nusrat Jahan Mim"])'

req GET '/api/users/search.php?q=zzzznotarealname'
check 'search with no hits is empty' 200 'count' '0'

# Wildcards typed by the user are data, not LIKE metacharacters.
req GET '/api/users/search.php?q=%25'
check 'search escapes wildcards' 200 'count' '0'

# The viewer must never appear in their own results.
req GET '/api/users/search.php?q=Saimon'
assert 'search excludes the viewer' 200 '
    foreach (($d["users"] ?? []) as $u) {
        if ((int) $u["id"] === 1) return "the viewer was returned";
    }
    return true;'

# ---------------------------------------------------------------- settings
section 'settings'

# The suite is about to change preferences. `user_settings` rows are created on
# demand, so snapshot user 1 and user 2 exactly as they are - possibly nothing -
# and put the rows back in cleanup().
PRE_SETTINGS_1=$(db_ro "SELECT CONCAT_WS('|',
                      user_id, compact_feed, reduce_motion, profile_visibility,
                      show_online_status, allow_search_by_id, message_privacy,
                      notify_likes, notify_comments, notify_friend_requests,
                      notify_events, IFNULL(updated_at, ''))
                     FROM user_settings WHERE user_id = 1")
PRE_SETTINGS_2=$(db_ro "SELECT CONCAT_WS('|',
                      user_id, compact_feed, reduce_motion, profile_visibility,
                      show_online_status, allow_search_by_id, message_privacy,
                      notify_likes, notify_comments, notify_friend_requests,
                      notify_events, IFNULL(updated_at, ''))
                     FROM user_settings WHERE user_id = 2")

req GET /api/settings/get.php
check 'settings load' 200 'status' 'success'
assert 'settings expose every documented key' 200 '
    $hasFields($d, "settings", ["compact_feed", "reduce_motion", "profile_visibility",
        "show_online_status", "allow_search_by_id", "message_privacy",
        "notify_likes", "notify_comments", "notify_friend_requests", "notify_events"])'

req POST /api/settings/update.php '{"compact_feed":true,"reduce_motion":true,"profile_visibility":"friends"}'
check 'settings update succeeds' 200 'status' 'success'
check 'settings echo the boolean' 200 'settings.compact_feed' 'true'
check 'settings echo the enum' 200 'settings.profile_visibility' 'friends'

req GET /api/settings/get.php
check 'settings persist across requests' 200 'settings.compact_feed' 'true'
check 'the enum persists too' 200 'settings.profile_visibility' 'friends'

req POST /api/settings/update.php '{"profile_visibility":"nonsense"}'
check 'an invalid enum is rejected' 422 'status' 'error'
req POST /api/settings/update.php '{"totally_unknown":1}'
check 'a body with no known keys is rejected' 422 'status' 'error'
req GET /api/settings/get.php
check 'a rejected enum did not change anything' 200 'settings.profile_visibility' 'friends'

req POST /api/settings/update.php '{"compact_feed":false,"reduce_motion":false,"profile_visibility":"public"}'
check 'settings can be reset' 200 'settings.compact_feed' 'false'

# ---------------------------------------------------------------- post delete
section 'post delete'

req POST /api/posts/create.php '{"text":"A post the API suite will delete."}'
check 'a post to delete is created' 201 'status' 'success'
DELETE_POST_ID=$(printf '%s' "$BODY" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["post"]["id"] ?? 0;')

# Ownership: another account must not be able to delete it. Use the POST-then-
# DELETE on the same id to prove the failed attempt left the row alone.
req POST /api/auth/logout.php
req POST /api/auth/login.php '{"email":"nusrat@uiu.ac.bd","password":"password123"}'
req POST /api/posts/delete.php "{\"postId\":$DELETE_POST_ID}"
check 'another user cannot delete the post' 403 'status' 'error'

req POST /api/auth/logout.php
req POST /api/auth/login.php '{"email":"saimon@uiu.ac.bd","password":"password123"}'
req POST /api/posts/delete.php "{\"postId\":$DELETE_POST_ID}"
check 'the owner can delete the post' 200 'postId' "$DELETE_POST_ID"
check 'the delete reports success' 200 'status' 'success'

req POST /api/posts/delete.php "{\"postId\":$DELETE_POST_ID}"
check 'deleting it again is a 404' 404 'status' 'error'
req POST /api/posts/delete.php '{"postId":0}'
check 'a zero post id is rejected' 422 'status' 'error'
req POST /api/posts/delete.php '{}'
check 'a missing post id is rejected' 422 'status' 'error'

# ---------------------------------------------------------------- post manage
section 'post manage'

# Snapshot user 1's About fields before the about-fields section writes to them;
# cleanup() puts them back.
PRE_ABOUT_1=$(db_ro "SELECT CONCAT_WS('|',
    IFNULL(headline,''), IFNULL(location,''), IFNULL(website,''), IFNULL(interests,''))
    FROM users WHERE id = 1")

req POST /api/posts/create.php '{"text":"A post the API suite will edit, save and report."}'
check 'a post to manage is created' 201 'status' 'success'
MANAGE_POST_ID=$(printf '%s' "$BODY" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["post"]["id"] ?? 0;')

# Edit: only the owner may rewrite the text.
req POST /api/posts/edit.php "{\"postId\":$MANAGE_POST_ID,\"text\":\"Edited by the API suite.\"}"
check 'the owner can edit the post' 200 'status' 'success'
check 'the edit returns the new text' 200 'post.text' 'Edited by the API suite.'
req POST /api/posts/edit.php "{\"postId\":$MANAGE_POST_ID,\"text\":\"   \"}"
check 'an empty edit is rejected' 422 'status' 'error'
req POST /api/posts/edit.php '{"postId":999999999,"text":"ghost"}'
check 'editing a missing post is a 404' 404 'status' 'error'

# A single post can be pulled by id, and arrives with saved=false.
req GET "/api/posts/fetch.php?id=$MANAGE_POST_ID"
check 'the post can be fetched by id' 200 'count' '1'
check 'a fresh post is not saved' 200 'data.0.saved' 'false'

# Bookmark / un-bookmark.
req POST /api/posts/save.php "{\"postId\":$MANAGE_POST_ID}"
check 'a post can be saved' 201 'saved' 'true'
req GET "/api/posts/fetch.php?id=$MANAGE_POST_ID"
check 'the saved post reports saved=true' 200 'data.0.saved' 'true'
req GET '/api/posts/fetch.php?scope=saved'
assert 'the saved post is listed under scope=saved' 200 '
    in_array((int) $argv[2], array_map("intval", array_column($d["data"] ?? [], "id")), true)' "$MANAGE_POST_ID"
req POST /api/posts/save.php "{\"postId\":$MANAGE_POST_ID}"
check 'saving the same post again unsaves it' 200 'saved' 'false'
req GET "/api/posts/fetch.php?id=$MANAGE_POST_ID"
check 'the unsaved post reports saved=false' 200 'data.0.saved' 'false'
req POST /api/posts/save.php '{"postId":0}'
check 'saving with no valid id is rejected' 422 'status' 'error'

# Reporting your own post is refused.
req POST /api/posts/report.php "{\"postId\":$MANAGE_POST_ID,\"reason\":\"spam\"}"
check 'a user cannot report their own post' 422 'status' 'error'

# Another account cannot edit; it can report, and a repeat is idempotent.
req POST /api/auth/logout.php
req POST /api/auth/login.php '{"email":"nusrat@uiu.ac.bd","password":"password123"}'
req POST /api/posts/edit.php "{\"postId\":$MANAGE_POST_ID,\"text\":\"hijacked\"}"
check 'another user cannot edit the post' 403 'status' 'error'
req POST /api/posts/report.php "{\"postId\":$MANAGE_POST_ID,\"reason\":\"spam\",\"details\":\"API suite report\"}"
check 'another user can report the post' 201 'reported' 'true'
check 'the first report is not a duplicate' 201 'already' 'false'
req POST /api/posts/report.php "{\"postId\":$MANAGE_POST_ID,\"reason\":\"spam\"}"
check 'a duplicate report is idempotent' 200 'already' 'true'
req POST /api/posts/report.php "{\"postId\":$MANAGE_POST_ID,\"reason\":\"nonsense\"}"
check 'an invalid report reason is rejected' 422 'status' 'error'

# Back to the owner: deleting the post cascades its bookmark and report rows.
req POST /api/auth/logout.php
req POST /api/auth/login.php '{"email":"saimon@uiu.ac.bd","password":"password123"}'
req POST /api/posts/delete.php "{\"postId\":$MANAGE_POST_ID}"
check 'the managed post is deleted' 200 'status' 'success'
if [ "$(db_ro "SELECT COUNT(*) FROM post_reports WHERE post_id = $MANAGE_POST_ID")" = "0" ]; then
    _report 'the report row cascaded away with the post' 1 200
else
    _report 'the report row cascaded away with the post' 0 200
fi

# ---------------------------------------------------------------- about fields
section 'about fields'

req POST /api/users/update.php '{"headline":"CSE undergrad","location":"Dhaka","website":"example.com","interests":"robotics, chess, robotics, poetry, music, extra"}'
check 'the about fields save' 200 'status' 'success'
check 'the headline is stored' 200 'user.headline' 'CSE undergrad'
check 'the location is stored' 200 'user.location' 'Dhaka'
check 'a bare domain becomes an https url' 200 'user.website' 'https://example.com'
assert 'interests are de-duplicated and capped at five' 200 '
    $d["user"]["interests"] === "robotics, chess, poetry, music, extra"'

req POST /api/users/update.php '{"website":"javascript:alert(1)"}'
check 'a non-web scheme is rejected' 422 'status' 'error'
req POST /api/users/update.php '{"website":"ftp://example.com/x"}'
check 'a non-http scheme is rejected' 422 'status' 'error'
req POST /api/users/update.php '{"website":"https://uiu.ac.bd"}'
check 'a full https url is accepted' 200 'user.website' 'https://uiu.ac.bd'

req POST /api/users/update.php '{"headline":"","location":"","website":"","interests":""}'
check 'the about fields can be cleared' 200 'status' 'success'
check 'the cleared headline is empty' 200 'user.headline' ''
check 'the cleared website is empty' 200 'user.website' ''
# The response for a no-op update echoes the stored row, so an HTTP-only check
# cannot tell "cleared" from "nothing to update". Read the database directly:
# ulink_current_user() once omitted the About columns, every field looked empty,
# and a populated field could be set but never cleared while the API still said
# success.
if [ "$(db_ro "SELECT IFNULL(headline,'') FROM users WHERE id = 1")" = "" ] \
   && [ "$(db_ro "SELECT IFNULL(interests,'') FROM users WHERE id = 1")" = "" ]; then
    _report 'clearing the about fields really cleared the row' 1 200
else
    _report 'clearing the about fields really cleared the row' 0 200
fi

# ---------------------------------------------------------------- privacy
section 'privacy'

STUDENT_ID_2=$(db_ro "SELECT student_id FROM users WHERE id = 2")

# Nusrat locks her profile down: private visibility, student-id search off and
# messages limited to connections.
req POST /api/auth/logout.php
req POST /api/auth/login.php '{"email":"nusrat@uiu.ac.bd","password":"password123"}'
req POST /api/settings/update.php '{"profile_visibility":"private","allow_search_by_id":false,"message_privacy":"friends"}'
check 'privacy settings save' 200 'settings.profile_visibility' 'private'
check 'search-by-id preference saves' 200 'settings.allow_search_by_id' 'false'
check 'message preference saves' 200 'settings.message_privacy' 'friends'

# Saimon sees the gate but not the contents.
req POST /api/auth/logout.php
req POST /api/auth/login.php '{"email":"saimon@uiu.ac.bd","password":"password123"}'
req GET '/api/users/profile.php?id=2'
check 'a private profile is marked limited' 200 'user.limited' 'true'
check 'a private profile hides the bio' 200 'user.bio' ''
assert 'a private profile does not advertise a post count' 200 '
    (int) ($d["user"]["posts_count"] ?? -1) === 0'

req GET '/api/posts/fetch.php?user_id=2&limit=5'
check 'a private profile returns no posts to others' 200 'count' '0'

# allow_search_by_id=0 only hides the student-id match; the name still matches.
if [ -n "$STUDENT_ID_2" ]; then
    req GET "/api/users/search.php?q=$STUDENT_ID_2"
    check 'a hidden student id is not searchable' 200 'count' '0'
fi
req GET '/api/users/search.php?q=Nusrat'
assert 'the name still finds the user' 200 'count($d["users"] ?? []) > 0'

# A stranger cannot open a conversation; a connection still can.
req POST /api/auth/logout.php
req POST /api/auth/login.php "{\"email\":\"$EMAIL\",\"password\":\"password123\"}"
req POST /api/messages/send.php '{"userId":2,"text":"Stranger message from the API suite."}'
check 'a stranger cannot message a connections-only account' 403 'status' 'error'

req POST /api/auth/logout.php
req POST /api/auth/login.php '{"email":"rakib@uiu.ac.bd","password":"password123"}'
req POST /api/messages/send.php '{"userId":2,"text":"Friend message from the API suite."}'
check 'a connection can still message the account' 201 'status' 'success'

# Put Nusrat's preferences back.
req POST /api/auth/logout.php
req POST /api/auth/login.php '{"email":"nusrat@uiu.ac.bd","password":"password123"}'
req POST /api/settings/update.php '{"profile_visibility":"public","allow_search_by_id":true,"message_privacy":"everyone"}'
check 'privacy settings are restored' 200 'settings.profile_visibility' 'public'

req POST /api/auth/logout.php
req POST /api/auth/login.php '{"email":"saimon@uiu.ac.bd","password":"password123"}'

# ---------------------------------------------------------------- security
section 'security'

# The password tests round-trip the real credential, so snapshot the hash and
# put it back in cleanup() whether or not the run reaches the second change.
PRE_PASSWORD_HASH=$(db_ro "SELECT password_hash FROM users WHERE id = 1")

req POST /api/users/password.php '{"current_password":"wrong","new_password":"password124"}'
check 'a wrong current password is rejected' 401 'status' 'error'
req POST /api/users/password.php '{"current_password":"password123","new_password":"password123"}'
check 'reusing the current password is rejected' 422 'status' 'error'
req POST /api/users/password.php '{"current_password":"password123","new_password":"abc"}'
check 'a too-short password is rejected' 422 'status' 'error'

req POST /api/users/password.php '{"current_password":"password123","new_password":"password124"}'
check 'the password changes' 200 'status' 'success'

# The old password must no longer work...
req POST /api/auth/logout.php
req POST /api/auth/login.php '{"email":"saimon@uiu.ac.bd","password":"password123"}'
check 'the old password no longer logs in' 401 'status' 'error'
req POST /api/auth/login.php '{"email":"saimon@uiu.ac.bd","password":"password124"}'
check 'the new password logs in' 200 'status' 'success'

# ...and change it back so the documented demo password still works.
req POST /api/users/password.php '{"current_password":"password124","new_password":"password123"}'
check 'the password is restored' 200 'status' 'success'
req GET /api/auth/session.php
check 'the session survives the rotation' 200 'status' 'success'

# Deactivation is only ever exercised on the throwaway account from the register
# section, so a failed run cannot disable a demo login; the sweep deletes the
# account anyway.
req POST /api/auth/logout.php
req POST /api/auth/login.php "{\"email\":\"$EMAIL\",\"password\":\"password123\"}"
req POST /api/users/deactivate.php '{"password":"wrong"}'
check 'deactivation needs the right password' 401 'status' 'error'
req POST /api/users/deactivate.php '{}'
check 'deactivation needs a password at all' 422 'status' 'error'
req POST /api/users/deactivate.php '{"password":"password123"}'
check 'the throwaway account deactivates' 200 'status' 'success'
req POST /api/auth/logout.php
req POST /api/auth/login.php "{\"email\":\"$EMAIL\",\"password\":\"password123\"}"
check 'a deactivated account cannot log in' 403 'status' 'error'
req POST /api/auth/login.php '{"email":"saimon@uiu.ac.bd","password":"password123"}'
check 'the demo login is unaffected' 200 'status' 'success'

# ---------------------------------------------------------------- bootstrap
section 'bootstrap'
req GET /api/bootstrap.php
check 'bootstrap loads' 200 'status' 'success'
check 'bootstrap returns the user' 200 'user.full_name' 'Saimon Rahman'
assert 'bootstrap exposes the counters updateUI needs' 200 '
    $hasFields($d, "user", ["id", "name", "dept", "batch", "studentId", "pic", "bio", "postsCount"])'
assert 'bootstrap returns a friends array' 200 'array_key_exists("friends", $d) && is_array($d["friends"])'
assert 'bootstrap returns a communities array' 200 'array_key_exists("communities", $d) && is_array($d["communities"])'
assert 'bootstrap friend count matches the array' 200 '
    count($d["friends"] ?? []) === (int) ($d["counts"]["friends"] ?? -1)'

# ---------------------------------------------------------------- explore
section 'explore'
req GET /api/explore.php
check 'explore loads' 200 'status' 'success'
assert 'explore returns the four discovery rails' 200 '
    array_key_exists("trending", $d)
        && array_key_exists("communities", $d)
        && array_key_exists("events", $d)
        && array_key_exists("people", $d)'
assert 'trending rows match the frontend contract' 200 '
    count($d["trending"] ?? []) === 0
        || ($hasKeys($d, "trending", ["id", "name", "text", "likes", "comments"]))'
assert 'explore communities match the community card contract' 200 '
    count($d["communities"] ?? []) === 0
        || ($hasKeys($d, "communities", ["id", "name", "memberCount", "joined"]))'
assert 'explore events match the event card contract' 200 '
    count($d["events"] ?? []) === 0
        || ($hasKeys($d, "events", ["id", "title", "day", "month", "interested_count"]))'
assert 'explore never recommends the caller' 200 '
    foreach (($d["people"] ?? []) as $u) {
        if ((int) ($u["id"] ?? 0) === 1) return "recommended the caller";
    }
    return true;'

# ---------------------------------------------------------------- activities
section 'activities'
req POST /api/activities/log.php '{"activity_type":"page_view","details":"{\"page\":\"home\"}"}'
check 'activity is logged' 200 'status' 'success'

req POST /api/activities/log.php '{"activity_type":"definitely_not_real"}'
check 'unknown activity type is rejected' 422 'status' 'error'

req GET /api/activities/get.php
check 'own activities load' 200 'status' 'success'
assert 'activity log is not empty' 200 'count($d["data"] ?? []) > 0'
assert 'the activity just logged is retrievable' 200 '$find($d, "data", ["activity_type", "page_view"])'
assert 'activities only ever belong to the caller' 200 '
    foreach (($d["data"] ?? []) as $a) {
        if ((int) ($a["user_id"] ?? 0) !== 1) return "row belongs to user {$a["user_id"]}";
    }
    return true;'

# ---------------------------------------------------------------- authz
section 'authorisation'
req POST /api/auth/logout.php
req GET /api/activities/get.php
check 'activities require a session' 401 'status' 'error'
req GET /api/bootstrap.php
check 'bootstrap requires a session' 401 'status' 'error'
req GET '/api/users/profile.php?id=1'
check 'public profile works signed out' 200 'status' 'success'
req POST /api/posts/create.php '{"text":"Should not work."}'
check 'posting requires a session' 401 'status' 'error'
req POST /api/friends/action.php '{"action":"request","userId":2}'
check 'friend actions require a session' 401 'status' 'error'
req GET '/api/activities/get.php?user_id=1'
check 'reading another activity log is blocked' 401 'status' 'error'

# Signed in as someone else, then try to read Saimon's log.
req POST /api/auth/login.php '{"email":"nusrat@uiu.ac.bd","password":"password123"}'
req GET '/api/activities/get.php?user_id=1'
check 'cross-user activity read is forbidden' 403 'status' 'error'
# Nusrat is signed in; a userId pointing at somebody else must be ignored so the
# endpoint can only ever edit the session holder.
# The endpoint must ignore the userId field and edit the session holder, so the
# response describes Nusrat (id 2) under her new name and never mentions Saimon.
req POST /api/users/update.php '{"userId":1,"name":"Should Not Work"}'
assert 'profile update cannot target another user' 200 '
    (int) ($d["user"]["id"] ?? 0) === 2
        && ($d["user"]["name"] ?? "") === "Should Not Work"
    ? true : "updated id=" . ($d["user"]["id"] ?? "?") . " name=" . ($d["user"]["name"] ?? "?")'

# Put her name back.
req POST /api/users/update.php '{"name":"Nusrat Jahan Mim"}'
check 'profile name is restored' 200 'user.name' 'Nusrat Jahan Mim'

# Confirm Saimon's name was untouched.
req POST /api/auth/logout.php
req POST /api/auth/login.php '{"email":"saimon@uiu.ac.bd","password":"password123"}'
req GET '/api/users/profile.php'
check 'other profile was not modified' 200 'user.full_name' 'Saimon Rahman'

# ---------------------------------------------------------------- methods
section 'http semantics'
req GET /api/posts/create.php
check 'GET on create is rejected' 405 'status' 'error'
req POST /api/posts/fetch.php
check 'POST on fetch is rejected' 405 'status' 'error'
req OPTIONS /api/posts/like.php
check_code 'preflight is answered' 204

# ---------------------------------------------------------------- sql lint
section 'sql hygiene'
# The connection uses native prepares, which reject a named placeholder that
# appears more than once with "Invalid parameter number" at execute time. That
# is a runtime failure in whichever endpoint happens to hit the statement, so
# catch it statically instead.
DUPE_PLACEHOLDERS=$(python3 "$SCRIPT_DIR/lint-sql.py" .)
if [ -z "$DUPE_PLACEHOLDERS" ]; then
    _report 'no statement reuses a named placeholder' 1 'none found'
else
    _report 'no statement reuses a named placeholder' 0 'none found'
    printf '        %s\n' "$DUPE_PLACEHOLDERS"
fi

# Every endpoint must answer with JSON even when it fails, otherwise the
# frontend falls back to "Malformed response from the server" and hides the
# real reason.
NON_JSON=''
for endpoint in \
    /api/auth/session.php /api/posts/fetch.php /api/friends/list.php \
    /api/notifications/list.php /api/communities/list.php /api/events/list.php \
    /api/messages/conversations.php /api/users/search.php /api/bootstrap.php \
    /api/explore.php
do
    req GET "$endpoint"
    CT=$(grep -i '^content-type:' /tmp/.ulink_headers | head -1 | tr -d '\r')
    case "$CT" in
        *json*) ;;
        *) NON_JSON="${NON_JSON}  ${endpoint} -> ${CT:-no content-type}\n" ;;
    esac
done
if [ -z "$NON_JSON" ]; then
    _report 'every endpoint answers with JSON' 1 'application/json'
else
    _report 'every endpoint answers with JSON' 0 'application/json'
    printf '        %b' "$NON_JSON"
fi

# ---------------------------------------------------------------- setup
section 'installer'
req GET '/api/init/setup.php'
check 'setup is idempotent' 200 'status' 'success'
assert 'setup reports the tables it created' 200 '
    count($d["tables"] ?? []) === 17 && ($d["statements"] ?? 0) > 0'

# A second run must not drop the data that is already there.
req GET '/api/init/setup.php'
assert 'setup preserves existing data' 200 '($d["created"] ?? false) === false'

# ---------------------------------------------------------------- summary
printf '\n%s\n' "─────────────────────────────────────────"
if [ "$FAIL" = 0 ]; then
    printf '%s  %d passed, 0 failed\n\n' "$(c_green 'ALL TESTS PASSED')" "$PASS"
    exit 0
fi

printf '%s  %d passed, %d failed\n' "$(c_red 'FAILURES')" "$PASS" "$FAIL"
for name in "${FAILED_NAMES[@]}"; do
    printf '  %s %s\n' "$(c_red 'x')" "$name"
done
printf '\n'
exit 1
