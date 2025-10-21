import Fastify from 'fastify';
import { openDb } from './db.js';
import fastifyCors from '@fastify/cors';
import fs from 'fs';
import path from 'path';

const app = Fastify({ logger: true });

app.get('/api/ping', async () => {
  const db = await openDb();

  // Lis le fichier schema.sql depuis ./backend
  const schemaPath = path.join(process.cwd(), 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Exécute le SQL du schema pour créer les tables si elles n'existent pas
  await db.exec(schema);

  // Exemple simple : table messages
  await db.run('INSERT INTO messages (text) VALUES (?)', ['pong 🏓']);
  const rows = await db.all('SELECT * FROM messages');

  return { messages: rows };
});

await app.register(fastifyCors, {
  origin: '*' // autorise toutes les origines pour dev
});

app.get('/', async (req, reply) => {
  return { message: 'Bienvenue sur l’API Transcendance 🚀' };
});

const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('✅ Serveur Fastify démarré sur http://localhost:3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();