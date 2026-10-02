# U-Link

A university social network for students, faculty and staff: a newsfeed,
communities, events, direct messages, friend requests and notifications.

PHP 8.1+ / MySQL 8+ on the back end, a vanilla-JavaScript single page app on
the front. No build step, no package manager, no framework.

---

## Run it

```bash
./setup.sh
```

That is the whole thing. It checks the prerequisites, unpacks a private
MariaDB and the missing PHP extensions into `.dev/` (no `sudo`, nothing
installed system-wide), creates the database, applies the schema, loads the
demo accounts, starts the server and checks it answers.

```
  App      http://127.0.0.1:8080/
  Sign in  saimon@uiu.ac.bd / password123
           nusrat@uiu.ac.bd / password123
```

Other flags:

| Flag | What it does |
| --- | --- |
| `./setup.sh --reset` | delete the database files and rebuild from the schema |
| `./setup.sh --no-seed` | install the schema without demo data |
| `./setup.sh --no-start` | install but leave the server stopped |
| `./setup.sh --check` | verify an existing installation, change nothing |

### Day to day

```bash
./scripts/dev.sh start     # database + web server
./scripts/dev.sh stop
./scripts/dev.sh status
./scripts/dev.sh restart
./scripts/dev.sh logs      # tail logs/app.log
./scripts/dev.sh setup --seed   # reinstall the schema and demo data
./scripts/dev.sh php ...        # run PHP with the bundled extensions
```

Everything the dev server creates lives in `.dev/`: the database files, the
unpacked MariaDB, the PHP extensions, pid files and its own logs. Delete the
directory to get back to nothing.

---

## Test it

```bash
./scripts/test-api.sh      # every endpoint: 272 assertions
./scripts/test-access.sh  # authorisation, disclosure, paging: 40 assertions
```

`test-api.sh` covers 26 groups: every endpoint's happy path, its failure
paths, HTTP semantics, authorisation (that one user cannot touch another's
data), the privacy and account-security transitions, and the SQL hygiene guard.

`test-access.sh` covers the guards that a happy-path suite cannot reach,
because each one needs a state the API cannot create by itself: joining a
brand-new community must not promote you to admin of the others, a block must
refuse requests *and* direct messages, a private community must not leak its
roster or posts, identifiers must not reach a stranger, and `offset` must
actually page. Where those fixtures need a database connection the cases
report as SKIP, so the script still works against a remote
`ULINK_BASE_URL`. Between them the two suites assert 312 behaviours.

### The suites leave the database exactly as they found it

Both suites have to disturb real demo data in order to test a transition - to
prove that "unlike" works they must first like a seeded post, to prove "leave"
works they must leave a seeded community. Each of those is snapshotted before
the change and restored afterwards, including the row's id and timestamps, so
running the tests does not slowly abrade the demo.

That claim used to be false in a way nothing caught. A snapshot that compared
row *counts* is satisfied by an overwritten column: `users` still had 16 rows
after a run had renamed a seeded account, emptied its bio and blanked its
avatar, and the report said "unchanged" every time. `scripts/db-state.sh` dumps
every durable row instead, and it is the tool to reach for when changing a
suite:

```bash
./scripts/db-state.sh > /tmp/before.txt
./scripts/test-api.sh
./scripts/db-state.sh > /tmp/after.txt
diff /tmp/before.txt /tmp/after.txt     # no output means no drift
```

Neither suite touches the login tables it did not write itself, so a session
you are signed into in a browser survives a test run.

The SQL hygiene group runs `scripts/lint-sql.py`, a static check for the two
mistakes that native prepared statements reject at runtime: a named
placeholder used twice in one statement, and named placeholders mixed with
positional ones. Both used to produce a 500 on specific endpoints only. The
linter's own fixture suite, `scripts/lint-sql-selftest.py`, checks that it
still *recognises* statements - it once silently tokenised a whole file away,
and reported "clean" on the very bug it exists to find. Both run under
`./setup.sh --check`.

---

## Configuration

Every setting is an environment variable, read from the process environment
first and then from `.env` in the project root. `.env` is created by
`setup.sh` on first run and is not in version control; `.env.example` is the
annotated list.

