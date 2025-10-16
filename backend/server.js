import Fastify from 'fastify';
import { openDb } from './db.js';

// 1. On crée une instance du serveur
const app = Fastify({ logger: true });

// 2. On définit une route simple
app.get('/api/ping', async () => {
  const db = await openDb();

  // Créons une table "messages" si elle n’existe pas encore
  await db.exec('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, text TEXT)');

  // Ajoutons un message
  await db.run('INSERT INTO messages (text) VALUES (?)', ['pong 🏓']);

  // Lisons tous les messages
  const rows = await db.all('SELECT * FROM messages');

  return { messages: rows };
});


// 3. On démarre le serveur
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
