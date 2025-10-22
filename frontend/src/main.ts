// src/main.ts
import { createRouter } from "./router";
import { Home } from "./pages/home";
import { LoginPage } from "./pages/login";
import { Game } from "./pages/game";

const routes = {
  "/": Home,
  "/login": LoginPage,
  "/game": Game,
};

createRouter("app", routes);  // le router écoute et rend tout seul
