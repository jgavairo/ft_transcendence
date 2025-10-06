# ft_transcendence

Plateforme web temps-réel mêlant mini‑jeux (Pong, Tower), chat privé, gestion d’amis, classement et profils, avec authentification (Email + Google OAuth2), servie derrière un Nginx en HTTPS.

## Demo
- URL locale: `https://localhost:8443`
- En prod, le reverse proxy redirige vers `https://<hostname>.42lyon.fr:8443`

## Sommaire
- Aperçu
- Stack technique
- Architecture
- Lancer le projet
- Variables d’environnement
- Scripts utiles
- Frontend (statique)
- Backend (Fastify + Socket.IO)
- Base de données
- Jeux inclus
- Sécurité
- Déploiement
- FAQ
- Crédits

## Aperçu
- Authentification email/mot de passe + Google OAuth2
- Chat privé en temps-réel (Socket.IO)
- Amis, invitations, blocage, présence en ligne
- Jeux: Pong (matchmaking), Tower (1v1 et solo), classement
- News / Store / Library
- Upload d’avatar, profil, bio
- HTTPS via Nginx (certificats auto-générés en local)

## Stack technique
- Serveur: Fastify 4 + Socket.IO 4, TypeScript
- Auth: JWT en cookie HTTPOnly, Google OAuth2
- DB: SQLite (fichiers persistés via volumes Docker)
- Front: HTML/CSS/JS statique + modules ES (scripts en `scripts/`), Socket.IO client
- Reverse proxy: Nginx (TLS, proxy /api et /socket.io)
- Containerisation: Docker, `docker-compose`
- Outils: TypeScript, Tailwind (deps présentes), sharp/konva (assets), Makefile

## Architecture
- Nginx reverse proxy (HTTPS 8443) → backend Fastify (port 3000, HTTPS interne)
- Static: `public/`, `styles/`, `scripts/`, `assets/` servis par Nginx
- Uploads servis par Fastify via `/uploads/*`
- Namespaces Socket.IO: `/game`, `/chat`, `/notification`, `/tower`
- Routes REST principales: `/api/auth`, `/api/user`, `/api/profile`, `/api/friends`, `/api/chat`, `/api/games`, `/api/news`, `/api/stats`

Schéma (voir `presentation/usecases.html` pour un aperçu visuel et les use‑cases).

## Lancer le projet

Prérequis:
- Docker + Docker Compose
- Make (optionnel mais recommandé)

Démarrage rapide:
```bash
make up
# génère les certifs auto-signés et lance nginx + backend + volumes
```

Arrêt / nettoyage:
```bash
make stop
make down
make clean   # supprime volumes + certifs
make restart # regénère certifs et redémarre
```

Accès:
- `https://localhost:8443` (ignorez l’avertissement de certificat auto‑signé)

## Variables d’environnement
Fichier `.env` (chargé par `docker-compose.yml` pour le service backend):
- `HOSTNAME` (ex: `localhost` ou sous-domaine sans TLD pour 42lyon redirect)
- `JWT_SECRET` (obligatoire)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- Toute config SMTP si utilisée par nodemailer (si activée)

Note: le backend lit les certificats en `/app/ssl/*.pem` (montés depuis `docker/nginx/ssl`).

## Scripts utiles
- `make up|down|stop|clean|restart`
- Backend (dans `backend/`):
  - `npm run dev` (ts-node `src/server.ts`)
  - `tsc` pour compiler en `dist/` (Dockerfile le fait au build)

## Frontend (statique)
- Entrée: `public/index.html`
- Styles: `styles/*.css`
- Scripts: `scripts/main.ts/js`, pages (`scripts/pages/*`), managers/helpers, jeux (`scripts/games/*`)
- Socket.IO client importé via importmap CDN sur `index.html`
- Les assets sont dans `assets/` (images, sprites, etc.)

## Backend (Fastify + Socket.IO)
- Entrée: `backend/src/server.ts`
- Plugins: `@fastify/cors`, `@fastify/cookie`, `@fastify/multipart`, `@fastify/static`, `@fastify/oauth2`, `fastify-socket.io`
- HTTPS interne: clé/cert en `/app/ssl` (via volume)
- Auth Google: `/api/auth/google` → callback `https://${HOSTNAME}:8443/api/auth/google/callback`
- Sockets:
  - `/chat`: messages privés, broadcast, mappage `userId/username → socketId`
  - `/notification`: enregistrement par `username` pour push événementiels
  - `/game`: matchmaking Pong
  - `/tower`: matchmaking, solo, boucle de jeu serveur, persistance historique et MMR
- Uploads: `@fastify/static` expose `/uploads/` (avatars…)

Routes principales: voir `backend/src/routes/*`.

## Base de données
- SQLite, schéma: `backend/src/database/schema.sql`
  - `users`, `messages`, `games`, `news`, `game_user_rankings`, `match_history`, `game_player`
- Dossier data persisté via volume Docker `ft_transcendence_db`
- Uploads persistés via volume `ft_transcendence_uploads`

## Jeux inclus
- Pong: matchmaking via namespace `/game`, endpoints utilitaires `room-exists`, etc.
- Tower: solo ou 1v1, `GAME_CONFIG.TICK_RATE` pour la fréquence, sauvegarde historique et classements.

## Sécurité
- Cookies HTTPOnly pour JWT (secure en prod)
- CORS permissif en dev (origin: true)
- Nginx force HTTPS (redir 80→8443), websockets proxifiés, SSL self-signed en local
- En prod, prévoir certificats valides et `secure=true`

## Déploiement
- Build via `docker-compose up --build` (ou `make up`)
- Nginx sert `public/`, `styles/`, `scripts/`, `assets/`; reverse proxy `/api` et `/socket.io` vers `backend:3000`
- Envoyer `HOSTNAME` correct et certificats en `docker/nginx/ssl`

## FAQ
- Erreur certificat: auto‑signé en local → accepter l’exception
- Google OAuth2 ne redirige pas: vérifier `HOSTNAME`, client/secret et callback autorisé
- Pas d’images de profil: vérifier volume `uploads_data` et droits

## Crédits
Projet 42 ft_transcendence. Équipe: Gavairon Jordan (jgavairo), Le-Pierres Loic (lle-pier) et Bolea Axel (abolea)