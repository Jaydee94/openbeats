package api

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"

	"github.com/jaydee94/openbeats/internal/auth"
	"github.com/jaydee94/openbeats/internal/db"
)

type createPlaylistRequest struct {
	Name string `json:"name"`
}

type addTrackRequest struct {
	TrackID string `json:"track_id"`
}

func (s *Server) handleListPlaylists(w http.ResponseWriter, r *http.Request) {
	claims := auth.ClaimsFromContext(r.Context())
	ownerID, _ := db.ParseUUID(claims.UserID)

	playlists, err := s.Queries.ListPlaylistsByOwner(r.Context(), ownerID)
	if err != nil {
		s.Logger.Error("list playlists", "error", err)
		writeError(w, http.StatusInternalServerError, "could not list playlists")
		return
	}
	out := make([]playlistDTO, 0, len(playlists))
	for _, p := range playlists {
		out = append(out, toPlaylistDTO(p))
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *Server) handleCreatePlaylist(w http.ResponseWriter, r *http.Request) {
	var req createPlaylistRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	claims := auth.ClaimsFromContext(r.Context())
	ownerID, _ := db.ParseUUID(claims.UserID)

	playlist, err := s.Queries.CreatePlaylist(r.Context(), db.CreatePlaylistParams{
		Name:    req.Name,
		OwnerID: ownerID,
	})
	if err != nil {
		s.Logger.Error("create playlist", "error", err)
		writeError(w, http.StatusInternalServerError, "could not create playlist")
		return
	}
	writeJSON(w, http.StatusCreated, toPlaylistDTO(playlist))
}

func (s *Server) handleGetPlaylist(w http.ResponseWriter, r *http.Request) {
	playlist, ok := s.loadOwnedPlaylist(w, r)
	if !ok {
		return
	}

	rows, err := s.Queries.ListPlaylistTracks(r.Context(), playlist.ID)
	if err != nil {
		s.Logger.Error("list playlist tracks", "error", err)
		writeError(w, http.StatusInternalServerError, "could not load playlist tracks")
		return
	}

	tracks := make([]map[string]any, 0, len(rows))
	for _, row := range rows {
		tracks = append(tracks, map[string]any{
			"id":               db.UUIDString(row.ID),
			"title":            row.Title,
			"artist":           row.Artist,
			"album":            row.Album,
			"duration_seconds": row.DurationSeconds,
			"mime_type":        row.MimeType,
			"has_cover":        row.CoverPath.Valid && row.CoverPath.String != "",
			"position":         row.Position,
		})
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"playlist": toPlaylistDTO(playlist),
		"tracks":   tracks,
	})
}

func (s *Server) handleAddPlaylistTrack(w http.ResponseWriter, r *http.Request) {
	playlist, ok := s.loadOwnedPlaylist(w, r)
	if !ok {
		return
	}

	var req addTrackRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	trackID, err := db.ParseUUID(req.TrackID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid track_id")
		return
	}
	// Ensure the track exists.
	if _, err := s.Queries.GetTrack(r.Context(), trackID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeError(w, http.StatusNotFound, "track not found")
		} else {
			writeError(w, http.StatusInternalServerError, "could not verify track")
		}
		return
	}

	pos, err := s.Queries.NextPlaylistPosition(r.Context(), playlist.ID)
	if err != nil {
		s.Logger.Error("next position", "error", err)
		writeError(w, http.StatusInternalServerError, "could not add track")
		return
	}

	entry, err := s.Queries.AddPlaylistTrack(r.Context(), db.AddPlaylistTrackParams{
		PlaylistID: playlist.ID,
		TrackID:    trackID,
		Position:   pos,
	})
	if err != nil {
		s.Logger.Error("add playlist track", "error", err)
		writeError(w, http.StatusInternalServerError, "could not add track")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"playlist_id": db.UUIDString(entry.PlaylistID),
		"track_id":    db.UUIDString(entry.TrackID),
		"position":    entry.Position,
	})
}

// loadOwnedPlaylist fetches the {id} playlist and verifies the caller owns it
// (admins may access any playlist).
func (s *Server) loadOwnedPlaylist(w http.ResponseWriter, r *http.Request) (db.Playlist, bool) {
	id, err := db.ParseUUID(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid playlist id")
		return db.Playlist{}, false
	}
	playlist, err := s.Queries.GetPlaylist(r.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeError(w, http.StatusNotFound, "playlist not found")
		} else {
			writeError(w, http.StatusInternalServerError, "could not load playlist")
		}
		return db.Playlist{}, false
	}
	claims := auth.ClaimsFromContext(r.Context())
	if claims.Role != "admin" && db.UUIDString(playlist.OwnerID) != claims.UserID {
		writeError(w, http.StatusForbidden, "not your playlist")
		return db.Playlist{}, false
	}
	return playlist, true
}
