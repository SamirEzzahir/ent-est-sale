# 🎓 ENT Project (Espace Numérique de Travail)

## 📌 Description

This project is a digital workspace (ENT) built with a microservices architecture.

It allows:

* Authentication (Keycloak)
* File upload/download
* Administration
* Frontend interface

---

## 🏗️ Architecture

* Frontend: React
* Backend: Microservices (FastAPI / Node)
* Database: Cassandra
* Storage: MinIO
* Auth: Keycloak
* DevOps: Docker, Docker Compose, Kubernetes (later)

---

## 📁 Project Structure

```
backend/
  ├── core-auth/
  ├── upload-service/
  ├── download-service/
  └── admin-service/

frontend/
nginx/
keycloak/
cassandra/
minio/
k8s/
```

---

## 🚀 Run project (local)

### 1. Clone repo

```
git clone https://github.com/SamirEzzahir/ent-est-sale.git
cd ent-est-sale
```

### 2. Run with Docker

```
docker-compose up -d
```

### 3. Access services

* Frontend: http://localhost:3000
* Keycloak: http://localhost:8080
* MinIO: http://localhost:9001

---

## 🌿 Branch Strategy

* main → stable version
* develop → integration branch
* feature/* → feature development

---

## 👥 Team Workflow

1. Create feature branch
2. Push code
3. Open Pull Request to `develop`
4. Review
5. Merge

---

## 👤 Team Roles

* Dev 1 → core-auth + frontend
* Dev 2 → upload-service
* Dev 3 → download + admin
* DevOps → docker + infra
* PM → coordination + review

---

## 📌 Status

🚧 Project in progress (Sprint 1)
