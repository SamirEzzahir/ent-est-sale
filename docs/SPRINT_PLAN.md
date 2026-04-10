# Sprint Plan - Projet ENT EST Sale

## 1. Objectif du document

Ce document organise le travail de l'equipe en sprints de maniere coherente avec [ENT_PROPOSAL_V3_REVIEWED.md](/c:/Users/samir/Desktop/IAWM/Semister%206/DevOps%20et%20cloud2/Project_ENT/ENT_PROPOSAL_V3_REVIEWED.md).

Le plan respecte :

- les 4 microservices imposes par le professeur
- le contexte ENT de l'EST Sale
- le mode `dev` avec Docker Compose
- le mode `deploy` avec Kubernetes
- le deploiement cible sur Ubuntu 24.10 heberge sur VMware ESXi
- Ollama comme bonus apres stabilisation du coeur ENT

## 2. Equipe cible

L'equipe compte 5 membres :

- `Dev 1 - chorok` : `core-auth` + frontend
- `Dev 2 - hamza` : backend `upload-service`
- `Dev 3 - abdelhak` : backend `download-service` et `admin-service`
- `IT 1 - soufian` : DevOps principal
- `IT 2 / PM - samir` : pilotage, documentation, QA, recette, soutenance, support DevOps

## 3. Regles de coherence projet

Pour rester aligne avec la proposition V3 reviewed, toute l'equipe doit suivre ces regles :

- les 4 services s'appellent `core-auth`, `upload-service`, `download-service`, `admin-service`
- le navigateur passe normalement par le `gateway` en dev mode
- les ports directs servent surtout au debug
- Docker Compose est utilise pour le developpement local
- Kubernetes est reserve au deploy mode
- l'IA avec Ollama n'est pas prioritaire avant la stabilisation du coeur ENT
- chacun peut aider les autres pour apprendre en faisant
- chaque domaine garde tout de meme un proprietaire principal
- pour chaque sujet critique, il faut idealement un owner principal et un support ou backup

## 4. Repartition des responsabilites

| Membre | Nom | Domaine principal | Responsabilites |
|---|---|---|---|
| `Dev 1` | `chorok` | Auth / securite / frontend | Keycloak, JWT, roles, `core-auth`, frontend auth/login/dashboard |
| `Dev 2` | `hamza` | Upload / stockage | `upload-service`, MinIO, metadata Cassandra |
| `Dev 3` | `abdelhak` | Lecture / admin | `download-service`, `admin-service`, lecture Cassandra |
| `IT 1` | `soufian` | DevOps principal | gateway Nginx, Docker Compose, Kubernetes, deploiement |
| `IT 2 / PM` | `samir` | Coordination / QA / support DevOps | backlog, suivi, recette, docs, demo, soutenance, support DevOps |

## 5. Workflow commun

### Git

- branche principale : `main`
- branche d'integration : `develop`
- branches de travail : `feature/...`

### Rythme equipe

- mini point quotidien de 10 minutes
- demo interne en fin de sprint
- integration partielle a chaque sprint
- aucune grosse integration repoussee a la toute fin
- entraide entre membres autorisee et encouragee

### Regle de collaboration

- un membre peut aider sur un autre sujet pour apprendre et accelerer l'equipe
- l'aide ne remplace pas la responsabilite principale
- chaque sprint doit garder des owners clairs pour eviter le chaos

### Rythme PM

Le PM doit faire a chaque sprint :

- liste des taches
- responsables
- date cible
- blocages
- bilan de sprint

## 6. Sprint 0 - Cadrage et alignement

**Objectif :** figer le perimetre, les roles, les conventions, et la cible technique.

### Taches

| Tache | Responsable |
|---|---|
| Valider le perimetre MVP ENT | PM + Tous |
| Valider les 4 microservices imposes | PM + Tous |
| Valider la stack : React, FastAPI, Keycloak, Cassandra, MinIO | Tous |
| Valider `dev mode` vs `deploy mode` | PM + IT 1 + Dev 1 |
| Fixer les conventions Git et PR | PM |
| Creer backlog initial et priorites | PM |

### Livrables

- perimetre MVP valide
- roles clairs
- backlog initial
- architecture de reference validee

## 7. Sprint 1 - Socle local en dev mode

**Objectif :** obtenir un environnement local coherent avec Docker Compose.

### Taches

