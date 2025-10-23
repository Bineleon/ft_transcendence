# Glossaire :

[Requête HTTP] : Demande faite par un client (navigateur, application) sur le protocole HTTP. Ça inclut des méthodes (GET, POST), une URL, des headers, un corps (payload) etc...

Elle se décompose en trois parties : Lignes de requête (GET par exemple) / Headers (Pair clef/valeurs qui fournissent des infos supplémentaires) / Body (optionnel)

[Route] : Dans le backend, c'est une correspondance entre une URL + une méthode et une fonction (un handler) qui s'exécute pour cette requête. Par exemple, la route GET /api/ping signifie "si quelqu'un fait GET sur /api/ping, exécute cette fonction".

Dans Fastify, ça correspond à app.get('/api/ping', handler) : On crée une route.

[Requête API] : C'est une requête HTTP faite pour interagir avec un backend via une interface de programmation (API = Application programming Interface). Ça signifie que l'appel n'est pas pour charger une page HTML complète, mais pour obtenir ou envoyer des données (JSON, etc.)

Quand le front envoie fetch('/api/users') pour obtenir la liste des users, c'est une requête API.

*** Toutes les requêtes API sont des requêtes HTTP, mais les requêtes HTTP peuvent aussi servir du contenu HTML (front).

*** La "route" est du côté serveur : C'est le chemin qu'on écoute pour répondre à certaines requêtes HTTP/API.

### Exemple concret dans ton architecture

* Le front exécute `fetch('https://mon-site.com/api/ping')` → c’est une  **requête HTTP** .
* Le proxy Nginx reçoit cette requête `/api/ping`, il voit que c’est un chemin `/api/`, il la **proxy_pass** vers le backend (par exemple `backend:3000/api/ping`).
* Le backend (Fastify) a une **route** `GET /api/ping` définie. Le serveur exécute le code dans ce handler, interagit avec la DB, etc. Puis renvoie une réponse JSON.
* Le proxy renvoie cette réponse au client.

[Payload] : Le contenu utile que tu envoies dans une requête (De n'importe quel type). Ce sont les données nécessaires pour l'action que tu veux faire. Par exemple pour le login c'est : login/mdp. Pour register ce serait login/mdp/mail.
