#!/bin/bash

# ---- CONFIG ----
USERNAME="yoann"
PASSWORD="test"
API_URL="http://localhost:3000"

# ---- LOGIN ----
echo "🔑 Tentative de login..."
TOKEN=$(curl -s -X POST "$API_URL/api/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}" | jq -r .token)

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Échec du login. Vérifie le backend."
  exit 1
fi

echo "✅ Login réussi. Token reçu : $TOKEN"

# ---- ROUTE PROTÉGÉE ----
echo "🔒 Accès à la route protégée..."
curl -s "$API_URL/api/protected" -H "Authorization: Bearer $TOKEN" | jq
echo
