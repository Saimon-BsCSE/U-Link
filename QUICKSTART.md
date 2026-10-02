# Quick start

## One command

```bash
./setup.sh
```

Then open <http://127.0.0.1:8080/> and sign in:

| | |
| --- | --- |
| `saimon@uiu.ac.bd` | `password123` |
| `nusrat@uiu.ac.bd` | `password123` |
| `rakib@uiu.ac.bd` | `password123` |

The demo data set has 16 users, 18 posts, 15 communities, 12 events and a
week of activity, so every screen has something real in it.

That script does the lot: checks PHP, unpacks a private MariaDB and the
missing PHP extensions into `.dev/`, writes `.env`, creates the database,
applies the schema, loads the demo data, starts the server and verifies it
answers. **No `sudo`, nothing installed system-wide.**

---

## What it needs

PHP 8.1 or newer and `curl`. That is it — everything else it fetches for
itself into `.dev/`.

Already have MySQL? Skip the download and point `.env` at it:

```bash
ULINK_DB_HOST=127.0.0.1
ULINK_DB_PORT=3306
ULINK_DB_NAME=ulink_db
ULINK_DB_USER=your_user
ULINK_DB_PASS=your_password
```

---

## Everyday commands

```bash
./scripts/dev.sh start     # database + web server
./scripts/dev.sh stop
./scripts/dev.sh status
./scripts/dev.sh logs      # tail logs/app.log
```

Change the ports with `ULINK_HTTP_PORT` and `ULINK_DB_PORT`:

```bash
ULINK_HTTP_PORT=9000 ULINK_DB_PORT=3308 ./scripts/dev.sh start
```

---

## Verify it works

```bash
./scripts/test-api.sh      # 272 assertions
./scripts/test-access.sh  #  40 assertions
```

```
ALL TESTS PASSED  272 passed, 0 failed
ALL TESTS PASSED   40 passed, 0 failed
```

The first covers every endpoint, the failure paths, HTTP semantics and
authorisation. The second covers the guards that need a state the API cannot
create by itself — an empty community, a private one, a block — and reports
those cases as SKIP if it cannot reach the database.

Both are safe to run repeatedly: each snapshots the demo rows it has to disturb
and puts them back, so a run leaves the database byte for byte as it found it.
`./scripts/db-state.sh` dumps every durable row, which is how that claim is
checked rather than assumed:

```bash
./scripts/db-state.sh > /tmp/before.txt
./scripts/test-api.sh && ./scripts/test-access.sh
./scripts/db-state.sh > /tmp/after.txt
diff /tmp/before.txt /tmp/after.txt    # silent means nothing drifted
```

---

## Start from nothing

```bash
./scripts/dev.sh stop
rm -rf .dev/data
./setup.sh --seed
```

---

## Change the settings

Everything is an environment variable, read from the process environment
first and then from `.env`. `.env.example` lists all of them with comments.

The ones you are most likely to touch:

```bash
ULINK_DEBUG=1              # show real error messages in API responses
ULINK_DB_PORT=3307         # the bundled dev server runs on 3307, not 3306
ULINK_ALLOWED_ORIGINS=*    # use an explicit origin if the SPA is on another host
ULINK_HSTS=1               # send Strict-Transport-Security over HTTPS
```

---

## Deploying

`.htaccess` handles the SPA fallback and denies `.env`, `config/`, `scripts/`,
`logs/` and `.dev/`. It needs `mod_rewrite`.

`/api/test/` and `/api/init/` are blocked over HTTP unless you create
`.dev-endpoints-enabled`. Both work from the command line:

```bash
./scripts/dev.sh php config/install.php --seed
```

Before going live: set `ULINK_DEBUG=0`, give the database user only the
privileges it needs, put the app behind HTTPS, and make `logs/` and each of
`uploads/profiles`, `uploads/posts` and `uploads/messages` writable by the web
server user. `uploads/messages` must also be unreachable over HTTP — see
`DEPLOYMENT.md` §4, which has the nginx equivalent of the `.htaccess` guard.
`README.md` has the full configuration table, `DEPLOYMENT.md` the server setup,
and `CHECKLIST.md` the go-live list.
