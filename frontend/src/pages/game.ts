// src/pages/game.ts
export function Game(): HTMLElement {
  const main = document.createElement("main");
  main.className = "max-w-3xl mx-auto px-6 py-8";
  const p = document.createElement("p");
  p.textContent = "Page Game (placeholder).";
  main.append(p);
  return main;
}
