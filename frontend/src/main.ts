// src/main.ts
import { createRouter } from "./router";
import { Home } from "./content/home";
import { LoginPage } from "./content/login";
import { Game } from "./content/game";
import { PlayPong } from "./content/pong/playpong";
import { Profile } from "./content/profile";

// Structure des routes de l'application
const routes = {
  "/": Home,
  "/login": LoginPage,
  "/game": Game,
  "/profile": Profile,
  "/gameon": PlayPong,
};

// Initialise le router et écoute automatiquement les changements
createRouter("app", routes);
