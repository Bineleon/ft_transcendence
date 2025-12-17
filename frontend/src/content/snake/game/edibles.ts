import type { SnakeController } from "../controller";
import type { PlayerId, Edible } from "./uiTypes";
import type { LetterCase } from "./uiTypes";


function randInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function makeEdibleDisplay(baseChar: string): { displayChar: string; letterCase: LetterCase } {
  const base = baseChar.toUpperCase();
  const letterCase: LetterCase = Math.random() < 0.5 ? "upper" : "lower";
  return {
    letterCase,
    displayChar: letterCase === "upper" ? base : base.toLowerCase(),
  };
}

function isCellFilled(ctrl: SnakeController, wordId: string, index: number): boolean {
  const w = ctrl.state.crossword.words.find((x) => x.id === wordId);
  if (!w) return true;
  const cell = w.cells[index];
  if (!cell) return true;
  return ctrl.state.crossword.filledCells.has(`${cell.x},${cell.y}`);
}

function pickIncompleteWord(ctrl: SnakeController, exclude: Set<string>): string | null {
  const candidates = ctrl.state.crossword.words
    .filter((w) => !w.completed)
    .map((w) => w.id)
    .filter((id) => !exclude.has(id));
  if (candidates.length === 0) return null;
  return candidates[randInt(candidates.length)];
}

function nextUnfilledIndex(ctrl: SnakeController, wordId: string): number | null {
  const w = ctrl.state.crossword.words.find((x) => x.id === wordId);
  if (!w) return null;
  for (let i = 0; i < w.cells.length; i++) {
    if (!isCellFilled(ctrl, wordId, i)) return i;
  }
  return null;
}

function spawnOne(ctrl: SnakeController, pid: PlayerId, wordId: string): Edible | null {
  const w = ctrl.state.crossword.words.find((x) => x.id === wordId);
  if (!w) return null;

  const index = nextUnfilledIndex(ctrl, wordId);
  if (index == null) return null;

  const baseChar = (w.solution[index] || "").toUpperCase();
  if (!baseChar) return null;

  const p = ctrl.state.players[pid];

  for (let tries = 0; tries < 40; tries++) {
    const x = randInt(10);
    const y = randInt(10);
    if (ctrl.isOccupiedLocal(p, x, y)) continue;

    return {
      playerId: pid,
      wordId,
      index,
      baseChar,
      ...makeEdibleDisplay(baseChar),

      x,
      y,
    };
  }
  return null;
}

export function spawnEdiblesIfNeeded(ctrl: SnakeController): void {
  const finalPhase = ctrl.state.crossword.remainingWords <= 4;
  const targetActive = finalPhase ? 1 : 2;

  (["p1", "p2"] as PlayerId[]).forEach((pid) => {
    const p = ctrl.state.players[pid];

    // retire edibles dont la case est déjà remplie
    p.edibles = p.edibles.filter((e) => !isCellFilled(ctrl, e.wordId, e.index));

    // retire mots actifs complétés
    ctrl.activeWordIds[pid] = ctrl.activeWordIds[pid].filter((wid) => {
      const w = ctrl.state.crossword.words.find((x) => x.id === wid);
      return !!w && !w.completed;
    });

    // complète activeWordIds
    while (ctrl.activeWordIds[pid].length < targetActive) {
      const exclude = new Set<string>([
        ...ctrl.activeWordIds[pid],
        ...(pid === "p1" ? ctrl.activeWordIds.p2 : ctrl.activeWordIds.p1),
      ]);
      const pick = pickIncompleteWord(ctrl, exclude);
      if (!pick) break;
      ctrl.activeWordIds[pid].push(pick);
    }

    // 1 edible par mot actif
    for (const wid of ctrl.activeWordIds[pid]) {
      const idx = nextUnfilledIndex(ctrl, wid);
      if (idx == null) continue;

      const already = p.edibles.some((e) => e.wordId === wid && e.index === idx);
      if (already) continue;

      const e = spawnOne(ctrl, pid, wid);
      if (e) p.edibles.push(e);
    }
  });
}
