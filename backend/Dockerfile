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

# 1️⃣ Installation des dépendances build + ca-certificates avant curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    git \
    build-essential \
    libsqlite3-dev \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 2️⃣ Installation Node.js LTS via NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && node -v && npm -v

WORKDIR $APP_HOME

# 3️⃣ Copie des fichiers de dépendances et installation
COPY package*.json ./
RUN npm install --production

# 4️⃣ Copie du code source
COPY . .

# --------------------
# Stage 2: Runtime
# --------------------
FROM debian:bookworm-slim

ENV APP_HOME=/app \
    NODE_ENV=production \
    PORT=443

# 1️⃣ Installation runtime minimum
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    bash \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR $APP_HOME

# 2️⃣ Copie depuis le builder
COPY --from=builder /app /app

# 3️⃣ Certificats HTTPS auto-signés pour dev
RUN mkdir -p /certs && \
    openssl req -x509 -nodes -days 365 \
    -subj "/C=FR/ST=Paris/L=Paris/O=ft_transcendence/OU=Dev/CN=localhost" \
    -newkey rsa:2048 -keyout /certs/server.key \
    -out /certs/server.crt

# 4️⃣ Exposition du port HTTPS/WSS
EXPOSE $PORT

# 5️⃣ Commande pour démarrer le serveur
CMD ["node", "src/server.js"]
