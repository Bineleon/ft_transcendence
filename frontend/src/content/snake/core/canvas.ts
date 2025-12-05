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

function pickTileSize(viewport: number): number {
  // viewport = typiquement la plus petite dimension (min(width, height))
  if (viewport < 400) return TILE_SIZES.base;
  if (viewport < 600) return TILE_SIZES.lg;
  if (viewport < 900) return TILE_SIZES.xl;
  return TILE_SIZES.xxl;
}

export function createSnakeCanvas(): HTMLCanvasElement {
    const canvas = el("canvas", "mix-blend-multiply border-4") as HTMLCanvasElement;
    return canvas;
}

export function resizeSnake(canvas: HTMLCanvasElement, container: HTMLElement, state: SnakeState): void {
        const rect = container.getBoundingClientRect();
        console.log("Container rect:", rect);

        const viewport = Math.min(rect.width, rect.height);
        console.log("Viewport size:", viewport);
        const tile = pickTileSize(viewport);

        TILE = tile;

        const cols = Math.max(5, Math.floor(rect.width / tile));
        const rows = Math.max(5, Math.floor(rect.height / tile));

        state.world.w = cols;
        state.world.h = rows;

        canvas.width = cols * tile;
        canvas.height = rows * tile;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
