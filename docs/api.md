# API Reference

Base URL: `http://localhost:8081` (dev) or your configured host.

All endpoints except `POST /api/auth/login` require a `Authorization: Bearer <token>` header.  
Stream and cover endpoints also accept `?token=<jwt>` as a query parameter (required for `<audio>` / `<img>` elements).

## Authentication

| Method | Path                 | Auth   | Description                  |
|--------|----------------------|--------|------------------------------|
| POST   | `/api/auth/login`    | public | Returns `{ token, user }`    |
| POST   | `/api/auth/register` | admin  | Create a user                |

### Login example

```bash
TOKEN=$(curl -s localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | jq -r .token)
```

## Tracks

| Method | Path                       | Auth        | Description                                 |
|--------|----------------------------|-------------|---------------------------------------------|
| GET    | `/api/tracks`              | user        | List tracks; filter `?artist=` `?album=` `?q=` |
| POST   | `/api/tracks`              | user        | Multipart upload — extracts ID3 tags + cover |
| GET    | `/api/tracks/{id}`         | user        | Track metadata                              |
| GET    | `/api/tracks/{id}/stream`  | user        | Range-capable audio stream (206)            |
| GET    | `/api/tracks/{id}/cover`   | user        | Cover image or 404                          |
| DELETE | `/api/tracks/{id}`         | owner/admin | Delete track and its files                  |

### Upload example

```bash
curl localhost:8081/api/tracks \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@song.mp3;type=audio/mpeg"
```

### Stream with Range

```bash
curl -D - -o /dev/null \
  -H "Range: bytes=0-1023" \
  "localhost:8081/api/tracks/<id>/stream?token=$TOKEN"
# → 206 Partial Content
```

## Playlists

| Method | Path                           | Auth        | Description                         |
|--------|--------------------------------|-------------|-------------------------------------|
| GET    | `/api/playlists`               | user        | List the caller's playlists         |
| POST   | `/api/playlists`               | user        | Create a playlist                   |
| GET    | `/api/playlists/{id}`          | owner/admin | Playlist with ordered tracks        |
| POST   | `/api/playlists/{id}/tracks`   | owner/admin | Add a track `{ "track_id": "…" }`  |

## Health

| Method | Path      | Auth   | Description    |
|--------|-----------|--------|----------------|
| GET    | `/healthz` | public | DB ping liveness |