| Variable | Default | Notes |
| --- | --- | --- |
| `ULINK_DB_DRIVER` | `mysql` | or `sqlite` |
| `ULINK_DB_HOST` | `127.0.0.1` | |
| `ULINK_DB_PORT` | `3306` | `3307` in the bundled dev server |
| `ULINK_DB_NAME` | `ulink_db` | |
| `ULINK_DB_USER` | `root` | |
| `ULINK_DB_PASS` | *(empty)* | |
| `ULINK_DEBUG` | `0` | `1` returns the real error message instead of a generic 500 |
| `ULINK_ALLOWED_ORIGINS` | `*` | comma separated; credentials are only sent to an explicit origin |
| `ULINK_SETUP_TOKEN` | *(empty)* | required by `api/init/setup.php` when set |
| `ULINK_HSTS` | `0` | `1` sends `Strict-Transport-Security` on API responses |
| `ULINK_SESSION_NAME` | `ulink_session` | |
| `ULINK_MIN_PASSWORD_LENGTH` | `8` | |

### Web server

Apache needs `mod_rewrite`; the bundled `.htaccess` does the SPA fallback and
denies `.env`, `config/`, `scripts/`, `logs/` and `.dev/`.

`/api/test/` and `/api/init/` are blocked unless you create
`.dev-endpoints-enabled`. Both work from the command line regardless:

```bash
./scripts/dev.sh php config/install.php --seed
./scripts/dev.sh php api/test/health-check.php
```

`uploads/.htaccess` makes user-uploaded files inert: no handlers, no
execution, and only `jpg/png/gif/webp` served.

---

## API

41 endpoints. Every response is JSON and uses the same envelope:

```json
{ "status": "success", "message": "...", ...payload }
{ "status": "error",   "message": "..." }
```

`status` and `message` belong to the envelope, so a payload may not use either
as a field name — `ulink_ok()` drops a colliding key rather than letting it
disappear silently. (This is why the RSVP endpoint reports `rsvp_status` and
not `status`.)

The actor is always the session user. Endpoints that act on somebody else take
a target id, but no endpoint trusts a client-supplied acting id.

### Auth
| Method | Path | |
| --- | --- | --- |
| POST | `/api/auth/register.php` | `{ name, email, password, student_id?, department?, batch?, profile_pic? }` |
| POST | `/api/auth/login.php` | `{ email \| student_id, password }` |
| POST | `/api/auth/logout.php` | also accepts GET so a plain link can sign out |
| GET | `/api/auth/session.php` | 401 when signed out |

### Bootstrap
| Method | Path | |
| --- | --- | --- |
| GET | `/api/bootstrap.php` | user, friends, requests, sent, suggestions, notifications, communities, events, conversations, counts, settings, activity |

### Posts
| Method | Path | |
| --- | --- | --- |
| GET | `/api/posts/fetch.php` | `limit`, `offset`, `user_id`, `community_id`, `mine=1`, `scope=feed\|all\|saved`, `id` (a single post) |
| POST | `/api/posts/create.php` | `{ text, image?, community_id? }` |
| POST | `/api/posts/like.php` | `{ postId }` — returns `action: liked\|unliked` |
| POST | `/api/posts/comment.php` | `{ postId, text }` |
| POST | `/api/posts/edit.php` | `{ postId, text }` — the owner, a global admin, or an admin of the post's community |
| POST | `/api/posts/save.php` | `{ postId }` — toggles a bookmark in `saved_posts`, returns `{ saved }` |
| POST | `/api/posts/report.php` | `{ postId, reason: spam\|harassment\|misinformation\|other, details? }` — a repeat is idempotent (`already: true`); reporting your own post is `422` |
| POST | `/api/posts/delete.php` | `{ postId }` — the owner, a global admin, or an admin of the post's community |

`scope=feed` is the newsfeed (no community posts). `scope=all` also returns
community posts, which is what a profile lists, because the profile's post
count includes both. `scope=saved` is the caller's bookmarks and needs a
session (401 otherwise). Every post row carries a `saved` boolean for the
caller, so the feed can label the menu without a second request.

### Friends
| Method | Path | |
| --- | --- | --- |
| GET | `/api/friends/list.php` | friends, requests, sent, counts |
| GET | `/api/friends/suggestions.php` | `limit` |
| POST | `/api/friends/action.php` | `{ action: request\|accept\|reject\|cancel\|remove\|block, userId }` |

`id` on any person-shaped row — friends, requests, sent, suggestions — is the
**user** id. Requests also carry `friendshipId` separately. A new request is
`201`; a repeat is `200`.

### Users
| Method | Path | |
| --- | --- | --- |
| GET | `/api/users/profile.php` | `id` (optional, defaults to you) |
| GET | `/api/users/search.php` | `q`, `limit` |
| POST | `/api/users/update.php` | `{ full_name?, bio?, department?, batch?, headline?, location?, website?, interests?, profile_pic?, cover_pic? }` |
| POST | `/api/users/password.php` | `{ current_password, new_password }` — verifies the current password and rotates the session id |
| POST | `/api/users/deactivate.php` | `{ password }` — sets `is_active=0` and clears sessions; reversible, refuses the last active admin |

