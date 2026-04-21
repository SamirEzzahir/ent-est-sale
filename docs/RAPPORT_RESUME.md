# RAPPORT DE PROJET - ENT EST Sale

## Résumé Exécutif

---

## 1. Contexte et Objectif

Le projet **ENT EST Sale** consiste à développer une plateforme d'Environnement Numérique de Travail (ENT) destinée à l'établissement EST Sale. Cette plateforme permet aux enseignants de partager du contenu pédagogique et aux étudiants d'accéder à ces ressources de manière sécurisée et centralisée.

### Périmètre Fonctionnel Core

La plateforme répond à quatre besoins fonctionnels majeurs :

1. **Authentification des utilisateurs** — Gestion sécurisée des accès et des identités
2. **Téléchargement de contenu par enseignants** — Upload de ressources pédagogiques
3. **Consultation et téléchargement par étudiants** — Accès aux contenus disponibles
4. **Administration utilisateurs et rôles** — Gestion des permissions et des profils

---

## 2. Architecture Technique

### Stack Technologique

| Composant | Technologie | Rôle |
|---|---|---|
| **Backend** | Python + FastAPI | Microservices métier |
| **Frontend** | React + Vite | Interface web |
| **Base de données** | Apache Cassandra | Métadonnées et sessions |
| **Stockage objets** | MinIO | Fichiers pédagogiques |
| **Authentification** | Keycloak OAuth2 | IAM et tokens JWT |
| **Conteneurisation** | Docker + Docker Compose | Environnement local |
| **Déploiement** | Ubuntu + VMware | Infrastructure cible |
| **Extension IA** | Ollama + Llama 3 | Bonus futur (non core) |

### Microservices Obligatoires

Le projet implémente 4 microservices backend :

#### **1. `core-auth`**
- Gère l'intégration avec Keycloak
- Valide les tokens JWT
- Expose l'identité utilisateur et les rôles

#### **2. `upload-service`**
- Permet aux enseignants d'ajouter des cours
- Reçoit les métadonnées et fichiers associés
- Stocke les métadonnées en Cassandra
- Stocke les fichiers en MinIO

#### **3. `download-service`**
- Expose la liste des cours disponibles
- Permet aux étudiants de consulter les informations
- Génère les liens de téléchargement (URLs pré-signées MinIO)

#### **4. `admin-service`**
- Gère les utilisateurs et les rôles
- Intègre l'API Admin de Keycloak
- Supporte l'administration de la plateforme

### Architecture Globale

```
┌─────────────┐
│   Frontend  │ (React)
└──────┬──────┘
       │
   ┌───▼──────┐
   │ Gateway  │ (Nginx)
   └───┬──────┘
       │
    ┌──┴──┬─────┬─────┐
    │     │     │     │
┌───▼──┐ ┌─┴───┐ ┌──┴─┐ ┌──┴──┐
│ Auth │ │Upload│ │Down│ │Admin│
└───┬──┘ └──┬──┘ └──┬─┘ └──┬──┘
    │       │  │    │      │
    │   ┌───▼──┴────▼──┐   │
    │   │   Cassandra  │   │
    │   │   MinIO      │   │
    │   └──────────────┘   │
    │                      │
    └──┬───────────────────┘
       │
   ┌───▼────────┐
   │  Keycloak  │
   └────────────┘
```

---

## 3. Équipe de Projet

### Composition (5 Membres)

| Membre | Rôle | Responsabilités |
|---|---|---|
| **Chorok** | Dev 1 | Backend `core-auth` + Frontend login/dashboards |
| **Hamza** | Dev 2 | Backend `upload-service` + MinIO + Cassandra (upload) |
| **Abdelhak** | Dev 3 | Backend `download-service` + `admin-service` |
| **Soufian** | IT 1 | DevOps : Docker Compose, Nginx, Kubernetes |
| **Samir** | IT 2 / PM | Pilotage, coordination, documentation, recette, soutenance |

