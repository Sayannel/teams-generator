# Running the project locally

## Frontend

```sh
npm run dev
```

Serves at http://localhost:5173/teams-generator/.

## Backend

The backend runs in two **pre-existing** Docker containers — reuse them,
never `docker run` a new one:

```sh
docker start tg-mysql tg-php
```

- `tg-mysql` — `mysql:8.0`, host port `3307` → container `3306`.
- `tg-php` — `php:7.4-cli-alpine`, **`network_mode: host`**, bind-mounts
  `server/` to `/srv/app`. Its entrypoint **recompiles the `pdo_mysql`
  extension on every start** (`docker-php-ext-install pdo_mysql`) before
  running `php -S 127.0.0.1:8080 -t /srv/app` — this takes ~15-20s, during
  which the port isn't listening yet. Don't conclude the container is
  broken from an early connection-refused; poll instead:
  ```sh
  until curl -s -o /dev/null http://127.0.0.1:8080/; do sleep 2; done
  ```

Because `tg-php` uses host networking, `server/config.php`'s `db.host`
must be `127.0.0.1` (not a bridge-network gateway IP like `172.17.0.1`).

## Smoke test

```sh
curl -i http://127.0.0.1:8080/api/auth/me.php
```

Expect `401 {"error":"unauthorized"}` — a `500` with `could not find
driver` means `pdo_mysql` didn't finish compiling yet or `tg-mysql` isn't
up; a PHP error page means `config.php` is missing/misconfigured.

## Pre-commit hook

A Husky pre-commit hook (`.husky/pre-commit`) runs `lint-staged`, which
runs `prettier --write` on staged JS/JSX/TS/TSX/JSON/CSS/MD files before
each commit. Never bypass it with `git commit --no-verify` — if it fails
or reformats files, fix the underlying issue (or re-stage the
reformatted files) and commit again.