The optional About fields are validated rather than stored raw: `headline`
(160), `location` (120), `website` (255, normalised to an absolute `http` or
`https` address; any other scheme is rejected) and `interests` (a comma list
trimmed, de-duplicated and capped at five tags). An empty string clears the
field. The website is stored absolute but rendered as its host, and interests
render as chips.

### Communities
| Method | Path | |
| --- | --- | --- |
| GET | `/api/communities/list.php` | `scope=all\|joined`, `limit` |
| GET | `/api/communities/detail.php` | `id`, `feed=1` |
| POST | `/api/communities/action.php` | `{ action: join\|leave, communityId }` |
| POST | `/api/communities/create.php` | `{ name, description?, is_private?, pic?, cover? }` — the creator becomes the community's admin; `pic`/`cover` accept a data URI or a remote URL |

### Events
| Method | Path | |
| --- | --- | --- |
| GET | `/api/events/list.php` | `scope=upcoming\|past\|all` |
| POST | `/api/events/rsvp.php` | `{ eventId, interested: bool }` or `{ eventId, action: clear }` |
| POST | `/api/events/create.php` | `{ title, event_date, end_date?, location?, description?, image? }` — the dates are `YYYY-MM-DD HH:mm:ss` UTC wall time |

RSVP is three-state. The response reports it as `rsvp_status`:
`interested`, `not_interested` or `null`.

### Explore
| Method | Path | |
| --- | --- | --- |
| GET | `/api/explore.php` | trending posts, the busiest public communities, the next upcoming events, and people suggestions |

The Explore page itself is the campus portal: a landing view plus Programming,
Research, Gaming and Career sub-portals, driven from `index.html` and
`ulink_script.js` (`switchExploreTab`, `openExplorePopup`). `/api/explore.php`
is a general discovery aggregate - trending is weighted by likes and comments,
communities are public-only and busiest-first, and `people` falls back to other
accounts when the viewer is already connected to everyone - available to any
surface that wants a one-call campus snapshot.

### Messages
| Method | Path | |
| --- | --- | --- |
| GET | `/api/messages/conversations.php` | |
| GET | `/api/messages/fetch.php` | `userId`, `limit`, `markRead=1` |
| POST | `/api/messages/send.php` | `{ userId, text }`, or multipart `userId`, `text`, `attachment` |
| GET | `/api/messages/attachment.php` | `id` - streams an attachment to a participant |

A message carries text, an attachment, or both. Attachments are pictures
(`jpg`, `png`, `gif`, `webp`) or documents (`pdf`, `doc`/`docx`, `xls`/`xlsx`,
`ppt`/`pptx`, `rtf`, `txt`, `csv`, `json`, `zip`); the type is decided by
sniffing the bytes, never by the uploaded name or declared MIME type, so
renaming a script to `.pdf` does not help. `send.php` takes `multipart/form-data`
when a file is attached and JSON otherwise - `ulink_input()` reads both.

Attachment bytes are never served from `/uploads/`. `uploads/messages/` is
closed to direct requests and every read goes through `attachment.php`, which
checks that the requester is the sender or the receiver. Pictures are served
inline, documents as a download with `nosniff`, so an uploaded file can never be
rendered as markup on the site's origin.

### Notifications
| Method | Path | |
| --- | --- | --- |
| GET | `/api/notifications/list.php` | `tab=all\|requests\|activity`, `limit` |
| POST | `/api/notifications/read.php` | `{ id }` or `{ all: 1 }` |

### Activities
| Method | Path | |
| --- | --- | --- |
| POST | `/api/activities/log.php` | `{ activity_type, details }` |
| GET | `/api/activities/get.php` | `limit`, `offset` — always the caller's own |

### Settings
| Method | Path | |
| --- | --- | --- |
| GET | `/api/settings/get.php` | the caller's preferences; a new account gets the defaults, not a 404 |
| POST | `/api/settings/update.php` | any subset of `compact_feed`, `reduce_motion`, `show_online_status`, `allow_search_by_id`, `notify_likes`, `notify_comments`, `notify_friend_requests`, `notify_events` (bool), `profile_visibility` (`public\|friends\|private`), `message_privacy` (`everyone\|friends`) |