### Rôle du PM (Samir)

Le PM assure la coordination globale du projet en :
- Cadrant l'objectif et le périmètre
- Suivant l'avancement et les blocages
- Centralisant l'information (documentation, API list, variables d'environnement)
- Organisant les points de synchronisation
- Assurant la cohérence entre frontend, backend et infrastructure
- Préparant la démo et la soutenance

---

## 4. Structure du Dépôt

```
ent-est-sale/
├── docs/
│   ├── ENT_PROPOSAL_V3_REVIEWED.md    (Vision architecture)
│   ├── GITHUB_SETUP.md                (Organisation repo)
│   ├── PM_ROLE.md                     (Rôles équipe)
│   ├── SPRINT_PLAN.md                 (Roadmap)
│   ├── DAT_V2.md                      (Details techniques)
│   └── SOMMAIRE.md                    (Index documentation)
├── frontend/                          (React + Vite)
├── backend/
│   ├── core-auth/
│   ├── upload-service/
│   ├── download-service/
│   └── admin-service/
├── nginx/                             (Gateway)
├── k8s/                               (Manifests Kubernetes)
├── docker-compose.yml                 (Stack locale)
├── .env.example                       (Variables d'environnement)
├── .gitignore                         (Exclusions Git)
└── README.md                          (Guide démarrage)
```

---

## 5. Flux Utilisateur

### Scénario Enseignant

1. L'enseignant s'authentifie via Keycloak
2. Il accède au formulaire d'upload
3. Il saisit le nom du cours et sélectionne un fichier
4. Le fichier est transmis à `upload-service`
5. Le service vérifie le rôle « enseignant »
6. Le fichier est stocké en MinIO
7. Les métadonnées sont enregistrées en Cassandra

### Scénario Étudiant

1. L'étudiant s'authentifie via Keycloak
2. Il consulte la liste des cours disponibles (depuis `download-service`)
3. Il accède aux informations du cours
4. Il télécharge le fichier via une URL pré-signée MinIO
5. Le fichier est servi directement depuis MinIO

### Scénario Administrateur

1. L'administrateur s'authentifie
2. Il accède au panneau d'administration
3. Il gère les utilisateurs et les rôles via Keycloak
4. Les modifications sont appliquées dans le realm Keycloak

---

## 6. État Actuel du Projet

### Éléments Implémentés ✅

- Les 4 microservices backend (core-auth, upload-service, download-service, admin-service)
- Frontend React avec interface login, upload, consultation, administration
- Stack Docker Compose opérationnelle
- Intégration Keycloak pour l'authentification
- Cassandra et MinIO intégrés à la stack locale
- Gateway Nginx de développement
- Documentation technique (ENT_PROPOSAL_V3, DAT_V2)
- Organisation Git et branching strategy

### Éléments Partiellement Implémentés ⚠️

- Authentification Keycloak (flux configuré mais à consolider)
- Administration réelle (intégration Keycloak Admin API en place)
- Modèle de données (MVP file-centric, possible évolution vers course-centric)

### Éléments à Compléter 🔄

- Manifests Kubernetes (cible de déploiement)
- Ollama / Llama 3 (extension IA, bonus futur après stabilisation core)
- Documentation de déploiement sur Ubuntu/VMware ESXi
- Tests d'intégration complets
- Dossier d'architecture technique détaillé (DAT_V2 en cours)

---

## 7. Roadmap et Priorités

### Ordre de Réalisation Recommandé

1. **Phase A — Documentation et assainissement**
   - README cohérent et honnête
   - DAT_V2 finalisé
   - Aligner documentation et implémentation réelle

2. **Phase B — Gateway dev mode**
   - Valider le routage Nginx
   - Assurer que tout passe par `/api/auth`, `/api/upload`, `/api/download`, `/api/admin`

3. **Phase C — Authentification propre**
   - Consolider le flux Keycloak-first
   - Simplifier la documentation du parcours auth

