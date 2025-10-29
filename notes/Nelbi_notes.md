Modif 30 oct 

- Creation de backend/src
server.ts deplace dans backend/src

- Creation de backend/src/types && backend/src/utils
Modif package.json :
    - Ajout de "build": "tsc"
    - Modification de "start": "node dist/src/server.js" (car tsc compile vers dist/src/)
    - Ajout de @types/node et prisma dans devDependencies (nécessaires pour la compilation)

- rm "version: "3.9"" dans docker-compose.dev (obsolete avec Docker Compose v2)

TODO : 
- cd backend; npm install