One row per account in `user_settings`, created on demand. The enums are
validated here rather than trusted at read time, unknown keys are ignored, and a
body with none of the known keys is a `422` so a typo cannot silently succeed.
`profile_visibility` gates `api/users/profile.php` and a user-scoped
`api/posts/fetch.php` (private = self or an admin, friends = accepted
connections or self/admin, public = everyone), `allow_search_by_id=0` drops only
the student-id match from `api/users/search.php`, `message_privacy=friends`
refuses a direct message from a non-connection, muted notification types create
no row at all, and `show_online_status` is honoured wherever a presence dot is
rendered.

### Health and setup
| Method | Path | |
| --- | --- | --- |
| GET | `/api/test/health-check.php` | PHP version, extensions, tables, writable paths |
| POST | `/api/init/setup.php` | applies `config/schema.sql` and the column migrations |

`init/setup.php` is the web-facing equivalent of `config/install.php` and is
guarded by `ULINK_SETUP_TOKEN`. Set the token, or keep the directory
unreachable from the web, on anything reachable from the internet.

---

## Schema

17 tables.

| Table | Holds |
| --- | --- |
| `users` | accounts, profiles, roles, presence |
| `user_sessions` | server-side session records |
| `login_attempts` | throttle counter: 8 failures per identifier per 15 minutes |
| `posts` | posts, optionally attached to a community |
| `post_likes` | `(post_id, user_id)` |
| `saved_posts` | `(user_id, post_id)` bookmarks; both foreign keys cascade |
| `post_reports` | one report per `(post_id, reporter_id)`, with a reason enum; cascades |
| `comments` | post comments |
| `communities` | groups |
| `community_members` | membership and role |
| `events` | events and their date |
| `event_interest` | per-user RSVP state |
| `friendships` | request, accept and block states for one user pair |
| `messages` | direct messages |
| `notifications` | friend requests, likes, comments |
| `user_activities` | the activity log |
| `user_settings` | per-account appearance, privacy and notification preferences |

`friendships` stores both directions in one row, which is why a request needs
`status_requested_by` to say who sent it. There is no `friend_requests` table.

---

## Layout

```
index.html               the whole SPA shell
ulink_script.js          render functions, event handlers, mock fallback data
backend_integration.js   apiRequest, ULinkAPI, the ULink store, hydrate, ActivityLogger
utilities.js             escapeHtml and other small helpers
router.php               front controller for PHP's built-in server
config/
  config.php             .env loading and the constants
  database.php           PDO wrapper; mysql and sqlite
  bootstrap.php          request, response, auth, validation, uploads, logging
  relations.php          shared queries and row mappers
  schema.sql             the 17 tables
  install.php            command line installer
  seed.php               demo data
  media.php              community and event artwork, shared by the seed and scripts/assign-media.php
api/                     one directory per feature area
scripts/
  dev.sh                 local server
  lib.sh                 shared shell helpers
  test-api.sh            endpoint behaviour suite
  db-state.sh            full-row database dump, for before/after diffs
  test-access.sh         authorisation and disclosure suite
  assert.php             assertion evaluator used by both suites
  query-count.sh         counts the SQL one endpoint actually issues
  lint-sql.py            static SQL placeholder checker
  lint-sql-selftest.py   fixtures proving lint-sql.py reports real defects
  lint-theme.py          dark-mode contrast checker
  audit-contrast.js      in-browser AA contrast audit, every view and settings panel
  assign-media.php       applies config/media.php to existing community and event rows
setup.sh                 one-shot bootstrap
uploads/
  profiles/              avatars; public
  covers/                cover photos; public
  posts/                 post pictures; public
  messages/              attachments; not reachable over HTTP
logs/                    app.log
```

### How the frontend talks to the API

`ULink.isLive` is the switch. It starts `true` and becomes `false` when the
session check comes back 401. When it is `false` the app renders the bundled
mock arrays instead, so `index.html` opened straight off disk still shows a
complete interface rather than an empty shell.

`ULink.hydrate()` is the one round trip that fills `state`. Every friend,
comment or RSVP action re-reads the affected list from the server rather than
patching the store in place, because the previous hand-patched version left
the Requests tab offering someone who had already been accepted.

### Theming

Every Tailwind colour in `index.html` is `rgb(var(--ulink-<name>) / <alpha-value>)`.
`ulink.css` holds a light palette in `:root` and a dark one in `.dark`, so a
colour is corrected in one place and both themes move together. `lint-theme.py`
catches the source mistakes that survive that (a `text-white` on a filled
brand surface, a dark background that is too light for its label) and
`audit-contrast.js` measures the rendered result in both themes across every
view; both are wired into `setup.sh --check`. Run the audit after reloading the
page, because a stale rendered message can produce a false positive.

