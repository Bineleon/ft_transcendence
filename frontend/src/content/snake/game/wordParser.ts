export interface WordCell {
  x: number;
  y: number;
}

export interface WordDef {
  id: string;
  solution: string;
  cells: WordCell[];
}

function isLetterCell(ch: string): boolean {
  // 0 = background, . = snake playfield, space = padding
  return ch !== "0" && ch !== "." && ch !== " " && ch !== "\r" && ch !== "\n";
}

function seededChar(seed: number): string {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return A[seed % A.length];
}

function makeSolution(len: number, seedBase: number): string {
  let s = "";
  for (let i = 0; i < len; i++) s += seededChar(seedBase + i * 7);
  return s;
}

export function parseWordDefsFromFile(lines: string[]): WordDef[] {
  const hWords: WordDef[] = [];
  const vWords: WordDef[] = [];
  const h = lines.length;
  const w = Math.max(...lines.map((l) => l.length));

  const at = (x: number, y: number) => (lines[y]?.[x] ?? "0");

  let hid = 0;
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      if (isLetterCell(at(x, y)) && !isLetterCell(at(x - 1, y))) {
        const cells: WordCell[] = [];
        let xx = x;
        while (xx < w && isLetterCell(at(xx, y))) {
          cells.push({ x: xx, y });
          xx++;
        }
        if (cells.length > 1) {
          const id = `H${hid++}`;
          hWords.push({ id, cells, solution: makeSolution(cells.length, 1000 + hid * 13) });
        }
        x = xx;
      } else x++;
    }
  }

  let vid = 0;
  for (let x = 0; x < w; x++) {
    let y = 0;
    while (y < h) {
      if (isLetterCell(at(x, y)) && !isLetterCell(at(x, y - 1))) {
        const cells: WordCell[] = [];
        let yy = y;
        while (yy < h && isLetterCell(at(x, yy))) {
          cells.push({ x, y: yy });
          yy++;
        }
        if (cells.length > 1) {
          const id = `V${vid++}`;
          vWords.push({ id, cells, solution: makeSolution(cells.length, 2000 + vid * 17) });
        }
        y = yy;
      } else y++;
    }
  }

  return [...hWords, ...vWords];
}

export async function loadWordDefsFromMap(url = "/snake/map.txt"): Promise<WordDef[]> {
  const txt = await fetch(url).then((r) => r.text());
  const lines = txt
    .split("\n")
    .map((l) => l.replace(/\r/g, ""))
    .filter((l) => l.length > 0);

  return parseWordDefsFromFile(lines);
}
