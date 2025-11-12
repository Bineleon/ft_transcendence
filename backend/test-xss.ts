/**
 * test-xss.ts
 *
 * Scénarios de test XSS (stocké + réfléchi) pour ton backend Fastify.
 *
 * Usage :
 * 1) Assure-toi que ton backend tourne sur http://localhost:3000
 * 2) Installer node-fetch si nécessaire : npm install node-fetch
 * 3) Lancer : npx tsx test-xss.ts
 *
 * Ce script :
 * - tente plusieurs payloads malicieux (script tags, event handlers, onerror, encoded)
 * - crée un user de test (username malicieux), vérifie la réponse de l'API (register)
 * - récupère le profil (/api/auth/me) pour vérifier si la valeur renvoyée contient du HTML/script brut
 * - vérifie si les cookies sont HttpOnly et SameSite (indicateur côté serveur)
 *
 * Interprétation :
 * - Si le script trouve des "<script" non encodés dans les réponses JSON -> vulnérable (stocked/reflected)
 * - Si le serveur renvoie une erreur 400 et messages de validation -> bonne validation côté backend
 * - Si cookies ont HttpOnly et SameSite=strict/lax -> bon point pour protection côté client
 */

import fetch from 'node-fetch';

// URL de l'API
const BASE = 'http://localhost:3000';

// Payloads à tester
const PAYLOADS = [
  { name: 'basic-script', value: '<script>alert(1)</script>' },
  { name: 'img-onerror', value: `<img src=x onerror="alert(1)">` },
  { name: 'encoded', value: '&lt;script&gt;alert(1)&lt;/script&gt;' },
  { name: 'event-attr', value: `<div onclick="alert(1)">click</div>` },
  { name: 'js-protocol', value: `javascript:alert(1)` }
];

// Utilitaires
function containsScriptLike(s: string | undefined | null) {
  if (!s) return false;
  const low = s.toLowerCase();
  // on cherche pattern <script or onerror= or onload= or javascript:
  return /<script\b|onerror\s*=|onload\s*=|javascript:/i.test(low);
}

async function register(payloadUsername: string, payloadEmail: string, payloadPassword: string) {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: payloadUsername,
      email: payloadEmail,
      password: payloadPassword
    })
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, headers: res.headers, body };
}

async function login(username: string, password: string) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const body = await res.json().catch(() => null);
  const setCookies = res.headers.raw()['set-cookie'] || [];
  return { status: res.status, headers: res.headers, body, setCookies };
}

async function me(cookiesHeader?: string) {
  const res = await fetch(`${BASE}/api/auth/me`, {
    method: 'GET',
    headers: cookiesHeader ? { 'Cookie': cookiesHeader } : {}
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, headers: res.headers, body };
}

async function run() {
  console.log('--- XSS test starting ---\n');

  // Boucle sur les payloads
  for (const p of PAYLOADS) {
    const unique = `${p.name}-${Date.now().toString(36).slice(-6)}`;
    const username = `xss_${unique}` + p.value;            // username malicieux
    const email = `xss_${unique}@example.com`;              // email safe (on ne veut pas break email regex)
    // password doit respecter ta validation: min 8, 1 maj, 1 chiffre, 1 spécial
    const password = 'Password1!';

    console.log(`\n[Test payload] ${p.name}`);
    console.log(`Attempt register with username: ${username}`);

    // 1) REGISTER
    const reg = await register(username, email, password);
    console.log(` -> register status: ${reg.status}`);
    if (reg.body) console.log(' -> register body:', JSON.stringify(reg.body).slice(0, 400));

    // Si register a retourné success, check returned user fields for raw script
    const returnedUsername = reg.body?.data?.user?.username ?? null;
    if (returnedUsername) {
      const flagged = containsScriptLike(returnedUsername);
      console.log(` -> returned username contains script-like content? ${flagged}`);
      if (flagged) {
        console.log('    !!! POSSIBLE REFLECTED/STORED XSS: username returned contains script-like text.');
      } else {
        console.log('    OK: returned username seems sanitized/encoded or rejected.');
      }
    } else {
      // Si l'API a rejeté l'inscription (validation), affiche erreurs
      if (reg.body?.error) {
        console.log(' -> registration rejected by server validation:', reg.body.error.messages ?? reg.body.error.message);
      }
    }

    // 2) Si register ok, se logger et appeler /me pour vérifier stockage
    if (reg.status === 200 || reg.status === 201 || reg.body?.success) {
      const loginRes = await login(username, password);
      console.log(` -> login status: ${loginRes.status}`);
      if (loginRes.body && loginRes.body.error) {
        console.log(' -> login returned error:', loginRes.body.error);
      } else {
        // récupérer cookie header
        const cookieHeader = (loginRes.setCookies || []).join('; ');
        console.log(' -> cookies set:', loginRes.setCookies?.slice(0, 3) ?? []);
        // vérifier flags cookie (HttpOnly, SameSite)
        if (loginRes.setCookies && loginRes.setCookies.length > 0) {
          for (const cookie of loginRes.setCookies) {
            console.log('    cookie:', cookie);
            if (!/HttpOnly/i.test(cookie)) console.warn('    WARNING: cookie not HttpOnly (weak security)');
            if (!/SameSite=(Strict|Lax)/i.test(cookie)) console.warn('    WARNING: SameSite not Strict/Lax (recommended)');
          }
        }

        // appeler /me
        const meRes = await me(cookieHeader);
        console.log(` -> /me status: ${meRes.status}`);
        if (meRes.body?.data?.user) {
          const storedUsername = meRes.body.data.user.username;
          const flaggedStored = containsScriptLike(storedUsername);
          console.log(` -> stored username contains script-like content? ${flaggedStored}`);
          if (flaggedStored) {
            console.log('    !!! POSSIBLE STORED XSS: stored username contains script-like text.');
          } else {
            console.log('    OK: stored username sanitized/encoded on read.');
          }
        } else {
          console.log(' -> /me response body:', JSON.stringify(meRes.body).slice(0, 200));
        }
      }
    }

    // 3) Cleanup: if register created the account, try to delete it directly from an admin route (non présent ici)
    //    Si tu veux: on pourrait ajouter un script qui supprime via Prisma directement (local), mais ce test reste pur HTTP.
  }

  console.log('\n--- XSS test finished ---');
  console.log('Interprétation rapide:');
  console.log('- Si beaucoup de "POSSIBLE STORED/REFLECTED XSS" apparaissent -> corriger en échapant/filtrant côté serveur (strip tags ou encode output).');
  console.log('- Même si l\'API valide et rejette -> c\'est un bon signe. Idéal: validation stricte + output encoding.');
  console.log('- Pour mitigation supplémentaire: CSP, HttpOnly cookies, input validation, output escaping, utilisation d\'une bibliothèque de sanitization (dompurify côté serveur via JSDOM ou sanitize-html), ou zod pour validation stricte.\n');
}

run().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