`toggleDarkMode()` flips `.dark` and then calls `forceThemeRepaint()`, which
re-inserts `#main-app`. A plain class flip is not enough: an element with a
`backdrop-filter` is promoted to its own compositing layer and the browser can
keep the styles that layer was first painted with, so a translucent card stays
light after the switch and its own text becomes unreadable against it. Moving
the subtree is the reliable trigger; a filter nudge and a bare reflow both
failed intermittently.

Appearance preferences are server data, not `localStorage`: `compact_feed`
tightens spacing and `reduce_motion` removes transitions (it is also honoured
when the operating system asks for reduced motion). `ULinkSettings` applies both
to `<html>`, so every view obeys the same choice, and they survive a reload
because `api/bootstrap.php` returns them alongside the rest of the session.

### Cover photos

The users table has always carried `cover_pic` and `api/users/update.php` has
always accepted it, but nothing in the UI wrote to it. The profile banner is
now that control. It follows the avatar path exactly: the file is read as a
base64 data URI and POSTed as JSON, the server stores it under `uploads/covers/`
and writes the `<image>.htaccess` guard pair that `ulink_delete_upload()` clears
when the cover is replaced.

### Community and event artwork

Communities carry an avatar (`pic`) and a banner (`cover_pic`); events carry one
`image_url`. The demo values live in `config/media.php`, keyed by community slug
and event title, so the seed and `scripts/assign-media.php` cannot drift apart;
re-running the script re-applies the same mapping to an existing database.
Creating a community or event from the UI uploads through the same helper
(`ulink_store_entity_image()`), which accepts a data URI or a remote URL and
refuses anything else rather than writing a broken path. Every card also has a
generated SVG gradient fallback, so a row with no artwork still renders.

### The profile editor

One dialog covers every editable field: name, department, batch, bio, the four
optional About fields and both pictures. Pictures are read locally into data
URIs and only uploaded when Save is pressed, so cancelling leaves the account
untouched. The About card carries its own **Edit** button that opens the same
dialog. Clearing an About input sends an empty string, which the server stores
as `NULL` — a field can be unset, not only set.

### The post menu

Every post card has a `…` popover. The owner sees **Edit in place**, save,
copy link, hide from feed and **Delete**; everyone else sees save, copy link,
hide and **Report**. Edit swaps the paragraph for a textarea and sends nothing
until Save, so Cancel really changes nothing. Save is a durable `saved_posts`
row, surfaced as a **Saved** feed filter, not a browser bookmark. Hide is a
local, per-account preference (`localStorage`, keyed by user id) with an Undo
toast, and never touches the author's copy. Report writes a `post_reports` row
through an in-app reason dialog and is idempotent per post per reporter. Copy
link builds `?post=<id>`; opening that URL signs the viewer in to the right
view, scrolls to the post and highlights it. Delete asks through the shared
in-app confirm dialog, and the post's report and bookmark rows cascade away
with it.

---

## Troubleshooting

**`error: no database server available`** — no bundled MariaDB in `.dev/` and
`apt-get` could not download one. Point `.env` at an existing MySQL instead, or
run `./setup.sh` on a machine with network access.

**Ports already in use** — `ULINK_HTTP_PORT` and `ULINK_DB_PORT` before
`./scripts/dev.sh start`.

**Uploads fail** — `uploads/` and each of `profiles/`, `covers/`, `posts/`,
`messages/` must be writable by the web server user. `setup.sh` creates them,
sets group-writable permissions and checks them.

**A profile picture or cover upload is silently ignored** — `api/users/update.php`
takes either a base64 data URI in JSON or a real `multipart/form-data` upload
under the same field name. A JSON string that is not a data URI, and a file that
is not a recognised raster image, are both refused with `422` and an explanation;
they are never treated as "nothing to update".

**An attachment is rejected but the file looks fine** — the type is decided by
sniffing the bytes, so a renamed or slightly malformed file is refused. The
allowlist is in `ulink_document_type_from_binary()`; the caps are
`ULINK_UPLOAD_MAX_BYTES` (pictures) and `ULINK_ATTACHMENT_MAX_BYTES`
(documents), and PHP's own `upload_max_filesize` / `post_max_size` has to allow
at least as much or PHP rejects the request before the app sees it.

**Everything returns 500** — set `ULINK_DEBUG=1` in `.env` to get the real
message, then check `logs/app.log`.

**A stale page after a code change** — the browser cached `index.html`; it is
sent with `Cache-Control: no-cache`, so a hard reload normally suffices.
