import { el } from "../../home";
import type { SnakeState } from "../game/types";

export const COLS = 20;
export const ROWS = 20;
export let TILE = 16;

type TileSizeName = "base" | "lg" | "xl" | "xxl";

const TILE_SIZES: Record<TileSizeName, number> = {
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

type ResizeCache = {
  tile: number;
  cols: number;
  rows: number;
};

let _resizeCache: ResizeCache | null = null;
let _cacheArmed = false;

function pickTileSize(viewport: number): number {
  // viewport = typiquement la plus petite dimension (min(width, height))
  if (viewport < 400) return TILE_SIZES.base;
  if (viewport < 600) return TILE_SIZES.lg;
  if (viewport < 900) return TILE_SIZES.xl;
  return TILE_SIZES.xxl;
}

export function createSnakeCanvas(): HTMLCanvasElement {
    const canvas = el("canvas", "mix-blend-multiply") as HTMLCanvasElement;
    return canvas;
}

export function resizeSnake(
  canvas: HTMLCanvasElement,
  container: HTMLElement,
  state: SnakeState
): void {
  // 1) Si on a déjà calculé dans cette “batch” (TL -> BR), on réutilise.
  if (_resizeCache) {
    TILE = _resizeCache.tile;
    state.world.w = _resizeCache.cols;
    state.world.h = _resizeCache.rows;
    applyCanvas(canvas, _resizeCache.cols, _resizeCache.rows, _resizeCache.tile);
    return;
  }

  // 2) Sinon, on calcule à partir du container courant (probablement TL)
  let rect: DOMRect | null = null;
  if (container && typeof container.getBoundingClientRect === "function") {
    rect = container.getBoundingClientRect();
  } else if (canvas.parentElement) {
    rect = canvas.parentElement.getBoundingClientRect();
    console.warn("resizeSnake: container absent, using canvas.parentElement as fallback");
  } else if (document.documentElement) {
    rect = document.documentElement.getBoundingClientRect();
    console.warn("resizeSnake: container absent, using document.documentElement as fallback");
  }
  const viewport = Math.min(rect.width, rect.height);

  const tile = pickTileSize(viewport);
  TILE = tile;

  const cols = Math.max(5, Math.floor(viewport / tile));
  const rows = Math.max(5, Math.floor(viewport / tile));

  // State mis à jour UNE fois
  state.world.w = cols;
  state.world.h = rows;

  // On applique au canvas appelant
  applyCanvas(canvas, cols, rows, tile);

  // 3) On met en cache pour le 2e appel immédiat (BR)
  _resizeCache = { tile, cols, rows };

  // 4) On clear le cache juste après la pile courante (donc après le 2e appel)
  if (!_cacheArmed) {
    _cacheArmed = true;
    queueMicrotask(() => {
      _resizeCache = null;
      _cacheArmed = false;
    });
  }
}

function applyCanvas(canvas: HTMLCanvasElement, cols: number, rows: number, tile: number) {
  canvas.width = cols * tile;
  canvas.height = rows * tile;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Si tu veux voir le papier dans les frames : enlève ce fill blanc.
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
