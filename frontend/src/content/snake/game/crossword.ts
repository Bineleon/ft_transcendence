import type { GameState, PlayerId, Edible, FilledCell } from "./uiTypes";

function key(x: number, y: number): string {
  return `${x},${y}`;
}

export function collectEdible(state: GameState, playerId: PlayerId, edible: Edible): void {
  const w = state.crossword.words.find((x) => x.id === edible.wordId);
  if (!w) return;

  const cell = w.cells[edible.index];
  if (!cell) return;

  const k = key(cell.x, cell.y);
  if (state.crossword.filledCells.has(k)) return;

  const fc: FilledCell = { x: cell.x, y: cell.y, letter: edible.baseChar, filledBy: playerId };
  state.crossword.filledCells.set(k, fc);
}

export function updateWordCompletion(state: GameState, wordId: string, playerId: PlayerId): void {
  const w = state.crossword.words.find((x) => x.id === wordId);
  if (!w || w.completed) return;

  for (let i = 0; i < w.cells.length; i++) {
    const c = w.cells[i];
    if (!state.crossword.filledCells.has(key(c.x, c.y))) return;
  }

  w.completed = true;
  w.completedBy = playerId;
  state.crossword.remainingWords = Math.max(0, state.crossword.remainingWords - 1);

  void playerId;
}
