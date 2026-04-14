# GitHub Setup Guide - Projet ENT

## 1. Objectif

Ce guide explique **pas a pas** comment creer votre repository GitHub de maniere coherente avec votre projet ENT.

Il est aligne avec :

- [ENT_PROPOSAL_V3_REVIEWED.md](/c:/Users/samir/Desktop/IAWM/Semister%206/DevOps%20et%20cloud2/Project_ENT/ENT_PROPOSAL_V3_REVIEWED.md)
- [SPRINT_PLAN.md](/c:/Users/samir/Desktop/IAWM/Semister%206/DevOps%20et%20cloud2/Project_ENT/SPRINT_PLAN.md)

## 2. Recommandation principale

### Choix recommande : `1 mono-repo`

Pour votre equipe, je recommande **un seul repository GitHub**.

### Pourquoi ?

Parce que vous etes :

- 5 etudiants
- sur un seul projet
- avec 4 microservices tres lies
- avec un frontend commun
- avec une infrastructure commune

Un mono-repo vous donne :

- un seul `git clone`
- une seule vision du projet
- une integration plus simple
- un `docker-compose.yml` commun
- une meilleure coherence entre frontend, backend et DevOps

### Donc, ne creez pas 4 repos separes

Ce serait plus difficile pour vous a ce stade.

## 3. Nom du repository

Je vous conseille un nom simple et propre, par exemple :

- `ent-est-sale`
- `project-ent`
- `ent-est-sale-devops`

### Mon conseil

Le plus propre :

```text
ent-est-sale
```

## 4. Structure cible du repository

Quand vous commencerez le code, le repo devra ressembler a ceci :

```text
ent-est-sale/
|
|-- docs/
|   |-- ENT_PROPOSAL_V3_REVIEWED.md
|   |-- DAT_V2.md
|   |-- SPRINT_PLAN.md
|   `-- PM_ROLE.md
|
|-- frontend/
|
|-- backend/
|   |-- core-auth/
|   |-- upload-service/
|   |-- download-service/
|   `-- admin-service/
|
|-- nginx/
|-- keycloak/
|-- cassandra/
|-- minio/
|-- k8s/
|
|-- docker-compose.yml
|-- .env.example
|-- .gitignore
`-- README.md
```

### Pourquoi cette structure ?

- `docs/` garde toute la documentation propre
- `frontend/` est separe du backend
- `backend/` contient les 4 microservices imposes
- les dossiers DevOps sont clairs
- la racine du projet reste lisible

## 5. Etat actuel du dossier

Le dossier local actuel **n'est pas encore un repository Git**.

Donc vous devez commencer par initialiser Git localement.

## 6. Etape 1 - Creer le repository sur GitHub

### Comment

1. Ouvrez GitHub
2. Cliquez sur `New repository`
3. Choisissez le nom :

```text
ent-est-sale
```

4. Choisissez `Private` ou `Public`

### Que choisir ?

Pour un projet d'etudiants, je conseille :

- `Private` si vous voulez travailler tranquillement
- `Public` seulement si votre prof vous demande de partager

### Important

Au moment de creation, vous pouvez :

- laisser GitHub creer un `README`
- ou ne rien initialiser

### Mon conseil

Choisissez :

- **sans README**
- **sans .gitignore**
- **sans licence**

### Pourquoi ?

Parce que vous avez deja un dossier local et vous allez l'attacher au repo distant.

## 7. Etape 2 - Initialiser Git en local

Dans votre dossier projet, ouvrez PowerShell et executez :

```powershell
git init
git branch -M main
```

### Pourquoi ?

- `git init` transforme le dossier en repository Git local
- `git branch -M main` definit `main` comme branche principale

## 8. Etape 3 - Creer une bonne base avant le premier push

Avant de pousser sur GitHub, il faut nettoyer un peu la structure.

### Ce que je vous conseille

1. garder seulement les documents utiles a la racine ou les deplacer dans `docs/`
2. eviter de commit des fichiers temporaires
3. preparer un `.gitignore`

## 9. Etape 4 - Creer `.gitignore`

### Pourquoi ?

Pour eviter de pousser :

- mots de passe
- caches Python
- `node_modules`
- fichiers de build
- logs
- `.env`

### Exemple recommande

```gitignore
# Environment
.env
.env.local

# Python
__pycache__/
*.pyc
.venv/
venv/

# Node
node_modules/
dist/
build/

# IDE
.vscode/
.idea/

# Logs
*.log

