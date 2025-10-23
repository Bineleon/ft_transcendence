// // server.js
// import dotenv from 'dotenv';
// dotenv.config(); // charge les variables depuis .env

// import Fastify from 'fastify';
// import fastifyJwt from '@fastify/jwt';
// import fastifyCors from '@fastify/cors';
// import bcrypt from 'bcryptjs';
// import fs from 'fs';
// import path from 'path';
// import { openDb } from './db.js';

// // 1️⃣ Créer l'instance Fastify
// const app = Fastify({ logger: true });

// // 2️⃣ Enregistrer JWT, on définit les règles de nos tokens JWT //
// await app.register(fastifyJwt, {
//   secret: process.env.JWT_SECRET,       // depuis ton .env
//   sign: { expiresIn: '1h' }             // optionnel : expire en 1h
// });

// // 3️⃣ Enregistrer CORS
// await app.register(fastifyCors, {
//   origin: '*'  // autorise toutes les origines pour dev
// });

// // 4️⃣ Middleware pour vérifier JWT
// app.decorate('authenticate', async (req, reply) => {
//   try {
//     await req.jwtVerify();  // décode token et place les infos dans req.user
//   } catch (err) {
//     reply.send(err);
//   }
// });

// // 5️⃣ Route de test ping et création table messages
// app.get('/api/ping', async () => {
//   const db = await openDb();

//   // Lis le fichier schema.sql
//   const schemaPath = path.join(process.cwd(), 'schema.sql');
//   const schema = fs.readFileSync(schemaPath, 'utf8');

//   // Crée les tables si elles n'existent pas
//   await db.exec(schema);

//   // Exemple : ajoute un message et renvoie tous les messages
//   await db.run('INSERT INTO messages (text) VALUES (?)', ['pong 🏓']);
//   const rows = await db.all('SELECT * FROM messages');

//   return { messages: rows };
// });

// // 6️⃣ Route publique
// app.get('/', async () => {
//   return { message: 'Bienvenue sur l’API Transcendance 🚀' };
// });

// // 7️⃣ Route login pour générer un JWT
// app.post('/api/login', async (req, reply) => {
//   const { username, password } = req.body;

//   if (!username || !password) {
//     return reply.status(400).send({ error: 'Username et password requis' });
//   }

//   // Pour l’instant on accepte n’importe quel user/mdp
//   const token = app.jwt.sign({ username }); // encode l'identité

//   return { token };
// });

// // 8️⃣ Route protégée
// app.get('/api/protected', { preValidation: [app.authenticate] }, async (req, reply) => {
//   return { message: `Salut ${req.user.username}, tu as accédé à une route protégée !` };
// });

// // 9️⃣ Démarrage du serveur
// const start = async () => {
//   try {
//     await app.listen({ port: 3000, host: '0.0.0.0' });
//     console.log('✅ Serveur Fastify démarré sur http://localhost:3000');
//   } catch (err) {
//     app.log.error(err);
//     process.exit(1);
//   }
// };

// // Route pour le register
// app.post('/api/auth/register', async (req, reply) => {
//   const { username, email, password } = req.body;

//   // 1️⃣ Vérification des champs
//   if (!username || !email || !password) {
//     return reply.status(400).send({ error: 'Tous les champs sont requis' });
//   }

//   try {
//     // 2️⃣ Hash du mot de passe
//     const hashedPassword = await bcrypt.hash(password, 10); // 10 rounds

//     // 3️⃣ Insérer dans la DB
//     const db = await openDb();
//     await db.run(
//       'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
//       [username, email, hashedPassword]
//     );

//     // 4️⃣ Réponse au front
//     return reply.status(201).send({ message: 'Utilisateur créé avec succès' });
//   } catch (err) {
//     // Gestion des erreurs (ex: email déjà existant)
//     return reply.status(500).send({ error: 'Impossible de créer l’utilisateur', details: err.message });
//   }
// });


// start();


// import Fastify from 'fastify';
// import fastifyCors from '@fastify/cors';
// import { prisma } from './db';

// const app = Fastify({ logger: true });
// await app.register(fastifyCors, { origin: true });

// app.get('/api/ping', async () => {
//   // Exemple d’accès DB typé :
//   const userCount = await prisma.user.count().catch(() => 0);
//   return { ok: true, userCount };
// });

// app.get('/', async () => ({ message: 'Bienvenue sur l’API Transcendance 🚀' }));

// const start = async () => {
//   await app.listen({ host: '0.0.0.0', port: 3000 });
// };
// start();

// backend/server.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import fastifyJwt from '@fastify/jwt';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const app = Fastify({ logger: true });
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET!;

// 1) Plugins d'abord
await app.register(cors,   { origin: true, credentials: true });
await app.register(cookie, { secret: 'cookies-are-signed' });
await app.register(helmet, { contentSecurityPolicy: false });

// (optionnel) ping/health
app.get('/api/ping', async () => ({ pong: true }));

// 2) === TES 3 ROUTES AUTH ICI, À LA SUITE ===

// A) REGISTER
app.post('/api/auth/register', async (req, reply) => {
  const { email, username, password } = req.body as any;

  // unicité
  const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] }});
  if (exists) return reply.code(409).send({ error: 'Email or username already in use' });

  // hash + insert
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, username, passwordHash },
    select: { id: true, email: true, username: true, createdAt: true }
  });

  // cookie JWT (en DEV: secure:false, en PROD: true)
  const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  reply.setCookie('access_token', token, { httpOnly: true, secure: false, sameSite: 'lax', path: '/' });
  return reply.code(201).send({ user });
});

// B) LOGIN
app.post('/api/auth/login', async (req, reply) => {
  const { login, password } = req.body as any; // login = email OU username
  const user = await prisma.user.findFirst({ where: { OR: [{ email: login }, { username: login }] }});
  if (!user) return reply.code(401).send({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return reply.code(401).send({ error: 'Invalid credentials' });

  const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  reply.setCookie('access_token', token, { httpOnly: true, secure: false, sameSite: 'lax', path: '/' });
  return reply.send({ ok: true });
});

// C) ME
app.get('/api/me', async (req, reply) => {
  const token = (req.cookies as any)?.access_token;
  if (!token) return reply.code(401).send({ error: 'No session' });

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const me = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, username: true, createdAt: true }
    });
    if (!me) return reply.code(401).send({ error: 'Invalid session' });
    return reply.send({ user: me });
  } catch {
    return reply.code(401).send({ error: 'Invalid session' });
  }
});

// 3) listen en dernier
app.listen({ port: 3000, host: '0.0.0.0' });
