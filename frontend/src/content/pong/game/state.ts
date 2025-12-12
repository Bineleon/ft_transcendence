import type { Tournament } from "../../tournament/uiTypes";
import { getTournamentDatas } from "../../utils/todb";
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
  } else {        // "SO"
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
    state.stats.totalBounces = 0;
}

export function initPlayersInfo(state: GameState) {
    state.p1 = { userName: "P1", avatarUrl: "" };
    state.p2 = { userName: "P2", avatarUrl: "" };
}

export function initState(tCode?: string): GameState {
  console.log("NOOOW");
  return {
    world: { w: 1500, h: 900 },   // logique, pas pixels
    ball: {
        pos: { x: 750, y: 450 },  // position initiale de la balle
        vel: { x: 0, y: 0 },      // "pixels" par seconde
        velIncrement: { x: 20, y: 20 },
        r: 15                     // rayon de la balle en "pixels" world
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
    matchId: undefined,
    stats: { 
      p1: {
        name: "P1",
        isGuest: false,
        score: 0,
        effects: 0,
        maxEffects: 0,
        maxBounces: 0,
        maxBallSpeedWon: 0,
        maxBallSpeedLost: 0,
        fastestWonRally: Infinity,
        fastestLostRally: Infinity,
        ralliesWon: 0,
        ralliesLost: 0,
      },
      p2: {
        name: "P2",
        isGuest: false,
        score: 0,
        effects: 0,
        maxEffects: 0,
        maxBounces: 0,
        maxBallSpeedWon: 0,
        maxBallSpeedLost: 0,
        fastestWonRally: Infinity,
        fastestLostRally: Infinity,
        ralliesWon: 0,
        ralliesLost: 0,
      },
      lastScorer: undefined,
      currentBounces: 0,
      totalBounces: 0,
      totalRallies: 0,
      rallyStartAt: undefined,
      rallyDurationsMs: [],
      pauseStartAt: undefined,
      totalPauseMs: 0,
      tournamentCode: undefined,
      tournamentMode: undefined,
      tournamentName: undefined,
      matchRound: undefined,
      matchStatus: undefined,
    },
    p1: { userName: "P1", avatarUrl: "" }, p2: { userName: "P2", avatarUrl: "" },
    tournamentCode: tCode,
  } as GameState;
}