# SOMMAIRE - Projet ENT EST Sale

## Index de la Documentation Complète

---

## 1. **ENT_PROPOSAL_V3_REVIEWED.md**
### Proposition Technique et Vision du Projet

**Sections principales:**
- **1. Purpose** — Objet du document et positionnement
- **2. Technologies Used** — Stack complète (FastAPI, React, Cassandra, MinIO, Keycloak, Docker, Ollama)
- **3. Project Objective** — Périmètre fonctionnel core (auth, upload, download, admin)
- **4. Required Application Microservices** — 4 services obligatoires
  - `core-auth`
  - `upload-service`
  - `download-service`
  - `admin-service`
- **5. Support Components** — Frontend, Keycloak, Cassandra, MinIO, Docker Compose
- **6. Microservice Architecture** — Responsabilités et flux
- **7. Global Architecture** — Diagramme d'architecture générale
- **8. Workflow** — Scénarios teacher et student
- **9. AI Extension** — Ollama/Llama 3 (bonus futur)
- **10. Project Execution Order** — Ordre de réalisation recommandé
- **11. Deployment Vision** — Ubuntu/VMware
- **12. Final Position** — Résumé des choix techniques

**Clé:** Document de référence pour l'architecture cible du projet.

---

## 2. **GITHUB_SETUP.md**
### Guide de Configuration GitHub

**Sections principales:**
- **1. Objectif** — Création cohérente du repo GitHub
- **2. Recommandation principale** — ✅ **1 mono-repo** pour 5 étudiants
- **3. Nom du repository** — `ent-est-sale`
- **4. Structure cible du repository** — Arborescence complète
- **5. Etat actuel du dossier** — Point de départ
- **6-15. Étapes 1-11** — Procédure pas à pas :
  - Créer le repo GitHub
  - Git init local
  - Structure des dossiers
  - `.gitignore`
  - Premier commit
  - Connecter origin
  - Branching strategy (`main`, `develop`, `feature/...`)
  - Ajouter l'équipe
  - Répartition des branches
  - Workflow quotidien
  - Règles de travail équipe
- **16-24. Étapes 12-15** — README, branch protection, ordre pratique

**Clé:** Processus complet de création et organisation du repo GitHub.

---

## 3. **PM_ROLE.md**
### Définition du Rôle PM

**Sections principales:**
- **1. Contexte de l'équipe** — 5 membres (3 Dev + 2 IT)
- **2. Rôle principal du PM** — Coordinateur du projet
- **3. Responsabilités concrètes** —
  - Cadrer le projet
  - Organiser et suivre le travail
  - Suivre les deadlines
  - Centraliser l'information
  - Débloquer l'équipe
- **4. Responsabilités techniques du PM** — QA, recette, documentation
- **5. Rythme hebdomadaire recommandé** — Début, milieu, fin de semaine
- **6. Format de réunion d'équipe** — 3 questions clés (15 min max)
- **7. Tableau de suivi** — Exemple de tracking
- **8. Points de vigilance** — Intégration, documentation, démo
- **9. Erreurs à éviter** — Coordination, intégration, documentation
- **10. Rôle pendant la soutenance** — Présentation PM vs techniques
- **11. Livrables du PM** — Documents responsabilité
- **12. Résumé du rôle** — Synthèse mission

**Clé:** Définition précise des responsabilités du PM (Samir).

---

## 4. **SPRINT_PLAN.md**
### Plan de Sprints et Priorités

**Sections principales:**
- **1. Objectif du document** — Organiser le travail par phases
- **2. Etat actuel pris comme point de départ** — Où nous sommes
- **3. Equipe cible** — Répartition 5 membres
- **4. Règles de cohérence projet** — Convention nommage, architecture
- **5. Priorités réelles** —
  - **Priorité 1** → Rendre le repo cohérent
  - **Priorité 2** → Rendre le dev mode cohérent
  - **Priorité 3** → Renforcer le métier
  - **Priorité 4** → Renforcer l'auth et l'admin
  - **Priorité 5** → Préparer le deploy
- **6. Relecture du plan par phases** —
  - **Phase A** — Documentation et assainissement
  - **Phase B** — Gateway dev mode
  - **Phase C** — Auth plus propre
  - **Phase D** — Métier et données
  - **Phase E** — Admin réel
  - **Phase F** — Deploy mode
- **7. Definition of Done** — Critères de complétude
- **8. Priorité globale** — Ordre recommandé des 7 étapes

**Clé:** Roadmap détaillée et ordonnée du travail par phase.

---

## 5. **DAT_V2.md**
### Dossier d'Architecture Technique (DAT)

**Sections principales:**
- **1. Objet du document** — Description architecture cible vs réalité
- **2. Périmètre stable du projet** — Services obligatoires et composants support
- **3. Etat réel du dépôt aujourd'hui** — Ce qui existe vs ce qui manque
- **4. Vue d'ensemble** — Diagrammes architecture actuelle et cible
- **5. Description des composants** (5.1-5.9) —
  - `frontend-web`
  - `core-auth`
  - `upload-service`
  - `download-service`
  - `admin-service`
  - `keycloak`
  - `cassandra`
  - `minio`
  - `ollama`
