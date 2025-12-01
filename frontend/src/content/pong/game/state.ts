import type { GameState } from "./types";
import type { CardinalDirection } from "./update";


export function launchBall(state: GameState, dir: CardinalDirection, speed: number) {
  const diag = speed / Math.sqrt(2);

  if (dir === "CENTER") {
    state.ball.vel = { x: 0, y: 0 };
  } else if (dir === "NE") {
    state.ball.vel = { x:  diag, y: -diag };
  } else if (dir === "NO") {
    state.ball.vel = { x: -diag, y: -diag };
  } else if (dir === "SE") {
    state.ball.vel = { x:  diag, y:  diag };
  } else { // "SO"
    state.ball.vel = { x: -diag, y:  diag };
  }
}

export function initBoard(state: GameState) {
    state.ball.pos = { x: 750, y: 450 };
    state.ball.vel = { x: 0, y: 0 };
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
    state.stats.bounces = 0;
}

export function initGame(): GameState {
  const state = initState();
  initBoard(state);
  return state;
}

export function initState(): GameState {
  return {
    world: { w: 1500, h: 900 }, // logique, pas pixels
    ball: {
        pos: { x: 750, y: 450 },  // position initiale de la balle
        vel: { x: 0, y: 0 },// "pixels" par seconde
        velIncrement: { x: 20, y: 20 },
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
    PrevPhase: undefined,
    ready: { p1: false, p2: false },
    stats: { p1Score: 0, p2Score: 0, lastScorer: undefined, bounces: 0, p1Effects: 0, p2Effects: 0, p1MaxBounces: 0, p2MaxBounces: 0 },
  } as GameState;
}