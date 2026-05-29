// Package config loads runtime configuration from environment variables.
package config

import (
	"fmt"
	"log/slog"
	"os"
	"strings"
	"time"
)

// Config holds all runtime configuration for the OpenBeats server.
type Config struct {
	Port          string
	DatabaseURL   string
	JWTSecret     string
	JWTTTL        time.Duration
	StoragePath   string
	AdminUsername string
	AdminPassword string
	CORSOrigins   []string
}

// Load reads configuration from the environment, applying sensible defaults.
// It returns an error only for values that cannot be parsed; missing optional
// values fall back to defaults and emit a warning where relevant.
func Load() (*Config, error) {
	cfg := &Config{
		Port:          getenv("PORT", "8080"),
		DatabaseURL:   getenv("DATABASE_URL", "postgres://openbeats:openbeats@localhost:5432/openbeats?sslmode=disable"),
		JWTSecret:     getenv("JWT_SECRET", ""),
		StoragePath:   getenv("STORAGE_PATH", "/data"),
		AdminUsername: getenv("ADMIN_USERNAME", "admin"),
		AdminPassword: getenv("ADMIN_PASSWORD", "changeme"),
	}

	ttlRaw := getenv("JWT_TTL", "24h")
	ttl, err := time.ParseDuration(ttlRaw)
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_TTL %q: %w", ttlRaw, err)
	}
	cfg.JWTTTL = ttl

	origins := getenv("CORS_ORIGINS", "*")
	for _, o := range strings.Split(origins, ",") {
		if o = strings.TrimSpace(o); o != "" {
			cfg.CORSOrigins = append(cfg.CORSOrigins, o)
		}
	}
	if len(cfg.CORSOrigins) == 0 {
		cfg.CORSOrigins = []string{"*"}
	}

	if cfg.JWTSecret == "" {
		cfg.JWTSecret = "insecure-development-secret-change-me"
		slog.Warn("JWT_SECRET is not set; using an insecure development default. Set JWT_SECRET in production.")
	}

	return cfg, nil
}

func getenv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}
