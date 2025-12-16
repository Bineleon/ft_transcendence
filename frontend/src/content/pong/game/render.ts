// game/render.ts
import type { GameState } from "./uiTypes";

export function render(context: CanvasRenderingContext2D, s: GameState, alpha: number) {
  void alpha;
  const canvas = context.canvas;
  context.clearRect(0, 0, canvas.width, canvas.height);

  // scale uniforme pour préserver le ratio world
  const scale = Math.min(canvas.width / s.world.w, canvas.height / s.world.h);
  const vw = s.world.w * scale;
  const vh = s.world.h * scale;
  const offsetX = (canvas.width - vw) / 2;
  const offsetY = (canvas.height - vh) / 2;

  context.save();
  context.translate(offsetX, offsetY);
  context.scale(scale, scale);

  // maintenant dessiner en coordonnées "world" (pas besoin de multiplier par sx/sy)
  const b = s.ball;
  context.beginPath();
  context.arc(b.pos.x, b.pos.y, b.r, 0, Math.PI * 2);
  context.fill();

  const p1 = s.paddle1;
  const p2 = s.paddle2;
  context.fillStyle = "black";
  context.fillRect(p1.pos.x, p1.pos.y, p1.size.x, p1.size.y);
  context.fillRect(p2.pos.x, p2.pos.y, p2.size.x, p2.size.y);

  context.restore();
}
