# ===============================
# ft_transcendence Backend Dockerfile
# Multi-stage build (Bookworm-slim) - Corrigé SSL Node.js
# ===============================

# --------------------
# Stage 1: Builder
# --------------------
FROM debian:bookworm-slim AS builder

ENV DEBIAN_FRONTEND=noninteractive \
    APP_HOME=/app

# Installation des dépendances build + ca-certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    git \
    build-essential \
    libsqlite3-dev \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Installation Node.js LTS via NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && node -v && npm -v

WORKDIR $APP_HOME

# Copie des fichiers de dépendances et installation
COPY package*.json ./
RUN npm install --production

# Copie du code source
COPY . .

# --------------------
# Stage 2: Runtime
# --------------------
FROM debian:bookworm-slim

ENV APP_HOME=/app \
    NODE_ENV=production \
    PORT=443

# Installation runtime minimum
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    bash \
    sqlite3 \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR $APP_HOME

# Copie depuis le builder
COPY --from=builder /app /app

# Certificats HTTPS auto-signés pour dev
RUN mkdir -p /certs && \
    [ ! -f /certs/server.key ] && \
    openssl req -x509 -nodes -days 365 \
        -subj "/C=FR/ST=Paris/L=Paris/O=ft_transcendence/OU=Dev/CN=localhost" \
        -newkey rsa:2048 \
        -keyout /certs/server.key \
        -out /certs/server.crt || echo "Certificat déjà existant"

# Exposition du port HTTPS/WSS
EXPOSE $PORT

# Commande pour démarrer le serveur
CMD ["node", "srcs/server.js"]
