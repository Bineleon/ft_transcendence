import { el, text } from "../../home";
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

export function createPlayersHud(ctrl: SnakeController): HTMLElement {
  const s = ctrl.state;
  const root = el("div", "contents") as HTMLDivElement;

  const p1 = s.players.p1;
  const p2 = s.players.p2;

  const p1Name = p1.profile?.userName?.trim() ? p1.profile!.userName : "P1";
  const p2Name = p2.profile?.userName?.trim() ? p2.profile!.userName : "P2";
  console.log(`Creating HUD for players: P1='${p1Name}', P2='${p2Name}'`);

  // P1 : avatar (0,0), name à partir de (1,0), cœurs en dessous (0,1..3)
  root.appendChild(placeInGrid(avatarPill(p1.profile?.avatarUrl || "/imgs/avatar.png", p1Name), 0, 0, 1, 1));
  root.appendChild(placeInGrid(el("div",
    "px-1 text-[20px] font-lapresse tracking-widest leading-none self-center justify-self-start",
    el("span", "px-1 py-[1px] inline-block", text(p1Name))
  ) as HTMLDivElement, 1, 0, 8, 1));

  for (let i = 0; i < 3; i++) {
    root.appendChild(placeInGrid(heart(p1.lives > i), 0, 1 + i, 1, 1));
  }

  // P2 : avatar (33,23), name à gauche (25..32,23), cœurs au-dessus (33,22..20)
  root.appendChild(placeInGrid(avatarPill(p2.profile?.avatarUrl || "/imgs/avatar.png", p2Name), 33, 23, 1, 1));
  root.appendChild(placeInGrid(el("div",
    "px-1 text-[20px] font-lapresse tracking-widest leading-none self-center justify-self-end text-right",
    el("span", "px-1 py-[1px] inline-block", text(p2Name))
  ) as HTMLDivElement, 25, 23, 8, 1));

  for (let i = 0; i < 3; i++) {
    root.appendChild(placeInGrid(heart(p2.lives > i), 33, 22 - i, 1, 1));
  }

  return root;
}

function placeInGrid(node: HTMLElement, x: number, y: number, w = 1, h = 1): HTMLElement {
  node.style.gridColumn = `${x + 1} / span ${w}`;
  node.style.gridRow = `${y + 1} / span ${h}`;
  return node;
}

function avatarPill(url: string, alt: string): HTMLImageElement {
  const img = el("img", "w-full rounded-full object-cover grayscale contrast-200 border border-black") as HTMLImageElement;
  img.src = url;
  img.alt = alt;
  return img;
}

function heart(isAlive: boolean): HTMLElement {
  const h = el("img", `w-full flex items-center justify-center text-xs leading-none mix-blend-multiply
    ${isAlive ? "" : "opacity-20"}`) as HTMLImageElement;
  h.src = "/snake/coeur.png";
  h.alt = "life";
  return h;
}

