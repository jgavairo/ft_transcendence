# ft_transcendence

## Description
Projet de jeu en ligne avec authentification, chat en direct et matchmaking.

## Prérequis
- Docker
- Docker Compose

## Installation et Lancement

1. Cloner le repository :
```bash
git clone https://github.com/jgavairo/ft_transcendence.git
cd ft_transcendence
```

2. Lancer l'application :
```bash
docker compose up -d || docker compose up --build -d
```

Pour arrêter l'application :
```bash
docker compose down
```

## Accès
- Frontend : http://localhost:8080
- Backend API : http://localhost:3000

## Structure du projet
```
ft_transcendence/
├── frontend/                # Application frontend
│   ├── src/
│   │   ├── pages/          # Pages de l'application
│   │   │   ├── Store/      # Page du store
│   │   │   │   └── store.ts    # Logique du store
│   │   │   ├── Library/    # Page de la bibliothèque
│   │   │   │   └── library.ts  # Logique de la bibliothèque
│   │   │   └── Community/  # Page de la communauté
│   │   │       └── community.ts # Logique de la communauté
│   │   ├── styles/         # Fichiers CSS
│   │   ├── main.ts         # Point d'entrée
│   │   ├── navigation.ts   # Gestion de la navigation
│   │   └── route.ts        # Configuration des routes
│   ├── index.html          # Template HTML
│   ├── vite.config.ts      # Configuration Vite
│   └── package.json        # Dépendances frontend
│
├── backend/                 # Serveur backend
│   └── src/                # Code source backend
│
├── data/                   # Base de données et fichiers persistants
├── utils/                  # Utilitaires
├── docker compose.yml      # Configuration Docker Compose
├── Dockerfile             # Configuration Docker
└── start.sh              # Script de démarrage
```

## Configuration Docker
Le projet utilise Docker pour l'environnement de développement :
- Un conteneur pour le frontend (Vite + React)
- Un conteneur pour le backend (Node.js + Fastify)
- Base de données SQLite avec persistance des données

## Développement
- Hot-reload activé pour le frontend et le backend
- Les modifications sont automatiquement détectées
- La base de données est persistante dans le dossier `/data`

## Commandes utiles
```bash
# Démarrer l'application en reconstruisant les images
docker compose up --build    # Le flag --build force la reconstruction des images

# Démarrer en mode détaché (arrière-plan)
docker compose up -d        # Le flag -d lance les conteneurs en background

# Démarrer en mode détaché avec reconstruction
docker compose up -d --build

# Voir les logs (utile en mode détaché)
docker compose logs -f      # Le flag -f permet de suivre les logs en temps réel

# Redémarrer un service spécifique
docker compose restart frontend
docker compose restart backend

# Arrêter l'application
docker compose down        # Arrête et supprime les conteneurs

# Nettoyer les conteneurs et volumes
docker compose down -v     # Le flag -v supprime aussi les volumes
```

## Architecture technique
- Frontend : TypeScript, React, Vite
- Backend : Node.js, Fastify
- Base de données : SQLite
- Conteneurisation : Docker

## Fonctionnalités implémentées
- Authentification utilisateur
- Chat en direct
- Matchmaking
- Interface utilisateur moderne avec Chakra UI 