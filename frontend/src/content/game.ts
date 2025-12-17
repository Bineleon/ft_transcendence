import { el, text } from "./home";

export function Game(): HTMLElement {
  const main = el("main", `mx-auto px-4 py-4
        lg:py-6 xl:py-8 xxl:py-10`);

///// Main Box (2 sections: left + right)        
  const box1 = el("div",
  `grid gap-4 grid-cols-1 md:grid-cols-[1fr_4fr] md:items-start`
  );

//// On divise en deux etages celle de gauche
  const box1a = el("aside", `grid gap-4 md:grid-rows-[auto_auto]`);

  /// TOURNAMENT BOX
  const tournamentBox = el("section", `img-newspaper p-4 -m-2 big-btn-click
    whitespace-pre-line items-center text-2xl`);
  const tournamentLink = el("a", ``) as HTMLAnchorElement;
  const tournamentInfos = el("h2", `font-origin-athletic text-2xl -p-8 m-6`);

  tournamentLink.href = `#/tournament`;
  tournamentBox.setAttribute("aria-label", "Go to Tournament page");
  tournamentInfos.append(text(`click here to know more about\n`));
  tournamentInfos.append(el("h1", `text-3xl underline`, text(`TOURNAMENTS`)));
  tournamentLink.append(tournamentInfos);
  tournamentBox.append(tournamentLink);

  /// SNAKE BOX
  const snakeBox = el("section", `px-6 pb-6`);
  const snakeTitle = el("a", `font-jmh text-4xl mb-4 hover:underline decoration-4`, text(`— games`), el("br"), el("p", "text-center", text("&")), el("p", "text-right", text(` puzzles —`))) as HTMLAnchorElement;
  snakeTitle.href = `#/snake`;
  snakeTitle.setAttribute("aria-label", "Go to Snake games and puzzles page");

  const snakeLink = el("a",
    `block border-9 font-superretro uppercase text-2xl p-2 text-center mt-6
     hover:bg-black hover:underline hover:text-white`
  ) as HTMLAnchorElement;
  snakeLink.href = `#/snake`;
  snakeLink.append(text(`GO PLAY SNAKE`));

  const snakeTeaser1 = el("p", `article-base mt-4 dropcap text-justify whitespace-pre-line`,
    text(`Every respectable newspaper has its puzzles. Crosswords for the patient, riddles for the stubborn. This one has a snake.`));
  const snakeTeaser2 = el("p", `article-base mt-4 dropcap text-justify whitespace-pre-line`,
    text(`Inspired by the logic of word grids and the reflexes of arcade screens, this game twists the old formula: movement becomes thinking, speed becomes spelling. There are no clues printed in the margins — only patterns to recognize and mistakes to regret. `));

  const snakeTeaser3 = el("p", `article-base mt-4 dropcap text-justify whitespace-pre-line`,
    text(`Call it a puzzle. Call it a game.
Either way, you will start “just one round” too many.`));

  // Assemblage
  snakeBox.append(snakeTitle, snakeTeaser1, snakeTeaser2, snakeLink, snakeTeaser3);
  box1a.append(tournamentBox, snakeBox);

//// PONG SECTION Titre + Photo + Article
  const box1b = el("section", `grid gap-4 md:grid-rows-[auto_1fr]`);

  /// PONG TITLE
  const pongTitleRow = el("a", `block
    font-lapresse whitespace-pre-line
    text-[5rem] text-justify
    leading-[5rem] tracking-wide
    hover:bg-black hover:underline hover:text-white`) as HTMLAnchorElement;
  pongTitleRow.href = `#/playpong`;
  pongTitleRow.setAttribute("aria-label", "Go to Play Pong page");
  pongTitleRow.append(text(`PLAY PONG with the best, Be Fearless. Be Limitless.`));
//// PONG CONTENT (photo + article)
  const box1b2 = el("div", `grid gap-4 md:grid-cols-[3fr_1fr]`);

  /// PONG PHOTO
  const photoWrap = el("a", `block img-newspaper p-4
    hover:contrast-125 focus:outline-none`) as HTMLAnchorElement;
  photoWrap.href = `#/playpong`;
  photoWrap.setAttribute("aria-label", "Go to Play Pong (photo)");

  const photoTitle = el("h2", `font-modern-type italic text-justify text-sm mb-1`);
  photoTitle.append(text(`Ted Dabney, left, was a Marine and co-creator of the prototypical arcade game,
     Pong. Dabney died on May 26 and is considered a father of modern video gaming. (Al Alcorn/Computer History Museum)`));

  const pongImg = el("img", `img-newspaper contrast-150 hover:contrast-120 w-full`) as HTMLImageElement;
  pongImg.src = `/imgs/AtariCrew.png`;
  pongImg.alt = `Pong illustration`;
  pongImg.loading = `lazy`;

  photoWrap.append(pongImg, photoTitle);

  // box 1b2b = Pong Article (20%)
  const pongArticle = el("article", `p-4 border-4`);
  const pongArticleH2 = el("h2", `font-minecraft text-3xl mb-3 text-justify whitespace-pre-line`);

  const pongArticleLink = el("a", `block border-9 font-superretro uppercase text-2xl p-2 text-center mt-6
     hover:bg-black hover:underline hover:text-white`) as HTMLAnchorElement;
  pongArticleLink.href = `#/playpong`;
  pongArticleLink.append(text(`GO PLAY PONG`));

  pongArticleH2.append(pongArticleLink);

  const pongBody = el("p", `article-base dropcap text-justify whitespace-pre-line`);
  pongBody.append(
    text(`Released by Atari in 1972, Pong was built as a technical exercise. Two paddles, one ball, a score. Nothing more.
      Designed under Nolan Bushnell and Allan Alcorn, the game was tested in a bar. The machine failed within days — its coin box was full.
      Pong required no explanation. Anyone could play. Anyone could lose. It turned interaction into spectacle and electronics into sport.
      There was no story. Only response time.
      And that was enough.`)
  );

  pongArticle.append(pongArticleH2, pongBody);

  box1b2.append(photoWrap, pongArticle);

  box1b.append(pongTitleRow, box1b2);

  // Assemble
  box1.append(box1a, box1b);
  main.append(box1);
  return main;
}

function keywordLink(label: string, href: string): HTMLAnchorElement {
  const a = el("a", `underline decoration-4 hover:bg-black hover:text-white`) as HTMLAnchorElement;
  a.href = href;
  a.append(text(label));
  return a;
}
