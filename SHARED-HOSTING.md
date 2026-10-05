# Shared hosting deployment

`DEPLOYMENT.md` describes a VPS: nginx or Apache you administer yourself, systemd
units, `php-fpm`, certbot, and a MySQL you can create databases in. This document
covers the other case — a free cPanel-style host where you have a control panel,
an FTP account and a web server you cannot configure.

Nothing here contradicts `DEPLOYMENT.md`. This is the same application with the
parts you cannot do without root removed.

> **GitHub Pages is not this.** Pages serves static files only and cannot execute
> `api/*.php` or reach a database. `.github/workflows/pages.yml` publishes the
> frontend as an interactive demo; `.github/workflows/deploy.yml` publishes the
> real application. They are separate deployments of the same tree.

---

## 1. Why this app suits shared hosting

It is closer to a folder of files than to an application you deploy:

| | |
| --- | --- |
| Build step | none — no bundler, no transpiler, no `npm install` |
| Dependencies | none — no Composer, no `vendor/` |
| Entrypoint | `index.html` at the document root |
| Runtime | `api/*.php`, one endpoint per file |

Uploading is copying files. Updating is copying files again. The GitHub Actions
workflow does exactly that over FTP.

### Two limits worth knowing before you start

**No shell.** You cannot run `php config/install.php`. The installer is also
reachable over HTTP — see [section 5](#5-apply-the-schema-from-a-browser) — but
only while a marker file exists.

**No `CREATE DATABASE`.** Free hosts hand you one database with a prefixed name
and usually withhold the privilege to create more. The installer handles a
database that already exists, so this costs you one extra step: create the
database yourself. See [section 3](#3-create-the-database).

Neither is a workaround for something missing. There is no composer step that
needs a shell and no migration that needs to write a file to disk.

---

## 2. Requirements on the host

Confirm these in the host's control panel before uploading anything.

| | Version | Notes |
| --- | --- | --- |
| PHP | 8.1 or newer | Typed properties, `match`, `str_contains` |
| MySQL | 8.0+ or MariaDB 10.5+ | `utf8mb4` throughout |
| Apache | 2.4 with `mod_rewrite` | Required — the SPA fallback and the directory guards |

PHP extensions: `pdo`, `pdo_mysql`, `json`, `session`, `mbstring`, `fileinfo`.

`fileinfo` is the one to check. It is how upload types are decided; without it
`finfo_*` is unavailable and every upload falls back to content markers, which
only covers text and Office formats.

Free hosts often let you pick the PHP version per account or per subdomain. If
the host only offers PHP 7.x, it cannot run this application.

---

## 3. Create the database

In the control panel — cPanel → MySQL Databases, or the host's equivalent — create
one database and one user, and grant the user **all** privileges on that database
only.

Shared hosts prefix both with your account name, and you must use the prefixed
name verbatim:

```
database name   epiz_12345678_ulink      (example — copy the real one)
database user   epiz_12345678_ulink
```

Write the name down exactly. It is the value of `ULINK_DB_NAME` in [section 4](#4-create-env).

The MySQL **host is not `127.0.0.1`** on shared hosting. The panel gives you a
remote hostname such as `sqlXXX.infinityfree.com`. That value belongs in
`ULINK_DB_HOST`.

---

## 4. Create `.env`

`.env` holds the database password, so it is never in the repository and never
uploaded by the deploy workflow — it exists only on the host. Create it in the
control panel's file manager, in the document root, next to `index.html`.

Copy [`.env.example`](.env.example) and change these values:

```
ULINK_DB_DRIVER=mysql
ULINK_DB_HOST=sqlXXX.infinityfree.com
ULINK_DB_PORT=3306
ULINK_DB_NAME=epiz_12345678_ulink
ULINK_DB_USER=epiz_12345678_ulink
ULINK_DB_PASS=<the password the panel generated>
ULINK_DB_CHARSET=utf8mb4

ULINK_DEBUG=0
ULINK_ALLOWED_ORIGINS=*
ULINK_SETUP_TOKEN=<a long random string>
```

Three of these are worth a second look:

**`ULINK_DEBUG`** — keep it `0`. It puts error messages into API responses, which
on a public site means database details in the browser.

**`ULINK_ALLOWED_ORIGINS`** — `*` is fine while the frontend is served from the
same host as the API. The wildcard only gets in the way if you later serve the
frontend from somewhere else, because it disables credentialed CORS. Replace it
with the exact origin if that happens.

**`ULINK_SETUP_TOKEN`** — required by `/api/init/setup.php`. Set it to a long
random string. Do not leave it empty: an empty token disables the check entirely,
and the installer creates tables and loads demo data.

Generate something with any password manager, or:

```bash
head -c 32 /dev/urandom | base64
```

---

## 5. Apply the schema from a browser

The installer applies `config/schema.sql`, then the column migrations for tables
that predate a column, then creates the upload directories. It is reachable over
HTTP, but `/api/init/` is refused by default:

```
RewriteCond %{DOCUMENT_ROOT}/.dev-endpoints-enabled !-f
RewriteRule ^api/(?:test|init)/ - [F,L]
```

So the marker file is the switch. In the document root:

**1. Create an empty file named `.dev-endpoints-enabled`**

Some panels refuse to create a file starting with a dot through the file manager.
If yours does, upload an empty file by any means that works — FTP, or rename a
file you did create.

**2. Run the installer**

```
https://your-host.example/api/init/setup.php?token=<your-token>&seed=1
```

Drop `&seed=1` to install an empty database instead of the demo accounts.

It answers with JSON listing the tables, the upload directories and the seed. If
`tables` is empty, the schema did not apply — see [troubleshooting](#8-troubleshooting).

**3. Delete `.dev-endpoints-enabled`**

Not optional. While this file exists the installer and the health check are
publicly reachable to anyone who has the token, and the health check reports
database structure.

---

## 6. Writable directories

Everything the application writes goes under `uploads/`. These six subdirectories
must exist and be writable by PHP:

```
uploads/profiles
uploads/covers
uploads/posts
uploads/messages
uploads/communities
uploads/events
```

The installer creates them, and reports any it could not prepare. If it reports a
directory as not writable, the usual cause is ownership: on shared hosting the web
server user and the FTP user are normally the same, so FTP-created directories are
already correct, but a directory created by the installer may land with different
permissions. Set every directory under `uploads/` to `755` in the file manager.

### What guards these directories, and what does not

Two `.htaccess` files are tracked, and both are deployed:

- **`uploads/.htaccess`** covers `uploads/` and everything under it. It denies
  every extension that is not `jpg`, `png`, `gif` or `webp`, and serves those four
  with `X-Content-Type-Options: nosniff`, a `default-src 'none'; sandbox`
  content policy and `Cross-Origin-Resource-Policy`. This is the second lock:
  even if an upload bug stored a script, it cannot be executed or served as
  markup.
- **`uploads/messages/.htaccess`** denies that whole directory. Attachments are
  private — `api/messages/attachment.php` streams them after checking that the
  requester is one of the two people in the thread. The parent guard already
  rejects non-images, but a picture would still be served to anyone holding the
  URL, so this closes the image case too.

The other four subdirectories have no guard of their own and do not need one:
`uploads/.htaccess` applies to subdirectories, so `profiles`, `covers`, `posts`,
`communities` and `events` are already covered. If you are looking for a missing
file, that is expected.

The application also writes a per-file guard next to each uploaded image
(`<name>.png.htaccess`) that disables the PHP engine for that file. Those are
runtime artefacts, not repository content, and a post-upload cleanup pass removes
the ones whose image is gone. Their absence is not a problem.

Do not delete either tracked `.htaccess`.

---

## 7. Connect the host to GitHub

Upload once by hand first (section 8), so the site works before automating
anything. Then wire up the workflow.

### Repository secrets

**Settings → Secrets and variables → Actions → New repository secret**, once each:

| Secret | Example |
| --- | --- |
| `ULINK_FTP_HOST` | `ftp.infinityfree.com` |
| `ULINK_FTP_PORT` | `21` |
| `ULINK_FTP_USER` | `epiz_12345678` |
| `ULINK_FTP_PASSWORD` | the FTP password from the panel |
| `ULINK_FTP_DIR` | `/htdocs`, `public_html`, or the full `/accounts/epiz_12345678/htdocs` |
| `ULINK_FTP_SCHEME` | `ftp` or `ftps` |

Use the **FTP** account, not the control panel login. On 000webhost and
InfinityFree they are different credentials, and the FTP account is usually
restricted to its own directory — which is why `ULINK_FTP_DIR` must match the
host's layout.

If the host only offers SFTP (SSH file transfer, not a shell), this workflow does
not cover it: it speaks FTP and FTPS. Either use the host's FTP service, or deploy
from your machine with any SFTP client instead.

### What happens next

Every push to `main` uploads the application. Until `ULINK_FTP_HOST` exists the
job reports **skipped** rather than failed, so the repository stays green while
you set the account up. The first run after the secrets are set deploys.

Run it by hand from **Actions → Deploy to shared host → Run workflow** rather than
waiting for a commit.

### The workflow does not prune

Deliberately. `.env`, `.dev-endpoints-enabled` and the upload guards live only on
the host, and a recursive delete would take them with it. The consequence is that
a file you delete from the repository stays on the host. Remove it in the file
manager when that matters — in practice this applies to an endpoint you retired,
and the safe order is to delete it from the repository, deploy, then delete it on
the host.

The workflow also never uploads the images tracked under `uploads/`. Those are
local demo residue, and re-uploading them would overwrite whatever a real user
has uploaded to the same filename. Nothing in `config/seed.php` references them,
so a fresh host does not miss them.

---

## 8. Verify

```
https://your-host.example/
```

Then, in this order:

1. **The app loads** and you can sign in. `saimon@uiu.ac.bd` / `password123` if
   you seeded, or register a new account.
2. **Post something.** This exercises `uploads/` — if avatars or images fail to
   save, it is the directory permissions in [section 6](#6-writable-directories).
3. **Upload an image.** It is the only feature that depends on `fileinfo`.
4. **Send a message with an attachment.** Attachments are the most heavily
   guarded path; a failure here usually means a guard was deleted.
5. **Push a commit to `main`** and confirm the change appears on the site. This
   is the step that proves the GitHub connection.

For a health check, recreate `.dev-endpoints-enabled`, visit
`/api/test/health-check.php`, then delete it again.

---

## 9. Troubleshooting

**Every API call fails, the page loads.** `.env` is missing, misnamed, or its
values are wrong. `.env` must be in the document root — next to `index.html`, not
above it. Browsers and PHP are case-sensitive on Linux hosts: `.env` is correct,
`.ENV` and `.env.txt` are not.

**`Database connection failed`.** Usually the host. `ULINK_DB_HOST` is almost
never `127.0.0.1` on shared hosting; the panel gives you a hostname. Also check
that `ULINK_DB_USER` is the prefixed user, not your control panel username.

**Installer reports `tables: []`.** The database name does not match the one the
host created. `CREATE DATABASE IF NOT EXISTS` in the installer cannot help you
here, because the account usually lacks the privilege — and a name that does not
exist is a privilege error, not a no-op.

**`/api/init/setup.php` returns 403.** `.dev-endpoints-enabled` is missing from
the document root. Confirm it is a *file* at the root, not a folder, and not
`api/.dev-endpoints-enabled`.

**Uploads fail with no error.** Check the directory permissions first, then
whether `fileinfo` is enabled. Also confirm PHP's `upload_max_filesize` and
`post_max_size` are at least as large as your largest expected upload.

**Upload appears to succeed but the image is 404.** A guard file is missing for
that upload. `uploads/.htaccess` and `uploads/messages/.htaccess` should both be
present; the workflow deploys them.

**`404` on the app after uploading, 200 on `index.html`.** `mod_rewrite` is off,
so the `.htaccess` SPA fallback is not being applied. Most hosts can enable it per
domain in the panel.

**Deploy job fails with a curl error 67, 78 or 553.** The path is wrong or the
directory does not exist. `ULINK_FTP_DIR` is the most common mistake: some hosts
need the full absolute path rather than a directory relative to the FTP login.

**Deploy job is skipped.** `ULINK_FTP_HOST` is not set under the repository's
Actions secrets. Note the setting must be on the repository, not your account.

---

## 10. What is deliberately not deployed

| Path | Why |
| --- | --- |
| `.env` | Contains the database password. Created once on the host. |
| `api/` on Pages | Pages cannot execute PHP. Demo only. |
| `config/` | 403 to the web, but the installer reads `schema.sql` and `seed.php` from it. |
| `scripts/`, `logs/`, `.dev/` | Local development and runtime state. |
| `router.php` | Only used by `php -S` locally; already 403 over HTTP. |
| `setup.sh` | Installs a private MariaDB under `.dev/`. Meaningless on shared hosting. |
| `uploads/` images | Demo residue; would clobber real uploads. |
| `*.md` | Documentation. |