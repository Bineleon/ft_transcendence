// src/main.ts
import { createRouter } from "./router";
import { Home } from "./pages/home";
import { Login } from "./pages/login";
import { Game } from "./pages/game";

const routes = {
  "/": Home,
  "/login": Login,
  "/game": Game,
};

createRouter("app", routes);  // le router écoute et rend tout seul
