#!/bin/bash

BASE_URL="https://localhost:8443"

tests=(
  '{"email":"invalid","username":"Yoann","password":"Prout123"}'          # Email invalide
  '{"email":"yoann@gmail.com","username":"Y","password":"Prout123"}'      # Username trop court
  '{"email":"yoann@gmail.com","username":"Yo@nn","password":"Prout123"}'  # Username caractères interdits
  '{"email":"yoann@gmail.com","username":"Yoann","password":"weak"}'      # Mot de passe trop faible
  '{"email":"","username":"","password":""}'                              # Champs vides
)

echo "🚀 Début des tests de validation Zod sur /api/auth/register"
echo "-----------------------------------------------------------"

for data in "${tests[@]}"; do
  echo -e "\n📤 Test avec données : $data"
  response=$(curl -k -s -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "$data" -w "\n%{http_code}")

  # Extraction du code HTTP
  status=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n -1)

  echo "🔍 Status HTTP : $status"
  echo "🧾 Réponse : $body"

  if [[ "$status" == "400" || "$status" == "422" ]]; then
    echo "✅ Erreur détectée comme prévu (validation côté serveur)"
  else
    echo "❌ La validation aurait dû échouer"
  fi

  echo "-----------------------------------------------------------"
done

echo "🏁 Tests terminés"
