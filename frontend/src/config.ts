// src/config.ts

// Récupère l'URL du backend depuis la variable d'environnement injectée par Docker Compose
export const BACKEND_URL = (window as any).BACKEND_URL || "https://localhost:8080";
