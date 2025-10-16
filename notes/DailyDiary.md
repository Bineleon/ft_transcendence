# 
    Daily Diary

### I - Setup le backend.

[node] - Fait tourner du JavaScript sans navigateur.

[npm] - Installe et gère les bibliothèques du projet [node]

[package.json] - Registre par défaut du projet [node]. Il garde la liste des dépendances et scripts.

[server.js] - Lorsqu'on fait node server.js on demande à Node d'exécuter le code présent dans le fichier, et ce code dit :

- "Je crée un serveur Fastify"
- "Je lui dit d'écouter sur le port 3000"
- Quand quelqu'un appelle /api/ping, je répond { messgae: "pong"}

  Ce fichier est donc le cerveau du backend. C'est lui qui démarre le serveur web, définit les routes, et connecte plus tard la base de données.

[SQLite] - Base de donnée ultra légère. Contrairement à MySQL ou PostgreSQL, il ne s'agit pas d'un service séparé, c'est simplement un fichier database.db dans le projet.



Donc, une fois qu'on a utilisé fastify pour créer le server, il est temps de créer la DB. Donc on installe SQlite dans le projet, et on ajoute un script [db.js], dans lequel on setup la DB, puis on modifie server.js pour coder le lien entre le serveur et la DB.

[db.js] - Script qui connecte vers la base de données. Dans server.js on appelle la fonction openDB(), définie dans db.js, qui ouvre le fichier database.db. Et ensuite dans notre script server.js on utilise db.exec/db.run etc... pour interagir avec la DB.


Pour faire une analogie :

1 - [db.js] --> Le technicien : Il ouvre et configure la connexion à la base SQLite.

2 - [server.js] ---> Le chef d'orchestre : Il écoute les requêtes et demande au technicien d'écrire/lire des données.

3 - [route API] (/api/ping) --> La porte d'entrée que le monde extérieur utilise pour parler au chef d'orchestre.

### Conclusion : [db.js] setup la DB, et [server.js] s'en sert pour interagir avec elle via des [routes API].
