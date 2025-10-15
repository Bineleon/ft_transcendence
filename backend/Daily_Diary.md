# Journal de Bord - Yoann

# I - Setup l'environnement Docker

- Dockerfile divisé en deux parties : Builder et Docker
  Objectif : Rendre l'image plus légère et rapide en ne conservant que le code mandatory dans l'image runtime.
- package json :


# *1 - package.json

```json
    "express": "^4.18.2",
    "__comment_express": "Serveur HTTP principal pour ton API",
    "ws": "^8.15.0",
    "__comment_ws": "WebSocket pour matchmaking et tournois",
    "sqlite3": "^5.1.6",
    "__comment_sqlite3": "Stockage des scores et historique",
    "dotenv": "^16.3.1",
    "__comment_dotenv": "Gestion des variables d'environnement pour secrets",
    "cors": "^2.8.5",
    "__comment_cors": "Gestion CORS pour SPA",
    "helmet": "^7.0.0",
    "__comment_helmet": "Sécurité HTTP (XSS, headers, etc.)",
    "jsonwebtoken": "^9.0.2",
    "__comment_jwt": "Gestion JWT pour authentification",
    "bcrypt": "^5.2.1",
    "__comment_bcrypt": "Hachage de mots de passe"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "__comment_nodemon": "Reload automatique en dev",
    "eslint": "^8.48.0",
    "__comment_eslint": "Vérification du code"
```
