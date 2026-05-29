// Command openbeats runs the OpenBeats HTTP API server.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5"

	"github.com/jaydee94/openbeats/internal/api"
	"github.com/jaydee94/openbeats/internal/auth"
	"github.com/jaydee94/openbeats/internal/config"
	"github.com/jaydee94/openbeats/internal/db"
	"github.com/jaydee94/openbeats/internal/storage"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	if err := run(logger); err != nil {
		logger.Error("fatal", "error", err)
		os.Exit(1)
	}
}

func run(logger *slog.Logger) error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	ctx := context.Background()

	// Apply database migrations before accepting traffic.
	logger.Info("running migrations")
	if err := db.RunMigrations(cfg.DatabaseURL); err != nil {
		return err
	}

	pool, err := db.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	queries := db.New(pool)

	store, err := storage.New(cfg.StoragePath)
	if err != nil {
		return err
	}

	if err := seedAdmin(ctx, logger, queries, cfg); err != nil {
		return err
	}

	tokenManager := auth.NewManager(cfg.JWTSecret, cfg.JWTTTL)
	srv := &api.Server{
		Pool:        pool,
		Queries:     queries,
		Storage:     store,
		Auth:        tokenManager,
		Middleware:  auth.NewMiddleware(tokenManager),
		Logger:      logger,
		CORSOrigins: cfg.CORSOrigins,
	}

	httpServer := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           srv.Routes(),
		ReadHeaderTimeout: 10 * time.Second,
	}

	// Graceful shutdown on SIGINT/SIGTERM.
	shutdownCtx, stop := signal.NotifyContext(ctx, syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	errCh := make(chan error, 1)
	go func() {
		logger.Info("openbeats listening", "addr", httpServer.Addr, "storage", cfg.StoragePath)
		if err := httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
	}()

	select {
	case err := <-errCh:
		return err
	case <-shutdownCtx.Done():
		logger.Info("shutting down")
		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()
		return httpServer.Shutdown(ctx)
	}
}

// seedAdmin creates the bootstrap admin account when the users table is empty.
func seedAdmin(ctx context.Context, logger *slog.Logger, q *db.Queries, cfg *config.Config) error {
	count, err := q.CountUsers(ctx)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	if cfg.AdminUsername == "" || cfg.AdminPassword == "" {
		logger.Warn("no users exist and ADMIN_USERNAME/ADMIN_PASSWORD are unset; skipping admin seed")
		return nil
	}

	// Guard against a race where another instance seeded concurrently.
	if _, err := q.GetUserByUsername(ctx, cfg.AdminUsername); err == nil {
		return nil
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return err
	}

	hash, err := auth.HashPassword(cfg.AdminPassword)
	if err != nil {
		return err
	}
	if _, err := q.CreateUser(ctx, db.CreateUserParams{
		Username:     cfg.AdminUsername,
		PasswordHash: hash,
		Role:         "admin",
	}); err != nil {
		return err
	}
	logger.Info("seeded bootstrap admin user", "username", cfg.AdminUsername)
	return nil
}
