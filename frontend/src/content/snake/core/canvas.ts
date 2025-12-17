import type { SnakeSegment, Edible } from "../game/uiTypes";
import { el } from "../../home";

export const PLAYER_GRID_SIZE = 10;
export const CELL_SIZE = 40;

export function createPlayerCanvas(): HTMLCanvasElement {
  const canvas = el("canvas", "mix-blend-multiply") as HTMLCanvasElement;
  canvas.width = PLAYER_GRID_SIZE * CELL_SIZE;
  canvas.height = PLAYER_GRID_SIZE * CELL_SIZE;
  return canvas;
}

export function drawPlayerCanvas(
  canvas: HTMLCanvasElement,
  snakeSegments: SnakeSegment[],
  edibles: Edible[],
  options: { bg: string; text: string; edible: string }
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = options.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = "24px LaPresse";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = options.edible;
  for (const ed of edibles) {
    ctx.fillText(ed.displayChar, (ed.x + 0.5) * CELL_SIZE, (ed.y + 0.5) * CELL_SIZE);
  }

  ctx.fillStyle = options.text;
  for (const seg of snakeSegments) {
    ctx.fillText(seg.char, (seg.x + 0.5) * CELL_SIZE, (seg.y + 0.5) * CELL_SIZE);
  }
}
