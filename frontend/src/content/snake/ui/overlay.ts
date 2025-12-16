import { el } from "../../home";
import type { SnakeController } from "../controller";
import type { SnakePhase, PlayerId } from "../game/uiTypes";
import { runAuthBox } from "../../utils/alertBox";

function pill(label: string, ok: boolean): HTMLElement {
  const s = el("span", `px-2 py-1 border border-black text-xs ${ok ? "bg-black text-white" : "bg-white text-black"}`);
  s.textContent = label;
  return s;
}

export class domOverlayManager {
  private snakeController: SnakeController;

  constructor(snakeController: SnakeController) {
    this.snakeController = snakeController;
  }

private registerRow(pid: PlayerId): HTMLElement {
  const info = this.snakeController.getPlayerInfo(pid);

  const row = el("div", "flex items-center justify-between font-modern-type gap-3 border border-black p-2") as HTMLDivElement;

  const left = el("div", "flex items-center gap-2");
  left.append(pill(pid.toUpperCase(), true), pill(info.registered ? (info.name || "Guesteuh") : " - - ", info.registered));

  const right = el("div", "flex items-center gap-2");

  const syncBtn = el("button", "border border-black px-2 py-1 font-modern-type hover:bg-black hover:text-white text-sm") as HTMLButtonElement;
  syncBtn.textContent = "Sync";
  syncBtn.disabled = info.registered && !info.isGuest; // déjà sync
  syncBtn.classList.toggle("opacity-40", syncBtn.disabled);

  syncBtn.onclick = async () => {
    // même pattern que ton Pong : ouvre la box de login/sync
    const res = await runAuthBox("M_SYNC");
    if (!res) return;

    // adapte les clés selon ton Pong (je mets des fallbacks)
    const userId = (res as any).id || (res as any).userId || "";
    const name = (res as any).userName || (res as any).name || "Player";
    const avatarUrl = (res as any).avatarUrl || (res as any).avatar || "/imgs/avatar.png";

    this.snakeController.registerSyncedPlayer(pid, { userId, name, avatarUrl });
    console.log(`Player ${pid} synced as ${name} (${userId})`);
    this.snakeController.refreshOverlay();
  };

  const guestBtn = el("button", "border border-black px-2 py-1 font-modern-type hover:bg-black hover:text-white text-sm") as HTMLButtonElement;
  guestBtn.textContent = info.registered ? "Unregister" : "Guest";

  guestBtn.onclick = () => {
    if (this.snakeController.getPlayerInfo(pid).registered) this.snakeController.unregisterPlayer(pid);
    else this.snakeController.registerGuest(pid);
    this.snakeController.refreshOverlay();
  };

  right.append(syncBtn, guestBtn);

  row.append(left, right);
  return row;
}

  public bindHTMLElement(phase: SnakePhase): HTMLElement {
    switch (phase) {
      case "START": {
        const wrap = el("div", "w-[520px] bg-[url('/imgs/papier.jpg')] border-6 border-black p-4 mx-8 rounded-full shadow-xl") as HTMLDivElement;

        const title = el("div", "alert-title text-center");
        title.textContent = "CROSSWORD SNAKE";

        const sub = el("div", "alert-message text-sm mb-4 text-center");
        sub.textContent = "Register players to start the game";

        const reg = el("div", "grid gap-2 mb-3 w-[75%] mx-auto");
        reg.append(this.registerRow("p1"), this.registerRow("p2"));

        const actions = el("div", "flex gap-2 justify-center");
        const start = el("button", `border border-black px-3 py-2 text-sm items-center ${this.snakeController.canStart() ? "hover:bg-black hover:text-white" : "opacity-40 cursor-not-allowed"}`) as HTMLButtonElement;
        start.textContent = "START";
        start.disabled = !this.snakeController.canStart();
        start.onclick = () => this.snakeController.startGame();

        actions.append(start);

        wrap.append(title, sub, reg, actions);
        return wrap;
      }

      case "PAUSED": {
        const wrap = el("div", "w-[420px] bg-white border-2 border-black p-4 shadow");
        const title = el("div", "font-bold text-lg mb-3");
        title.textContent = "PAUSED";

        const actions = el("div", "flex gap-2 justify-end");
        const resume = el("button", "border border-black px-3 py-2 text-sm hover:bg-black hover:text-white") as HTMLButtonElement;
        resume.textContent = "RESUME";
        resume.onclick = () => this.snakeController.setPhase("PLAYING");

        const restart = el("button", "border border-black px-3 py-2 text-sm hover:bg-black hover:text-white") as HTMLButtonElement;
        restart.textContent = "RESTART";
        restart.onclick = () => this.snakeController.restartGame();

        actions.append(resume, restart);
        wrap.append(title, actions);
        return wrap;
      }

      case "GAMEOVER": {
        const wrap = el("div", "w-[520px] bg-white border-2 border-black p-4 shadow");
        const title = el("div", "font-bold text-lg mb-2");
        title.textContent = "GAME OVER";

        const s = this.snakeController.state;
        const score = el("div", "text-sm mb-3");
        score.textContent = `P1 score=${s.players.p1.score} lives=${s.players.p1.lives} | P2 score=${s.players.p2.score} lives=${s.players.p2.lives} | remainingWords=${s.crossword.remainingWords}`;

        const actions = el("div", "flex gap-2 justify-end");
        const restart = el("button", "border border-black px-3 py-2 text-sm hover:bg-black hover:text-white") as HTMLButtonElement;
        restart.textContent = "RESTART";
        restart.onclick = () => this.snakeController.restartGame();

        actions.append(restart);
        wrap.append(title, score, actions);
        return wrap;
      }

      default:
        return el("div", "");
    }
  }
}
