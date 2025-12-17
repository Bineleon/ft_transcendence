import type { GameState, Direction, SnakeSegment, CrosswordWord } from "./uiTypes";

function makeSnakeInitial(direction: Direction): SnakeSegment[] {
  const letters = ["S","N","A","K","E"];

  if (direction === "RIGHT") {
    const headX = 4, y = 5;
    return letters.map((ch, i) => ({ x: headX - i, y, char: ch }));
  } else { // LEFT
    const headX = 5, y = 4;
    return letters.map((ch, i) => ({ x: headX + i, y, char: ch }));
  }
}
export function initState(
  wordDefs: { id: string; solution: string; cells: { x: number; y: number }[] }[]
): GameState {
  const words: CrosswordWord[] = wordDefs.map((w) => ({
    id: w.id,
    solution: w.solution,
    cells: w.cells,
    completed: false,
    completedBy: undefined,
  }));

  return {
    phase: "START",
    tick: 0,
    world: { cols: 34, rows: 24 },
    players: {
      p1: {
        id: "p1",
        lives: 3,
        score: 0,
        snake: { segments: makeSnakeInitial("RIGHT"), direction: "RIGHT", nextDirection: "RIGHT", respawnTicks: 0 },
        edibles: [],
      },
      p2: {
        id: "p2",
        lives: 3,
        score: 0,
        snake: { segments: makeSnakeInitial("LEFT"), direction: "LEFT", nextDirection: "LEFT", respawnTicks: 0 },
        edibles: [],
      },
    },
    crossword: {
      words,
      filledCells: new Map(),
      remainingWords: words.length,
    },
  };
}

export function resetPlayersInfos(state: GameState): void {
  if (!state.players) return;
  state.players.p1.profile = { registered: false, isGuest: false,
    userId: "", userName: "", avatarUrl: "/imgs/avatar.png" };

  state.players.p2.profile = { registered: false, isGuest: false,
    userId: "", userName: "", avatarUrl: "/imgs/avatar.png" };
}

export function initBoard(state: GameState): void {
  state.tick = 0;

  state.players.p1.score = 0;
  state.players.p2.score = 0;

  state.players.p1.lives = 3;
  state.players.p2.lives = 3;

  state.players.p1.snake.segments = makeSnakeInitial("RIGHT");
  state.players.p1.snake.direction = "RIGHT";
  state.players.p1.snake.nextDirection = "RIGHT";
  state.players.p1.snake.respawnTicks = 0;
  state.players.p1.edibles = [];
  
  state.players.p2.snake.segments = makeSnakeInitial("LEFT");
  state.players.p2.snake.direction = "LEFT";
  state.players.p2.snake.nextDirection = "LEFT";
  state.players.p2.snake.respawnTicks = 0;
  state.players.p2.edibles = [];
    
  state.crossword.filledCells.clear();
  for (const w of state.crossword.words) {
    w.completed = false;
    w.completedBy = undefined;
  }
  state.crossword.remainingWords = state.crossword.words.length;
}