# OS
Thumbs.db
.DS_Store
```

## 10. Etape 5 - Faire le premier commit

Une fois Git initialise :

```powershell
git add .
git commit -m "chore: initial project documentation and structure"
```

### Pourquoi ?

Le premier commit sert de base commune pour toute l'equipe.

## 11. Etape 6 - Connecter le repo local a GitHub

Sur GitHub, apres creation du repository, vous aurez une URL comme :

```text
https://github.com/<username-or-org>/ent-est-sale.git
```

Ensuite dans PowerShell :

```powershell
git remote add origin https://github.com/SamirEzzahir/ent-est-sale.git
git push -u origin main
```

### Pourquoi ?

- `origin` = le repo GitHub distant
- `push -u` connecte votre branche locale `main` a la branche distante `main`

## 12. Etape 7 - Creer la branche `develop`

Je vous conseille une petite strategie simple :

- `main` = version stable
- `develop` = branche d'integration
- `feature/...` = branches de travail

### Commandes

```powershell
git checkout -b develop
git push -u origin develop
```

### Pourquoi ?

Comme ca :

- `main` reste propre
- vous integrez d'abord dans `develop`
- vous evitez de casser la branche principale

## 13. Etape 8 - Ajouter les membres de l'equipe

Ajoutez vos membres GitHub au repository :

- `chorok`
- `hamza`
- `abdelhak`
- `soufian`
- `samir`

### Pourquoi ?

Chaque membre pourra :

- cloner le repo
- creer une branche
- faire ses commits
- ouvrir des pull requests

## 14. Etape 9 - Repartition des branches

Je vous conseille ce schema :

```text
main
develop
feature/core-auth
feature/upload-service
feature/download-service
feature/admin-service
feature/frontend
feature/devops-compose
feature/k8s-manifests
feature/docs
```

### Coherence avec votre equipe

- `chorok` : `feature/core-auth` et `feature/frontend`
- `hamza` : `feature/upload-service`
- `abdelhak` : `feature/download-service` et `feature/admin-service`
- `soufian` : `feature/devops-compose` et `feature/k8s-manifests`
- `samir` : `feature/docs`, suivi integration, PR review, support DevOps

## 15. Etape 10 - Workflow quotidien

Chaque membre doit faire ceci :

```powershell
git checkout develop
git pull origin develop
git checkout -b feature/ma-tache
```

Puis apres travail :

```powershell
git add .
git commit -m "feat(upload-service): add course file upload endpoint"
git push -u origin feature/ma-tache
```

Ensuite :

- ouvrir une Pull Request vers `develop`
- faire relire par un membre
- merger seulement si c'est propre

## 16. Etape 11 - Regles de travail equipe

### Regles simples

- personne ne pousse directement sur `main`
- personne ne travaille directement sur `develop`
- chaque fonctionnalite a sa branche
- chaque merge important passe par Pull Request

### Pourquoi ?

Parce que vous etes une equipe etudiante, donc vous devez :

- garder l'historique propre
- limiter les conflits
- apprendre la vraie logique de travail collaborative

## 17. Etape 12 - Ce que chacun doit pousser

### `Dev 1 - chorok`

- `core-auth`
- frontend login
- frontend dashboards

### `Dev 2 - hamza`

- `upload-service`
- integration MinIO
- metadata Cassandra cote upload

### `Dev 3 - abdelhak`

- `download-service`
- `admin-service`
- lecture Cassandra

### `IT 1 - soufian`

- `docker-compose.yml`
- `nginx`
- Dockerfiles
- Kubernetes manifests

### `IT 2 / PM - samir`

- documentation
- README
- guide de lancement
- recette
- support DevOps
- coordination integration

## 18. Etape 13 - README minimal

Votre `README.md` doit expliquer :

- le but du projet
- la stack
- la structure des dossiers
- comment lancer le projet en local
- comment utiliser les branches

## 19. Etape 14 - Branch protection

Quand le repo est cree, je vous conseille d'activer sur GitHub :

- protection de `main`
- protection de `develop`
- pull request obligatoire

### Pourquoi ?

Ca evite :

- les pushes accidentels
- les merges trop rapides
- les erreurs de coordination

## 20. Etape 15 - Premier objectif concret

Une fois le repo cree, votre premier objectif ne doit pas etre "coder tout le projet".

Le premier objectif doit etre :

1. repo GitHub cree
2. repo local connecte
3. branches `main` et `develop` pretes
4. equipe ajoutee
5. structure de dossiers creee
6. Docker Compose de base lance

## 21. Ordre pratique recommande

Voici l'ordre exact que je te conseille :

1. creer le repo GitHub
2. faire `git init`
3. faire le premier commit
4. connecter `origin`
5. pousser `main`
6. creer `develop`
7. inviter l'equipe
8. creer l'arborescence du projet
9. creer les branches features
10. commencer le travail par sprint

## 22. Ce que je te recommande personnellement comme PM

Toi `samir`, je te conseille de faire :

- creation du repo GitHub
- mise en place initiale Git
- creation de `main` et `develop`
- ajout des membres
- redaction du `README`
- verification des PR
- suivi de la coherence globale

Ca correspond parfaitement a ton role de PM + support IT.

## 23. Conclusion

Le choix le plus coherent pour votre projet est :

- **1 seul repository GitHub**
- structure mono-repo
- branches `main`, `develop`, `feature/...`
- responsabilites claires par membre
- entraide possible, mais ownership principal maintenu

## 24. Si tu veux la suite

Je peux maintenant faire directement l'un de ces deux travaux :

1. creer un vrai `README.md` initial pour votre repo
2. creer un vrai `.gitignore` adapte a votre projet
