# U-Link Pre-Launch Checklist

A go-live checklist, not a status report. Tick these against the server you are
about to publish to, not against the source tree. `DEPLOYMENT.md` has the
commands; this is the list.

Automated cover for the checks marked **[auto]**: `./scripts/test-api.sh` (272
assertions), `./scripts/test-access.sh` (40), `python3 scripts/lint-sql.py .`,
`python3 scripts/lint-sql-selftest.py`,
`python3 scripts/lint-theme.py .`, `node --check` on every JS file, `php -l` on
every PHP file, and `scripts/audit-contrast.js` run in the browser for the
contrast checks in §4.

---

## 1. The code is what you think it is

- [ ] **[auto]** `./scripts/test-api.sh` — every assertion passes
- [ ] **[auto]** `./scripts/test-access.sh` — every assertion passes, no SKIPs
- [ ] **[auto]** `./scripts/db-state.sh` is identical before and after both
      suites — they are meant to restore every row they disturb, not just
      every row they create
- [ ] **[auto]** `python3 scripts/lint-sql.py .` — no reused named placeholders
- [ ] **[auto]** `python3 scripts/lint-sql-selftest.py` — the SQL linter still
      recognises statements (it has silently passed on real bugs before)
- [ ] **[auto]** `python3 scripts/lint-theme.py .` — no dark-mode contrast defects
- [ ] **[auto]** `node --check` on `*.js` and `scripts/*.js`
- [ ] **[auto]** `php -l` on every file under `api/` and `config/`
- [ ] **[auto]** `./setup.sh --check` — reports a complete installation
- [ ] `git status` is clean, or the diff is one you can explain
- [ ] No `TODO`, `FIXME` or `console.log` left in shipped JavaScript
- [ ] `grep -rn "alert(\|confirm(\|prompt(" *.js` returns nothing —
      every dialog is in-app

## 2. Secrets

- [ ] `.env` exists on the server and is **not** in version control
- [ ] `.env` is `600`, owned by the deploy user, not world-readable
- [ ] `ULINK_DB_PASS` is a real password, not `change-me`
- [ ] `ULINK_DEBUG=0`
- [ ] `ULINK_SETUP_TOKEN` is set to something unguessable
- [ ] No credentials in `config/*.php` — they read from the environment only
- [ ] `curl -sI https://host/.env` returns 403, not the file

## 3. Database

- [ ] **[auto]** `php config/install.php` completes and reports all 17 tables
- [ ] **[auto]** Running it twice changes nothing (idempotent)
- [ ] The application database user has no privileges outside `ulink_db`
- [ ] `config/install.php` is not reachable over HTTP, or `ULINK_SETUP_TOKEN` is set
- [ ] A dump restores cleanly into an empty database

## 4. Uploads — the part that is easy to get wrong

- [ ] `uploads/` and each of `profiles/`, `covers/`, `posts/`, `messages/` exist and are writable
- [ ] Files are `0644`, directories `0775`, owned by the **PHP-FPM** user
- [ ] `php.ini` has `upload_max_filesize` ≥ `ULINK_ATTACHMENT_MAX_BYTES`
- [ ] `php.ini` has `post_max_size` > `upload_max_filesize`
- [ ] `curl -o /dev/null -w '%{http_code}' https://host/uploads/<name>.php` → 403/404
- [ ] `curl ... https://host/uploads/messages/<name>` → 403/404
- [ ] An uploaded `.html` or `.svg` is not rendered by the browser
- [ ] **[auto]** `./scripts/test-api.sh` — the attachment rejection cases pass

## 5. Transport and headers

- [ ] TLS is valid, and HTTP redirects to HTTPS
- [ ] `ULINK_HSTS=1` once TLS is confirmed working
- [ ] `Strict-Transport-Security` present over HTTPS
- [ ] `X-Content-Type-Options: nosniff` on HTML and on uploads
- [ ] `X-Frame-Options` present (clickjacking)
- [ ] Session cookie has `HttpOnly`, `Secure`, `SameSite=Lax`
- [ ] No `X-Powered-By` / version banner in the response headers

## 6. Access control

- [ ] Logged out, every endpoint except `login`, `register`, `health-check` returns 401
- [ ] A second account cannot read another's activity log
- [ ] A second account cannot read a private conversation
- [ ] **[auto]** `profile update cannot target another user`
- [ ] **[auto]** `an outsider cannot read a picture attachment`
- [ ] `api/test/` and `api/init/` are off by default, or restricted to your monitor

`test-api.sh` covers the account-security and preference guards, which were an
untested surface before:

