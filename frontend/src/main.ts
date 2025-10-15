// src/main.ts — point d'entrée TypeScript pour la SPA

import { BACKEND_URL } from "./config"; // Récupère dynamiquement l'URL du backend

function router() {
  const app = document.getElementById("app");

  if (!app) {
    console.warn("Element #app introuvable !");
    return;
  }

  const hash = window.location.hash || "#home";

  switch (hash) {
    case "#home":
      app.innerHTML = "<p class='text-center mt-4'>Bienvenue sur ft_transcendence!</p>";
      break;

    case "#ping":
      // ✅ Utilisation de BACKEND_URL pour fetch dynamique
      fetch(`${BACKEND_URL}/api/ping`, { method: "GET" })
        .then(res => res.json())
        .then(data => {
          app.innerHTML = `<p class='text-center mt-4'>Backend dit : ${data.message}</p>`;
        })
        .catch(err => {
          app.innerHTML = `<p class='text-center mt-4 text-red-500'>Erreur backend : ${err}</p>`;
        });
      break;

    default:
      app.innerHTML = "<p class='text-center mt-4'>Page inconnue</p>";
  }
}

// ⚡ Initial load
router();

// 🔄 Listener pour changement de hash
window.addEventListener("hashchange", router);

// Exemple de ping automatique au backend à l'initialisation
fetch(`${BACKEND_URL}/api/ping`, { method: "GET" })
  .then(res => res.json())
  .then(data => console.log("Ping backend:", data))
  .catch(err => console.warn("Erreur ping backend :", err));
