package auth

import (
	"context"
	"net/http"
	"strings"
)

type contextKey string

const claimsKey contextKey = "openbeats.claims"

// Middleware builds HTTP middleware bound to a token Manager.
type Middleware struct {
	manager *Manager
}

// NewMiddleware returns auth middleware for the given Manager.
func NewMiddleware(m *Manager) *Middleware {
	return &Middleware{manager: m}
}

// tokenFromRequest extracts a bearer token from the Authorization header, or
// falls back to a `token` query parameter (used by <audio>/<img> elements that
// cannot set custom headers).
func tokenFromRequest(r *http.Request) string {
	if h := r.Header.Get("Authorization"); h != "" {
		if after, ok := strings.CutPrefix(h, "Bearer "); ok {
			return strings.TrimSpace(after)
		}
	}
	return r.URL.Query().Get("token")
}

// RequireAuth rejects requests without a valid token and stores the claims in
// the request context.
func (mw *Middleware) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		raw := tokenFromRequest(r)
		if raw == "" {
			http.Error(w, "missing authorization token", http.StatusUnauthorized)
			return
		}
		claims, err := mw.manager.Parse(raw)
		if err != nil {
			http.Error(w, "invalid or expired token", http.StatusUnauthorized)
			return
		}
		ctx := context.WithValue(r.Context(), claimsKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireAdmin must be chained after RequireAuth; it rejects non-admin users.
func (mw *Middleware) RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims := ClaimsFromContext(r.Context())
		if claims == nil || claims.Role != "admin" {
			http.Error(w, "admin privileges required", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// ClaimsFromContext returns the authenticated claims, or nil if unauthenticated.
func ClaimsFromContext(ctx context.Context) *Claims {
	c, _ := ctx.Value(claimsKey).(*Claims)
	return c
}