- [ ] **[auto]** `profile_visibility=private` hides the bio and post count from another account
- [ ] **[auto]** `message_privacy=friends` refuses a stranger but still allows a connection
- [ ] **[auto]** Changing a password rejects the wrong current password, refuses a reuse, and the old password stops working
- [ ] **[auto]** Deactivation refuses a wrong password, and a disabled account cannot sign back in

`test-access.sh` asserts these, each of which was a real defect rather than a
hypothetical — the first was reachable by any authenticated user:

- [ ] **[auto]** Joining an empty community does not promote you to admin of your others
- [ ] **[auto]** A blocked user gets 403 on a friend request *and* on a direct message,
      the block row is untouched, and no dead notification lands in the blocker's inbox
- [ ] **[auto]** A private community refuses `join`, refuses its posts, returns an empty
      roster with `locked: true`, and is hidden from the directory for non-members
- [ ] **[auto]** Commenting, liking or posting in a community you have not joined is
      refused under both the `community_id` and `communityId` spellings, while reading
      a *public* community stays open
- [ ] **[auto]** `friends/suggestions.php`, both request lists and `messages/fetch.php`
      carry no `email` or `student_id`; `friends/list.php` still does
- [ ] **[auto]** `posts/fetch.php?scope=all` with no author filter returns 200

## 7. Content Security Policy

CSP is **off by default** because the app loads Tailwind and the icon font from
CDNs, and a policy that is missing one origin breaks styling silently rather than
failing visibly. Enable it deliberately:

- [ ] Replace `cdn.tailwindcss.com` with a built Tailwind stylesheet
- [ ] Self-host the Material Symbols font
- [ ] Add the policy from the comment at the bottom of `.htaccess`
- [ ] Verify every view and every settings panel in both themes with `scripts/audit-contrast.js`

## 8. Browser behaviour

- [ ] Every one of the six tabs renders with real data
- [ ] Every one renders in dark mode, with readable text
- [ ] Toggling the theme switch in the running app repaints every card — the
      `backdrop-filter` cards are the ones that used to stay light
- [ ] Upload a profile cover, then a second one — the first image *and* its
      `.htaccess` guard are gone
- [ ] No layout collapse, no horizontal overflow, in both themes
- [ ] Sign out and back in — state comes from the server, not from a stale cache
- [ ] Edit every profile field (name, department, batch, bio, headline, location, website, interests, avatar, cover) and confirm each survives a reload
- [ ] Clear the optional About fields, reload, and confirm they stay cleared (not just hidden)
- [ ] The `…` menu on your own post offers Edit, Save, Copy link, Hide and Delete — and no Report
- [ ] The `…` menu on someone else's post offers Save, Copy link, Hide and Report — and no Edit or Delete
- [ ] Editing a post inline updates it after a reload; Cancel leaves it untouched
- [ ] Save a post, open the **Saved** feed filter, unsave it and watch it leave; a reload still shows the saved state
- [ ] Hide a post, use the Undo toast to bring it back, and confirm another account still sees it
- [ ] Copy a post link, open the `?post=<id>` URL signed out, and land on the highlighted post after signing in
- [ ] Report a post through the in-app dialog; a second report of the same post confirms rather than duplicating
- [ ] Delete one of your own posts: the post leaves the feed and your profile count, and its report/bookmark rows are gone
- [ ] Change an appearance and a privacy preference, reload, and confirm they persisted
- [ ] Change your password, sign out, and sign in with the new one
- [ ] Send a picture, send a document, download the document, open the picture
- [ ] A failed send keeps the text in the composer
- [ ] **No `alert()`, `confirm()` or `prompt()` anywhere** — every confirmation is in-app
- [ ] No request is left pointing at an endpoint that answers "nothing to update"

## 9. Operations

- [ ] Log files rotate; `logs/` does not fill the disk
- [ ] Automated database backup, and a restore you have actually performed
- [ ] Automated backup of `uploads/` — it is not in the database
- [ ] Uptime check against `api/test/health-check.php`
- [ ] Someone knows where the deploy script is and how to roll back

## 10. Demo data

- [ ] `php config/install.php --seed` is **not** run against production
- [ ] If it was: the seeded accounts and their known passwords are gone
- [ ] Every remaining real account has a unique email and a rotated password

---

## Known limits

Not defects — decisions, so they are recorded rather than rediscovered:

- No real-time updates. Threads are read on open, on send, and on refresh.
  Polling would be the next step; websockets are not implemented.
- No email. Registration does not verify an address or send a notification.
- No password reset. Recovery is an administrator action.
- Images are not resized on upload. `ULINK_UPLOAD_MAX_DIMENSION` is defined and
  enforced on avatars only.
- Voice and video call buttons are deliberately inert and say so.
- Content-Security-Policy is off. See §7.
- Message attachments cap at 10 MB and pictures at 5 MB; the allowlist is in
  `ulink_document_type_from_binary()`.