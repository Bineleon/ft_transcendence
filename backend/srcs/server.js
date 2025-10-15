// ===== Imports =====
import fs from 'fs';                   // Gestion des fichiers
import path from 'path';               // Gestion des chemins
import https from 'https';             // Serveur HTTPS natif
import { WebSocketServer } from 'ws';  // WebSocket sécurisé
import sqlite3 from 'sqlite3';         // SQLite3 natif
import { execSync } from 'child_process'; // Exécuter openssl pour certs

// ===== Dossiers nécessaires =====
const CERT_DIR = path.resolve('./certs'); // Dossier certificats
const DATA_DIR = path.resolve('./data');  // Dossier base de données
if (!fs.existsSync(CERT_DIR)) fs.mkdirSync(CERT_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ===== Certificats auto-signés =====
const KEY_FILE = path.join(CERT_DIR, 'server.key');
const CRT_FILE = path.join(CERT_DIR, 'server.crt');

if (!fs.existsSync(KEY_FILE) || !fs.existsSync(CRT_FILE)) {
  console.log('Génération de certificats auto-signés...');
  execSync(`openssl req -x509 -nodes -days 365 -subj "/C=FR/ST=Paris/L=Paris/O=ft_transcendence/OU=Dev/CN=localhost" -newkey rsa:2048 -keyout ${KEY_FILE} -out ${CRT_FILE}`);
}

// ===== Serveur HTTPS natif =====
const server = https.createServer(
  {
    key: fs.readFileSync(KEY_FILE),
    cert: fs.readFileSync(CRT_FILE),
  },
  (req, res) => {
    // Route /api/ping → test backend
    if (req.method === 'GET' && req.url === '/api/ping') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'pong' }));
      return;
    }

    // Route / → page d'accueil simple
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>Bienvenue sur ft_transcendence backend</h1>');
      return;
    }

    // Toute autre route → 404
    res.writeHead(404);
    res.end('Not Found');
  }
);

// ===== SQLite3 setup =====
const dbFile = path.join(DATA_DIR, 'database.sqlite');
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) console.error('Erreur SQLite :', err.message);
  else console.log('SQLite connecté');
});

// Création de la table scores si elle n'existe pas
db.run(`
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ===== WebSocket sécurisé =====
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  // Envoi message de bienvenue au client
  ws.send(JSON.stringify({ message: 'Bienvenue sur ft_transcendence WSS' }));

  // Gestion des messages entrants
  ws.on('message', (msg) => {
    console.log('Message reçu :', msg.toString());
    // Echo pour test
    ws.send(JSON.stringify({ message: `Reçu : ${msg.toString()}` }));
  });
});

// ===== Démarrage serveur =====
const PORT = 8080; // Port > 1024 pour éviter sudo
server.listen(PORT, () => {
  console.log(`Backend ft_transcendence en HTTPS/WSS sur https://localhost:${PORT}`);
});
