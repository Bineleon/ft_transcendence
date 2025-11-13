import { el, text } from "../../home";
import type { GameState } from "../game/types";

export function createPongStatsPanel(state: GameState): HTMLElement {
  const { ball, paddle1: pad1, paddle2: pad2, stats } = state;
  const speed = Math.sqrt(ball.vel.x * ball.vel.x + ball.vel.y * ball.vel.y);

  const hdr: string[] = [
    "░█░█░█▀▀░█░░░█▀▀░█▀█░█▄█░█▀▀░░░▀█▀░█▀█░░             ",
    "░█▄█░█▀▀░█░░░█░░░█░█░█░█░█▀▀░░░░█░░█░█░░             ",
    "░▀░▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░▀░▀░▀▀▀░░░░▀░░▀▀▀░░             ",
    "░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░             ",
    "                                                     ",
    "░▀█▀░█░█░█▀▀░░░█▀▄░█▀█░▀█▀░█░░░█░█░░░█▀█░█▀█░█▀█░█▀▀░", 
    "░░█░░█▀█░█▀▀░░░█░█░█▀█░░█░░█░░░░█░░░░█▀▀░█░█░█░█░█░█░",
    "░░▀░░▀░▀░▀▀▀░░░▀▀░░▀░▀░▀▀▀░▀▀▀░░▀░░░░▀░░░▀▀▀░▀░▀░▀▀▀░",
    "░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░",
    "                                                     ",
    "░█▀▀░█▀█░█▄█░█▀▀░░░█▀▀░▀█▀░█▀█░▀█▀░█▀▀░              ",
    "░█░█░█▀█░█░█░█▀▀░░░▀▀█░░█░░█▀█░░█░░▀▀█░              ",
    "░▀▀▀░▀░▀░▀░▀░▀▀▀░░░▀▀▀░░▀░░▀░▀░░▀░░▀▀▀░              ",
    "░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░              ",
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // Structure DOM
  // ─────────────────────────────────────────────────────────────────────────────
  const root = el("div", "md:p-6 text-white border border-white/10");

  const header = el("div", "font-mono text-justify-center text-[6px] md:text-[8px] leading-[1] text-white");
  header.textContent = hdr.join("\n");

  const gameStats = el("div", "my-4 text-sm md:text-base");
  const speedBold = el("b");
  speedBold.append(text(`${speed.toFixed(2)} px/s`));
  gameStats.append(
    text(`Ball Speed: `),
    speedBold,
    el("br"),
    text(`vel.x: ${ball.vel.x.toFixed(2)} | vel.y: ${ball.vel.y.toFixed(2)}`),
    el("br"),
  );

  const playersBox = el("div", "grid grid-cols-2 gap-2");

  const p1Box = el("div", "border border-white/10 rounded-lg p-2");
  const p1Title = el("div", "font-bold mb-2 text-left");
  const p1Stats = el("div", "flex text-left");

  const p2Box = el("div", "border border-white/10 rounded-lg p-2");
  const p2Title = el("div", "font-bold mb-2 text-right");
  const p2Stats = el("div", "flex text-right");
  p1Title.textContent = "P1:\nALPHA";
  p2Title.textContent = "P2:\nOMEGA";
  p1Stats.append(
    (() => { const n = el("div", "mr-4"); n.textContent = `${stats.p1Score}`; return n; })(),
    (() => { const n = el("div", "mr-4"); n.textContent = `${stats.bounces}`; return n; })(),
  );

  p1Box.append(p1Title, p1Stats);
  p2Box.append(p2Title, p2Stats);
  playersBox.append(p1Box, p2Box);

  root.append(header, gameStats, playersBox);
  return root;
}

  // const statuses = ["Serving", "Rallying", "Charging", "Defending", "Smashing", "Taunting"];
  // const moods    = ["Calm", "On fire", "Tilted", "Zen", "Focused", "Distracted"];

  // const p1_score = [0,1,2,2,3,4,4,5,6,6,7,8,8,9,10];
  // const p2_score = [0,0,1,2,2,2,3,3,4,5,5,6,7,7,8];
  // const rounds   = p1_score.length;

  // // ─────────────────────────────────────────────────────────────────────────────
  // // Helpers ultra-simples
  // // ─────────────────────────────────────────────────────────────────────────────
  // const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text?: string) => {
  //   const n = document.createElement(tag);
  //   if (cls) n.className = cls;
  //   if (text != null) n.textContent = text;
  //   return n;
  // };

  // // ─────────────────────────────────────────────────────────────────────────────
  // // Structure DOM
  // // ─────────────────────────────────────────────────────────────────────────────
  // const root = el(
  //   "div",
  //   "md:p-6 text-white" +
  //   "border border-white/10"
  // );

  // const header = el("div", "font-mono text-[6px] md:text-[8px] leading-[1.2] text-white");
  // header.textContent = hdr.join("\n");
  // root.appendChild(header);

  // // Sous-titre encadré
  // const box = el("div", "border-2 border-white/20 rounded-lg overflow-hidden");
  // const topLine = el("div", "h-0.5 bg-white/20");
  // const boxedRow = el("div", "px-4 py-3 font-bold underline tracking-wide");
  // boxedRow.textContent = "Let's get some stats !";
  // const bottomLine = el("div", "h-0.5 bg-white/20");
  // box.append(topLine, boxedRow, bottomLine);
  // root.appendChild(box);

  // // Grosse séparation
  // root.appendChild(el("div", "h-0.5 bg-white/20 my-2"));

  // // Ligne "Live: <time>"
  // const liveRow = el("div", "text-sm md:text-base");
  // const liveLabel = el("span", "font-bold mr-2", "Live:");
  // const liveTime  = el("span", "underline", "");
  // liveRow.append(liveLabel, liveTime);
  // root.appendChild(liveRow);

  // // Grille joueurs
  // const grid = el("div", "grid grid-cols-1 md:grid-cols-2 gap-4");
  // root.appendChild(grid);

  // // Carte Joueur (factory)
  // const makePlayerCard = (title: string) => {
  //   const card = el("div", "rounded-xl border border-white/10 p-4 bg-white/5 space-y-2");
  //   const h = el("div", "font-bold underline text-lg", title);
  //   // const score  = el("div", "", "Score:  ");
  //   // const streak = el("div", "", "Streak: ");
  //   // const status = el("div", "", "Status: ");
  //   // const acc    = el("div", "", "Accuracy: ");
  //   // const ping   = el("div", "", "Ping: ");
  //   // const mood   = el("div", "", "Mood: ");
  //   const hr     = el("div", "h-0.5 bg-white/10 my-1");

  //   const val = (label: string, spanCls = "tabular-nums") => {
  //     const row = el("div", "flex gap-2");
  //     row.append(el("span", "min-w-20", label), el("span", spanCls));
  //     return { row, span: row.lastElementChild as HTMLSpanElement };
  //   };

  //   // Re-map pour aligner proprement les valeurs
  //   const sv = val("Score:");
  //   const st = val("Streak:");
  //   const ss = val("Status:", "");
  //   const sa = val("Accuracy:");
  //   const sp = val("Ping:");
  //   const sm = val("Mood:", "");

  //   card.replaceChildren(
  //     h,
  //     sv.row,
  //     st.row,
  //     ss.row,
  //     sa.row,
  //     sp.row,
  //     sm.row,
  //     hr
  //   );

  //   return {
  //     card,
  //     fields: {
  //       score: sv.span, streak: st.span, status: ss.span,
  //       acc: sa.span, ping: sp.span, mood: sm.span,
  //     },
  //   };
  // };

  // const p1 = makePlayerCard("Player 1: ALPHA");
  // const p2 = makePlayerCard("Player 2: OMEGA");
  // grid.append(p1.card, p2.card);

  // // Extra metrics
  // const extras = el("div", "rounded-xl border border-white/10 p-4 bg-white/5 space-y-2");
  // const ballSpeed = el("div", "");
  // const crowd     = el("div", "");
  // const highlights = el("div", "");
  // extras.append(ballSpeed, crowd, highlights);
  // root.appendChild(extras);

  // // Note "quit"
  // const quit = el("div", "underline text-xs text-white/70", "(Appuie sur Échap pour fermer… ou pas 😅)");
  // root.appendChild(quit);

  // // ─────────────────────────────────────────────────────────────────────────────
  // // Update loop (toutes les 750 ms)
  // // ─────────────────────────────────────────────────────────────────────────────
  // let tick = 0;
  // const update = () => {
  //   // Time (Europe/Paris)
  //   const now = new Date();
  //   const pad = (n: number) => (n < 10 ? "0" + n : "" + n);
  //   const tStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ` +
  //                `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  //   liveTime.textContent = tStr;

  //   const idx = tick % rounds;
  //   const s   = tick % statuses.length;
  //   const m   = Math.floor(tick / 3) % moods.length;

  //   // Player 1
  //   p1.fields.score.textContent  = String(p1_score[idx]).padStart(2, " ");
  //   p1.fields.streak.textContent = String((tick + 2) % 8).padStart(2, " ");
  //   p1.fields.status.textContent = statuses[s];
  //   p1.fields.acc.textContent    = `${60 + ((tick * 7) % 40)}%`;
  //   p1.fields.ping.textContent   = `${30 + ((tick * 13) % 120)} ms`;
  //   p1.fields.mood.textContent   = moods[m];

  //   // Player 2
  //   p2.fields.score.textContent  = String(p2_score[idx]).padStart(2, " ");
  //   p2.fields.streak.textContent = String((tick + 5) % 6).padStart(2, " ");
  //   p2.fields.status.textContent = statuses[(s + 2) % statuses.length];
  //   p2.fields.acc.textContent    = `${55 + ((tick * 11) % 45)}%`;
  //   p2.fields.ping.textContent   = `${25 + ((tick * 17) % 130)} ms`;
  //   p2.fields.mood.textContent   = moods[(m + 3) % moods.length];

  //   // Extras
  //   const speed = 80 + ((tick * 9) % 60);
  //   const isRoaring = tick % 5 === 0;
  //   ballSpeed.innerHTML = `<span class="font-bold">Ball Speed:</span> ${speed.toString().padStart(3, " ")} km/h`;
  //   crowd.innerHTML     = `<span class="font-bold">Crowd:</span> ${isRoaring ? '<span class="font-bold">ROARING</span>' : 'murmuring'}`;
  //   highlights.innerHTML= `<span class="font-bold">Highlights:</span> <span class="${(tick%7===0)?'text-red-400':''}">${(tick%7===0)?'SICK BACKSPIN WIN':'—'}</span>`;

  //   tick = (tick > 1_000_000) ? 0 : tick + 1;
  // };

  // update();
  // const id = setInterval(update, 750);

  // // Si tu veux pouvoir “detruire” proprement le widget :
  // (root as any).__dispose = () => clearInterval(id);

