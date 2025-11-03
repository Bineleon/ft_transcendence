#!/bin/bash

BASE_URL="https://localhost:8443"
USERNAME="Yoh"
PASSWORD="Prout123"

echo "🔑 Tentative de login via Nginx reverse-proxy..."

# --- Login ---
HTTP_RESPONSE=$(curl -k -s -w "HTTPSTATUS:%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}" \
  -c cookies.txt)

# Séparer le body et le status code
HTTP_BODY=$(echo "$HTTP_RESPONSE" | sed -e 's/HTTPSTATUS\:.*//g')
HTTP_STATUS=$(echo "$HTTP_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

echo "Status HTTP : $HTTP_STATUS"
echo "Body réponse : $HTTP_BODY"

if [ "$HTTP_STATUS" -ne 200 ] && [ "$HTTP_STATUS" -ne 201 ]; then
  echo "❌ Login échoué. Vérifie email/password et que l'utilisateur existe dans SQLite."
  exit 1
fi

# --- Extraction du JWT ---
JWT=$(grep access_token cookies.txt | awk '{print $7}')
if [ -n "$JWT" ]; then
  echo "✅ JWT récupéré : $JWT"
else
  echo "⚠️ Aucun JWT récupéré. Check Set-Cookie côté backend."
fi

# --- Test route protégée /api/me ---
echo "🔍 Test /api/me..."
ME_RESPONSE=$(curl -k -s -X GET "$BASE_URL/api/me" \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -w "HTTPSTATUS:%{http_code}")

ME_BODY=$(echo "$ME_RESPONSE" | sed -e 's/HTTPSTATUS\:.*//g')
ME_STATUS=$(echo "$ME_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

echo "Status HTTP /api/me : $ME_STATUS"
echo "Body réponse /api/me : $ME_BODY"

# --- Nettoyage ---
rm -f cookies.txt