4. **Phase D — Modèle métier**
   - Clarifier MVP file-centric vs évolution course-centric
   - Aligner schéma de données et APIs

5. **Phase E — Administration réelle**
   - Brancher admin-service sur Keycloak Admin API
   - Gestion réelle des utilisateurs et rôles

6. **Phase F — Préparation déploiement**
   - Créer manifests Kubernetes
   - Documentation déploiement sur Ubuntu/VMware

7. **Phase G — Ollama (bonus)**
   - Intégration Ollama + Llama 3
   - Chatbot assistant (après stabilisation core)

---

## 8. Critères de Succès

### Definition of Done (DoD)

Une tâche est considérée comme terminée si elle satisfait à :

✅ **Code** — Implémenté et versionné  
✅ **Tests** — Tests unitaires et d'intégration réussis  
✅ **Documentation** — APIs documentées, configurations claires  
✅ **Cohérence** — Compatible avec le reste du dépôt  
✅ **Démontrabilité** — Fonctionnalité testable et démontrable  

### Livrables du Projet

| Livrable | Responsable | Deadline |
|---|---|---|
| Repository GitHub opérationnel | PM | Début |
| Documentation technique (DAT_V2) | PM | Phase A |
| Docker Compose stable | IT 1 | Phase B |
| Frontend + Backend intégré | Tous | Phase D |
| Manifests Kubernetes | IT 1 | Phase F |
| Documentation déploiement | PM + IT 1 | Phase F |
| Démo fonctionnelle | PM | Continu |
| Soutenance préparée | PM | Fin projet |

---

## 9. Points de Vigilance

### Risques Principaux

| Risque | Mitigation |
|---|---|
| Absence d'intégration jusqu'à la fin | Points d'intégration réguliers (fin de chaque phase) |
| Documentation dépassée | Documentation construite pendant le projet, pas après |
| Incompatibilité frontend/backend | Synchronisation bi-hebdomadaire sur les APIs |
| Merges tardives | Pull requests et revues dès fin de tâche |
| Confusion sur les priorités | Sprint plan clair + standup quotidien |

### Focus Critiques

1. **Intégration précoce et fréquente**
2. **Documentation honnête et à jour**
3. **Communication équipe régulière**
4. **Respect du périmètre MVP (4 services)**
5. **Keycloak dès le départ (pas d'auth maison)**

---

## 10. Technologies et Outils

### Développement

- **IDE** : Visual Studio Code / PyCharm / WebStorm
- **Version Control** : Git + GitHub
- **API Testing** : Postman / Swagger UI
- **Container** : Docker Desktop / Docker Engine

### Infrastructure

- **Orchestration locale** : Docker Compose
- **Orchestration production** : Kubernetes
- **Gateway** : Nginx
- **Load Balancing** : Ingress (K8s)

### Communication

- **Réunions** : Standup quotidien (15 min) + points de sync hebdo
- **Tracking** : Tableau de tâches / GitHub Issues
- **Documentation** : Markdown dans `/docs`

---

## 11. Conclusion

Le projet ENT EST Sale est architecturalement cohérent et techniquement viable. L'équipe dispose de tous les éléments pour livrer une plateforme fonctionnelle respectant les 4 microservices imposés.

Les priorités claires (Phase A → Phase F) et la coordination par le PM permettront une intégration progressive et une démonstration fluide.

La clé du succès réside dans :
- La rigueur documentaire (DAT_V2, README, SPRINT_PLAN)
- L'intégration précoce et fréquente
- La synchronisation régulière de l'équipe
- Le respect du périmètre MVP et de la stack définie

Le projet est prêt pour démarrer sa réalisation selon le plan établi.

---

**Auteur du rapport** : Samir Ezzahir (PM)  
**Date** : 21 Avril 2026  
**Version** : 1.0  
**Statut** : Approuvé pour démarrage
