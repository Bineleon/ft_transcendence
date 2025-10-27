// src/main.ts
import { createRouter } from "./router";
import { Home } from "./pong/home";
import { LoginPage } from "./pong/login";
import { Game } from "./pong/game";
import { PlayPong } from "./pong/playpong";
import { Profile } from "./pong/profile";


// Structure des routes de l'application
const routes = {
  "/": Home,
  "/login": LoginPage,
  "/game": Game,
  "/profile": Profile,
  "/gameon": PlayPong,
};

// 
createRouter("app", routes);  // le router écoute et rend tout seul
