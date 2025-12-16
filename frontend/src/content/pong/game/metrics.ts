// game/metrics.ts
import type { GameState, Vec2 } from "./uiTypes";
import type { CardinalDirection } from "./update";
import { getBallCardinalPoints, getPaddleFacePoints } from "./geometry";

export interface BallLiveMetrics {
  position: Vec2;
  cardinals: ReturnType<typeof getBallCardinalPoints>;
  direction: CardinalDirection;
  speed: number;          // norme de la vitesse
}

export type PlayerId = "p1" | "p2";

export interface PaddleLiveMetrics {
  player: PlayerId;
  face: ReturnType<typeof getPaddleFacePoints>;
  center: Vec2;
  distanceToBall: number;
  verticalOffsetToBall: number;
}

export interface ScoreSnapshot {
  p1: number;
  p2: number;
}

export interface FrameSnapshot {
  t: number; // temps depuis le début de la partie (en secondes)
  ball: BallLiveMetrics;
  paddles: {
    p1: PaddleLiveMetrics;
    p2: PaddleLiveMetrics;
  };
  score: ScoreSnapshot;
  rallyIndex: number;     // id du rally courant
}

export function getBallSpeed(state: GameState): number {
  const { vel } = state.ball;
  return Math.sqrt(vel.x * vel.x + vel.y * vel.y);
}

export function distance(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function makeFrameSnapshot(state: GameState, t: number, rallyIndex: number): FrameSnapshot {
  const ballCardinals = getBallCardinalPoints(state.ball);
  const ballSpeed = getBallSpeed(state);
  const ballDir = state.ball.vel; // ou getBallDirection(state.ball, { useVel: true })

  const p1Face = getPaddleFacePoints(state.paddle1, "p1");
  const p2Face = getPaddleFacePoints(state.paddle2, "p2");

  const ballCenter = ballCardinals.center;
  const p1Center = {
    x: (state.paddle1.pos.x + state.paddle1.pos.x + state.paddle1.size.x) / 2,
    y: (state.paddle1.pos.y + state.paddle1.pos.y + state.paddle1.size.y) / 2,
  };
  const p2Center = {
    x: (state.paddle2.pos.x + state.paddle2.pos.x + state.paddle2.size.x) / 2,
    y: (state.paddle2.pos.y + state.paddle2.pos.y + state.paddle2.size.y) / 2,
  };

  function getDirectionFromVec2(vec: Vec2): CardinalDirection {
    const epsilon = 1e-3;
    const dx = Math.abs(vec.x) < epsilon ? 0 : vec.x;
    const dy = Math.abs(vec.y) < epsilon ? 0 : vec.y;

    if (dx === 0 && dy === 0) return "CENTER";
    if (dx > 0 && dy < 0) return "NE";
    if (dx < 0 && dy < 0) return "NO";
    if (dx < 0 && dy > 0) return "SO";
    return "SE"; // dx > 0 && dy > 0
  }

  return {
    t,
    ball: {
      position: ballCenter,
      cardinals: ballCardinals,
      direction: getDirectionFromVec2(ballDir),
      speed: ballSpeed,
    },
    paddles: {
      p1: {
        player: "p1",
        face: p1Face,
        center: p1Center,
        distanceToBall: distance(p1Face.center, ballCenter),
        verticalOffsetToBall: ballCenter.y - p1Face.center.y,
      },
      p2: {
        player: "p2",
        face: p2Face,
        center: p2Center,
        distanceToBall: distance(p2Face.center, ballCenter),
        verticalOffsetToBall: ballCenter.y - p2Face.center.y,
      },
    },
    score: {
      p1: state.stats.p1.score,
      p2: state.stats.p2.score,
    },
    rallyIndex,
  };
}
