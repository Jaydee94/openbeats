package api

import (
	"errors"
	"io"
	"mime"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/jaydee94/openbeats/internal/auth"
	"github.com/jaydee94/openbeats/internal/db"
	"github.com/jaydee94/openbeats/internal/metadata"
	"github.com/jaydee94/openbeats/internal/storage"
)

// maxUploadSize caps multipart uploads at 512 MiB.
const maxUploadSize = 512 << 20

func (s *Server) handleListTracks(w http.ResponseWriter, r *http.Request) {
	params := db.ListTracksParams{
		Artist: optionalText(r.URL.Query().Get("artist")),
		Album:  optionalText(r.URL.Query().Get("album")),
		Q:      optionalText(r.URL.Query().Get("q")),
	}
	tracks, err := s.Queries.ListTracks(r.Context(), params)
	if err != nil {
		s.Logger.Error("list tracks", "error", err)
		writeError(w, http.StatusInternalServerError, "could not list tracks")
		return
	}
	out := make([]trackDTO, 0, len(tracks))
	for _, t := range tracks {
		out = append(out, toTrackDTO(t))
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *Server) handleGetTrack(w http.ResponseWriter, r *http.Request) {
	track, ok := s.loadTrack(w, r)
	if !ok {
		return
	}
	writeJSON(w, http.StatusOK, toTrackDTO(track))
}

func (s *Server) handleUploadTrack(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "invalid or too large multipart upload")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "missing 'file' field")
		return
	}
	defer file.Close()

	// Extract tags/cover (best-effort), then rewind for storage.
	info, metaErr := metadata.Extract(file)
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		writeError(w, http.StatusInternalServerError, "could not process upload")
		return
	}
	if metaErr != nil {
		s.Logger.Warn("tag extraction failed; using fallbacks", "file", header.Filename, "error", metaErr)
	}

	fileID := uuid.NewString()
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext == "" {
		ext = ".mp3"
	}

	filePath, err := s.Storage.SaveReader(storage.TracksDir, fileID+ext, file)
	if err != nil {
		s.Logger.Error("save audio", "error", err)
		writeError(w, http.StatusInternalServerError, "could not store audio file")
		return
	}

	// Persist the embedded cover separately on the volume, if present.
	var coverPath *string
	if info.Cover != nil {
		coverName := fileID + "." + info.Cover.Ext
		cp, err := s.Storage.SaveBytes(storage.CoversDir, coverName, info.Cover.Data)
		if err != nil {
			s.Logger.Warn("save cover", "error", err)
		} else {
			coverPath = &cp
		}
	}

	title := info.Title
	if title == "" {
		title = strings.TrimSuffix(header.Filename, filepath.Ext(header.Filename))
	}
	mimeType := header.Header.Get("Content-Type")
	if mimeType == "" || mimeType == "application/octet-stream" {
		if byExt := mime.TypeByExtension(ext); byExt != "" {
			mimeType = byExt
		} else {
			mimeType = "application/octet-stream"
		}
	}

	claims := auth.ClaimsFromContext(r.Context())
	uploadedBy, _ := db.ParseUUID(claims.UserID)

	track, err := s.Queries.CreateTrack(r.Context(), db.CreateTrackParams{
		Title:           title,
		Artist:          info.Artist,
		Album:           info.Album,
		DurationSeconds: int32(info.DurationSeconds),
		FilePath:        filePath,
		MimeType:        mimeType,
		CoverPath:       db.PgTextPtr(coverPath),
		UploadedBy:      uploadedBy,
	})
	if err != nil {
		// Roll back the files we just wrote.
		_ = s.Storage.Delete(filePath)
		if coverPath != nil {
			_ = s.Storage.Delete(*coverPath)
		}
		s.Logger.Error("create track", "error", err)
		writeError(w, http.StatusInternalServerError, "could not save track metadata")
		return
	}

	writeJSON(w, http.StatusCreated, toTrackDTO(track))
}

func (s *Server) handleStreamTrack(w http.ResponseWriter, r *http.Request) {
	track, ok := s.loadTrack(w, r)
	if !ok {
		return
	}

	f, err := s.Storage.Open(track.FilePath)
	if err != nil {
		s.Logger.Error("open audio", "error", err, "path", track.FilePath)
		writeError(w, http.StatusNotFound, "audio file not found")
		return
	}
	defer f.Close()

	stat, err := f.Stat()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not stat audio file")
		return
	}

	if track.MimeType != "" {
		w.Header().Set("Content-Type", track.MimeType)
	}
	// http.ServeContent handles Range requests and sets Accept-Ranges: bytes,
	// emitting 206 Partial Content for seeks.
	http.ServeContent(w, r, filepath.Base(track.FilePath), stat.ModTime(), f)
}

func (s *Server) handleTrackCover(w http.ResponseWriter, r *http.Request) {
	track, ok := s.loadTrack(w, r)
	if !ok {
		return
	}
	if !track.CoverPath.Valid || track.CoverPath.String == "" {
		writeError(w, http.StatusNotFound, "no cover for this track")
		return
	}
	f, err := s.Storage.Open(track.CoverPath.String)
	if err != nil {
		writeError(w, http.StatusNotFound, "cover file not found")
		return
	}
	defer f.Close()

	stat, err := f.Stat()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not stat cover")
		return
	}
	http.ServeContent(w, r, filepath.Base(track.CoverPath.String), stat.ModTime(), f)
}

func (s *Server) handleDeleteTrack(w http.ResponseWriter, r *http.Request) {
	track, ok := s.loadTrack(w, r)
	if !ok {
		return
	}
	claims := auth.ClaimsFromContext(r.Context())
	if claims.Role != "admin" && db.UUIDString(track.UploadedBy) != claims.UserID {
		writeError(w, http.StatusForbidden, "only the uploader or an admin may delete this track")
		return
	}

	if err := s.Queries.DeleteTrack(r.Context(), track.ID); err != nil {
		s.Logger.Error("delete track", "error", err)
		writeError(w, http.StatusInternalServerError, "could not delete track")
		return
	}
	_ = s.Storage.Delete(track.FilePath)
	if track.CoverPath.Valid {
		_ = s.Storage.Delete(track.CoverPath.String)
	}
	w.WriteHeader(http.StatusNoContent)
}

// loadTrack parses the {id} path param and fetches the track, writing the
// appropriate error response and returning ok=false on failure.
func (s *Server) loadTrack(w http.ResponseWriter, r *http.Request) (db.Track, bool) {
	id, err := db.ParseUUID(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid track id")
		return db.Track{}, false
	}
	track, err := s.Queries.GetTrack(r.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeError(w, http.StatusNotFound, "track not found")
		} else {
			s.Logger.Error("get track", "error", err)
			writeError(w, http.StatusInternalServerError, "could not load track")
		}
		return db.Track{}, false
	}
	return track, true
}

// optionalText maps an empty query value to a NULL pgtype.Text so the
// ListTracks filter clauses are skipped.
func optionalText(v string) pgtype.Text {
	v = strings.TrimSpace(v)
	if v == "" {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: v, Valid: true}
}
