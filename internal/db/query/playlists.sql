-- name: CreatePlaylist :one
INSERT INTO playlists (name, owner_id)
VALUES ($1, $2)
RETURNING *;

-- name: GetPlaylist :one
SELECT * FROM playlists WHERE id = $1;

-- name: ListPlaylistsByOwner :many
SELECT * FROM playlists WHERE owner_id = $1 ORDER BY created_at DESC;

-- name: AddPlaylistTrack :one
INSERT INTO playlist_tracks (playlist_id, track_id, position)
VALUES ($1, $2, $3)
ON CONFLICT (playlist_id, track_id) DO UPDATE SET position = EXCLUDED.position
RETURNING *;

-- name: NextPlaylistPosition :one
SELECT COALESCE(MAX(position), 0) + 1 AS next_position
FROM playlist_tracks
WHERE playlist_id = $1;

-- name: ListPlaylistTracks :many
SELECT t.*, pt.position
FROM playlist_tracks pt
JOIN tracks t ON t.id = pt.track_id
WHERE pt.playlist_id = $1
ORDER BY pt.position;