| Tache | Responsable |
|---|---|
| Creer l'arborescence mono-repo | IT 1 + PM |
| Rediger `docker-compose.yml` de base | IT 1 |
| Configurer `keycloak`, `cassandra`, `minio` en local | IT 1 + PM |
| Preparer `nginx/nginx.conf` pour le gateway local | IT 1 |
| Creer les squelettes `core-auth`, `upload-service`, `download-service`, `admin-service` | Dev 1 + Dev 2 + Dev 3 |
| Creer le squelette `frontend` React | Dev 1 |
| Rediger `.env.example` | IT 1 + PM |
| Rediger `README.md` de lancement | PM |
| Verifier que le navigateur passe par `http://localhost` | PM + IT 1 + Dev 1 |

### Livrables

- stack locale qui demarre
- gateway local fonctionnel
- composants d'infra accessibles
- squelettes applicatifs prets

## 8. Sprint 2 - `core-auth`

**Objectif :** mettre en place l'authentification avec Keycloak et les roles.

### Taches

| Tache | Responsable |
|---|---|
| Configurer realm Keycloak | Dev 1 |
| Creer les roles `admin`, `teacher`, `student` | Dev 1 |
| Implementer `core-auth` | Dev 1 |
| Exposer `/me` et logique de validation de token | Dev 1 |
| Tester l'emission et la lecture du JWT | Dev 1 + PM |
| Ajouter le flux de login cote frontend | Dev 1 |
| Verifier le passage du token via le gateway | Dev 1 + IT 1 + PM |

### Livrables

- login fonctionnel
- JWT valide
- roles fonctionnels
- premier parcours frontend vers Keycloak

## 9. Sprint 3 - `upload-service`

**Objectif :** permettre a un enseignant d'ajouter un cours et ses fichiers.

### Taches

| Tache | Responsable |
|---|---|
| Definir le modele metadata des cours | Dev 2 |
| Implementer creation de cours | Dev 2 |
| Implementer upload fichier vers MinIO | Dev 2 |
| Enregistrer metadata dans Cassandra | Dev 2 |
| Reutiliser la validation `teacher` depuis `core-auth` | Dev 1 + Dev 2 |
| Ajouter le formulaire frontend upload | Dev 1 |
| Rediger cas de recette teacher | PM |
| Tester les erreurs d'upload | PM + Dev 3 |

### Livrables

- enseignant peut ajouter un cours
- fichier stocke dans MinIO
- metadata stockees dans Cassandra
- parcours upload visible dans le frontend

## 10. Sprint 4 - `download-service`

**Objectif :** permettre a un etudiant de consulter et telecharger les ressources.

### Taches

| Tache | Responsable |
|---|---|
| Implementer listing des cours | Dev 3 |
| Implementer detail d'un cours | Dev 3 |
| Lire metadata depuis Cassandra | Dev 3 |
| Generer lien de telechargement securise MinIO | Dev 3 |
| Verifier coherence metadata upload/download | Dev 2 + Dev 3 |
| Ajouter pages liste et detail frontend | Dev 1 |
| Verifier acces `student` | Dev 1 |
| Rediger cas de recette student | PM |

### Livrables

- listing des cours fonctionnel
- telechargement securise operationnel
- parcours etudiant demonstrable

## 11. Sprint 5 - `admin-service`

**Objectif :** permettre a l'administrateur de gerer les utilisateurs et les roles.

### Taches

| Tache | Responsable |
|---|---|
| Implementer `admin-service` | Dev 3 |
| Integrer creation utilisateur via Keycloak | Dev 1 + Dev 3 |
| Gerer affectation de roles | Dev 3 |
| Lister les utilisateurs | Dev 3 |
| Proteger les routes admin | Dev 1 |
| Ajouter ecrans admin frontend | Dev 1 |
| Rediger cas de recette admin | PM |

### Livrables

- creation d'utilisateur fonctionnelle
- gestion des roles operationnelle
- parcours admin demonstrable

## 12. Sprint 6 - Integration frontend + gateway

**Objectif :** rendre l'application coherente du point de vue utilisateur.

### Taches

| Tache | Responsable |
|---|---|
| Creer dashboard par role | Dev 1 |
| Centraliser les appels API | Dev 1 |
| Aligner les routes frontend sur `/api/auth`, `/api/upload`, `/api/download`, `/api/admin` | Dev 1 |
| Verifier que le flux normal passe par le gateway | Dev 1 + IT 1 + PM |
| Corriger incoherences backend/frontend | Dev 1 + Dev 2 + Dev 3 + IT 1 |
| Rediger checklists de demo fonctionnelle | PM |

### Livrables

- navigation claire par role
- routes API alignees avec la V3 reviewed
- demonstration de bout en bout en dev mode

