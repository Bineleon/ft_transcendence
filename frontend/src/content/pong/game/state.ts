import type { GameState } from "./types";

export function initState(): GameState {
  return {
    world: { w: 1300, h: 800 }, // logique, pas pixels
    ball: {
        x: 0, y: 0,             // position initiale de la balle
        vx: 130, vy: 80,        // "pixels" par seconde
        r: 12                   // rayon de la balle
    },
    paddle1: {
        pos: { x: 50, y: 300 },
        size: { x: 10, y: 100 },
        speed: 300
    },
    paddle2: {
        pos: { x: 1240, y: 300 },
        size: { x: 10, y: 100 },
        speed: 300
    },
    phase: "START",
    ready: { p1: false, p2: false, paused: false },
    controls: {
        p1Ready: "w",
        p2Ready: "ArrowUp",
        pause: " "
    },
  } as GameState;
}