// game/geometry.ts
import type { Ball, Paddle, GameState, Vec2, PlayerId } from "./uiTypes";

export interface CardinalPoints {
  center: Vec2;
  n: Vec2;
  s: Vec2;
  e: Vec2;
  w: Vec2;
}

export interface PaddleFacePoints {
  center: Vec2;
  top: Vec2;
  bottom: Vec2;
}

export function getBallCardinalPoints(ball: Ball): CardinalPoints {
  const { pos, r } = ball; // r = radius
  return {
    center: { x: pos.x, y: pos.y },
    n:  { x: pos.x,       y: pos.y - r },
    s:  { x: pos.x,       y: pos.y + r },
    w:   { x: pos.x - r,   y: pos.y },
    e:   { x: pos.x + r,   y: pos.y },
  };
}

// North, South, West, East
export interface NSWE {
  n: number;
  s: number;
  w: number;
  e: number;
}

export function getBallNSWE(ball: Ball): NSWE {
  return {
    n: ball.pos.y - ball.r,
    s: ball.pos.y + ball.r,
    w:  ball.pos.x - ball.r,
    e:  ball.pos.x + ball.r,
  };
}

export function getPaddleNSWE(p: Paddle): NSWE {
  return {
    n: p.pos.y,
    s: p.pos.y + p.size.y,
    w:  p.pos.x,
    e:  p.pos.x + p.size.x,
  };
}

// Points sur l’arête qui fait face à l’arène
export interface PaddleFacePoints {
  center: Vec2;
  top: Vec2;
  bottom: Vec2;
}

export function getPaddleFacePoints(p: Paddle, side: PlayerId): PaddleFacePoints {
  const xFace = side === "p1" ? p.pos.x + p.size.x : p.pos.x;
  const yTop = p.pos.y;
  const yBottom = p.pos.y + p.size.y;
  const yCenter = (yTop + yBottom) / 2;

  return {
    center: { x: xFace, y: yCenter },
    top:    { x: xFace, y: yTop },
    bottom: { x: xFace, y: yBottom },
  };
}

// Version pratique pour tout récupérer d’un coup depuis le GameState
export interface GeometrySnapshot {
  ball: CardinalPoints & { nswe: NSWE };
  paddle1: { nswe: NSWE; face: PaddleFacePoints };
  paddle2: { nswe: NSWE; face: PaddleFacePoints };
}

export function getGeometrySnapshot(state: GameState): GeometrySnapshot {
  const ballCardinals = getBallCardinalPoints(state.ball);
  return {
    ball: {
      ...ballCardinals,
      nswe: getBallNSWE(state.ball),
    },
    paddle1: {
      nswe: getPaddleNSWE(state.paddle1),
      face: getPaddleFacePoints(state.paddle1, "p1"),
    },
    paddle2: {
      nswe: getPaddleNSWE(state.paddle2),
      face: getPaddleFacePoints(state.paddle2, "p2"),
    },
  };
}
