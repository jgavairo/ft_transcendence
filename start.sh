#!/bin/sh

# Démarrage du backend
cd /app/backend && npm run dev &

# Démarrage du frontend
cd /app/frontend && npm run dev 