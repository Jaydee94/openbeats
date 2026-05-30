# --- Build stage ---
FROM golang:1.23-alpine AS build

WORKDIR /src

# Cache dependencies first.
COPY go.mod go.sum ./
RUN go mod download

# Build the static binary (migrations are embedded via go:embed).
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/openbeats ./cmd/openbeats && \
    mkdir -p /out/data

# --- Runtime stage ---
FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /app
COPY --from=build /out/openbeats /app/openbeats
COPY --from=build --chown=nonroot:nonroot /out/data /data

# Persistent volume mount point for audio + covers.
ENV STORAGE_PATH=/data
ENV PORT=8080
EXPOSE 8080

USER nonroot:nonroot
ENTRYPOINT ["/app/openbeats"]
