// server.js
import dotenv from 'dotenv';
dotenv.config(); // charge les variables depuis .env

import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { openDb } from './db.js';

// 1️⃣ Créer l'instance Fastify
const app = Fastify({ logger: true });

// 2️⃣ Enregistrer JWT, on définit les règles de nos tokens JWT //
await app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET,       // depuis ton .env
  sign: { expiresIn: '1h' }             // optionnel : expire en 1h
});

// 3️⃣ Enregistrer CORS
await app.register(fastifyCors, {
  origin: '*'  // autorise toutes les origines pour dev
});

// 4️⃣ Middleware pour vérifier JWT
app.decorate('authenticate', async (req, reply) => {
  try {
    await req.jwtVerify();  // décode token et place les infos dans req.user
  } catch (err) {
    reply.send(err);
  }
});

// 5️⃣ Route de test ping et création table messages
app.get('/api/ping', async () => {
  const db = await openDb();

  // Lis le fichier schema.sql
  const schemaPath = path.join(process.cwd(), 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Crée les tables si elles n'existent pas
  await db.exec(schema);

  // Exemple : ajoute un message et renvoie tous les messages
  await db.run('INSERT INTO messages (text) VALUES (?)', ['pong 🏓']);
  const rows = await db.all('SELECT * FROM messages');

  return { messages: rows };
});

// 6️⃣ Route publique
app.get('/', async () => {
  return { message: 'Bienvenue sur l’API Transcendance 🚀' };
});

// 7️⃣ Route login pour générer un JWT
app.post('/api/login', async (req, reply) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return reply.status(400).send({ error: 'Username et password requis' });
  }

  // Pour l’instant on accepte n’importe quel user/mdp
  const token = app.jwt.sign({ username }); // encode l'identité

  return { token };
});

// 8️⃣ Route protégée
app.get('/api/protected', { preValidation: [app.authenticate] }, async (req, reply) => {
  return { message: `Salut ${req.user.username}, tu as accédé à une route protégée !` };
});

// 9️⃣ Démarrage du serveur
const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('✅ Serveur Fastify démarré sur http://localhost:3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

app.post('/api/auth/register', async (req, reply) => {
  // Accept either "username" or "login" from the frontend
  const username = req.body.username || req.body.login;
  const { email, password } = req.body;

  // 1️⃣ Vérification des champs
  if (!username || !email || !password) {
    return reply.status(400).send({ error: 'Tous les champs sont requis' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const db = await openDb();
    await db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    return reply.status(201).send({ message: 'Utilisateur créé avec succès' });
  } catch (err) {
    return reply.status(500).send({ error: 'Impossible de créer l’utilisateur', details: err.message });
  }
});


start();
