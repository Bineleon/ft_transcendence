#!/bin/bash
BASE="https://localhost:8443"
EMAIL="xsstest@example.local"
USERNAME="<script>console.log('XSS_STORED')</script>"
PASSWORD="Prout123"

echo "1) POST /api/auth/register (tentative d'enregistrement avec payload XSS)"
RESP=$(curl -k -s -w "\n%{http_code}" -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}" \
  -c cookies_xss.txt)

BODY=$(echo "$RESP" | head -n -1)
CODE=$(echo "$RESP" | tail -n1)

echo "HTTP $CODE"
echo "Body: $BODY"

if [[ "$CODE" -ne 201 && "$CODE" -ne 200 ]]; then
  echo "Registration failed — backend rejected input (good)."
  cat cookies_xss.txt || true
  exit 1
fi

echo
echo "2) GET /api/me (avec cookie récupéré) pour voir ce que renvoie le backend"
ME_RESP=$(curl -k -s -X GET "$BASE/api/me" -b cookies_xss.txt -w "\n%{http_code}")
ME_BODY=$(echo "$ME_RESP" | head -n -1)
ME_CODE=$(echo "$ME_RESP" | tail -n1)
echo "HTTP $ME_CODE"
echo "Body: $ME_BODY"

# cleanup
rm -f cookies_xss.txt
