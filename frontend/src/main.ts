// src/main.ts
import { createRouter } from "./router";
import { Home } from "./pages/home";
import { LoginPage } from "./pages/login";
import { Game } from "./pages/game";
import { PlayPong } from "./pages/playpong";
import { Profile } from "./pages/profile";

const routes = {
  "/": Home,
  "/login": LoginPage,
  "/game": Game,
  "/profile": Profile,
  "/gameon": PlayPong,
};

createRouter("app", routes);  // le router écoute et rend tout seul
