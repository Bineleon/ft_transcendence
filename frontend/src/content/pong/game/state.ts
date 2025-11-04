import type { GameState } from "./types";

export function initBoard(state: GameState) {
    state.ball.pos = { x: 750, y: 450 };
    state.ball.vel = { x: 300, y: 100 };
    state.ball.dir = { x: 1, y: 1 };
    state.ball.r = 15;

    state.paddle1 = {
        pos: { x: 5, y: 325 },
        size: { x: 20, y: 250 },
        speed: 1000
    };
    state.paddle2 = {
        pos: { x: 1475, y: 325 },
        size: { x: 20, y: 250 },
        speed: 1000
    };
}

export function initState(): GameState {
  return {
    world: { w: 1500, h: 900 }, // logique, pas pixels
    ball: {
        pos: { x: 750, y: 450 },  // position initiale de la balle
        vel: { x: 0, y: 0 },// "pixels" par seconde
        dir: { x: 1, y: 1 },
        r: 15                   // rayon de la balle en "pixels" world
    },
    paddle1: {
        pos: { x: 5, y: 325 },
        size: { x: 20, y: 250 },
        speed: 1000
    },
    paddle2: {
        pos: { x: 1475, y: 325 },
        size: { x: 20, y: 250 },
        speed: 1000
    },
    phase: "START",
    ready: { p1: false, p2: false },
    stats: { p1Score: 0, p2Score: 0, lastScorer: undefined, bounces: 0},
  } as GameState;
}