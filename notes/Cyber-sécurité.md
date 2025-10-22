# Cyber-sécurité



## I - JWT [JSON Web Token]

### I - Qu'est-ce que c'est ?

Un JWT est une carte d'identité numérique signée utilisée pour prouver l'identité d'un utilisateur sans devoir stocker sa session sur le serveur.

En clair : Au lieu de garder une session en mémoire côté serveur, le backend génère un token signé (Du texte encodé), et l'envoie au client.

Le client le renvoie à chaque requête -- et le serveur peut vérfier son authenticité sans base de données.

Un JWT dispose de 3 parties séparées par des points :

xxxxx.yyyyy.zzzzz

xxxxx : Header : Contient le type (JWT) et l'algo utilisé [HS256].

yyyyy : Payload : Contient les donn'ees (ex: user_id, username).

zzzzz : Signature : Permet de vérifier que le token n'a pas été modifié.

### 2 - Pourquoi c'est sécurisé

Le serveur signe le JWT avec une clé secrète (ex: JWT_SECRET dans le .env)

Quand le client renvoie ce token, le serveur vérifie la signature.

➡️ Si le token a été altéré ou falsifié →  **rejeté immédiatement** .

### 🔹 Pourquoi on l’utilise

* ✅ Plus besoin de sessions côté serveur
* ✅ Léger et rapide
* ✅ Standard (utilisé par toutes les API modernes)
* ⚠️ Si quelqu’un vole le token, il peut agir à la place de l’utilisateur jusqu’à expiration

  → d’où l’importance du HTTPS et de limiter sa durée de vie (`1h` typiquement)

À la différence d'une session web classique, le stockage du token se fait côté client, et pas serveur, ce qui rend JWT très scalable. 

L'idée c'est qu'au moment ou un user se connecte, et envoie ses logins, dont le mdp, si les deux sont bons, le serveur renvoie un JWT au client pour lui dire "C'est good, j'te connais". Ce JWT est signée avec une clé secrète contenu dans la viariable d'env JWT_SECRET. Et désormais, à chaque nouvelle requête, le client retransmet ce token en header de la requête http !



[Client]  →  POST /login (username+password)
                     ↓
              [Serveur vérifie]
                     ↓
              Génère JWT signé
                     ↓
[Client]  ←  { token: "ey..." }

Puis :
[Client]  →  GET /profile
             Authorization: Bearer ey...
                     ↓
              [Serveur vérifie la signature]
                     ↓
              Si valide → accès autorisé


## 3 - Précision importante 

Fastify ne crypte pas automatiquement le mdp du client. Il faut utiliser bcrypt (dans Node.js), pour crypter le mdp avant de le stocker dans la db ! Comme ça même si un pirate accède à notre base de données, il ne peut pas voir le mdp. 

Donc quand l'user se log, on va comparer son mot de passe saisi, avec notre hash (Le résultat de bcrypt sur son mdp lors de l'inscription) et vérifié si le hash de bcrypt sur le mdp fourni à l'inscription est bien le même que celui fourni lors de cette connexion. 


[Utilisateur] → Saisie username + mot de passe
       │
       ▼
[Serveur] → Récupère hash du mot de passe en DB
       │
       ▼
[Serveur] → Compare mot de passe saisi avec hash (bcrypt)
       │
       ├─❌ Si incorrect → Erreur login
       │
       ▼
       ✔ Si correct → Vérifie 2FA (si activé)
       │
       ├─❌ Si code 2FA incorrect → Erreur login
       │
       ▼
       ✔ Si tout correct → Génère JWT signé avec la clé secrète
       │
       ▼
[Utilisateur] ← Renvoi du JWT (Authorization Bearer)
       │
       ▼
[Utilisateur] → Utilise JWT pour toutes les requêtes suivantes
       │
       ▼
[Serveur] → Vérifie signature JWT + expiration pour sécuriser l’accès
