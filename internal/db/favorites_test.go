package db_test

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"os"
	"testing"

	"github.com/jaydee94/openbeats/internal/db"
)

// favoritesTestQueries spins up a real connection against $DATABASE_URL.
// The test is skipped when no database is configured, so it only runs in CI
// (or locally against the dev stack) per the integration-test preference.
func favoritesTestQueries(t *testing.T) (*db.Queries, context.Context) {
	t.Helper()
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		t.Skip("DATABASE_URL not set; skipping favorites DB integration test")
	}
	if err := db.RunMigrations(url); err != nil {
		t.Fatalf("migrations: %v", err)
	}
	ctx := context.Background()
	pool, err := db.NewPool(ctx, url)
	if err != nil {
		t.Fatalf("pool: %v", err)
	}
	t.Cleanup(pool.Close)
	return db.New(pool), ctx
}

func TestFavoritesAddListRemove(t *testing.T) {
	q, ctx := favoritesTestQueries(t)

	user, err := q.CreateUser(ctx, db.CreateUserParams{
		Username:     "fav-tester-" + randomSuffix(),
		PasswordHash: "x",
		Role:         "user",
	})
	if err != nil {
		t.Fatalf("create user: %v", err)
	}
	track, err := q.CreateTrack(ctx, db.CreateTrackParams{
		Title:    "Fav Song",
		Artist:   "Tester",
		Album:    "Album",
		FilePath: "tracks/fav-" + randomSuffix() + ".mp3",
		MimeType: "audio/mpeg",
	})
	if err != nil {
		t.Fatalf("create track: %v", err)
	}

	add := db.AddFavoriteParams{UserID: user.ID, TrackID: track.ID}

	if err := q.AddFavorite(ctx, add); err != nil {
		t.Fatalf("add favorite: %v", err)
	}
	// Idempotent: adding the same favourite twice must not error.
	if err := q.AddFavorite(ctx, add); err != nil {
		t.Fatalf("add favorite (idempotent): %v", err)
	}

	tracks, err := q.ListFavoriteTracks(ctx, user.ID)
	if err != nil {
		t.Fatalf("list favorites: %v", err)
	}
	if len(tracks) != 1 || db.UUIDString(tracks[0].ID) != db.UUIDString(track.ID) {
		t.Fatalf("expected exactly the favourited track, got %d rows", len(tracks))
	}

	if err := q.RemoveFavorite(ctx, db.RemoveFavoriteParams{UserID: user.ID, TrackID: track.ID}); err != nil {
		t.Fatalf("remove favorite: %v", err)
	}
	tracks, err = q.ListFavoriteTracks(ctx, user.ID)
	if err != nil {
		t.Fatalf("list favorites after remove: %v", err)
	}
	if len(tracks) != 0 {
		t.Fatalf("expected no favourites after removal, got %d", len(tracks))
	}
}

func randomSuffix() string {
	b := make([]byte, 8)
	if _, err := rand.Read(b); err != nil {
		return "fixed"
	}
	return hex.EncodeToString(b)
}
