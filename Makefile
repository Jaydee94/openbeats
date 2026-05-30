# OpenBeats developer Makefile
.DEFAULT_GOAL := help

BINARY      := bin/openbeats
PKG         := ./cmd/openbeats
SQLC_VER    := v1.27.0
MIGRATE_VER := v4.18.1
DATABASE_URL ?= postgres://openbeats:openbeats@localhost:5432/openbeats?sslmode=disable

.PHONY: help build run test migrate sqlc docker-build dev stop tidy

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

build: ## Build the API server binary
	go build -o $(BINARY) $(PKG)

run: build ## Build and run the API server locally
	./$(BINARY)

test: ## Run Go tests
	go test ./...

tidy: ## Tidy go modules
	go mod tidy

sqlc: ## Regenerate the sqlc database code
	go run github.com/sqlc-dev/sqlc/cmd/sqlc@$(SQLC_VER) generate

migrate: ## Apply database migrations (the server also does this on startup)
	go run -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@$(MIGRATE_VER) \
		-path migrations -database "$(DATABASE_URL)" up

docker-build: ## Build the api and web Docker images
	docker build -t openbeats-api:latest .
	docker build -t openbeats-web:latest ./web

dev: ## Start the full local stack with docker-compose
	docker buildx use default
	docker compose up --build

stop: ## Stop the local stack (volumes are preserved)
	docker compose down
