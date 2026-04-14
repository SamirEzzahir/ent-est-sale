# Rôle PM — Équipe de 5 (3 Dev + 2 IT)

## 1. Contexte de l'équipe

| Membre | Profil |
|---|---|
| Dev 1 | Développeur backend — `core-auth` + Keycloak |
| Dev 2 | Développeur backend — `upload-service` + MinIO |
| Dev 3 | Développeur backend — `download-service` + `admin-service` |
| IT 1 | Infrastructure / DevOps — Docker, Kubernetes, VMs |
| **IT 2 / PM** | **Toi — Pilotage, coordination, documentation, recette** |

---

## 2. Rôle principal du PM

Tu es le **coordinateur du projet**.

Tu es l'interface entre :

- le besoin du professeur
- le travail technique des développeurs
- le travail infrastructure des IT
- le planning de livraison
- la documentation
- la soutenance finale

En une phrase :

> **Tu n'es pas la personne qui fait tout. Tu es la personne qui fait avancer tout le monde dans la bonne direction.**

---

## 3. Responsabilités concrètes

### 3.1 Cadrer le projet

Vérifier en permanence que tout le monde travaille sur le bon objectif :

- respect des 4 microservices imposés
- respect de la stack technique définie
- périmètre MVP clair et partagé
- priorités bien définies et visibles

Rappeler régulièrement :

- ce qu'on fait maintenant
- ce qu'on fera en phase suivante
- ce qu'on ne fait **pas** dans la v1

### 3.2 Organiser et suivre le travail

Être capable de répondre à tout moment à :

- qui travaille sur quoi ?
- qu'est-ce qui est terminé ?
- qu'est-ce qui est en cours ?
- qu'est-ce qui bloque ?
- quelles tâches dépendent d'une autre ?

### 3.3 Suivre les deadlines

Éviter deux problèmes classiques :

- tout le monde code, mais rien n'est assemblé
- l'intégration est repoussée à la dernière semaine

Actions concrètes :

- fixer des mini-deadlines par sprint
- organiser des points de contrôle réguliers
- planifier des démos internes après chaque sprint

### 3.4 Centraliser l'information

Maintenir les documents de référence :

- backlog et tableau d'avancement
- planning sprint
- rôles et responsabilités
- conventions Git
- liste des APIs exposées
- variables d'environnement partagées
- checklist de démo

### 3.5 Débloquer l'équipe

Quand quelqu'un est bloqué, agir vite.

Exemples de blocages fréquents :

- un dev attend la structure d'une API
- l'IT attend les variables d'environnement
- le frontend attend les routes backend
- un membre ne sait pas quoi faire ensuite

Dans ces cas, le rôle du PM est de :

1. identifier le blocage précisément
2. assigner quelqu'un pour le résoudre
3. suivre jusqu'à résolution

---

## 4. Responsabilités techniques du PM

En tant que PM, tu peux rester actif techniquement sans être le développeur principal.

Tâches adaptées à ce profil :

- vérification des endpoints (tests via Postman ou Swagger)
- tests fonctionnels et recette
- vérification de la cohérence backend / frontend
- relecture de la documentation technique
- suivi des variables d'environnement
- vérification du `docker-compose.yml`
- rédaction et mise à jour de `DAT_V2.md`, `SPRINT_PLAN.md`, `README.md`

Ton profil PM peut donc combiner :

- **coordination et pilotage**
- **documentation technique**
- **QA / recette fonctionnelle**

Ces contributions ont une vraie valeur dans un projet comme le vôtre.

---

## 5. Rythme hebdomadaire recommandé

### Début de semaine

- définir les objectifs de la semaine
- assigner les tâches à chaque membre
- identifier les dépendances critiques et les priorités

### Milieu de semaine

- vérifier l'avancement des tâches
- identifier les blocages
- réaliser une intégration partielle si possible

### Fin de semaine

Produire un mini bilan :

