FROM node:20

WORKDIR /app

# Installation de TypeScript globalement
RUN npm install -g typescript

COPY package.json ./
RUN npm install
RUN npm install jsonwebtoken cookie-parser
RUN npm install jsonwebtoken @types/jsonwebtoken
RUN npm install cookie-parser @types/cookie-parser

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



#  dockerfile work on linux
# FROM node:20

# WORKDIR /app

# COPY package.json ./
# RUN npm install
# RUN npm install jsonwebtoken cookie-parser
# RUN npm install jsonwebtoken @types/jsonwebtoken
# RUN npm install cookie-parser @types/cookie-parser

# COPY . .

# RUN npx tsc

# COPY src/database/schema.sql dist/database/schema.sql

# EXPOSE 3000

# CMD ["node", "dist/server.js"]