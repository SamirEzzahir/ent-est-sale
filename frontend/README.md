# Frontend Notes

This frontend is a React + Vite application used in the current Docker Compose MVP.

Key points:

- normal user access goes through the Nginx gateway at `http://localhost`
- direct Vite access on `http://localhost:5173` remains available for debug
- API calls use relative `/api/*` paths so the same frontend works cleanly behind the gateway
- authentication is Keycloak-first through `core-auth`

The frontend is intentionally aligned with the current MVP scope:

- login and logout
- teacher upload flow
- student list and download flow
- admin user management
