# Development Guide

## Architecture

```
Browser (React SPA)
    │ HTTPS
    ▼
web (nginx)  ── serves SPA, proxies /api + /healthz
    │
    ▼
api (Go / chi)
    ├── auth      JWT / bcrypt
    ├── tracks    upload, stream (HTTP Range), cover art
    └── playlists
    │               │
    ▼               ▼
PostgreSQL      Persistent Volume (/data)
(pgx + sqlc)    audio files + cover art
```

Audio and cover files are stored on a plain filesystem volume — never in Postgres. Streaming uses `http.ServeContent`, so `Range` requests and seeking work out of the box.

## Project layout

```
cmd/openbeats/          Entrypoint: config, migrations, seed, graceful shutdown
internal/api/           HTTP handlers, router, middleware
internal/auth/          JWT manager, bcrypt, RequireAuth / RequireAdmin middleware
internal/storage/       Persistent-volume access (audio + covers)
internal/metadata/      ID3 tag + embedded cover extraction
internal/db/            pgx pool, embedded migrations, sqlc-generated queries
internal/config/        Env-based configuration
migrations/             golang-migrate SQL (embedded into the binary)
web/                    React + TypeScript frontend (Vite)
deploy/helm/openbeats/  Helm chart
```

## Running locally (without Docker)

Requires a PostgreSQL instance reachable via `DATABASE_URL`.

```bash
# Backend — migrations are applied automatically on start
make run

# Frontend dev server — proxies /api to localhost:8080
cd web && npm install && npm run dev
```

## Makefile targets

| Target          | Description                                      |
|-----------------|--------------------------------------------------|
| `make dev`      | Build images and start the full stack (daemon)   |
| `make stop`     | Stop the stack (volumes preserved)               |
| `make build`    | Build the API binary                             |
| `make run`      | Build and run the API locally                    |
| `make test`     | Run Go tests                                     |
| `make migrate`  | Apply DB migrations manually                     |
| `make sqlc`     | Regenerate sqlc database code                    |
| `make tidy`     | Tidy Go modules                                  |

## Notes

- **Track duration:** the ID3 library does not reliably expose stream duration, so `duration_seconds` is stored as `0` on upload.
- **Token storage:** the frontend keeps the JWT in memory (Zustand), not `localStorage`, to reduce XSS exposure. A full page reload ends the session.
