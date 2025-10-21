# # Étape 1 : choisir une image Node officielle
# FROM node:22-alpine

# # Étape 2 : définir le dossier de travail dans le conteneur
# WORKDIR /app

# # Deps pour node-gyp + SQLite (musl)
# RUN apk add --no-cache python3 make g++ pkgconfig sqlite sqlite-dev

# # Étape 3 : copier les fichiers nécessaires
# COPY package*.json ./

# # Étape 4 : installer les dépendances
# RUN npm ci

# # Étape 5 : copier le reste du code
# COPY . .

# # Étape 6 : exposer le port du serveur (3000)
# EXPOSE 3000

# # Étape 7 : commande par défaut pour lancer ton serveur
# CMD ["node", "server.ts"]

# Prod: build TS then run JS (single stage)
FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache python3 make g++ pkgconfig sqlite sqlite-dev

# 1) Install deps (dont Prisma & TS)
COPY package*.json ./
RUN npm ci

# 2) Prisma client (sinon erreur au runtime)
COPY prisma ./prisma
RUN npx prisma generate

# 3) Code + build TS -> dist/
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/database/app.db"
EXPOSE 3000

# 4) Appliquer les migrations au démarrage puis lancer l'app
CMD sh -c "npx prisma migrate deploy && node dist/server.js"
