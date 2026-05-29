// Package api wires together the HTTP handlers, routing and middleware.
package api

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/jaydee94/openbeats/internal/auth"
	"github.com/jaydee94/openbeats/internal/db"
	"github.com/jaydee94/openbeats/internal/storage"
)

// Server holds the shared dependencies for all HTTP handlers.
type Server struct {
	Pool        *pgxpool.Pool
	Queries     *db.Queries
	Storage     *storage.Storage
	Auth        *auth.Manager
	Middleware  *auth.Middleware
	Logger      *slog.Logger
	CORSOrigins []string
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if v != nil {
		_ = json.NewEncoder(w).Encode(v)
	}
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// --- DTOs (keep pgtype out of the public JSON surface) ---

type trackDTO struct {
	ID              string    `json:"id"`
	Title           string    `json:"title"`
	Artist          string    `json:"artist"`
	Album           string    `json:"album"`
	DurationSeconds int32     `json:"duration_seconds"`
	MimeType        string    `json:"mime_type"`
	HasCover        bool      `json:"has_cover"`
	UploadedBy      string    `json:"uploaded_by,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
}

func toTrackDTO(t db.Track) trackDTO {
	return trackDTO{
		ID:              db.UUIDString(t.ID),
		Title:           t.Title,
		Artist:          t.Artist,
		Album:           t.Album,
		DurationSeconds: t.DurationSeconds,
		MimeType:        t.MimeType,
		HasCover:        t.CoverPath.Valid && t.CoverPath.String != "",
		UploadedBy:      db.UUIDString(t.UploadedBy),
		CreatedAt:       t.CreatedAt.Time,
	}
}

type playlistDTO struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	OwnerID   string    `json:"owner_id"`
	CreatedAt time.Time `json:"created_at"`
}

func toPlaylistDTO(p db.Playlist) playlistDTO {
	return playlistDTO{
		ID:        db.UUIDString(p.ID),
		Name:      p.Name,
		OwnerID:   db.UUIDString(p.OwnerID),
		CreatedAt: p.CreatedAt.Time,
	}
}
