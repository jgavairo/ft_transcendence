# ft_transcendence

## Description
Projet de jeu en ligne avec authentification, chat en direct et matchmaking.

## Prérequis
- Docker
- Docker Compose

## Installation

1. Cloner le repository :
```bash
git clone [URL_DU_REPO]
cd ft_transcendence
```

2. Lancer l'application :
```bash
docker-compose up --build
```

## Accès
- Frontend : http://localhost:8080
- Backend API : http://localhost:3000

## Structure du projet
- `/backend` : Serveur Node.js avec Fastify
- `/frontend` : Application React avec Vite
- `/data` : Base de données SQLite

## Développement
- Le frontend et le backend sont en mode développement avec hot-reload
- Les modifications dans les fichiers sont automatiquement rechargées
- La base de données est persistante dans le dossier `/data`

## Fonctionnalités implémentées
- Authentification utilisateur
- Chat en direct
- Matchmaking
- Interface utilisateur moderne avec Chakra UI 