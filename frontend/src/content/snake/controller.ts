import type { SnakeViewWindow } from "./ui/view";
import type {
  GameState,
  PlayerId,
  PlayerState,
  Direction,
  SnakePhase,
  Controls,
  Edible,
} from "./game/uiTypes";

import { createControls } from "./ui/guards";
import { initState, initBoard } from "./game/state";
import { domOverlayManager } from "./ui/overlay";

import { startLoop as startTickLoop, stopLoop as stopTickLoop } from "./core/loop";

import * as GUpdate from "./game/update";
import * as Edibles from "./game/edibles";
import * as Crossword from "./game/crossword";
import * as Draw from "./game/draw";

type PlayerInfo = { registered: boolean; name: string };

export class SnakeController {
  public view: SnakeViewWindow;
  public state: GameState;
  public overlay: domOverlayManager;
  public controls: Controls;

  // mots actifs par joueur (2 normal, 1 fin)
  public activeWordIds: Record<PlayerId, string[]> = { p1: [], p2: [] };

  private loopId: number | null = null;
  private framesPerMove = 12;
  private frameCounter = 0;

  private playersInfo: Record<PlayerId, PlayerInfo> = {
    p1: { registered: false, name: "" },
    p2: { registered: false, name: "" },
  };

  constructor(
    view: SnakeViewWindow,
    wordDefs: { id: string; solution: string; cells: { x: number; y: number }[] }[]
  ) {
    this.view = view;
    this.state = initState(wordDefs);

    this.controls = createControls();
    this.overlay = new domOverlayManager(this);

    initBoard(this.state);
  }

  // =========================
  //         LIFECYCLE
  // =========================

  public boot(): void {
    this.setPhase("START");
  }

  public setPhase(phase: SnakePhase): void {
    this.state.phase = phase;
    this.refreshOverlay();

    if (phase === "PLAYING") {
      this.wireControls();
      this.startLoop();
    } else {
      this.unwireControls();
      this.stopLoop();
    }
  }

  public startGame(): void {
    initBoard(this.state);
    // Remettre le compteur de frames à zéro
    this.frameCounter = 0;
    this.state.tick = 0;
    this.setPhase("PLAYING");
  }

  public restartGame(): void {
    initBoard(this.state);
    this.frameCounter = 0;
    this.state.tick = 0;
    this.setPhase("PLAYING");
  }

  public tick(): void {
    if (this.state.phase !== "PLAYING") return;

    this.applyDirectionsFromControls();

    this.frameCounter++;
    if (this.frameCounter >= this.framesPerMove) {
      this.frameCounter = 0;
      this.state.tick += 1;

      GUpdate.updateBothPlayers(this);

      this.spawnEdiblesIfNeeded();
      this.refreshWordCompletion("p1");
      this.refreshWordCompletion("p2");
      this.checkEndConditions();
    }

    this.render();
  }

  public startLoop(): void {
    if (this.loopId != null) return;
    startTickLoop(this, 30);
    this.loopId = 1; // simple flag
  }

  public stopLoop(): void {
    if (this.loopId == null) return;
    stopTickLoop(this);
    this.loopId = null;
  }

  // =========================
  //        PLAYERS INFO
  // =========================

  public getPlayerInfo(pid: PlayerId) {
    const p = this.state.players[pid];
    const pr = p.profile;
    return {
      registered: !!pr?.registered,
      name: pr?.userName || "",
      avatarUrl: pr?.avatarUrl || "",
      isGuest: !!pr?.isGuest,
    };
  }

  public registerGuest(pid: PlayerId): void {
    const p = this.state.players[pid];
    p.profile = {
      registered: true,
      isGuest: true,
      userId: "guest",
      userName: "Guest",
      avatarUrl: "/imgs/avatar.png",
    };
  }

  public unregisterPlayer(pid: PlayerId): void {
    const p = this.state.players[pid];
    p.profile = {
      registered: false,
      isGuest: false,
      userId: "",
      userName: "",
      avatarUrl: "/imgs/avatar.png",
    };
  }

  public registerSyncedPlayer(pid: PlayerId, payload: { userId: string; name: string; avatarUrl: string }): void {
    const p = this.state.players[pid];
    p.profile = {
      registered: true,
      isGuest: false,
      userId: payload.userId,
      userName: payload.name,
      avatarUrl: payload.avatarUrl || "/imgs/avatar.png",
    };
  }

  public canStart(): boolean {
    return this.getPlayerInfo("p1").registered && this.getPlayerInfo("p2").registered;
  }

