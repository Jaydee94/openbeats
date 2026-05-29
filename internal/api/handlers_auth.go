package api

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"

	"github.com/jaydee94/openbeats/internal/auth"
	"github.com/jaydee94/openbeats/internal/db"
)

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type registerRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Username == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "username and password are required")
		return
	}

	user, err := s.Queries.GetUserByUsername(r.Context(), req.Username)
	if err != nil {
		// Do not leak whether the username exists.
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	if !auth.CheckPassword(user.PasswordHash, req.Password) {
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	token, err := s.Auth.Generate(db.UUIDString(user.ID), user.Username, user.Role)
	if err != nil {
		s.Logger.Error("generate token", "error", err)
		writeError(w, http.StatusInternalServerError, "could not issue token")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"token": token,
		"user": map[string]string{
			"id":       db.UUIDString(user.ID),
			"username": user.Username,
			"role":     user.Role,
		},
	})
}

func (s *Server) handleRegister(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Username == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "username and password are required")
		return
	}
	role := req.Role
	if role == "" {
		role = "user"
	}
	if role != "user" && role != "admin" {
		writeError(w, http.StatusBadRequest, "role must be 'user' or 'admin'")
		return
	}

	// Reject duplicate usernames with a clear 409.
	if _, err := s.Queries.GetUserByUsername(r.Context(), req.Username); err == nil {
		writeError(w, http.StatusConflict, "username already exists")
		return
	} else if !errors.Is(err, pgx.ErrNoRows) {
		s.Logger.Error("lookup user", "error", err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not hash password")
		return
	}

	user, err := s.Queries.CreateUser(r.Context(), db.CreateUserParams{
		Username:     req.Username,
		PasswordHash: hash,
		Role:         role,
	})
	if err != nil {
		s.Logger.Error("create user", "error", err)
		writeError(w, http.StatusInternalServerError, "could not create user")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{
		"id":       db.UUIDString(user.ID),
		"username": user.Username,
		"role":     user.Role,
	})
}
