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

# II - Initialisation du contenu de la DB (SQLite) lors du lancement du projet

1 - Création du fichier backend/schema.sql

- Initialise la DB (création de tables users, matches etc.) au lancement, si la db n'existe pas déja.
- C'est la structure de la DB, son plan de construction. Grace à ce fichier, SQLite sait quoi stocker et où.
- Définit les relations entre les différents tableau (Un tableau peut dépendre d'un autre).

# III - Fin de journée 17.10

- Makefile OK
- Docker OK
- DB connectée au back OK
- Chaque appel à localhost:3000/api/ping stocke bien un "pong" dans la table message de la DB.

# IV - Nginx

Pourquoi utiliser Nginx ?

- On masque le backend. Le client (navigateur) ne parle jamais directement au backend (adresse, port, etc.). Nginx agit comme un intermédiaire qui centralise toutes les requêtes venant de l'extérieur.
- Nginx peut gérer tout la partie HTTPS (certifs, cryptages), et communique avec le backend en HTTP. De sorte à ce que le backend n'est pas à s'en occuper.
- On peut rajouter des couches de sécurité directement à ce niveau, avant que la requête n'atteigne le backend. (Bloquer certaines IP, vérifier des headers, limiter le nombre de requêtesm valider JWT).
- Le proxy peut réecrire des URLs.
- Il peut également mettre en cache certaines réponses, en compresser d'autres, loguer toutes les requêtes etc...

  En conclusion : Le proxy contrôle, sécurise et simplifie la comm entre le front et le back. Le backend ne voit qu'un client immuable (le proxy), pas tout les cQuand on reçoit les infos du client, on crée le JWT token, et on lui renvoie. Et à chaque nouvelle requête du navigateur, on revérifie ce token pour voir s'il a bien notre signature.lients direct.

Pour Nginx, c'est en trois étapes :

- le script default.conf
  On écoute les ports 80 et 443, et on redirige les requêtes http sur https.
  On copy/paste les certs.
  On utilise des headers de sécurité.
- le Dockerfile
- Modif du docker-compose.yaml
- Générer les certifs auto-signés