  private updatePlayersBox(): void {
    const p1 = this.getPlayerInfo("p1").registered ? (this.getPlayerInfo("p1").name || "Invité") : "—";
    const p2 = this.getPlayerInfo("p2").registered ? (this.getPlayerInfo("p2").name || "Invité") : "—";
    this.view.playersBox.textContent = `P1: ${p1}   P2: ${p2}`;
  }

  public refreshOverlay(): void {
    this.view.overlayBox.replaceChildren(this.overlay.bindHTMLElement(this.state.phase));
    this.updatePlayersBox();
  }

  // =========================
  //        GAME LOGIC
  // =========================

  public updatePlayer(pid: PlayerId): void {
    const res = GUpdate.updatePlayer(this, pid);
    if (res === "DEAD") this.onPlayerDeath(pid);
  }

  public onPlayerDeath(pid: PlayerId): void {
    const p = this.state.players[pid];
    p.lives = Math.max(0, p.lives - 1);

    if (p.lives > 0) {
      // respawn court, simple
      GUpdate.respawnPlayer(this, pid, 25);
      return;
    }
    this.setPhase("GAMEOVER");
  }

  public onEatEdible(pid: PlayerId, edible: Edible): void {
    Crossword.collectEdible(this.state, pid, edible);
    this.state.players[pid].score += 10;
    Crossword.updateWordCompletion(this.state, edible.wordId, pid);
  }

  public refreshWordCompletion(pid: PlayerId): void {
    for (const wid of this.activeWordIds[pid]) {
      Crossword.updateWordCompletion(this.state, wid, pid);
    }
  }

  public spawnEdiblesIfNeeded(): void {
    Edibles.spawnEdiblesIfNeeded(this);
  }

  public isOccupiedLocal(p: PlayerState, x: number, y: number): boolean {
    for (const s of p.snake.segments) if (s.x === x && s.y === y) return true;
    for (const e of p.edibles) if (e.x === x && e.y === y) return true;
    return false;
  }

  public checkEndConditions(): void {
    if (this.state.crossword.remainingWords <= 0) {
      this.setPhase("GAMEOVER");
      return;
    }
    if (this.state.players.p1.lives <= 0 || this.state.players.p2.lives <= 0) {
      this.setPhase("GAMEOVER");
    }
  }

  public render(): void {
    Draw.renderAll(this);
  }

  // =========================
  //    CONTROLS (pour guards)
  // =========================

  public wireControls(): void {
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp, { passive: false });
  }

  public unwireControls(): void {
    window.removeEventListener("keydown", this.onKeyDown as any);
    window.removeEventListener("keyup", this.onKeyUp as any);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    // block scroll on arrows/space
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();

    const keys = Object.values(this.controls);
    for (const k of keys) if (k.code === e.code) k.down = true;

    // pause toggle (sur press)
    if (e.code === this.controls.pause.code) {
      if (this.state.phase === "PLAYING") this.setPhase("PAUSED");
      else if (this.state.phase === "PAUSED") this.setPhase("PLAYING");
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    const keys = Object.values(this.controls);
    for (const k of keys) if (k.code === e.code) k.down = false;
  };

  public enableArrowGuard(e: KeyboardEvent): void {
    // garde simple, déjà géré par preventDefault plus haut
    void e;
  }
  public disableArrowGuard(): void {}

  public applyDirectionsFromControls(): void {
    const p1 = this.state.players.p1.snake;
    const p2 = this.state.players.p2.snake;

    const d1 = this.pickDirFrom4(
      this.controls.p1Up.down,
      this.controls.p1Down.down,
      this.controls.p1Left.down,
      this.controls.p1Right.down
    );
    const d2 = this.pickDirFrom4(
      this.controls.p2Up.down,
      this.controls.p2Down.down,
      this.controls.p2Left.down,
      this.controls.p2Right.down
    );

    if (d1) p1.nextDirection = preventUTurn(p1.direction, d1);
    if (d2) p2.nextDirection = preventUTurn(p2.direction, d2);
  }

  public pickDirFrom4(up: boolean, down: boolean, left: boolean, right: boolean): Direction | null {
    if (up) return "UP";
    if (down) return "DOWN";
    if (left) return "LEFT";
    if (right) return "RIGHT";
    return null;
  }
}

function preventUTurn(cur: Direction, next: Direction): Direction {
  if (cur === "UP" && next === "DOWN") return cur;
  if (cur === "DOWN" && next === "UP") return cur;
  if (cur === "LEFT" && next === "RIGHT") return cur;
  if (cur === "RIGHT" && next === "LEFT") return cur;
  return next;
}
