// src/content/utils/apiFetch.ts

import { pongAlert } from "./alertBox";

/**
 * Wrapper autour de fetch qui :
 * - inclut toujours les cookies
 * - si 401 → tente un /api/auth/refresh puis rejoue la requête 1 fois
 */
export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const finalInit: RequestInit = {
    // on garde tout ce que l'appelant a mis
    ...init,
    credentials: "include",
  };

  // 1ère tentative
  let res = await fetch(input, finalInit);

  if (res.status !== 401) {
    return res;
  }

  // Si on est déjà en train d'appeler /refresh → on ne boucle pas
  if (typeof input === "string" && input.includes("/api/auth/refresh")) {
    return res;
  }

  // si sur la page de jeu ou de tournoi → on ne fait rien
  if (window.location.hash.startsWith("#/playpong/") || window.location.hash.startsWith("#/tournament/")) {
    return res;
  }

  // Tentative de refresh
  try {
    const refreshRes = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (!refreshRes.ok) {
      // Refresh impossible → on considère la session expirée
      pongAlert("Session expirée. Merci de vous reconnecter.");
      window.location.href = "/#/login";
      return res;
    }

    const refreshData = await refreshRes.json();
    if (!refreshData.success) {
      pongAlert("Session expirée. Merci de vous reconnecter.");
      window.location.href = "/#/login";
      return res;
    }

    // Refresh OK → on rejoue la requête une seule fois
    res = await fetch(input, finalInit);
    return res;
  } catch (err) {
    console.error("Refresh token error:", err);
    pongAlert("Erreur d'authentification. Merci de vous reconnecter.");
    window.location.href = "/#/login";
    return res;
  }
}
