# U-Link Deployment

Everything here is written against what the code actually does. Where a setting
has to match something in `config/config.php`, the constant is named.

For local development see `README.md` and `QUICKSTART.md` — this document is
about putting the app on a real server.

---

## 1. Requirements

| | Version | Why |
| --- | --- | --- |
| PHP | 8.1 or newer | Typed properties, `match`-era stdlib, `str_contains` |
| MySQL / MariaDB | MySQL 8.0+ or MariaDB 10.5+ | `utf8mb4` throughout, CTEs not required but used where convenient |
| Web server | Apache 2.4 with `mod_rewrite` + `mod_headers`, or nginx | The SPA fallback and the upload guards |

Required PHP extensions:

```
pdo  pdo_mysql  json  session  mbstring  fileinfo
```

`fileinfo` is not optional in practice — it is how upload types are decided.
Without it `finfo_*` is unavailable and every upload falls back to the content
markers, which only covers text and Office formats.

`pdo_sqlite` is supported (`ULINK_DB_DRIVER=sqlite`) for a zero-dependency
throwaway install, but `pdo_mysql` is what production uses.

Check what is actually loaded:

```bash
php -m | grep -E 'pdo_mysql|mbstring|fileinfo'
curl -s https://your-host/api/test/health-check.php   # needs the marker file, see §6
```

---

## 2. Database

Create a database and a user that owns nothing else on the server:

```sql
CREATE DATABASE ulink_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ulink'@'127.0.0.1' IDENTIFIED BY 'a-long-random-password';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP
  ON ulink_db.* TO 'ulink'@'127.0.0.1';
FLUSH PRIVILEGES;
```

`CREATE`/`ALTER`/`INDEX`/`DROP` are needed because `config/install.php` applies
the schema and the column migrations. Once the schema is in place and setup is
done over the command line only, they can be dropped.

Apply the schema:

```bash
php config/install.php            # schema + column migrations
php config/install.php --seed     # ...and 16 demo users, posts, communities
```

Both are idempotent: re-running converges on the declared shape and does not
duplicate data. `config/schema.sql` uses `CREATE TABLE IF NOT EXISTS`, which
never adds a column to a table that already exists — that is what
`ulink_column_migrations()` in `config/bootstrap.php` is for, and the installer
runs it and then verifies the result.

---

## 3. Configuration

Copy `.env.example` to `.env` and edit it. `.env` holds the database password
and must never be committed; the root `.htaccess` returns 403 for it.

| Variable | Default | Notes |
| --- | --- | --- |
| `ULINK_DB_*` | `mysql`, `127.0.0.1:3306`, `ulink_db`, `root`, empty | |
| `ULINK_DEBUG` | `0` | Set to `1` locally to see real error messages in responses. Never on in production — it puts SQL and paths in the browser. |
| `ULINK_ALLOWED_ORIGINS` | `*` | Comma-separated origins, or `*`. A wildcard disables credentialed CORS, so use an explicit origin when the frontend is on another host. |
| `ULINK_SETUP_TOKEN` | *(empty)* | Required by `api/init/setup.php` when set. Empty disables the check, which is fine only while the endpoint is unreachable. |
| `ULINK_SESSION_LIFETIME` | `604800` | Seconds. |
| `ULINK_SESSION_SAMESITE` | `Lax` | |
| `ULINK_COOKIE_SECURE` | auto | Left unset, the `Secure` flag is set when served over HTTPS. |
| `ULINK_TRUST_PROXY` | `0` | Only behind a proxy you control, otherwise clients spoof `X-Forwarded-For` and the login throttle is defeated. |
| `ULINK_UPLOAD_MAX_BYTES` | `5242880` | Pictures and avatars. |
| `ULINK_ATTACHMENT_MAX_BYTES` | `10485760` | Message documents. |
| `ULINK_PAGE_MAX` | `50` | Hard ceiling on `limit`, whatever a caller asks for. |
| `ULINK_HSTS` | `0` | Set to `1` once TLS is working everywhere. |

Every variable is documented inline in `.env.example`.

---

## 4. Uploads

