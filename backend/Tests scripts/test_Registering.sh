#!/bin/bash

# Nom du conteneur backend
BACKEND_CONTAINER="ft_transcendence-backend-1"

# Infos de test pour l'inscription
USERNAME="yoann_test"
EMAIL="yoann@test.com"
PASSWORD="password123"

echo "📡 Envoi des infos à /api/auth/register..."
# On utilise curl dans le conteneur backend pour appeler le backend
docker exec -i $BACKEND_CONTAINER curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\", \"email\":\"$EMAIL\", \"password\":\"$PASSWORD\"}" \
  -o /tmp/register_response.json

cat /tmp/register_response.json
echo

echo "🔍 Vérification dans la DB..."
# On utilise Node.js dans le conteneur pour interroger SQLite
docker exec -i $BACKEND_CONTAINER node -e "
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

(async () => {
  const db = await open({ filename: './dev.db', driver: sqlite3.Database });
  const users = await db.all('SELECT * FROM users WHERE username = \"$USERNAME\"');
  console.log(users);
  await db.close();
})();
"
