# Étape 1 : choisir une image Node officielle
FROM node:20-bookworm

# Étape 2 : définir le dossier de travail dans le conteneur
WORKDIR /app

# Étape 3 : copier les fichiers nécessaires
COPY package*.json ./

# Étape 4 : installer les dépendances
RUN npm install

# Étape 5 : copier le reste du code
COPY . .

# Étape 6 : exposer le port du serveur (3000)
EXPOSE 3000

# Étape 7 : commande par défaut pour lancer ton serveur
CMD ["node", "server.js"]
