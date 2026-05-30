# Configuration

All configuration is via environment variables. Copy `.env.example` to `.env` and adjust before running.

| Variable         | Default                          | Description                                              |
|------------------|----------------------------------|----------------------------------------------------------|
| `PORT`           | `8080`                           | HTTP listen port inside the container                    |
| `DATABASE_URL`   | `postgres://…/openbeats`         | PostgreSQL connection string (pgx/libpq format)          |
| `JWT_SECRET`     | `dev-secret-change-me`           | HS256 signing secret — **required in production**        |
| `JWT_TTL`        | `24h`                            | Access-token lifetime                                    |
| `STORAGE_PATH`   | `/data`                          | Filesystem path for audio files and cover art            |
| `ADMIN_USERNAME` | `admin`                          | Bootstrap admin username (created when users table is empty) |
| `ADMIN_PASSWORD` | `admin`                          | Bootstrap admin password — **change in production**      |
| `CORS_ORIGINS`   | `*`                              | Comma-separated allowed origins                          |

## Production checklist

- Set `JWT_SECRET` to a random value: `openssl rand -hex 32`
- Set `ADMIN_PASSWORD` to a strong password
- Restrict `CORS_ORIGINS` to your domain
- Use a managed PostgreSQL instance or a backed-up StatefulSet
