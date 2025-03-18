# 🏆 ft_transcendence  

## 🏗️ Modules & Architecture  

Le projet **ft_transcendence** repose sur plusieurs modules clés qui améliorent l'expérience utilisateur et assurent une architecture robuste.  

### 🔹 1. Standard User Management (Majeur)  
➡️ Permet aux utilisateurs de s'inscrire, se connecter, gérer leurs profils et ajouter des amis.  
✅ Essentiel pour plusieurs fonctionnalités comme le matchmaking, la gestion des tournois et le chat.  

### 🔹 2. Remote Players (Majeur)  
➡️ Permet de jouer en ligne contre d’autres joueurs.  
✅ Indispensable pour rendre le jeu accessible en multijoueur et interagir avec d'autres modules comme le chat.  

### 🔹 3. Live Chat (Majeur)  
➡️ Ajoute un chat intégré permettant aux joueurs de communiquer et d’inviter d’autres à jouer.  
✅ Compatible avec User Management et Remote Players pour une meilleure interaction.  

### 🔹 4. AI Opponent (Majeur)  
➡️ Introduit un adversaire IA, permettant aux joueurs de jouer même en l'absence d'opposants humains.  
✅ Accélère les tests et assure une expérience solo de qualité.  

### 🔹 5. Web Framework Backend (Fastify + Node.js) (Majeur)  
➡️ Utilisation de **Fastify** avec **Node.js** pour optimiser les performances backend.  
✅ Simplifie la gestion des utilisateurs, des sessions et de l’authentification.  

### 🔹 6. Two-Factor Authentication & JWT (Majeur)  
➡️ Implémente l'authentification à deux facteurs (2FA) et les JWT pour renforcer la sécurité.  
✅ Augmente la fiabilité du **User Management** et protège les comptes utilisateurs.  

### 🔹 7. Database (SQLite) & Game Stats Dashboard (Mineur + Mineur = Majeur)  
➡️ **SQLite** pour un stockage efficace des utilisateurs et des matchs.  
➡️ **Game Stats Dashboard** pour afficher les performances et statistiques des joueurs.  
✅ Facilite l'analyse des performances et l'amélioration du jeu.  

### 🔹 8. Multiplayer (Plus de 2 joueurs en simultané) (Majeur)  
➡️ Ajoute la prise en charge de matchs impliquant plusieurs joueurs au-delà du 1v1 classique.  

### 🔹 9. Fonctionnalités supplémentaires  
- 🌍 **Multiple Languages** : Prise en charge de plusieurs langues pour une accessibilité accrue.  
- 🎨 **Game Customization** : Permet aux utilisateurs de personnaliser l'apparence et les règles du jeu.  
- 🔑 **Remote Authentication (Google Sign-In)** : Authentification avec Google pour simplifier la connexion des utilisateurs.  

---  

> 🔗 **Wireframes & UI/UX** : [Miro Board](https://miro.com/app/board/uXjVIQuhdj8=/)  

---

## 🛠 Installation  
```bash
git clone https://github.com/ton-repo/ft_transcendence.git
cd ft_transcendence
docker-compose up --build

---

my-pong-project/
│
├── backend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── index.js
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── frontend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── db/
│   ├── Dockerfile
│   └── init-db.sql
│
├── docker-compose.yml
└── README.md

---


# Installation de nvm (vérifiez sur le dépôt officiel pour la dernière version)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

# Rechargement de l'environnement nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Installation de la version LTS de Node.js
nvm install --lts

# Définir la version installée comme version par défaut
nvm alias default node


YOOOUUUUPIIIIIIIIIII