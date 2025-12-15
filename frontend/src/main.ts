// src/main.ts
import { createRouter } from "./router";
import { Home } from "./content/home";
import { LoginPage } from "./content/login";
import { Game } from "./content/game";
import { PlayPong } from "./content/pong/playpong";
import { Profile } from "./content/profile";
import { ChoseTournament } from "./content/tournament/tournament";
import { classicTournament } from "./content/tournament/classic";
import { PlaySnake } from "./content/snake/snake";
import { Settings } from "./content/settings";
import { Credits } from "./content/credits";

// Structure des routes de l'application
const routes = {
  "/": Home,
  "/login": LoginPage,
  "/game": Game,
  "/profile": Profile,
  "/playpong": PlayPong,
  "/tournament/classic": classicTournament,
  // "/tournament/king": kingTournament,
  // "/tournament/gauntlet": gauntletTournament,
  "/tournament": ChoseTournament,
  "/snake": PlaySnake,
  "/settings": Settings,
  "/credits": Credits,
};

// ✅ Gérer le state de Google OAuth AVANT d'initialiser le router
(function init() {
  const params = new URLSearchParams(window.location.search);
  const state = params.get("state");

  if (state) {
    // On enlève ?state=... de l’URL pour garder un truc propre
    window.history.replaceState({}, "", window.location.origin);
    // On renvoie vers la route d’origine (#/...)
    window.location.hash = state;
  }

  // Le router écoute et rend tout seul
  createRouter("app", routes);
})();
