FROM node:18-alpine

WORKDIR /app

# Installation des dépendances globales
RUN apk add --no-cache python3 make g++

# Copie des fichiers package.json
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Installation des dépendances
RUN cd frontend && npm install
RUN cd backend && npm install

# Copie du reste des fichiers
COPY frontend/ ./frontend/
COPY backend/ ./backend/

# Exposition des ports
EXPOSE 3000 8080

# Script de démarrage
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"] 