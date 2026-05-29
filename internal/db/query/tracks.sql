-- name: CreateTrack :one
INSERT INTO tracks (title, artist, album, duration_seconds, file_path, mime_type, cover_path, uploaded_by)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: GetTrack :one
SELECT * FROM tracks WHERE id = $1;

-- name: ListTracks :many
SELECT * FROM tracks
WHERE (sqlc.narg('artist')::text IS NULL OR artist ILIKE '%' || sqlc.narg('artist')::text || '%')
  AND (sqlc.narg('album')::text IS NULL OR album ILIKE '%' || sqlc.narg('album')::text || '%')
  AND (
        sqlc.narg('q')::text IS NULL
        OR title ILIKE '%' || sqlc.narg('q')::text || '%'
        OR artist ILIKE '%' || sqlc.narg('q')::text || '%'
        OR album ILIKE '%' || sqlc.narg('q')::text || '%'
      )
ORDER BY created_at DESC;

-- name: DeleteTrack :exec
DELETE FROM tracks WHERE id = $1;
