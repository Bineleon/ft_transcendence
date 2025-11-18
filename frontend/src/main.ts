// src/main.ts
import { createRouter } from "./router";
import { Home } from "./content/home";
import { LoginPage } from "./content/login";
import { Game } from "./content/game";
import { PlayPong } from "./content/pong/playpong";
import { Profile } from "./content/profile";
import { ChoseTournament } from "./content/tournament/tournament";
import { classicTournament } from "./content/tournament/classic";


// Structure des routes de l'application
const routes = {
  "/": Home,
  "/login": LoginPage,
  "/game": Game,
  "/profile": Profile,
  "/playpong": PlayPong,
  "/tournament": ChoseTournament,
  "/tournament/classic": classicTournament,
  // "/tournament/king": kingTournament,
  // "/tournament/gauntlet": gauntletTournament,
};

// 
createRouter("app", routes);  // le router écoute et rend tout seul
