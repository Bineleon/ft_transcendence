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
};

// 
createRouter("app", routes);  // le router écoute et rend tout seul
