import type { SnakeController } from "../controller";
import type { PlayerId } from "./uiTypes";

const WORLD_COLS = 34;
const WORLD_ROWS = 24;

const P1 = { x: 1, y: 1, w: 10, h: 10 };
const P2 = { x: 23, y: 13, w: 10, h: 10 };

function ensureCanvasSize(c: HTMLCanvasElement): void {
  const r = c.getBoundingClientRect();
  const w = Math.max(1, Math.floor(r.width));
  const h = Math.max(1, Math.floor(r.height));
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
  }
}

export function renderAll(ctrl: SnakeController): void {
  ensureCanvasSize(ctrl.view.canvasWorld);
  ensureCanvasSize(ctrl.view.canvasP1);
  ensureCanvasSize(ctrl.view.canvasP2);

  renderWorld(ctrl);
  renderPlayer(ctrl, "p1");
  renderPlayer(ctrl, "p2");
}

function renderWorld(ctrl: SnakeController): void {
  const c = ctrl.view.canvasWorld;
  const ctx = c.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, c.width, c.height);

  const cellW = c.width / WORLD_COLS;
  const cellH = c.height / WORLD_ROWS;

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, c.width, c.height);

  // grille
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.lineWidth = 1;

  for (let x = 0; x <= WORLD_COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cellW, 0);
    ctx.lineTo(x * cellW, c.height);
    ctx.stroke();
  }
  for (let y = 0; y <= WORLD_ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * cellH);
    ctx.lineTo(c.width, y * cellH);
    ctx.stroke();
  }

  // ghosts (mots actifs)
  ctx.font = `${Math.floor(Math.min(cellW, cellH) * 0.55)}px Modern_Type`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(0,0,0,0.25)";

  const ghostIds = new Set<string>([...ctrl.activeWordIds.p1, ...ctrl.activeWordIds.p2]);
  for (const wid of ghostIds) {
    const w = ctrl.state.crossword.words.find((x) => x.id === wid);
    if (!w) continue;

    for (let i = 0; i < w.cells.length; i++) {
      const cell = w.cells[i];
      const k = `${cell.x},${cell.y}`;
      if (ctrl.state.crossword.filledCells.has(k)) continue;

      const ch = w.solution[i] || "";
      ctx.fillText(ch, (cell.x + 0.5) * cellW, (cell.y + 0.5) * cellH);
    }
  }

  // filled cells
  for (const fc of ctrl.state.crossword.filledCells.values()) {
    const x0 = fc.x * cellW;
    const y0 = fc.y * cellH;

    if (fc.filledBy === "p1") {
      ctx.fillStyle = "black";
      ctx.fillRect(x0, y0, cellW, cellH);
      ctx.fillStyle = "white";
    } else {
      ctx.fillStyle = "white";
      ctx.fillRect(x0, y0, cellW, cellH);
      ctx.strokeStyle = "stone-600";
      ctx.strokeRect(x0 + 0.5, y0 + 0.5, cellW - 1, cellH - 1);
      ctx.fillStyle = "black";
    }

    ctx.fillText(fc.letter, (fc.x + 0.5) * cellW, (fc.y + 0.5) * cellH);
  }
}

function renderPlayer(ctrl: SnakeController, pid: PlayerId): void {
  const p = ctrl.state.players[pid];
  const c = pid === "p1" ? ctrl.view.canvasP1 : ctrl.view.canvasP2;
  const ctx = c.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, c.width, c.height);

  const zone = pid === "p1" ? P1 : P2;

  const cellW = c.width / WORLD_COLS;
  const cellH = c.height / WORLD_ROWS;

  const zx = zone.x * cellW;
  const zy = zone.y * cellH;
  const zw = zone.w * cellW;
  const zh = zone.h * cellH;

  // fond zone léger
  ctx.fillStyle = pid === "p1" ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.03)";
  ctx.fillRect(zx, zy, zw, zh);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // edibles
  ctx.fillStyle = "black";
  for (const e of p.edibles) {
    ctx.font = `${Math.floor(Math.min(cellW, cellH) * 0.75)}px Modern_Type`;
    ctx.fillText(e.displayChar, (zone.x + e.x + 0.5) * cellW, (zone.y + e.y + 0.5) * cellH);
  }

  // snake
    ctx.fillStyle = "black";
    const segments = p.snake.segments;
    const lastIndex = Math.max(0, segments.length - 1);
    ctx.font = `${Math.floor(Math.min(cellW, cellH) * 1)}px Omegle`;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const x = (zone.x + seg.x) * cellW;
      const y = (zone.y + seg.y) * cellH;
      const isHead = i === 0;
      const isTail = i === lastIndex;

      let alpha = 0.10; // corps par défaut

      if (isHead) {
        alpha = 0.20;   // tête plus sombre
      } else if (isTail) {
        alpha = 0.04;   // queue plus claire
      }

      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.fillRect(x, y, cellW, cellH);

      // lettre
      ctx.fillStyle = "black";
      ctx.fillText(seg.char, x + cellW * 0.5, y + cellH * 0.5);

      // bordure façon impression
      ctx.strokeStyle = "rgba(0,0,0,0.10)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);
    }
}
