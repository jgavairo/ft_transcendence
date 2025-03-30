FROM node:20

WORKDIR /app

COPY package.json ./
RUN npm install
RUN npm install jsonwebtoken cookie-parser
RUN npm install jsonwebtoken @types/jsonwebtoken

COPY . .

RUN npx tsc

COPY src/database/schema.sql dist/database/schema.sql

EXPOSE 3000

CMD ["node", "dist/server.js"]