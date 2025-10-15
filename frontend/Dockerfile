# ===============================
# ft_transcendence Frontend Dockerfile
# Multi-stage build (Node 20) - Corrigé
# ===============================

# ===== Étape 1 : Builder =====
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Installer dépendances
COPY package*.json ./
RUN npm install --include=dev
RUN npm install -g tailwindcss postcss postcss-cli autoprefixer typescript

# Copier tout le code source
COPY . .

# Compiler TypeScript
RUN npx tsc

# Compiler Tailwind CSS
RUN npx postcss src/styles/tailwind.css -o dist/styles.css

# Copier index.html depuis src vers dist
RUN mkdir -p dist && cp src/index.html dist/

# ===== Étape 2 : Runtime =====
FROM node:20-bookworm-slim AS runtime

WORKDIR /app

# Installer serveur léger + openssl
RUN apt-get update && apt-get install -y openssl && npm install -g serve

# Copier build et certificats depuis builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/certs ./certs

# Générer certificat auto-signé si absent
RUN mkdir -p certs && \
    [ ! -f certs/frontend.key ] && \
    openssl req -x509 -nodes -days 365 \
        -subj "/C=FR/ST=Paris/L=Paris/O=ft_transcendence/OU=Dev/CN=localhost" \
        -newkey rsa:2048 \
        -keyout certs/frontend.key \
        -out certs/frontend.crt || echo "Certificat déjà existant"

# Injecter BACKEND_URL dans index.html
ARG BACKEND_URL
RUN sed -i "s|%%BACKEND_URL%%|${BACKEND_URL}|g" dist/index.html || echo "Pas de placeholder %%BACKEND_URL%% dans index.html"

EXPOSE 8081

# Lancer serveur HTTPS
CMD ["serve", "-s", "dist", "-l", "8081", "--ssl-cert", "certs/frontend.crt", "--ssl-key", "certs/frontend.key"]
