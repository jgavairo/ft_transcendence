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
# Installation des dépendances pour l'authentification Google
RUN npm install passport passport-google-oauth20
RUN npm install @types/passport @types/passport-google-oauth20
COPY . .

# Conversion des fins de ligne et compilation
RUN apt-get update && apt-get install -y dos2unix
RUN find . -type f -name "*.ts" -exec dos2unix {} \;
RUN find . -type f -name "*.json" -exec dos2unix {} \;
RUN find . -type f -name "*.js" -exec dos2unix {} \;

RUN tsc

COPY src/database/schema.sql dist/database/schema.sql

EXPOSE 3000

CMD ["node", "dist/server.js"]