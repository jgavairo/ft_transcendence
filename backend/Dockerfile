FROM node:20

WORKDIR /app

# Installation de TypeScript globalement
RUN npm install -g typescript

COPY package.json ./
RUN npm install
RUN npm install jsonwebtoken cookie-parser
RUN npm install jsonwebtoken @types/jsonwebtoken
RUN npm install cookie-parser @types/cookie-parser
RUN npm install multer @types/multer
RUN npm install fastify @fastify/cors @fastify/cookie @fastify/static @fastify/multipart @fastify/session @fastify/websocket @fastify/passport @fastify/express install @fastify/oauth2


COPY . .

# Création des dossiers nécessaires
RUN mkdir -p data uploads/profile_pictures

# Conversion des fins de ligne et compilation
RUN apt-get update && apt-get install -y dos2unix
RUN find . -type f -name "*.ts" -exec dos2unix {} \;
RUN find . -type f -name "*.json" -exec dos2unix {} \;
RUN find . -type f -name "*.js" -exec dos2unix {} \;

RUN tsc

# Copie du schéma SQL
COPY src/database/schema.sql dist/database/schema.sql

EXPOSE 3000

CMD ["node", "dist/server.js"]
