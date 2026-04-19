# Keycloak setup (realm, client, roles)

## 1. Create a realm

1. Open Keycloak Admin Console → **Create realm** → name it `ent-sale` (or match `KEYCLOAK_REALM` in `.env`).

## 2. Realm roles (ENT)

1. **Realm roles** → **Create role** (three times):

- `ADMIN`
- `TEACHER`
- `STUDENT`

2. Assign **one** of these roles to each user (Users → select user → **Role mapping** → **Assign realm role**).

## 3. Client for the React app + password grant

1. **Clients** → **Create client**

- **Client type**: OpenID Connect  
- **Client ID**: `ent-frontend` (same as `KEYCLOAK_CLIENT_ID`)

2. **Capability config**

- **Client authentication**: Off (public client) *or* On if you use `KEYCLOAK_CLIENT_SECRET` (confidential).

3. **Login settings**

- **Valid redirect URIs**: `http://localhost:5173/*`  
- **Web origins**: `http://localhost:5173`

4. **Advanced** → **OpenID Connect Compatibility Modes**

- Enable **OAuth 2.0 Direct Access Grants** (Resource Owner Password Credentials) so `grant_type=password` works for `/login`.  
  For production, prefer Authorization Code + PKCE and drop password grant; this setup matches the requested email/password flow.

## 4. Token content (realm roles in JWT)

Default Keycloak access tokens include `realm_access.roles`. If roles are missing:

1. **Client scopes** → `roles` → **Mappers** → ensure **realm roles** are included on the access token (default usually works).

## 5. Test users

Create users under **Users** with credentials and assign exactly one realm role (`ADMIN`, `TEACHER`, or `STUDENT`).

## 6. Environment for FastAPI

Copy `backend/.env.example` to `backend/.env` and set:

- `KEYCLOAK_URL` (e.g. `http://localhost:8080`)
- `KEYCLOAK_REALM` = your realm name
- `KEYCLOAK_CLIENT_ID` = client id
- `KEYCLOAK_CLIENT_SECRET` = if the client is confidential
- `CORS_ORIGINS` = your Vite origin

If JWT validation fails on **audience**, set `KEYCLOAK_VERIFY_AUD=false` or adjust `KEYCLOAK_AUDIENCE` to match your token’s `aud` claim (often `account`).

## 7. Run services

```bash
# Keycloak (Docker example)
docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev

# Auth API (from backend/)
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --reload --port 8000
```

Frontend: copy `.env.example` to `.env`, set `VITE_AUTH_API_URL=http://localhost:8000`, then `npm run dev`.

## 8. Inscription (POST `/register`)

L’API crée un utilisateur via **Keycloak Admin REST** et lui assigne le rôle realm `STUDENT` (ou `DEFAULT_REGISTER_ROLE`).

1. **Clients** → **Create client**

- **Client ID**: `ent-registration` (ou autre, aligné sur `KEYCLOAK_ADMIN_CLIENT_ID`)
- **Client authentication**: **On** (confidential)
- **Service accounts roles**: **On**

2. **Credentials** → copier le **Client secret** dans `KEYCLOAK_ADMIN_CLIENT_SECRET`.

3. **Service account roles** → **Assign role** → filtre **Filter by clients** → `realm-management` → cocher **manage-users** (et idéalement **view-users**, **query-users**).

4. Dans `backend/.env` :

```env
KEYCLOAK_ADMIN_CLIENT_ID=ent-registration
KEYCLOAK_ADMIN_CLIENT_SECRET=<secret>
DEFAULT_REGISTER_ROLE=STUDENT
```

Sans ces variables, `POST /register` répond **503** et le formulaire d’inscription affiche le message serveur.

5. **Realm settings** → **Login** : si vous exigez un email vérifié, la connexion automatique après inscription peut échouer ; l’utilisateur devra alors se connecter manuellement après validation du mail.
