import { el, text } from "../../home";
import type { GameState, PlayerId, Vec2 } from "../game/types";
import { getDirectionFromVec, type GetDirOptions, type CardinalDirection } from "../game/update";

function arrowFromDirection(dir: CardinalDirection): string {
  switch (dir) {
    case "NE":     return "↗";
    case "NO":     return "↖";
    case "SE":     return "↘";
    case "SO":     return "↙";
    case "CENTER": return "•"; // balle quasi immobile
  }
}

function createArrowDiv(vel: Vec2): HTMLElement {
  const dir = getDirectionFromVec(vel);
  const arrowChar = arrowFromDirection(dir);

  const arrowDiv = el("div", "big-arrow");
  arrowDiv.textContent = arrowChar;

  return arrowDiv;
}

function getMaxBouncesPerPlayer(state: GameState, player: PlayerId): number {
  if (player === "p1") {
    return state.stats.p1MaxBounces || 0;
  } else {
    return state.stats.p2MaxBounces || 0;
  }
}


export function createPongStatsPanel(state: GameState): HTMLElement {
  const ball = state.ball;
  const speed = Math.sqrt(ball.vel.x * ball.vel.x + ball.vel.y * ball.vel.y);

  const hdr: string[] = [
    "░█░█░█▀▀░█░░░█▀▀░█▀█░█▄█░█▀▀░░░▀█▀░█▀█░░             ",
    "░█▄█░█▀▀░█░░░█░░░█░█░█░█░█▀▀░░░░█░░█░█░░             ",
    "░▀░▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░▀░▀░▀▀▀░░░░▀░░▀▀▀░░             ",
    "░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░             ",
    "                                                     ",
    "░▀█▀░█░█░█▀▀░░░█▀▄░█▀█░▀█▀░█░░░█░█░░░█▀█░█▀█░█▀█░█▀▀░", 
    "░░█░░█▀█░█▀▀░░░█░█░█▀█░░█░░█░░░░█░░░░█▀▀░█░█░█░█░█░█░",
    "░░▀░░▀░▀░▀▀▀░░░▀▀░░▀░▀░▀▀▀░▀▀▀░░▀░░░░▀░░░▀▀▀░▀░▀░▀▀▀░",
    "░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░",
    "                                                     ",
    "░█▀▀░█▀█░█▄█░█▀▀░░░█▀▀░▀█▀░█▀█░▀█▀░█▀▀░              ",
    "░█░█░█▀█░█░█░█▀▀░░░▀▀█░░█░░█▀█░░█░░▀▀█░              ",
    "░▀▀▀░▀░▀░▀░▀░▀▀▀░░░▀▀▀░░▀░░▀░▀░░▀░░▀▀▀░              ",
    "░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░              ",
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // Structure DOM
  // ─────────────────────────────────────────────────────────────────────────────
  const root = el("div", "p-6 text-white ");

  const header = el("div", "terminal-header");
  header.textContent = hdr.join("\n");

  const gameLiveStats = el("div", "m-4 terminal-text sm:h-auto");

  function statLine(label: string, value: string): HTMLElement {
    const line = el("div", "stat-line");

    line.append(
      el("span", "stat-label", text(label)),
      el("span", "stat-value", text(value))
    );

    return line;
  }

  gameLiveStats.append(
    statLine("Speed :", `${speed.toFixed(1)} px/s`),
    statLine("Bounces :", `${state.stats.bounces}`)
  );

  function playerCol(id: "p1" | "p2", state: GameState, align: "left" | "right"): HTMLElement {
    const box = el("div", "terminal-text-score");
    const statsDiv = el("div", "text-" + align);

    const playerStats = id === "p1" ? state.stats.p1Score : state.stats.p2Score;

    statsDiv.append(
      (() => { const n = el("div", "mx-2"); n.textContent = `${playerStats}`; return n; })(),
    );

    box.append(statsDiv);
    return box;
  }


  const playersBox = el("div", "grid grid-rows-4 mt-6");

  const PlayerHeader = el("div", "grid grid-cols-3 terminal-text");
  const p1Title = el("div", "font-bold text-left terminal-title");
  p1Title.textContent = "ALPHA";
  const vs = el("div", "text-center font-bold");
  vs.textContent = "VS";
  playersBox.append(vs);
  const p2Title = el("div", "font-bold text-right terminal-title");
  p2Title.textContent = "OMEGA";
  PlayerHeader.append(p1Title, vs, p2Title);

  const PlayersScores = el("div", "grid grid-cols-2 gap-2");
  const p1Box = playerCol("p1", state, "left");
  const p2Box = playerCol("p2", state, "right");
  PlayersScores.append(p1Box, p2Box);

  const PlayersStats = el("div", "grid grid-cols-3 gap-2 terminal-text text-sm");

  const p1Effects = el("div", "text-left");
  p1Effects.textContent = `${state.stats.p1Effects}`;
  const effectsLabel = el("div", "text-center terminal-text");
  effectsLabel.textContent = "Effects";
  const p2Effects = el("div", "text-right");
  p2Effects.textContent = `${state.stats.p2Effects}`;

  const p1MaxBounces = el("div", "text-left");
  p1MaxBounces.textContent = `${getMaxBouncesPerPlayer(state, "p1")}`;
  const maxBouncesLabel = el("div", "text-center terminal-text");
  maxBouncesLabel.textContent = "Max Bounces";
  const p2MaxBounces = el("div", "text-right");
  p2MaxBounces.textContent = `${getMaxBouncesPerPlayer(state, "p2")}`;



  PlayersStats.append(p1Effects, effectsLabel, p2Effects);
  PlayersStats.append(p1MaxBounces, maxBouncesLabel, p2MaxBounces);
  playersBox.append(PlayerHeader, PlayersScores, PlayersStats);

  const arrow = createArrowDiv(ball.vel);
  root.append(header, playersBox, gameLiveStats, arrow);
  return root;
}


