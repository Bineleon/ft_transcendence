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
import { createPlayersHud } from "./ui/players";

import { createSnakeMatchWithStats } from "../utils/todb";
import type { SnakeMatchDTO } from "./game/apiTypes";

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
    const previousPhase = this.state.phase;
    this.state.phase = phase;
    this.refreshOverlay();

    // START / GAMEOVER : rien ne tourne + pas besoin de controls
    if (phase === "START") {
      this.stopLoop();
      this.unwireControls();
      this.clearControlsDown();
      return;
    }

    // PAUSED : boucle stoppée, MAIS controls gardés pour Space (toggle)
    if (phase === "PAUSED") {
      this.stopLoop();
      this.wireControls();        // <-- important
      this.clearControlsDown();   // évite des touches "collées"
      return;
    }

    // PLAYING
    if (phase === "PLAYING") {
      this.wireControls();
      this.startLoop();
    }

	if (phase === "GAMEOVER" && previousPhase === "PLAYING") {
      console.log("=== GAME OVER - Saving match to database ===");
		this.saveMatchToDatabase();
    }

  }
  private saveMatchToDatabase(): void {
    const p1Info = this.getPlayerInfo("p1");
    const p2Info = this.getPlayerInfo("p2");
    
    const p1 = this.state.players.p1;
    const p2 = this.state.players.p2;

    console.log("[SnakeController.saveMatchToDatabase] Player 1 info:", p1Info);
    console.log("[SnakeController.saveMatchToDatabase] Player 2 info:", p2Info);
    console.log("[SnakeController.saveMatchToDatabase] Player 1 state:", {
      score: p1.score,
      lives: p1.lives,
      edibles: p1.edibles.length
    });
    console.log("[SnakeController.saveMatchToDatabase] Player 2 state:", {
      score: p2.score,
      lives: p2.lives,
      edibles: p2.edibles.length
    });

    // Compter les collectibles (lettres placées sur le crossword par chaque joueur)
    let p1Collectibles = 0;
    let p2Collectibles = 0;
    
    for (const filledCell of this.state.crossword.filledCells.values()) {
      if (filledCell.filledBy === "p1") {
        p1Collectibles++;
      } else if (filledCell.filledBy === "p2") {
        p2Collectibles++;
      }
    }

    console.log("[SnakeController.saveMatchToDatabase] Collectibles counted:", {
      p1: p1Collectibles,
      p2: p2Collectibles,
      totalFilledCells: this.state.crossword.filledCells.size
    });

    const payload: SnakeMatchDTO = {
      p1Username: p1Info.name || "Guest",
      p2Username: p2Info.name || "Guest",
      p1IsGuest: p1Info.isGuest,
      p2IsGuest: p2Info.isGuest,
      p1Score: p1.score,
      p1Collectibles: p1Collectibles,
      p2Score: p2.score,
      p2Collectibles: p2Collectibles,
    };

    console.log("[SnakeController.saveMatchToDatabase] Final payload:", JSON.stringify(payload, null, 2));
    console.log("[SnakeController.saveMatchToDatabase] Calling createSnakeMatchWithStats...");

    // Appeler l'API pour sauvegarder
    createSnakeMatchWithStats(payload).catch((err) => {
      console.error("[SnakeController.saveMatchToDatabase] Error saving match:", err);
    });
  }

  private clearControlsDown(): void {
    for (const k of Object.values(this.controls)) k.down = false;
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
    const p1 = this.getPlayerInfo("p1").registered || this.getPlayerInfo("p1").isGuest;
    const p2 = this.getPlayerInfo("p2").registered || this.getPlayerInfo("p2").isGuest;
    return p1 && p2;
  }

  private updatePlayersBox(): void {
    const p1 = this.getPlayerInfo("p1").registered ? (this.getPlayerInfo("p1").name || "Invité") : "—";
    const p2 = this.getPlayerInfo("p2").registered ? (this.getPlayerInfo("p2").name || "Invité") : "—";
    this.view.playersBox.textContent = `P1: ${p1}   P2: ${p2}`;
  }

  public refreshOverlay(): void {
    this.view.overlayBox.replaceChildren(this.overlay.bindHTMLElement(this.state.phase));
    this.view.hudLayer.replaceChildren(createPlayersHud(this));
    this.updatePlayersBox();
  }

  // =========================
  //        GAME LOGIC
  // =========================

  public updatePlayerControl(pid: PlayerId): void {
    const res = GUpdate.updatePlayer(this, pid);
    if (res === "DEAD") this.onPlayerDeath(pid);
  }

  public onPlayerDeath(pid: PlayerId): void {
    console.log(`Player ${pid} died.`);
    const p = this.state.players[pid];
    p.lives = Math.max(0, p.lives - 1);

    this.refreshOverlay();
    if (p.lives > 0) {
      GUpdate.respawnPlayer(this, pid, 5);
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