- **6. Flux fonctionnels** (6.1-6.5) —
  - Authentification (état actuel vs cible)
  - Upload
  - Consultation/téléchargement
  - Administration
- **7. Schéma de données** —
  - Table actuelle `course_files`
  - Schéma cible (courses, course_files, audit_logs)
- **8. APIs** —
  - APIs actuellement implémentées (par service)
  - APIs cibles (évolutions futures)
- **9. Sécurité** — Contrôles actuels et incomplets
- **10. Docker** — Conteneurs présents et cibles
- **11. Environnements** — Dev local et déploiement
- **12. Kubernetes** — État cible non encore implémenté
- **13. Conclusion** — Cohérence projet et écarts actuels

**Clé:** Documentation technique détaillée et honnête sur l'état réel du projet.

---

## Organisation Globale

### Par Rôle/Persona

| Rôle | Documents clés |
|---|---|
| **PM (Samir)** | ENT_PROPOSAL_V3, GITHUB_SETUP, PM_ROLE, SPRINT_PLAN, DAT_V2 |
| **Dev Backend** | ENT_PROPOSAL_V3, DAT_V2, SPRINT_PLAN |
| **DevOps (Soufian)** | GITHUB_SETUP, DAT_V2, SPRINT_PLAN |
| **Frontend** | ENT_PROPOSAL_V3, DAT_V2, PM_ROLE |
| **Toute l'équipe** | GITHUB_SETUP, SPRINT_PLAN |

### Par Contexte/Phase

| Phase | Documents référence |
|---|---|
| **Initialisation** | GITHUB_SETUP, PM_ROLE |
| **Architecture** | ENT_PROPOSAL_V3, DAT_V2 |
| **Planification** | SPRINT_PLAN |
| **Exécution** | DAT_V2, SPRINT_PLAN, PM_ROLE |
| **Coordination** | PM_ROLE, SPRINT_PLAN |

### Par Objectif

| Besoin | Consulter |
|---|---|
| "Qu'est-ce qu'on doit faire ?" | ENT_PROPOSAL_V3 + SPRINT_PLAN |
| "Comment on s'organise ?" | GITHUB_SETUP + PM_ROLE |
| "Comment fonctionne l'archi ?" | DAT_V2 |
| "Qu'est-ce qui reste à faire ?" | SPRINT_PLAN + DAT_V2 |
| "Je suis bloqué, par quoi commencer ?" | PM_ROLE (section 3.5) |

---

## Résumé Exécutif

### Vision du Projet (ENT_PROPOSAL_V3)
Plateforme ENT pour EST Sale : **4 microservices** (auth, upload, download, admin) + **React frontend** + **Cassandra/MinIO** + **Keycloak** sur **Docker Compose** et **Ubuntu/VMware**.

### Équipe (PM_ROLE)
- **Dev 1** (chorok) → `core-auth` + frontend
- **Dev 2** (hamza) → `upload-service`
- **Dev 3** (abdelhak) → `download-service` + `admin-service`
- **IT 1** (soufian) → DevOps (Docker, K8s)
- **IT 2 / PM** (samir) → Pilotage, documentation, recette, soutenance

### Répo GitHub (GITHUB_SETUP)
- ✅ **1 mono-repo** : `ent-est-sale`
- Branches : `main` (stable) → `develop` (intégration) → `feature/...` (travail)
- Structure claire : `frontend/`, `backend/{4 services}`, `docs/`, infrastructure

### Roadmap (SPRINT_PLAN)
1. Documentation honnête
2. Gateway dev mode
3. Alignement frontend/API
4. Auth plus propre
5. Admin réel
6. Kubernetes
7. Ollama bonus

### État Technique (DAT_V2)
- 4 microservices ✅ présents
- Stack Docker Compose ✅ opérationnelle
- Keycloak ✅ intégré
- Cassandra + MinIO ✅ présents
- MVP file-centric (évolution possible vers course-centric)
- Kubernetes = cible, pas encore implémenté

---

## Conseils de Navigation

- **Nouvelle personne dans l'équipe ?** → Commencez par ENT_PROPOSAL_V3 + GITHUB_SETUP
- **PM en début de sprint ?** → SPRINT_PLAN + PM_ROLE section 5
- **Développeur choisissant sa tâche ?** → DAT_V2 + SPRINT_PLAN section 5/6
- **DevOps planifiant l'infra ?** → ENT_PROPOSAL_V3 + DAT_V2 sections 10-12
- **Question technique d'architecture ?** → DAT_V2 sections 4-8

---

**Dernière mise à jour:** 21 Avril 2026

**Responsable:** Samir Ezzahir (PM)

**Version:** 1.0
