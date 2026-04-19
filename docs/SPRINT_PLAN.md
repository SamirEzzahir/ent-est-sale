# Sprint Plan - Projet ENT EST Sale

## 1. Objectif du document

Ce document organise le travail de l'equipe en distinguant:

- l'etat actuel du depot
- la cible technique a atteindre

Reference principale:

- `docs/ENT_PROPOSAL_V3_REVIEWED.md`

## 2. Etat actuel pris comme point de depart

Aujourd'hui, le depot contient deja:

- les 4 microservices imposes
- un frontend React
- une stack Docker Compose
- un gateway Nginx de dev
- Cassandra, MinIO et Keycloak dans l'environnement local

Mais il reste encore a finaliser:

- l'authentification Keycloak-first
- l'administration reelle via Keycloak
- les manifests Kubernetes

## 3. Equipe cible

L'equipe compte 5 membres:

- `Dev 1 - chorok`: `core-auth` + frontend
- `Dev 2 - hamza`: backend `upload-service`
- `Dev 3 - abdelhak`: backend `download-service` et `admin-service`
- `IT 1 - soufian`: DevOps principal
- `IT 2 / PM - samir`: pilotage, documentation, QA, recette, soutenance, support DevOps

## 4. Regles de coherence projet

Pour rester alignes:

- les 4 services s'appellent `core-auth`, `upload-service`, `download-service`, `admin-service`
- le repo doit distinguer clairement `etat actuel` et `architecture cible`
- les ports directs peuvent etre utilises pour debug
- a terme, le flux navigateur normal doit passer par le gateway
- Docker Compose est le mode dev
- Kubernetes est le mode deploy
- Ollama reste un bonus apres stabilisation du coeur ENT

## 5. Priorites reelles a partir du depot actuel

### Priorite 1 - rendre le repo coherent

- corriger la documentation
- aligner les ports, URLs et flux reels
- supprimer les promesses non implementees des docs courantes

### Priorite 2 - rendre le dev mode coherent

- consolider le gateway Nginx
- faire passer tout le flux utilisateur normal par `/api/auth`, `/api/upload`, `/api/download`, `/api/admin`
- garder les ports directs pour debug et tests

### Priorite 3 - renforcer le metier

- clarifier si le MVP reste file-centric
- ou faire evoluer le backend vers un vrai modele `course`

### Priorite 4 - renforcer l'auth et l'admin

- privilegier un flux Keycloak plus propre
- remplacer le store memoire admin par une vraie integration Keycloak

### Priorite 5 - preparer le deploy

- Dockerfiles finalises
- manifests Kubernetes
- documentation de deploiement

## 6. Relecture du plan par phases

### Phase A - Documentation et assainissement

Objectif:

- rendre le repo presentable et honnete

Livrables:

- `README.md` coherent
- `DAT_V2.md` coherent
- `ENT_PROPOSAL_V3_REVIEWED.md` coherent
- `SPRINT_PLAN.md` coherent

### Phase B - Gateway dev mode

Objectif:

- faire correspondre le comportement du frontend avec l'architecture recommandee

Taches:

- valider `nginx/nginx.conf`
- valider le service `gateway` dans `docker-compose.yml`
- confirmer le routage `/` vers le frontend
- confirmer le routage `/api/auth`, `/api/upload`, `/api/download`, `/api/admin` vers les services
- garder les URLs frontend en chemins relatifs

Livrables:

- navigation normale via `http://localhost`
- ports backend gardes pour debug

### Phase C - Auth plus propre

Objectif:

- reduire l'ecart entre doc et implementation

Taches:

- consolider le flow Keycloak-first
- mieux integrer le flux Keycloak
- documenter le mode par defaut

Livrables:

- auth story plus simple a presenter

### Phase D - Metier et donnees

Objectif:

- choisir clairement entre MVP fichier et vrai modele cours

Choix possible:

1. garder un MVP file-centric mais l'assumer partout
2. faire evoluer le backend vers `courses` + `course_files`

Livrables:

- API et schema alignes avec les docs

### Phase E - Admin reel

Objectif:

- remplacer l'administration en memoire

Taches:

- brancher `admin-service` sur Keycloak Admin API
- gerer creation utilisateurs et roles reellement

### Phase F - Deploy mode

Objectif:

- preparer la demo infra finale

Taches:

- creer manifests Kubernetes
- preparer ConfigMaps, Secrets, Services, Ingress
- documenter deploiement sur Ubuntu / VMware ESXi

## 7. Definition of Done

Une tache est terminee si elle est:

- codee
- testee
- documentee
- coherent avec le reste du repo
- demonstrable

## 8. Priorite globale

Ordre recommande:

1. documentation honnete
2. gateway dev mode
3. alignement frontend/API
4. auth plus propre
5. admin reel
6. Kubernetes
7. Ollama bonus
