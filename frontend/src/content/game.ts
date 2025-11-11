import { el, text } from "./home";

// src/pages/game.ts
export function Game(): HTMLElement {
  const main = el(
    "main", "max-w mx-auto p-auto pointer-events-auto"
  );
  const grid = el(
    "div",
    "grid gap-4 grid-cols-1 " +
    "md:grid-cols-[260px_1fr_300px] " + // gauche 260px, centre flexible, droite 300px
    "md:auto-rows-min" + // lignes auto, la hauteur totale vient de la somme des 2 boîtes du centre
    "md:grid-rows-[auto_1fr]"
  );

  /*** ENCART DE GAUCHE ***/
  const left = el(
    "aside", "px-8 pt-8 row-span-2 border-movie"
  );

  const category = el(
    "h2", "font-jmh text-4xl mb-4"
  );
  category.append(
    text("---- movies & more ----")
  );
  left.append(category);
  const leftTitle = el(
    "h3", "items-center border-4 font-jmh uppercase text-xl mb-4"
  );
  leftTitle.append(text("Breaking News !"));

  const leftContent = el(
    "p", "font-modern-type text-justify text-xl"
  );
  leftContent.append(
    text("After the incredible success of the story behind the Tetris game, a new movie is in the works, exploring the origins of the legendary game developer Alexey Pajitnov..."),
    el("br"),
    text("Soon in theaters near you!")
  );

  left.append(leftTitle, leftContent);
  ////////////////////////////////////////////////////

  /*** ENCART DU CENTRE ***/
  /// Partie haute
  const centerTop = el(
    "section", "p-4 border-5 border-double border-gray-400 mb-4"
  );

  const centerTopTitle = el(
    "h2", "font-jmh text-4xl mb-4"
  );
  centerTopTitle.append(
    text("THE FIRST GAME, THE LAST NERVE — INSIDE THE PONG PHENOMENON")
  );

  const centerTopContent = el(
    "p", "article-base"
  );
  centerTopContent.append(
    text("In 1972, Atari revolutionized the gaming world with the release of Pong, the first commercially successful video game. Created by Nolan Bushnell and Al Alcorn, Pong was a simple yet addictive table tennis simulation that captivated players worldwide. Its success laid the foundation for the video game industry, leading to the development of countless games and consoles that followed. Pong's legacy continues to influence modern gaming, reminding us of the humble beginnings of an industry that has become a global phenomenon.")
  );
  centerTop.append(centerTopTitle, centerTopContent);

  /// Partie basse
  const bottomDivider = el(
    "div", "grid grid-cols-1 md:grid-cols-2 gap-4 items"
  );
  const centerBottom = el(
    "section",  "p-4 border-4 border-dashed border-black"
  );
  const centerBottomTitle = el(
    "h2", "font-royalvogue text-2xl mb-4"
  );
  centerBottomTitle.append(
    text("Last Tournament"), el("br"), text("Top 3 Players")
  );
  
  const centerBottomContent = el(
    "ul", "font-modern-type text-md"
  );
  const players = [
    "1. Player One - 1000 points",
    "2. Player Two - 900 points",
    "3. Player Three - 800 points"
  ];
  players.forEach(player => {
    const listItem = el("li", "border-b border-gray-300 py-2");
    listItem.append(text(player));
    centerBottomContent.append(listItem);
  });

  centerBottom.append(centerBottomTitle, centerBottomContent);

  const tournament = el(
    "a", "box-dark in-dark-box"
  ) as HTMLAnchorElement;
  tournament.href = "#/tournament";
  tournament.setAttribute("aria-label", "Tournament Details");
  tournament.append(
    text("Next tournament starts"),
    el("br"), // une ligne vide si besoin mettre deux <br>
    text("July 15, 2024")
  );
  bottomDivider.append(centerBottom, tournament);
  //////////////////////////////////////////////////////

  /*** ENCART DE DROITE ***/
  const right = el(
    "div", "p-4 row-span-2 flex flex-col items-center border-8 border border-black"
  );
  const photoTitle = el(
    "h3", "font-jmh text-2xl text-center mb-4"
  );
  photoTitle.append(text("Vertical -Pong- Limit"));
  const photoFrame = el("div", "") as HTMLDivElement;
  const photo = el("img", "img-newspaper contrast-150 hover:contrast-120") as HTMLImageElement;
  photo.src = "/imgs/pong_ia.png";
  photoFrame.append(photo);

  const playButton = el("a", "btn-click mt-6") as HTMLAnchorElement;
  playButton.href = "#/gameon";
  playButton.append(text("Play Pong"));
  right.append(photoTitle, photoFrame, playButton);
  ////////////////////////////////////////////////

  /*** ASSEMBLAGE ***/
  grid.append(left, centerTop, right, bottomDivider);
  main.append(grid);
  return main;
}


/** MEMO **
-webkit : préfixe pour compatibilité avec les navigateurs basés sur WebKit (Safari, anciennes versions de Chrome)

*/