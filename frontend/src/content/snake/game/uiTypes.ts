// types.ts
export type PlayerId = "p1" | "p2";

export type SnakePhase = "START" | "PLAYING" | "GAMEOVER" | "PAUSED" | "RESTART";

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export type Vec2 = { x: number; y: number };

export type LetterCase = "upper" | "lower";

export interface ControlsKey {
  code: string;
  down: boolean;
}


export interface Controls {
  p1Up: ControlsKey;
  p1Down: ControlsKey;
  p1Left: ControlsKey;
  p1Right: ControlsKey;

  p2Up: ControlsKey;
  p2Down: ControlsKey;
  p2Left: ControlsKey;
  p2Right: ControlsKey;

  pause: ControlsKey;
  escape: ControlsKey;
}

export interface SnakeSegment {
  x: number; // local 0..9
  y: number; // local 0..9
  char: string;
}

export interface Snake {
  segments: SnakeSegment[]; // segments[0] = head
  direction: Direction;
  nextDirection: Direction;
  respawnTicks: number;
}

export interface WordCell {
  x: number; // abscisse dans la grille du monde (0 à 33 pour 34 colonnes)
  y: number; // ordonnée dans la grille du monde (0 à 23 pour 24 rangées)
}

export interface CrosswordWord {
  id: string;
  cells: WordCell[];
  solution: string; // même longueur que cells
  completed: boolean;
  completedBy?: PlayerId;
}

export interface FilledCell {
  x: number;
  y: number;
  letter: string;
  filledBy: PlayerId;
}

export interface Edible {
  playerId: PlayerId;
  wordId: string;
  index: number;      // index dans le mot
  baseChar: string;   // lettre "vraie" à poser (souvent uppercase)
  displayChar: string; // lettre affichée dans le snake (A uppercase / B lowercase)
  letterCase: LetterCase;
  x: number;          // local 0..9 dans la zone snake
  y: number;          // local 0..9
}

export interface PlayerState {
  id: PlayerId;
  lives: number;
  score: number;
  snake: Snake;
  edibles: Edible[];
  profile?: {
    registered: boolean;
    isGuest: boolean;
    userId: string;
    userName: string;
    avatarUrl: string;
  };
}

export interface CrosswordState {
  words: CrosswordWord[];
  filledCells: Map<string, FilledCell>; // key = "x,y"
  remainingWords: number;
}

export interface GameState {
  phase: SnakePhase;
  tick: number;

  world: {
    cols: number; // 34 colonnes
    rows: number; // 24 rangées
  };

  players: {
    p1: PlayerState;
    p2: PlayerState;
  };

  crossword: CrosswordState;
}