## 13. Sprint 7 - Docker images et deploy mode

**Objectif :** preparer le passage du dev mode au deploy mode.

### Taches

| Tache | Responsable |
|---|---|
| Finaliser les `Dockerfile` de tous les composants | IT 1 + PM |
| Stabiliser les variables d'environnement | IT 1 + PM |
| Preparer manifests Kubernetes | IT 1 |
| Preparer `Deployment`, `Service`, `Ingress`, `ConfigMap`, `Secret` | IT 1 + PM |
| Valider besoins auth pour deploy | Dev 1 |
| Valider persistance MinIO | Dev 2 |
| Valider persistance Cassandra | Dev 3 |
| Rediger documentation de deploiement | PM + IT 1 |

### Livrables

- images Docker pretes
- manifests Kubernetes prets
- documentation deploy mode prete

## 14. Sprint 8 - Deploiement sur infra cible

**Objectif :** deployer la solution sur Ubuntu 24.10 heberge sur VMware ESXi.

### Taches

| Tache | Responsable |
|---|---|
| Preparer VMs Ubuntu 24.10 | IT 1 + PM |
| Configurer cluster Kubernetes de base | IT 1 |
| Deployer frontend et microservices | IT 1 + PM |
| Deployer `keycloak`, `cassandra`, `minio` selon l'architecture retenue | IT 1 + PM |
| Verifier l'accessibilite reseau et Ingress | IT 1 + PM |
| Realiser recette post-deploiement | PM + Tous |

### Livrables

- plateforme deployee sur l'infra cible
- services accessibles
- recette deploy mode validee

## 15. Sprint 9 - IA bonus avec Ollama

**Objectif :** ajouter l'IA sans casser le coeur ENT.

### Taches

| Tache | Responsable |
|---|---|
| Installer et tester Ollama | IT 1 + Dev 2 |
| Choisir un cas d'usage simple : resume ou Q/R | PM + Tous |
| Connecter le service IA aux documents de cours | Dev 2 + Dev 3 |
| Gerer auth si necessaire | Dev 1 |
| Ajouter une interface simple cote frontend | Dev 1 |
| Rediger limites et valeur du bonus IA | PM |

### Livrables

- bonus IA demonstrable
- usage clair et limite
- integration non bloquante pour le coeur ENT

## 16. Sprint 10 - Stabilisation et soutenance

**Objectif :** fiabiliser le rendu final et preparer la presentation.

### Taches

| Tache | Responsable |
|---|---|
| Corriger bugs restants | Tous |
| Ajouter logs et monitoring simple si temps disponible | IT 1 + PM |
| Finaliser slides | PM |
| Ecrire script de demo | PM |
| Repartir la parole a l'oral | PM + Tous |
| Faire au moins une repetition complete | Tous |

### Livrables

- version finale stable
- presentation prete
- demo repetee

## 17. Backlog minimum indispensable

Si le temps manque, il faut absolument finir :

1. `core-auth`
2. `upload-service`
3. `download-service`
4. `admin-service`
5. frontend minimum
6. gateway local coherent
7. Docker Compose pour le dev mode
8. Dockerfiles des composants principaux

Ensuite seulement :

1. Kubernetes complet
2. deploiement ESXi complet
3. monitoring
4. Ollama

## 18. Definition of Done

Une tache n'est pas terminee si elle est juste codee.

Elle doit etre :

- poussee sur Git
- testee manuellement
- documentee
- integrable avec le reste
- demonstrable
- relue par au moins un autre membre si possible

## 19. Risques a surveiller

| Risque | Reponse |
|---|---|
| Keycloak prend trop de temps | le figer tres tot dans le projet |
| Cassandra complique le schema | garder un modele minimal |
| Gateway et frontend divergent | integrer des le sprint 1 puis sprint 6 |
| Kubernetes commence trop tot | le garder pour les sprints 7 et 8 |
| Ollama consomme trop de ressources | le garder comme bonus optionnel |

## 20. Scenario de demo finale

Le scenario de demo le plus coherent avec la proposition V3 reviewed est :

1. login admin
2. creation d'un enseignant et d'un etudiant
3. login teacher
4. ajout d'un cours avec fichier
5. login student
6. consultation de la liste des cours
7. telechargement securise
8. bonus IA avec Ollama si stable

## 21. Priorite globale

L'ordre de priorite a respecter est :

1. socle dev mode
2. `core-auth`
3. `upload-service`
4. `download-service`
5. `admin-service`
6. integration frontend + gateway
7. deploy mode Kubernetes
8. IA bonus
