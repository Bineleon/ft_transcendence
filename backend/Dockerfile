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

FROM node:20-alpine

WORKDIR /app

# 1) Copier d'abord les manifestes + le schéma Prisma
COPY package*.json ./
COPY prisma ./prisma

# 2) Installer (le postinstall "prisma generate" va maintenant réussir)
RUN npm ci
RUN apk add curl

# 3) Copier le reste du code
COPY . .

# 4) (optionnel mais recommandé) Générer Prisma à nouveau au cas où
RUN npx prisma generate

# Variables d'env (exemple)
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/database/app.db"

# Démarrage (à adapter : dev/prod)
CMD ["node", "dist/server.js"]