```
uploads/
  profiles/    avatars          public, inert
  posts/       post pictures    public, inert
  messages/    attachments       NOT reachable over HTTP
```

All three must be writable by the web server user, owned by it or group-writable:

```bash
chown -R www-data:www-data uploads logs
chmod -R 775 uploads logs
```

`uploads/.htaccess` is the primary guard on Apache: no handlers, no execution,
no markup, and only `jpg/png/gif/webp` served at all — everything else is a 404.

`uploads/messages/.htaccess` denies the whole directory. Message attachments
are private to the two people in a thread and are only ever streamed by
`api/messages/attachment.php`, which re-checks the viewer on every request.
Serving them directly would publish them to anyone holding a URL, and a URL that
leaks once stays leaked.

**nginx has no `.htaccess`.** Reproduce both guards in the server block:

```nginx
location ^~ /uploads/messages/ { deny all; return 404; }

location ^~ /uploads/ {
    autoindex off;
    location ~ \.php$ { return 404; }        # never execute anything
    add_header X-Content-Type-Options "nosniff" always;
    add_header Content-Security-Policy "default-src 'none'; sandbox" always;
}
```

PHP's own limits have to be at least as generous as the application caps,
otherwise PHP rejects the request before any of this code runs:

```ini
upload_max_filesize = 12M
post_max_size       = 14M
memory_limit        = 128M
```

---

## 5. Apache

The repository `.htaccess` is the whole configuration. It needs:

```apache
LoadModule rewrite_module modules/mod_rewrite.so
LoadModule headers_module modules/mod_headers.so
LoadModule deflate_module modules/mod_deflate.so
AllowOverride All      # or move the directives into the vhost
```

It handles:

- 403 for `config/`, `scripts/`, `logs/`, `.dev/`, `.env`, `.git`, `router.php`
- the SPA fallback to `index.html`, with `/api/` and `/uploads/` excluded so a
  missing endpoint answers JSON rather than HTML
- `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Cross-Origin-Opener-Policy`
- `no-cache` on `index.html`, immutable caching on fingerprints-free uploads
- HSTS only over TLS

`mod_php` flags (`display_errors Off`, `upload_max_filesize`) are wrapped in
`<IfModule mod_php.c>`, so on PHP-FPM they are silently skipped. Set them in
the FPM pool or `php.ini` instead:

```ini
; /etc/php/8.3/fpm/conf.d/99-ulink.ini
display_errors = Off
log_errors = On
error_log = /var/log/php/ulink-error.log
upload_max_filesize = 12M
post_max_size = 14M
```

---

## 6. nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/ulink;
    index index.html;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    root /var/www/ulink;
    index index.html;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Never public.
    location ^~ /.env     { deny all; }
    location ^~ /config/  { deny all; }
    location ^~ /scripts/ { deny all; }
    location ^~ /logs/    { deny all; }
    location ^~ /uploads/messages/ { deny all; }

    location = /router.php { deny all; }

    # Uploads: served, never executed, never sniffed.
    location ^~ /uploads/ {
        autoindex off;
        location ~ \.php$ { return 404; }
        add_header X-Content-Type-Options "nosniff" always;
        add_header Content-Security-Policy "default-src 'none'; sandbox" always;
    }

    # API, including the attachment streamer.
    location ~ ^/api/.*\.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$uri;
        fastcgi_read_timeout 60;
    }

    location = /index.html {
        add_header Cache-Control "no-cache, must-revalidate" always;
    }

    # SPA fallback. /api and /uploads are excluded so a typo there is a 404
    # rather than the HTML shell.
    location / {
        try_files $uri $uri/ /index.html;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000" always;
}
```

`try_files $uri $uri/ /index.html` would turn a request for
`/api/messages/nope.php` into the HTML shell, which is why `/api` gets its own
`location` above rather than relying on the fallback.

---

## 7. HTTPS

```bash
sudo apt install certbot python3-certbot-nginx     # or python3-certbot-apache
sudo certbot --nginx -d your-domain.com
sudo systemctl enable --now certbot.timer
```

Then set `ULINK_HSTS=1` in `.env` and restart PHP so API responses carry the
header too. One HSTS response is enough for the whole host, but the browser only
sends HTTPS after seeing it, so make sure it arrives before you rely on it.

---

## 8. Permissions

```bash
chown -R www-data:www-data /var/www/ulink/uploads /var/www/ulink/logs
chmod -R 775 /var/www/ulink/uploads /var/www/ulink/logs
find /var/www/ulink -type f -not -path '*/uploads/*' -exec chmod 644 {} +
```

Stored uploads are `0644`; directories `0775`. Nothing in the tree needs to be
executable except `router.php`, which is only used by the development server and
is denied over HTTP anyway.

---

## 9. systemd + PHP-FPM

```ini
# /etc/systemd/system/ulink.service
[Unit]
Description=U-Link
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/ulink
ExecStartPre=/usr/bin/php /var/www/ulink/config/install.php
ExecStart=/usr/sbin/php-fpm8.3 --nodaemonize
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

