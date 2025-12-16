import { el } from "../../home";
import { runAuthBox } from "../../utils/alertBox";
import type { SnakeController } from "../controller";
import type { PlayerId } from "../game/uiTypes";

function isRegistered(ctrl: SnakeController, pid: PlayerId): boolean {
  const p = ctrl.state.players[pid];
  return !!(p.profile?.userName && p.profile?.userName.trim().length > 0);
}

export function areBothPlayersRegistered(ctrl: SnakeController): boolean {
  return isRegistered(ctrl, "p1") && isRegistered(ctrl, "p2");
}

export function clearPlayer(ctrl: SnakeController, pid: PlayerId): void {
  const p = ctrl.state.players[pid];
  p.profile = {
    registered: false,
    isGuest: false,
    userId: "",
    userName: "",
    avatarUrl: "/imgs/avatar.png",
  };
}

export function createPlayerBox(ctrl: SnakeController, pid: PlayerId): HTMLDivElement {
  const p = ctrl.state.players[pid];

  const wrap = el("div", "border-2 border-black p-2 grid gap-2 bg-white") as HTMLDivElement;

  const top = el("div", "grid grid-cols-[auto_1fr] gap-2 items-center") as HTMLDivElement;

  const img = document.createElement("img");
  img.src = p.profile?.avatarUrl || "/imgs/avatar.png";
  img.alt = `${pid} avatar`;
  img.className = "w-[4.5rem] h-[4.5rem] img-newspaper object-cover grayscale contrast-150 mix-blend-multiply border border-black";

  const meta = el("div", "grid gap-1") as HTMLDivElement;

  const name = el("div", "font-houston-sport text-3xl leading-none") as HTMLDivElement;
  name.textContent = p.profile?.userName && p.profile?.userName.trim() ? p.profile.userName : (pid === "p1" ? "P1" : "P2");

  const lives = el("div", "text-xs font-arcade") as HTMLDivElement;
  lives.textContent = `LIVES : ${p.lives}`;

  const badge = el("div", "text-[10px] font-arcade-italic") as HTMLDivElement;
  badge.textContent = p.profile?.userName ? (p.profile?.isGuest ? "GUEST" : "SYNCED") : "NOT READY";

  meta.append(name, lives, badge);
  top.append(img, meta);

  // Buttons
  const btnRow = el("div", "flex gap-2 items-center justify-start") as HTMLDivElement;

  const syncBtn = el("button", "btn-click text-xs px-2 py-1 h-[2rem]") as HTMLButtonElement;
  syncBtn.textContent = "Sync Profile";

  const guestBtn = el("button", "btn-click text-xs px-2 py-1 h-[2rem]") as HTMLButtonElement;
  guestBtn.textContent = "Guest";

  const clearBtn = el("button", "btn-click text-xs px-2 py-1 h-[2rem]") as HTMLButtonElement;
  clearBtn.textContent = "Clear";

  syncBtn.onclick = async () => {
    const info = await runAuthBox("M_SYNC");
    if (!info || !("userName" in info)) return;

    const id = (info as any).id as string;
    const userName = (info as any).userName as string;
    const avatarUrl = ((info as any).avatarUrl as string) || "/imgs/avatar.png";

    p.profile = {
      registered: true,
      isGuest: false,
      userId: id,
      userName: userName,
      avatarUrl: avatarUrl,
    };

    ctrl.refreshOverlay(); // re-render overlay + players
  };

  guestBtn.onclick = async () => {
    const info = await runAuthBox("M_GUEST");
    if (!info || !("userName" in info)) return;

    const id = (info as any).id as string;
    const userName = (info as any).userName as string;
    const avatarUrl = ((info as any).avatarUrl as string) || "/imgs/avatar.png";

    p.profile = {
      registered: true,
      isGuest: true,
      userId: id || "guest",
      userName: userName || "Guest",
      avatarUrl: avatarUrl,
    };

    ctrl.refreshOverlay();
  };

  clearBtn.onclick = () => {
    clearPlayer(ctrl, pid);
    ctrl.refreshOverlay();
  };

  btnRow.append(syncBtn, guestBtn, clearBtn);

  wrap.append(top, btnRow);
  return wrap;
}
