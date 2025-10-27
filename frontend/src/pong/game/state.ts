import type { GameState } from "./types";

export function createState(): GameState {
  return {
    world: {
        w: 1300,
        h: 800
    }, // logique, pas pixels
    ball: {
        x: 0,
        y: 0,
        vx: 200,
        vy: 150,
        r: 12
    },
    paddle: {
        pos: { x: 50, y: 300 },
        size: { x: 10, y: 100 },
        speed: 300
    },
  };
}