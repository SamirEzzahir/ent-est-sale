# ENT Project - EST Sale

## Overview

This repository contains an ENT (Espace Numerique de Travail) project built around a microservices architecture.

Current stack in this repo:

- Frontend: React + Vite
- Backend: 4 FastAPI microservices
- Metadata storage: Cassandra
- File storage: MinIO
- Authentication: OAuth2 with Keycloak and `core-auth`
- DevOps: Docker Compose is the current target runtime
 
## Current Repository State

What is already implemented in the repo:

- Nginx gateway for dev mode
- `core-auth`
- `upload-service`
- `download-service`
- `admin-service`
- React frontend
- Docker Compose stack
- Cassandra initialization script
- Keycloak realm export

What is intentionally outside the current delivery scope:

- Kubernetes rollout
- Ollama integration

## Project Structure

```text
backend/
  core-auth/
  upload-service/
  download-service/
  admin-service/

frontend/
docs/
nginx/        # dev gateway config
keycloak/
cassandra/
minio/        # placeholder for future init assets
k8s/          # placeholder for future manifests
```

## Current Local Run With Docker Compose

### 1. Clone the repository

```bash
git clone https://github.com/SamirEzzahir/ent-est-sale.git
cd ent-est-sale
```

### 2. Create `.env`

```bash
cp .env.example .env
```

Then adjust values if needed.

### 3. Start the stack

```bash
docker compose up -d --build
```

## Current Access Points

These are the ports defined by the current `docker-compose.yml`:

- Main app through gateway: http://localhost
- Frontend debug access: http://localhost:5173
- Core Auth API: http://localhost:8001
- Upload Service API: http://localhost:8002
- Download Service API: http://localhost:8003
- Admin Service API: http://localhost:8004
- Keycloak: http://localhost:8080
- MinIO API: http://localhost:9000
- MinIO Console: http://localhost:9001
- Cassandra: `localhost:9042`

## Current Functional Scope

Implemented behavior today:

- Keycloak-first login through `core-auth`
- Teacher upload of files
- Student listing and download of uploaded files
- Admin CRUD on users through Keycloak-backed admin APIs

Important clarification:

- the current backend is mostly file-centric, not fully course-centric yet
- the normal browser flow now goes through the Nginx gateway at `http://localhost`
- direct service ports remain available for debugging
- Docker Compose is the only runtime target that must be demo-ready right now

## Target Architecture

The target project direction remains:

- 4 mandatory microservices:
  - `core-auth`
  - `upload-service`
  - `download-service`
  - `admin-service`
- Keycloak for centralized auth
- Cassandra for metadata
- MinIO for file objects
- Docker Compose for the current phase
- Kubernetes only as a later deployment target
- optional Ollama bonus after the core platform is stable

## Branch Strategy

- `main`: validated milestones
- `develop`: integration branch
- `feature/*`: work in progress

## Status

Current repo status: working Docker Compose MVP in progress, with partial implementation of the wider target architecture.
