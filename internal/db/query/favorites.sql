-- name: ListFavoriteTracks :many
SELECT t.* FROM favorites f
JOIN tracks t ON t.id = f.track_id
WHERE f.user_id = $1
ORDER BY f.created_at DESC;

-- name: AddFavorite :exec
INSERT INTO favorites (user_id, track_id)
VALUES ($1, $2)
ON CONFLICT (user_id, track_id) DO NOTHING;

-- name: RemoveFavorite :exec
DELETE FROM favorites WHERE user_id = $1 AND track_id = $2;
