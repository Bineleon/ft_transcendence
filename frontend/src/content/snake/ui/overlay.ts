import { el } from "../../home";
import type { SnakeController } from "../controller";
import type { SnakePhase, PlayerId } from "../game/uiTypes";
import { runAuthBox } from "../../utils/alertBox";

function pill(label: string, ok: boolean): HTMLElement {
  const s = el("span", `px-1 py-1 border border-black rounded-full text-xs ${ok ? "bg-black text-white" : "bg-white text-black"}`);
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

    const row = el("div", "flex items-center justify-between font-modern-type gap-3 border border-stone-400 rounded-md p-2") as HTMLDivElement;

    const left = el("div", "flex items-center gap-2");
    left.append(pill(pid.toUpperCase(), true), pill(info.registered || info.isGuest ? (info.name || "Guest") : " - - ", info.registered));

    const right = el("div", "flex items-center gap-2");

    const syncBtn = el("button", "btn-click text-xs px-2 py-1 h-[2rem]") as HTMLButtonElement;
    syncBtn.textContent = info.registered ? "Sync" : "Sync";

    syncBtn.disabled = info.registered || info.isGuest;
    syncBtn.classList.toggle("opacity-40", syncBtn.disabled);

    syncBtn.onclick = async () => {
      const info = await runAuthBox("M_SYNC");
      if (!info || !("userName" in info)) return;

      const id = (info as any).id as string;
      const userName = (info as any).userName as string;
      const avatarUrl = ((info as any).avatarUrl as string) || "/imgs/avatar.png";

      this.snakeController.state.players[pid].profile = {
        registered: true,
        isGuest: false,
        userId: id,
        userName: userName,
        avatarUrl: avatarUrl,
      };

      this.snakeController.refreshOverlay(); // re-render overlay + players
    };

    const guestBtn = el("button", "btn-click text-xs px-2 py-1 h-[2rem]") as HTMLButtonElement;
    guestBtn.textContent = "Guest";

    guestBtn.disabled = info.registered || info.isGuest;
    guestBtn.classList.toggle("opacity-40", guestBtn.disabled);

    guestBtn.onclick = async () => {
      const info = await runAuthBox("M_GUEST");
      if (!info || !("userName" in info)) return;

      const userName = (info as any).userName as string;

      this.snakeController.state.players[pid].profile = {
        registered: false,
        isGuest: true,
        userId: "",
        userName: userName,
        avatarUrl: "/imgs/avatar.png",
      };
      console.log("Guest registered:", this.snakeController.state.players[pid].profile);

      this.snakeController.refreshOverlay();
    };

    const unregisterBtn = el("button", "btn-click text-xs px-2 py-1 h-[2rem] rounded-full bg-white border-black border-b-2 border-r-2 text-stone-600 hover:bg-stone-200") as HTMLButtonElement;
    unregisterBtn.textContent = "Clear";

    unregisterBtn.onclick = () => {
      this.snakeController.unregisterPlayer(pid);
      unregisterBtn.disabled = true;
      unregisterBtn.classList.add("opacity-40");
      this.snakeController.refreshOverlay();
    };

    right.append(syncBtn, guestBtn, unregisterBtn);

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
        const start = el("button", `btn-click px-3 py-2 text-lg mix-blend-multiply items-center ${this.snakeController.canStart() ? "hover:bg-black hover:text-white" : "opacity-40 cursor-not-allowed"}`) as HTMLButtonElement;
        start.textContent = "START";
        start.disabled = !this.snakeController.canStart();
        start.onclick = () => this.snakeController.startGame();

        actions.append(start);

        wrap.append(title, sub, reg, actions);
        return wrap;
      }

      case "PAUSED": {
        const wrap = el("div", "w-[520px] bg-[url('/imgs/papier.jpg')] border-6 border-black p-4 mx-8 rounded-full shadow-xl") as HTMLDivElement;

        const title = el("div", "alert-title text-center");
        title.textContent = "PAUSED";

        const sub = el("div", "alert-message text-sm mb-4 text-center");
        sub.textContent = "Game is paused — take a break";

        const actions = el("div", "flex gap-2 justify-center");
        const resume = el("button", "btn-click px-3 py-2 text-lg mix-blend-multiply") as HTMLButtonElement;
        resume.textContent = "RESUME";
        resume.onclick = () => this.snakeController.setPhase("PLAYING");

        const restart = el("button", "btn-click px-3 py-2 text-lg mix-blend-multiply") as HTMLButtonElement;
        restart.textContent = "RESTART";
        restart.onclick = () => this.snakeController.restartGame();

        actions.append(resume, restart);
        wrap.append(title, sub, actions);
        return wrap;
      }

      case "GAMEOVER": {
        const wrap = el("div", "w-[520px] bg-[url('/imgs/papier.jpg')] border-6 border-black p-4 mx-8 rounded-full shadow-xl") as HTMLDivElement;

        const title = el("div", "alert-title text-center");
        title.textContent = "GAME OVER";

        const sub = el("div", "alert-message text-base text-bold mb-2 text-center");
        sub.textContent = "Thanks For Playin'";

        const s = this.snakeController.state;
        const score = el("div", "text-base mb-3 text-center font-modern-type");
        score.textContent = `P1 score=${s.players.p1.score} lives=${s.players.p1.lives} | P2 score=${s.players.p2.score} lives=${s.players.p2.lives} | remainingWords=${s.crossword.remainingWords}`;

        const actions = el("div", "flex gap-2 justify-center");
        const restart = el("button", "btn-click px-3 py-2 text-lg mix-blend-multiply") as HTMLButtonElement;
        restart.textContent = "RESTART";
        restart.onclick = () => this.snakeController.restartGame();

        actions.append(restart);
        wrap.append(title, sub, score, actions);
        return wrap;
      }

      default:
        return el("div", "");
    }
  }
}
