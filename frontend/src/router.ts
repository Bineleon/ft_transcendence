import { logUI } from "./content/utils/logUI";

/* Component est une fonction qui retourne un HTMLElement */
export type Component = () => HTMLElement;

/* Route est un objet qui mappe des chemins (string) à des composants */
export type Routes = Record<string, Component>;

/* Récupère le chemin depuis le hash et retourne la route correspondante */
function getPathFromHash(routes: Routes): string {
  const hash = window.location.hash || "#/";
  const path = hash.slice(1); // Supprime le '#'

  if (routes[path]) return path;

  for (const base of Object.keys(routes)) {
    if (path === base) return base;
    if (path.startsWith(base + "/")) return base;
  }

  return "/"; // Route par défaut si non trouvée
}

/* Initialise le routeur */
export function createRouter(rootId: string, routes: Routes) {
  const root = document.getElementById(rootId);
    if (!root) {
    throw new Error(`#${rootId} not found.`);
  }

  // root est forcément non null ici
  async function render() {
  const path = getPathFromHash(routes);
  const node = routes[path]();
  root!.replaceChildren(node);

  // Met à jour le statut utilisateur à chaque rendu de route
  try {
    logUI();
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  }


  /* Fonction pour naviguer programmatique */
  function navigate(path: string): void {
    window.location.hash = path;
  }

  /* Écoute les changements de hash et le DOMContentLoaded */
  window.addEventListener("hashchange", render);
  window.addEventListener("DOMContentLoaded", render);

  return { navigate };
}

export function getRouteTail(base: string): string {
  const hash = window.location.hash || "#/";
  const path = hash.slice(1); // "/profile/2"

  if (path === base) return "";
  if (path.startsWith(base + "/")) {
    return path.slice(base.length + 1); // après "/profile/"
  }
  return "";
}
