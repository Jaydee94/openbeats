# Deployment

## Kubernetes (Helm)

```bash
helm install openbeats deploy/helm/openbeats \
  --set ingress.enabled=true \
  --set ingress.host=music.example.com \
  --set secrets.jwtSecret=$(openssl rand -hex 32) \
  --set secrets.adminPassword=$(openssl rand -hex 12)
```

The chart deploys: an `api` Deployment, a `web` Deployment (nginx + SPA), a PVC for audio storage, a `Secret` for credentials, `ConfigMap`s, and a cert-manager-ready TLS `Ingress`. Liveness/readiness probes target `/healthz`.

### External PostgreSQL

The chart bundles a self-contained PostgreSQL StatefulSet (no `helm dependency update` required). For production, disable it and point at a managed instance:

```bash
helm install openbeats deploy/helm/openbeats \
  --set postgresql.enabled=false \
  --set externalDatabase.url="postgres://user:pass@db-host:5432/openbeats?sslmode=require"
```

All tunables (images, replicas, resources, probe timings, storage sizes, ingress/TLS) are in `deploy/helm/openbeats/values.yaml`.

> **Note:** If `secrets.jwtSecret` is left empty, a random value is generated on first install and regenerated on every `helm upgrade` — invalidating all active tokens. Pin it explicitly for stable deployments.

## Docker Compose (production-like)

```bash
cp .env.example .env   # set JWT_SECRET, ADMIN_PASSWORD, CORS_ORIGINS
docker compose up -d
```

See [Configuration](configuration.md) for all environment variables.
