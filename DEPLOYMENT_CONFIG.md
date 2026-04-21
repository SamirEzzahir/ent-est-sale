# Deployment Configuration Guide

## Overview
All localhost references are now centralized in `.env`. Simply change **one variable** to deploy to any server.

---

## 🚀 Quick Deployment Steps

### Step 1: Update `.env` with your server IP

```bash
# .env
SERVER_HOST=your.server.ip
# Example: SERVER_HOST=192.168.1.100
```

### Step 2: Start infrastructure
```bash
docker-compose -f docker-compose.infra.yml up -d
```

### Step 3: Start application
```bash
docker-compose up -d
```

That's it! All services will automatically use your server IP.

---

## 📋 Configuration Files Changed

### 1. `.env` - Main Configuration File
**Purpose:** Centralized environment variables for all services

**Key variables for deployment:**
```bash
SERVER_HOST=localhost              # ← CHANGE THIS for server deployment
PUBLIC_BASE_URL=http://${SERVER_HOST}:80
KEYCLOAK_PUBLIC_URL=http://${SERVER_HOST}:8080
CORS_ALLOWED_ORIGINS=http://${SERVER_HOST},...
```

**Frontend Variables:**
```bash
VITE_API_BASE_URL=/api            # Relative URL (works with gateway proxy)
VITE_KEYCLOAK_URL=http://localhost:8080  # ← Update if needed
```

### 2. `docker-compose.infra.yml` - Infrastructure Services
**Changed:** Keycloak now uses `${SERVER_HOST}` from .env
```yaml
environment:
  KC_HOSTNAME: ${SERVER_HOST}     # ← Uses .env variable
```

### 3. `frontend/vite.config.ts` - Frontend Build Config
**Changed:** Proxy target now uses environment variable
```typescript
const API_TARGET = process.env.VITE_API_TARGET || 'http://gateway'
```

### 4. `frontend/src/lib/config.ts` - New Centralized Config
**Purpose:** Frontend reads all API endpoints from environment variables

All API endpoints are defined here:
- `API_ENDPOINTS.base` - Main gateway
- `API_ENDPOINTS.upload` - Upload service
- `API_ENDPOINTS.auth` - Authentication
- `API_ENDPOINTS.courses` - Courses API
- etc.

---

## 🔧 Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `SERVER_HOST` | **Primary deployment variable** | `192.168.1.100` |
| `PUBLIC_BASE_URL` | Public app URL | `http://192.168.1.100:80` |
| `KEYCLOAK_URL` | Internal Keycloak (docker) | `http://keycloak:8080` |
| `KEYCLOAK_PUBLIC_URL` | Browser Keycloak URL | `http://192.168.1.100:8080` |
| `VITE_API_BASE_URL` | Frontend API base URL | `/api` |
| `VITE_KEYCLOAK_URL` | Frontend Keycloak URL | `http://192.168.1.100:8080` |

---

## 📱 Local Development

No changes needed! Everything defaults to `localhost`:

```bash
# .env
SERVER_HOST=localhost
VITE_KEYCLOAK_URL=http://localhost:8080

# Start normally
docker-compose -f docker-compose.infra.yml up -d
docker-compose up -d
```

---

## 🖥️ Server Deployment (Example: 192.168.1.100)

**Step 1: Update .env**
```bash
SERVER_HOST=192.168.1.100
VITE_KEYCLOAK_URL=http://192.168.1.100:8080
```

**Step 2: Start services**
```bash
docker-compose -f docker-compose.infra.yml up -d
docker-compose up -d
```

**Step 3: Access the app**
- Frontend: `http://192.168.1.100`
- Keycloak: `http://192.168.1.100:8080`
- APIs: `http://192.168.1.100/api/*`

---

## 🔗 Service Communication

### Internal (Docker Network)
Services communicate via service names:
```
frontend → core-auth (via gateway)
upload-service → cassandra:9042
ai-assistant-service → ollama:11434
```

### External (Browser)
Browser uses SERVER_HOST:
```
Browser → http://192.168.1.100/api/...
Browser → http://192.168.1.100:8080 (Keycloak)
```

---

## 🧪 Testing Configuration

### Check if services are reachable:

```bash
# From your server
curl http://SERVER_HOST:8080          # Keycloak
curl http://SERVER_HOST/api/health    # Gateway/API
curl http://SERVER_HOST:9000          # MinIO

# Check docker network
docker network inspect app-network
```

---

## ⚠️ Common Issues

### Issue: "Connection refused" to services
**Solution:** Make sure `SERVER_HOST` matches your actual server IP/hostname

### Issue: Keycloak page shows 404
**Solution:** Check `VITE_KEYCLOAK_URL` in .env matches `SERVER_HOST`

### Issue: API calls fail from browser
**Solution:** Verify `CORS_ALLOWED_ORIGINS` includes your server IP in .env

### Issue: Services can't communicate
**Solution:** Check both compose files are running:
```bash
docker-compose -f docker-compose.infra.yml ps
docker-compose ps
```

---

## 📝 Summary

| Environment | SERVER_HOST | VITE_KEYCLOAK_URL |
|-------------|-------------|-------------------|
| Local Dev | `localhost` | `http://localhost:8080` |
| Server | `192.168.1.100` | `http://192.168.1.100:8080` |
| Domain | `app.example.com` | `http://app.example.com:8080` |

**Just change `SERVER_HOST` and everything else adapts automatically!**
