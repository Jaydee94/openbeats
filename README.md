<p align="center">
  <img src="docs/assets/openbeats-banner.svg" alt="OpenBeats" width="440" />
</p>

<p align="center"><em>Self-hosted music streaming — your library, your server.</em></p>

OpenBeats is a **self-hosted music streaming platform**. Upload your audio
library, let OpenBeats read the ID3 tags and cover art, and stream it to a
browser with full seek (HTTP Range) support — all running on your own
infrastructure. No third-party services, no cloud object storage: audio lives
on a plain persistent volume and metadata in PostgreSQL.

- **Backend:** Go 1.23, [chi](https://github.com/go-chi/chi) router, PostgreSQL
  via [pgx](https://github.com/jackc/pgx) + [sqlc](https://sqlc.dev),
  [golang-migrate](https://github.com/golang-migrate/migrate), JWT auth,
  bcrypt, ID3 extraction via [dhowden/tag](https://github.com/dhowden/tag).
- **Frontend:** React + TypeScript, Vite, TanStack Query, Zustand, React Router.
- **Storage:** Audio files on a filesystem persistent volume (no S3).
- **Deployment:** Docker Compose for local dev, Helm chart for Kubernetes.

---

## Architecture

```
                         ┌─────────────────────────────┐
                         │           Browser            │
                         │  React SPA (Vite build)      │
                         └───────────────┬──────────────┘
                                         │ HTTPS
                                         ▼
                         ┌─────────────────────────────┐
                         │   web (nginx)                │
                         │   serves SPA + proxies /api  │
                         └───────────────┬──────────────┘
                                         │ /api, /healthz
                                         ▼
            ┌──────────────────────────────────────────────────┐
            │   api (Go / chi)                                   │
            │   ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
            │   │  auth    │ │ tracks   │ │ playlists        │  │
            │   │ JWT/bcr. │ │ upload/  │ │                  │  │
            │   │          │ │ stream   │ │                  │  │
            │   └──────────┘ └────┬─────┘ └──────────────────┘  │
            └─────────────────────┼──────────────┬──────────────┘
                                  │              │
                  metadata + users│              │ audio + cover files
                                  ▼              ▼
                       ┌──────────────────┐ ┌───────────────────────┐
                       │   PostgreSQL     │ │  Persistent Volume    │
                       │  (pgx + sqlc)    │ │  /data/tracks /covers  │
                       └──────────────────┘ └───────────────────────┘
```

Binary audio/cover data is **never** stored in Postgres — only relative file
paths are. Streaming uses `http.ServeContent`, so the server honours `Range`
requests (`Accept-Ranges: bytes`, `206 Partial Content`) and seeking works out
of the box.

---

## Quickstart (Docker Compose)

```bash
git clone https://github.com/jaydee94/openbeats.git
cd openbeats
cp .env.example .env          # adjust JWT_SECRET / admin credentials
docker compose up --build
```

Services:

| Service  | URL                     | Notes                                  |
|----------|-------------------------|----------------------------------------|
| web      | http://localhost:3000   | UI; nginx proxies `/api` to the API    |
| api      | http://localhost:8080   | Go API (direct access for testing)     |
| postgres | localhost:5432          | `openbeats` / `openbeats`              |

On first start an **admin** account is created from `ADMIN_USERNAME` /
`ADMIN_PASSWORD` (defaults `admin` / `changeme`). Log in, then create more users
through the admin-only registration endpoint.

### Try the API directly

```bash
# Login
TOKEN=$(curl -s localhost:8080/api/auth/login \
  -d '{"username":"admin","password":"changeme"}' | jq -r .token)

# Upload a track (ID3 tags + cover are extracted automatically)
curl localhost:8080/api/tracks -H "Authorization: Bearer $TOKEN" \
  -F "file=@song.mp3;type=audio/mpeg"

# List, then stream with a Range request (returns 206 Partial Content)
curl localhost:8080/api/tracks -H "Authorization: Bearer $TOKEN"
curl -D - -o /dev/null -H "Range: bytes=0-1023" \
  "localhost:8080/api/tracks/<id>/stream?token=$TOKEN"
```

---

## Local development (without Docker)

```bash
# 1. A PostgreSQL instance reachable via DATABASE_URL
# 2. Backend (auto-applies migrations on start)
make run

# 3. Frontend dev server (proxies /api to localhost:8080)
cd web && npm install && npm run dev
```

---

## API endpoints

| Method | Path                          | Auth        | Description                                |
|--------|-------------------------------|-------------|--------------------------------------------|
| POST   | `/api/auth/login`             | public      | Returns `{ token, user }`                  |
| POST   | `/api/auth/register`          | admin       | Create a user                              |
| GET    | `/api/tracks`                 | user        | List tracks; filter `?artist= ?album= ?q=` |
| POST   | `/api/tracks`                 | user        | Multipart upload (extracts ID3 + cover)    |
| GET    | `/api/tracks/{id}`            | user        | Track metadata                             |
| GET    | `/api/tracks/{id}/stream`     | user        | **Range-capable** audio stream             |
| GET    | `/api/tracks/{id}/cover`      | user        | Cover image, or 404                        |
| DELETE | `/api/tracks/{id}`            | owner/admin | Delete a track + its files                 |
| GET    | `/api/playlists`              | user        | List the caller's playlists                |
| POST   | `/api/playlists`              | user        | Create a playlist                          |
| GET    | `/api/playlists/{id}`         | owner/admin | Playlist with ordered tracks               |
| POST   | `/api/playlists/{id}/tracks`  | owner/admin | Add a track (`{ "track_id": "…" }`)        |
| GET    | `/healthz`                    | public      | Liveness (DB ping)                         |

Media elements (`<audio>`, `<img>`) cannot send an `Authorization` header, so
the stream and cover endpoints also accept the JWT as a `?token=` query
parameter.

---

## Environment variables

| Variable         | Default                  | Description                                             |
|------------------|--------------------------|---------------------------------------------------------|
| `PORT`           | `8080`                   | HTTP listen port                                        |
| `DATABASE_URL`   | `postgres://…/openbeats` | PostgreSQL connection string (pgx/libpq format)         |
| `JWT_SECRET`     | _(insecure default)_     | HS256 signing secret — **set in production**            |
| `JWT_TTL`        | `24h`                    | Access-token lifetime                                   |
| `STORAGE_PATH`   | `/data`                  | Persistent volume path for audio + covers               |
| `ADMIN_USERNAME` | `admin`                  | Bootstrap admin (created when the users table is empty) |
| `ADMIN_PASSWORD` | `changeme`               | Bootstrap admin password                                |
| `CORS_ORIGINS`   | `*`                      | Comma-separated allowed origins                         |

---

## Kubernetes (Helm)

```bash
helm install openbeats deploy/helm/openbeats \
  --set ingress.enabled=true \
  --set ingress.host=music.example.com \
  --set secrets.jwtSecret=$(openssl rand -hex 32) \
  --set secrets.adminPassword=$(openssl rand -hex 12)
```

The chart deploys: an **api** Deployment, a **web** Deployment (nginx serving
the SPA and proxying `/api`), a **PVC** for audio storage, a `Secret`
(JWT + admin + DB credentials), `ConfigMap`s, and a cert-manager-ready TLS
`Ingress`. Liveness/readiness probes target `/healthz`.

**PostgreSQL choice:** the chart bundles a simple in-chart **StatefulSet**
rather than depending on the Bitnami PostgreSQL chart. This keeps the chart
self-contained and installable offline (no `helm dependency update` / network
fetch). For production-grade databases, disable it and point at a managed
instance:

```bash
helm install openbeats deploy/helm/openbeats \
  --set postgresql.enabled=false \
  --set externalDatabase.url="postgres://user:pass@db-host:5432/openbeats?sslmode=require"
```

> If you leave `secrets.jwtSecret` empty, a random one is generated on first
> install — but it is regenerated on `helm upgrade` (invalidating tokens).
> Pin it explicitly for stable deployments.

See `deploy/helm/openbeats/values.yaml` for all tunables (images, replicas,
resources, probe timings, storage sizes, ingress/TLS).

---

## Authentication & token handling

JWTs are signed with HS256 and carry the user id, username and role. The
frontend keeps the token **in memory** (Zustand store), not in `localStorage`,
to reduce the XSS token-theft surface. The trade-off is that a full page reload
ends the session. For persistent sessions in production, issue the token as an
**httpOnly, Secure, SameSite** cookie from the backend instead.

`/api/auth/register` requires the `admin` role; all `/api/*` routes except
`login` require a valid token.

---

## Makefile targets

| Target              | Description                                         |
|---------------------|-----------------------------------------------------|
| `make build`        | Build the API server binary                         |
| `make run`          | Build and run the API server                        |
| `make test`         | Run Go tests                                         |
| `make migrate`      | Apply migrations (the server also does this itself) |
| `make sqlc`         | Regenerate the sqlc database code                   |
| `make docker-build` | Build the api and web images                        |
| `make dev`          | `docker compose up --build`                         |

---

## Project layout

```
cmd/openbeats/         Server entrypoint (config, migrations, seed, graceful shutdown)
internal/api/          HTTP handlers, router, middleware wiring
internal/auth/         JWT manager, bcrypt, RequireAuth/RequireAdmin middleware
internal/storage/      Persistent-volume access (audio + covers)
internal/metadata/     ID3 tag + embedded cover extraction
internal/db/           pgx pool, embedded migrations, sqlc-generated queries
internal/config/       Env-based configuration
migrations/            golang-migrate SQL (embedded into the binary)
web/                   React + TypeScript frontend (Vite)
deploy/helm/openbeats/ Helm chart
```

> **Note on track duration:** the tag library does not reliably expose stream
> duration, so `duration_seconds` is stored as `0` on upload unless a future
> decoder fills it in. Everything else (title/artist/album/cover) is extracted.

---

## License

[MIT](./LICENSE)