| Statut | Contenu |
|---|---|
| Fait | Tâches terminées cette semaine |
| En cours | Tâches commencées mais pas finies |
| Bloqué | Ce qui ralentit l'équipe |
| Prochaine étape | Priorités de la semaine suivante |

---

## 6. Format de réunion d'équipe

Une réunion courte et efficace. Chaque membre répond à 3 questions :

1. Qu'est-ce que j'ai terminé depuis la dernière réunion ?
2. Qu'est-ce que je fais ensuite ?
3. Qu'est-ce qui me bloque ?

Rôle du PM pendant la réunion :

- maintenir la réunion courte (15 min max)
- noter les blocages
- transformer chaque blocage en action assignée

---

## 7. Tableau de suivi

| Tâche | Responsable | Statut | Deadline | Blocage |
|---|---|---|---|---|
| Keycloak setup | Dev 1 | En cours | 10/04 | Aucun |
| Docker Compose | IT 1 | Terminé | 09/04 | Aucun |
| Upload API | Dev 2 | En cours | 12/04 | Attente schéma metadata |
| Download API | Dev 3 | À faire | 14/04 | Dépend de Cassandra |
| DAT V2 | PM | En cours | 11/04 | Aucun |

---

## 8. Points de vigilance

### Intégration

Le plus grand risque du projet n'est pas le code lui-même, c'est l'absence d'intégration.

À vérifier tôt et régulièrement :

- le frontend communique bien avec les APIs
- les tokens JWT circulent correctement
- MinIO est accessible depuis les services
- Cassandra est accessible depuis les services
- Docker Compose lance tout le système sans erreur

### Documentation

Ne pas laisser la documentation pour la fin. La construire pendant le projet :

- architecture et décisions techniques
- liste des endpoints et leurs formats
- variables d'environnement nécessaires
- captures d'écran de l'interface
- difficultés rencontrées et solutions

### Préparation de la démo

Penser à la démo dès le début du projet.

Question à se poser régulièrement :

> **Si le professeur demande une démo demain, qu'est-ce qu'on peut lui montrer ?**

---

## 9. Erreurs à éviter

| Erreur | Conséquence |
|---|---|
| Laisser chaque membre travailler sans coordination | Travaux incompatibles, intégration impossible |
| Attendre la fin pour assembler les parties | Panique en dernière semaine |
| Ne pas noter les décisions prises | Confusion et contradictions dans l'équipe |
| Ne pas suivre les retards | Surprises à la livraison |
| Devenir simple observateur | Perte de valeur et de contrôle |

Un bon PM est **actif**, pas passif.

---

## 10. Rôle pendant la soutenance

Le PM prend en charge :

- présentation du contexte et de l'ENT
- objectif du projet
- organisation de l'équipe
- planning et démarche adoptée
- conclusion et bilan

Les parties techniques détaillées sont présentées par les membres concernés.

### Répartition recommandée

| Membre | Partie présentée |
|---|---|
| PM | Contexte, organisation, roadmap, conclusion |
| Dev 1 | Authentification et sécurité |
| Dev 2 | Upload et stockage |
| Dev 3 | Download et administration |
| IT 1 | Docker, Kubernetes, déploiement |

---

## 11. Livrables du PM

Documents dont le PM est responsable :

- `ENT_PROPOSAL_V2.md`
- `DAT_V2.md`
- `SPRINT_PLAN.md`
- `README.md`
- Backlog des tâches (outil au choix)
- Tableau d'avancement
- Plan de soutenance
- Checklist de démo

Ces livrables prouvent que le projet est réellement piloté.

---

## 12. Résumé du rôle

> Je suis PM. Je pilote l'organisation du projet, je coordonne les membres, je suis l'avancement, je gère la documentation, je traite les blocages et je prépare l'intégration finale et la soutenance.

Tu n'as pas besoin d'être le plus gros codeur du groupe pour être essentiel au succès du projet.



