FROM node:20-bookworm

WORKDIR /app

# Copier seulement package.json pour installer les dépendances
COPY package*.json ./
RUN npm install

# Copier le reste du code
COPY . .

# Lancer Vite en mode dev
CMD ["npm", "run", "dev", "--", "--host"]
