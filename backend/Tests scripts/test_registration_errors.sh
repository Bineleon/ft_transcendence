#!/bin/bash
# Script de test pour la validation Zod sur /api/auth/register
# Utilise curl pour tester plusieurs cas invalides et inspecter les messages renvoyés

BASE_URL="https://localhost:8443/api/auth/register"
CONTENT_TYPE="Content-Type: application/json"

echo "🚀 Début des tests de validation Zod sur /api/auth/register"
echo "-----------------------------------------------------------"

# Tableau de tests (JSON + description attendue)
declare -A tests

tests["Email invalide"]='{"email":"invalid","username":"ValidUser","password":"Prout123"}'
tests["Username trop court"]='{"email":"yoann@example.com","username":"Y","password":"Prout123"}'
tests["Username avec caractères spéciaux"]='{"email":"yoann@example.com","username":"Yo@nn","password":"Prout123"}'
tests["Mot de passe faible"]='{"email":"yoann@example.com","username":"Yoann","password":"weak"}'
tests["Champs vides"]='{"email":"","username":"","password":""}'
tests["Doublon email/username"]='{"email":"yo3@gmail.com","username":"Yoann","password":"Prout123"}'  # suppose un user existant

for desc in "${!tests[@]}"; do
  json="${tests[$desc]}"
  echo "📤 Test : $desc"
  echo "Payload : $json"

  response=$(curl -s -k -w "\n%{http_code}" -X POST "$BASE_URL" \
    -H "$CONTENT_TYPE" \
    -d "$json")

  body=$(echo "$response" | head -n1)
  status=$(echo "$response" | tail -n1)

  echo "🔍 Status HTTP : $status"
  echo "🧾 Réponse : $body"

  # Évaluation simple
  if [[ "$status" -eq 400 || "$status" -eq 409 ]]; then
    echo "✅ Erreur détectée comme prévu (Zod/serveur)"
  else
    echo "❌ La validation aurait dû échouer"
  fi
  echo "-----------------------------------------------------------"
done

echo "🏁 Tests terminés"
