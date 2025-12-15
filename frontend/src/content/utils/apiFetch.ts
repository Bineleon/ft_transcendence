// src/content/utils/apiFetch.ts
import { pongAlert } from "./alertBox";

type ApiFetchInit = RequestInit & {
  requireAuth?: boolean;   // ✅ si true: 401 => refresh + redirect si échec
};

export async function apiFetch(input: RequestInfo | URL, init: ApiFetchInit = {}): Promise<Response> {
  const { requireAuth = false, ...rest } = init;

  const finalInit: RequestInit = {
    ...rest,
    credentials: "include",
  };

  // 1ère tentative
  let res = await fetch(input, finalInit);

  // ✅ Pas 401 => OK
  if (res.status !== 401) return res;

  // ✅ Si l’appel n’exige pas d’auth : on renvoie juste la 401, sans refresh, sans redirect
  if (!requireAuth) return res;

  // Anti-boucle refresh
  if (typeof input === "string" && input.includes("/api/auth/refresh")) {
    return res;
  }

  // Tentative de refresh
  try {
    const refreshRes = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (!refreshRes.ok) {
      pongAlert("Please log in again.");
      window.location.hash = "#/login";
      return res;
    }

    const refreshData = await refreshRes.json();
    if (!refreshData.success) {
      pongAlert("Please log in again.");
      window.location.hash = "#/login";
      return res;
    }

    // Refresh OK → rejouer 1 fois
    res = await fetch(input, finalInit);
    return res;
  } catch (err) {
    console.error("Refresh token error:", err);
    pongAlert("Authentication error. Please log in again.");
    window.location.hash = "#/login";
    return res;
  }
}
