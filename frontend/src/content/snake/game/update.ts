import type { SnakeController } from "../controller";
import type { PlayerId, Direction, SnakeSegment, PlayerState } from "./uiTypes";

function dirDelta(d: Direction): { dx: number; dy: number } {
  switch (d) {
    case "UP": return { dx: 0, dy: -1 };
    case "DOWN": return { dx: 0, dy: 1 };
    case "LEFT": return { dx: -1, dy: 0 };
    case "RIGHT": return { dx: 1, dy: 0 };
  }
}

function wrap10(n: number): number {
  return (n % 10 + 10) % 10;
}

// update.ts
export function computeNextHead(p: PlayerState): { x: number; y: number } {
  const head = p.snake.segments[0];
  const { dx, dy } = dirDelta(p.snake.nextDirection);
  return { x: (head.x + dx + 10) % 10, y: (head.y + dy + 10) % 10 };
}

function moveSnake(p: PlayerState, next: { x: number; y: number }): void {
  const segs = p.snake.segments;
  for (let i = segs.length - 1; i > 0; i--) {
    segs[i].x = segs[i - 1].x;
    segs[i].y = segs[i - 1].y;
  }
  segs[0].x = next.x;
  segs[0].y = next.y;
}

export function updateBothPlayers(ctrl: SnakeController): void {
  const p1 = ctrl.state.players.p1;
  const p2 = ctrl.state.players.p2;

  console.log("p1 RT", p1.snake.respawnTicks, "p2 RT", p1.snake.respawnTicks);
  // respawn ticks
  if (p1.snake.respawnTicks > 0) { p1.snake.respawnTicks--; }
  if (p2.snake.respawnTicks > 0) { p2.snake.respawnTicks--; }

  // 1) PLAN (ne modifie rien)
  const next1 = computeNextHead(p1);
  const next2 = computeNextHead(p2);

  // auto-collisions (planifiées aussi)
  const dead1 = p1.snake.segments.some(seg => seg.x === next1.x && seg.y === next1.y);
  const dead2 = p2.snake.segments.some(seg => seg.x === next2.x && seg.y === next2.y);

  if (dead1) ctrl.onPlayerDeath("p1");
  if (dead2) ctrl.onPlayerDeath("p2");

  // si mort, on ne bouge pas ce joueur-là (simple & stable)
  if (!dead1) applyMoveAndEat(ctrl, "p1", next1);
  if (!dead2) applyMoveAndEat(ctrl, "p2", next2);
}

function applyMoveAndEat(ctrl: SnakeController, pid: PlayerId, next: {x:number;y:number}) {
  const p = ctrl.state.players[pid];
  const s = p.snake;

  // mémorise l’ancienne queue pour grandir
  const tailPrev = { ...s.segments[s.segments.length - 1] };

  // déplace (une seule fois)
  if (ctrl.state.players[pid].snake.respawnTicks > 0) return ;
  moveSnake(p, next);

  // mange ?
  const idx = p.edibles.findIndex(e => e.x === next.x && e.y === next.y);
  if (idx >= 0) {
    const e = p.edibles[idx];
    p.edibles.splice(idx, 1);
    s.segments.push({ x: tailPrev.x, y: tailPrev.y, char: e.displayChar });
    ctrl.onEatEdible(pid, e);
  }

  // commit direction après move
  s.direction = s.nextDirection;
}


export function updatePlayer(ctrl: SnakeController, pid: PlayerId): "OK" | "DEAD" {
  const p = ctrl.state.players[pid];
  const s = p.snake;


  if (s.respawnTicks > 0) {
    s.respawnTicks--;
    return "OK";
  }

  // On calcule la prochaine tête à partir de nextDirection (on ne change pas encore s.direction)
  const { x: nx, y: ny } = computeNextHead(p);

  // Collision avec soi-même ?
  for (const seg of s.segments) {
    if (seg.x === nx && seg.y === ny) {
      ctrl.onPlayerDeath(pid);
      return "DEAD";
    }
  }

  // Mémoriser l'ancienne queue pour l'éventuelle croissance
  const tailPrev = { ...s.segments[s.segments.length - 1] };

  // Déplacer le serpent
  for (let i = s.segments.length - 1; i > 0; i--) {
    s.segments[i].x = s.segments[i - 1].x;
    s.segments[i].y = s.segments[i - 1].y;
  }
  s.segments[0].x = nx;
  s.segments[0].y = ny;

  // Manger une lettre ?
  const idx = p.edibles.findIndex(e => e.x === nx && e.y === ny);
  if (idx >= 0) {
    const e = p.edibles[idx];
    p.edibles.splice(idx, 1);
    s.segments.push({ x: tailPrev.x, y: tailPrev.y, char: e.displayChar });
    ctrl.onEatEdible(pid, e);
  }

  // Mettre à jour la direction courante une fois le déplacement effectué
  s.direction = s.nextDirection;

  return "OK";
}

export function respawnPlayer(ctrl: SnakeController, pid: PlayerId, ticks: number): void {
  const p = ctrl.state.players[pid];
  p.edibles = [];
  p.snake.respawnTicks = ticks;

  if (pid === "p1") {
    p.snake.segments = [
      { x: 4, y: 5, char: "S" }, { x: 3, y: 5, char: "N" }, { x: 2, y: 5, char: "A" }, { x: 1, y: 5, char: "K" }, { x: 0, y: 5, char: "E" },
    ];
    p.snake.direction = "RIGHT";
    p.snake.nextDirection = "RIGHT";
  } else {
    p.snake.segments = [
      { x: 5, y: 4, char: "S" }, { x: 6, y: 4, char: "N" }, { x: 7, y: 4, char: "A" }, { x: 8, y: 4, char: "K" }, { x: 9, y: 4, char: "E" },
    ];
    p.snake.direction = "LEFT";
    p.snake.nextDirection = "LEFT";
  }

  void ctrl;
}
