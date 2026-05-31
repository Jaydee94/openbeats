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

type favoriteRequest struct {
	TrackID string `json:"track_id"`
}

func (s *Server) handleListFavorites(w http.ResponseWriter, r *http.Request) {
	claims := auth.ClaimsFromContext(r.Context())
	userID, _ := db.ParseUUID(claims.UserID)

	tracks, err := s.Queries.ListFavoriteTracks(r.Context(), userID)
	if err != nil {
		s.Logger.Error("list favorites", "error", err)
		writeError(w, http.StatusInternalServerError, "could not list favorites")
		return
	}
	out := make([]trackDTO, 0, len(tracks))
	for _, t := range tracks {
		out = append(out, toTrackDTO(t))
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *Server) handleAddFavorite(w http.ResponseWriter, r *http.Request) {
	var req favoriteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	trackID, err := db.ParseUUID(req.TrackID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid track_id")
		return
	}
	// Ensure the track exists before favouriting it.
	if _, err := s.Queries.GetTrack(r.Context(), trackID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeError(w, http.StatusNotFound, "track not found")
		} else {
			writeError(w, http.StatusInternalServerError, "could not verify track")
		}
		return
	}

	claims := auth.ClaimsFromContext(r.Context())
	userID, _ := db.ParseUUID(claims.UserID)

	if err := s.Queries.AddFavorite(r.Context(), db.AddFavoriteParams{
		UserID:  userID,
		TrackID: trackID,
	}); err != nil {
		s.Logger.Error("add favorite", "error", err)
		writeError(w, http.StatusInternalServerError, "could not add favorite")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"track_id": req.TrackID})
}

func (s *Server) handleRemoveFavorite(w http.ResponseWriter, r *http.Request) {
	trackID, err := db.ParseUUID(chi.URLParam(r, "trackId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid track id")
		return
	}

	claims := auth.ClaimsFromContext(r.Context())
	userID, _ := db.ParseUUID(claims.UserID)

	if err := s.Queries.RemoveFavorite(r.Context(), db.RemoveFavoriteParams{
		UserID:  userID,
		TrackID: trackID,
	}); err != nil {
		s.Logger.Error("remove favorite", "error", err)
		writeError(w, http.StatusInternalServerError, "could not remove favorite")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