`ExecStartPre` keeps the schema and migrations current on every deploy. It is
idempotent, so re-running is safe.

---

## 10. Backups

```bash
# Database, daily
0 3 * * * mysqldump --single-transaction --quick \
  -u ulink -p"$ULINK_DB_PASS" ulink_db \
  | gzip > /backup/ulink/ulink_db_$(date +\%Y\%m\%d).sql.gz
find /backup/ulink -name '*.sql.gz' -mtime +14 -delete
```

Uploads are not in the database, so back them up too — but not with the message
attachments and the public images in one archive if the destination is less
trusted than the web server: `uploads/messages` holds private documents.

```bash
0 4 * * * tar czf /backup/ulink/uploads_$(date +\%Y\%m\%d).tar.gz -C /var/www/ulink uploads
```

Restore both before the app is switched back, or the app will render rows whose
files are missing.

---

## 11. Post-deploy verification

```bash
curl -s https://your-domain.com/api/test/health-check.php | python3 -m json.tool
```

Needs `touch .dev-endpoints-enabled` in the document root, per the root
`.htaccess` — that endpoint is disabled by default on purpose. Remove the marker
file afterwards, or restrict `/api/test/` to your monitoring host in the server
config instead.

Then, in order:

```bash
# Login and confirm the session works end to end.
curl -s -c /tmp/j -X POST https://your-domain.com/api/auth/login.php \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"..."}'
curl -s -b /tmp/j https://your-domain.com/api/auth/session.php

# An attachment round trip, both directions.
curl -s -b /tmp/j -F userId=2 -F 'text=hello' -F 'attachment=@photo.png' \
  https://your-domain.com/api/messages/send.php
curl -s -b /tmp/j -o /dev/null -w '%{http_code} %{content_type}\n' \
  'https://your-domain.com/api/messages/attachment.php?id=<id>'

# And confirm it is NOT reachable directly.
curl -s -o /dev/null -w '%{http_code}\n' \
  https://your-domain.com/uploads/messages/<the file name>
# must be 403 or 404, never 200
```

That last one is the check most worth running by hand: it is the only assertion
that the web server is actually honouring the upload guards, and no amount of
application code can enforce it.

---

## 12. Troubleshooting

**500 on every request** — set `ULINK_DEBUG=1` temporarily and read
`logs/app.log`. Check `php-fpm` owns the directory.

**Uploads fail with no message** — `uploads/` and each subdirectory must be
writable by the PHP-FPM user, not the web-server user. On nginx and PHP-FPM
those are frequently different users.

**Everything works on Apache, uploads are 404 on nginx** — the `.htaccess`
guards are not a thing on nginx. Reproduce them in the server block (§6).

**Attachments rejected but the file looks fine** — the type comes from sniffing
the bytes, not the name. See `ulink_document_type_from_binary()` for the
allowlist.

**Login attempts are never throttled** — `ULINK_TRUST_PROXY` is probably on
without a proxy in front, so every client looks like the same IP from the proxy
but different ones to the app.

**CORS errors in the console** — `ULINK_ALLOWED_ORIGINS=*` disables
credentialed CORS. Set the real origin, and confirm the frontend and API are
actually same-origin, which is simpler.