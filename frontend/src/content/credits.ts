// src/pages/Credits.ts
import { el, text } from "./home";

type Credit = {
  name: string;
  roleLine: string;
  portraitSrc: string;
  portraitHoverSrc: string;
  portraitAlt: string;
  blurb: string;
};

function creditHoverPortrait(src: string, hoverSrc: string, alt: string): HTMLElement {
  const wrap = el("div", "img-hover-wrapper mx-auto w-full");

  const imgBase = el("img", "img-newspaper img-hover") as HTMLImageElement;
  imgBase.src = src;
  imgBase.alt = alt;

  const imgHover = el("img", "img-newspaper img-base") as HTMLImageElement;
  imgHover.src = hoverSrc;
  imgHover.alt = alt;

  wrap.append(imgBase, imgHover);
  return wrap;
}

export function Credits(): HTMLElement {
  const main = el("main", `max-w mx-auto p-auto pointer-events-auto`);
  const page = el("section", `p-4 md:p-6`);

  // Header
  const header = el("header", `mb-6 p-4`);
  const h1 = el("h1", `font-lapresse text-6xl tracking-wide text-center md:text-7xl leading-tight underline decoration-4`);
  h1.append(text(`THE CREW BEHIND THE MACHINE`));

  const sub = el("p", `article-base mt-3 text-center`);
  sub.append(
    text(
      `Four career-changers from the Nov 2023 intake. Two months in. Built for our three evaluators — and yes, we really hope you like it.`
    )
  );

  header.append(h1, sub);

  // Data (TES VRAIS LIENS)
  const credits: Credit[] = [
    {
      name: `Nelbi`,
      roleLine: `Database • Blockchain • Backend`,
      portraitSrc: `/imgs/neleon.jpg`,
      portraitHoverSrc: `/imgs/neleon70bw.png`,
      portraitAlt: `Portrait of Nelbi`,
      blurb: `Nelbi built the foundations: the SQLite model, data integrity, and the blockchain layer that makes tournament results tamper-resistant. She also shared backend work — calm, precise, and very hard to argue with (because it works).`,
    },
    {
      name: `Yoann`,
      roleLine: `Backend • Security • Auth`,
      portraitSrc: `/imgs/ylenoel.jpg`,
      portraitHoverSrc: `/imgs/ylenoel70.png`,
      portraitAlt: `Portrait of Yoann`,
      blurb: `Yoann handled backend architecture and security tooling. Authentication flows, protection basics, and “please don’t break our app” engineering. If the platform feels solid, that’s not magic — it’s him.`,
    },
    {
      name: `Jérôme`,
      roleLine: `Grafana • Monitoring • Dashboards`,
      portraitSrc: `/imgs/jeportie.jpg`,
      portraitHoverSrc: `/imgs/jeportie70.png`,
      portraitAlt: `Portrait of Jérôme`,
      blurb: `Jérôme made the system observable: Prometheus metrics, Grafana dashboards, and the kind of monitoring that catches problems before your evaluator does. He also pushes features like a man possessed.`,
    },
    {
      name: `Félix`,
      roleLine: `Art Direction • Frontend • Games`,
      portraitSrc: `/imgs/fcoullou.jpg`,
      portraitHoverSrc: `/imgs/fcoullou70.png`,
      portraitAlt: `Portrait of Félix`,
      blurb: `Félix built the whole visual identity and the frontend, then went further: the games, the page layouts, the “newspaper arcade” vibe. When he has an idea, it’s already half shipped.`,
    },
  ];

  // Grid 4 across (responsive)
  const grid = el(
    "div",
    `grid gap-4 md:gap-6
     grid-cols-1 sm:grid-cols-2 xl:grid-cols-4
     items-start`
  );

  for (const c of credits) grid.append(creditColumn(c));

  // small footer note
  const foot = el("footer", `mt-6 p-4`);
  const footP = el("p", `article-base`);
  footP.append(
    text(
      `No remote modules: we designed it like the original Pong — two players on the same machine, shared keyboard, pure arcade logic.`
    )
  );
  foot.append(footP);

  page.append(header, grid, foot);
  main.append(page);
  return main;
}

function creditColumn(c: Credit): HTMLElement {
  // container
  const col = el("article", `p-4 bg-paper`);

  // PHOTO (top)
  const photoWrap = el("div", `mb-4`);

  // If tu veux une photo ronde + “magazine wrap”, active wrap-circle
  // sinon remplace par `wrap-tight` ou rien.
  const fig = el("figure", `mx-auto w-fit`);

  const portrait = creditHoverPortrait(c.portraitSrc, c.portraitHoverSrc, c.portraitAlt);

  // Debug friendly: si ça casse, au moins tu vois l’erreur dans la console
  portrait.addEventListener("error", () => {
    // eslint-disable-next-line no-console
    console.error(`[Credits] image not found: ${c.portraitSrc}`);
  });

  fig.append(portrait);

  const name = el("h2", `font-jmh text-3xl mt-3 underline decoration-4 text-center`);
  name.append(text(c.name));

  const role = el("p", `font-houston-sport text-base mt-1 text-center opacity-80`);
  role.append(text(c.roleLine));

  fig.append(name, role);
  photoWrap.append(fig);

  // TEXT (below)
  const body = el("div", `mt-4`);

  // Option “magazine wrap”: un petit médaillon rond dans le texte
  // (si tu veux du wrap réel, faut que l’élément float dans le paragraphe)
  const p = el("p", `article-base dropcap text-justify`);
//   const floatBadge = el(
//     "span",
//     `wrap-circle float-left bg-paper border-4 border-double border-gray-400 w-[84px] h-[84px] flex items-center justify-center font-jmh text-xl`
//   );
//   floatBadge.append(text(c.name[0])); // initiale, style presse

  p.append(text(c.blurb));

  body.append(p);

  col.append(photoWrap, body);
  return col;
}
