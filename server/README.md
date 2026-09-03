# server/ — teams-generator backend

Standalone PHP backend for auth (email + OTP) and persistent player rosters,
consumed by the frontend at the repo root. No framework, no Composer, no
build step — deployed by FTP/SFTP file upload only, matching the
constraints of the host it targets (shared PHP host, FTP/SFTP-only, no
SSH/Composer, **PHP 7.4** — see the "avoid PHP 8+ syntax" note below).
Requires PHP with the `pdo_mysql` extension (standard on virtually every
shared host).

## Deploy

1. **Database**: in phpMyAdmin, create a database (or reuse the existing one
   — the `tg_` table prefix avoids collisions with WordPress's `wp_` tables
   if you share a database). Open the SQL tab and run `schema.sql`.
2. **Config**: copy `config.example.php` to `config.php`, fill in the DB
   credentials and the `mail.from_email` you want OTP emails sent from.
   Leave `app_env` as `production` and `otp.dev_expose_code` as `false`.
   `config.php` is gitignored — it never gets committed, only uploaded.
3. **Upload**: FTP the _contents_ of this directory (`api/`, `lib/`,
   `config.php`) to wherever the frontend is served from — **not**
   `schema.sql`, which has already done its job in phpMyAdmin; unlike
   `config.php` it's a plain static file, so leaving it in a web-servable
   directory would let anyone fetch it and read the full table/column
   layout. Upload so that `api/auth/request-otp.php` resolves at
   `<frontend-origin>/api/...`
   — same-origin as the frontend is what lets the session cookie work
   without CORS. Don't nest it under a `server/` or `teams-api/` subfolder
   on the host; the folder name here is a repo-organization detail, not
   part of the URL scheme. `config.php` must not be web-readable as plain
   PHP source — on Apache/PHP hosts this is already the case since the
   server executes `.php` files rather than serving them raw, but keep it
   out of any directory with `.php` handling disabled.
4. **Smoke test**: `curl -i https://your-domain.tld/api/auth/me.php` should
   return `401 {"error":"unauthorized"}`, not a PHP error page — that
   confirms the DB connection and `config.php` are wired correctly.

## Local development

No SSH on the real host, so develop against a local PHP dev server instead.
The prod host runs **PHP 7.4.33** (confirmed via a diagnostic script) — no
`match`, `?->`, enums, constructor property promotion, union/intersection
types, named arguments, or `str_contains`/`str_starts_with`/`str_ends_with`.
Since this dev machine has no local PHP/MySQL install, prefer a container
pinned to `php:7.4-cli` over whatever a package manager would give you, so
you don't accidentally write 8.0+-only code that fatals on the real host:

```sh
# set app_env to 'development' in a local config.php (no HTTPS locally,
# so the session cookie can't require Secure) and consider setting
# otp.dev_expose_code to true so you don't need working local mail.
# run from inside server/ so it's the docroot:
php -S localhost:8080
curl -i -c cookies.txt -X POST localhost:8080/api/auth/request-otp.php \
  -H 'Content-Type: application/json' -d '{"email":"you@example.org"}'
# copy the dev_code from the JSON response (or read tg_otp_codes in phpMyAdmin)
curl -i -c cookies.txt -X POST localhost:8080/api/auth/verify-otp.php \
  -H 'Content-Type: application/json' -d '{"email":"you@example.org","code":"123456"}'
curl -i -b cookies.txt localhost:8080/api/auth/me.php
```

Never set `dev_expose_code` to `true` in the `config.php` you actually
upload — it bypasses the point of the OTP.

`mail.super_admin_email` (set in `config.php`) receives a notification
whenever a genuinely new account is created — production only (guarded by
`app_env`), so local/dev signups don't trigger it. See
`notify_super_admin_new_account()` in `lib/mail.php`.

## Endpoints

| Method | Path                                       | Auth   | Body / query                          |
| ------ | ------------------------------------------ | ------ | ------------------------------------- |
| POST   | `/api/auth/request-otp.php`                | –      | `{email}`                             |
| POST   | `/api/auth/verify-otp.php`                 | –      | `{email, code}` → sets session cookie |
| POST   | `/api/auth/logout.php`                     | cookie | –                                     |
| GET    | `/api/auth/me.php`                         | cookie | –                                     |
| GET    | `/api/lists/index.php`                     | cookie | –                                     |
| POST   | `/api/lists/index.php`                     | cookie | `{name}`                              |
| GET    | `/api/lists/item.php?id=`                  | cookie | –                                     |
| PUT    | `/api/lists/item.php?id=`                  | cookie | `{name?, isPublic?}`                  |
| DELETE | `/api/lists/item.php?id=`                  | cookie | –                                     |
| POST   | `/api/lists/players.php`                   | cookie | `{listId, name, skill, gender}`       |
| DELETE | `/api/lists/players.php?listId=&playerId=` | cookie | –                                     |
| POST   | `/api/lists/attendance.php`                | cookie | `{listId, playerIds: [...]}`          |
| GET    | `/api/lists/attendance.php?listId=`        | cookie | –                                     |
| GET    | `/api/players/index.php?search=`           | cookie | –                                     |
| PUT    | `/api/players/item.php?id=`                | cookie | `{name?, skill?, gender?}`            |

All `lists`/`players` endpoints are scoped to the authenticated user — one
person's data is never reachable with another person's session cookie.
The exception is an `admin` user: on top of their own lists, they can also
see every other account's `is_public = 1` list in `GET /api/lists/index.php`
and fully manage its roster (`players.php`, `attendance.php`) — but renaming,
deleting, or toggling `isPublic` on someone else's list stays owner-only,
enforced by `PUT`/`DELETE /api/lists/item.php` regardless of role. Players an
admin attaches to someone else's public list are created under that list's
owner, never under the admin's own account.

List mutation endpoints (`POST`/`PUT /api/lists/*.php`) now accept an
optional `isPublic` boolean alongside `name`. There's no UI yet to promote an
account to admin — do it locally/on a host with DB access via:

```sql
UPDATE tg_users SET role = 'admin' WHERE email = 'you@example.org';
```

## Known limitation

`request-otp.php` only throttles per targeted e-mail (one request per
`otp.min_seconds_between_requests`, capped at `otp.max_requests_per_hour`).
There's no per-IP limit, so a single source can still mail-bomb many
different addresses with unsolicited OTP codes by varying the target
e-mail. Fixing this needs a schema change (an IP column/table to throttle
against) — deliberately deferred rather than bundled into this pass.
