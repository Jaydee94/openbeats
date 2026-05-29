package api

import (
	"context"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

// Routes builds the chi router with all middleware and endpoints.
func (s *Server) Routes() http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.Recoverer)
	r.Use(s.requestLogger)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   s.CORSOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Content-Length", "Content-Range", "Accept-Ranges"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// Liveness probe — no auth.
	r.Get("/healthz", s.handleHealth)

	r.Route("/api", func(r chi.Router) {
		// Public auth endpoint.
		r.Post("/auth/login", s.handleLogin)

		// Everything below requires a valid JWT.
		r.Group(func(r chi.Router) {
			r.Use(s.Middleware.RequireAuth)

			// Admin-only.
			r.With(s.Middleware.RequireAdmin).Post("/auth/register", s.handleRegister)

			// Tracks.
			r.Get("/tracks", s.handleListTracks)
			r.Post("/tracks", s.handleUploadTrack)
			r.Get("/tracks/{id}", s.handleGetTrack)
			r.Delete("/tracks/{id}", s.handleDeleteTrack)
			r.Get("/tracks/{id}/stream", s.handleStreamTrack)
			r.Get("/tracks/{id}/cover", s.handleTrackCover)

			// Playlists.
			r.Get("/playlists", s.handleListPlaylists)
			r.Post("/playlists", s.handleCreatePlaylist)
			r.Get("/playlists/{id}", s.handleGetPlaylist)
			r.Post("/playlists/{id}/tracks", s.handleAddPlaylistTrack)
		})
	})

	return r
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()
	if err := s.Pool.Ping(ctx); err != nil {
		writeError(w, http.StatusServiceUnavailable, "database unavailable")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// requestLogger logs each request with structured slog output.
func (s *Server) requestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
		next.ServeHTTP(ww, r)
		s.Logger.Info("request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", ww.Status(),
			"bytes", ww.BytesWritten(),
			"duration_ms", time.Since(start).Milliseconds(),
		)
	})
}
