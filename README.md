# ENT EST Sale

Monorepo-style structure aligned with the reference architecture:

- `backend/` for API services
- `frontend/` for the Vite/React web app
- `keycloak/` for realm imports/exports
- `nginx/` for gateway configuration
- `k8s/` for future Kubernetes manifests
- `minio/` for future MinIO assets

## Quick Start

1. Copy `.env.example` to `.env`
2. Build and start the frontend service:

```bash
docker compose up --build frontend
```

Frontend is available at `http://localhost:5173`.

## Frontend Local Development

```bash
cd frontend
npm install
npm run dev
```
