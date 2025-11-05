/* On definit ici les types pour les composants et les routes */
/* Component est une fonction qui retourne un HTMLElement */
export type Component = () => HTMLElement;

/* Route est un objet qui mappe des chemins (string) à des composants */
/* Record<string, Component> est un type utilitaire de TS qui crée un objet
avec ces deux contraintes (un peu comme une Map<string, Component>) */
export type Routes = Record<string, Component>;

/* Retourne la route à afficher depuis le hash de l'URL */
function getPathFromHash(routes: Routes): string {
  const hash = window.location.hash || "#/";
  const path = hash.slice(1); // On enlève le '#'
  return routes[path] ? path : "/"; // Si la route n'existe pas, on retourne la route par défaut
}

/* La fonction createRouter initialise le routeur */
export function createRouter(rootId: string, routes:Routes) {
  const el = document.getElementById(rootId);
  if (!el) {
    throw new Error(`#${rootId} not found.`);
  }

  const root: HTMLElement = el;

  /* Fonction pour rendre la route courante */
  function render(): void {
    const path = getPathFromHash(routes);
    const node = routes[path]();
    root.replaceChildren(node);
  }

  /* Fonction pour naviguer via le router */
  function navigate(path:string): void {
      window.location.hash = path;
  }

  /* Événements pour réagir au changement de hash ou au chargement de la page */
  window.addEventListener("hashchange", render);
  window.addEventListener("DOMContentLoaded", render);

  return { navigate };
} 
