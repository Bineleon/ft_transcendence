// src/main.ts

/** Fonction ELEMENT (el) **/
/* elle crée un élément HTML avec une balise et une classe optionnelle */
/* liste types DOM (Document Object Model)/balise les plus courants :
    "a" - HTMLAnchorElement (lien)
    "div" - HTMLDivElement (division de page)
    "span" - HTMLSpanElement (portion de texte en ligne)
    "p" - HTMLParagraphElement (paragraphe)
    "section" - HTMLElement (section de page)
    "header" - HTMLElement (en-tête)
    "footer" - HTMLElement (pied de page)
    "main" - HTMLElement (contenu principal)
    "img" - HTMLImageElement (image)
    "button" - HTMLButtonElement (bouton)
    "input" - HTMLInputElement (champ de saisie)
    "form" - HTMLFormElement (formulaire)
    "ul" - HTMLUListElement (liste non ordonnée)
    "li" - HTMLLIElement (élément de liste)
    "h1", "h2", "h3", etc. - HTMLHeadingElement (titres)
    "table" - HTMLTableElement (tableau)
    "tr" - HTMLTableRowElement (ligne de tableau)
    "td" - HTMLTableCellElement (cellule de tableau)
    "canvas" - HTMLCanvasElement (zone de dessin)
    "video" - HTMLVideoElement (vidéo)
    "audio" - HTMLAudioElement (audio)
    "textarea" - HTMLTextAreaElement (zone de texte)
    etc. (https://developer.mozilla.org/en-US/docs/Web/API/HTMLElementTagNameMap)
*/
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  ...children: (HTMLElement | Text)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);

  // Premier argument optionnel
  if (className) node.className = className;

  // Enfants supplémentaires
  if (children.length > 0) node.append(...children);

  return node;
}

export function text(t: string): Text {
    return document.createTextNode(t);
}

export function Home(): HTMLElement {
    const main = el(
        "main",
        // Container général, adaptatif sur 4 tailles
        `mx-auto px-4 py-4
        lg:py-6 xl:py-8 xxl:py-10`
    );

    // Grille principale : 1 colonne en base, 4 colonnes à partir de lg,
    // avec une dernière colonne plus fine pour la “sidebar”
    const grid = el(
        "section",
        `grid grid-cols-1 gap-6
        lg:[grid-template-columns:20%_40%_20%_13%] lg:gap-7
        xl:[grid-template-columns:20%_40%_20%_13%] xl:gap-8
        xxl:[grid-template-columns:20%_40%_20%_13%] xxl:gap-10`
    );

    /************************************************************
     * COLONNE 1 – INTRO / ARTICLE PRINCIPAL
     ************************************************************/
    const col1 = el("article", "space-y-3");

    const col1Kicker = el("p", "subtitle-cat", text(" · Campus · 42 Paris · "));

    const col1Title = el("h2", `article-hed`,
        text(`4 Students , 1 Last Boss`));

    const col1Chapo = el("p", "article-sm italic");
    col1Chapo.append(
        text(
            "In the basement glow of 42 Paris, four exhausted students are trying to ship one last project "
        ),
        text(
            "before the school spits them back into the real world: a full-stack Pong universe called Transcendence."
        )
    );

    const col1P1 = el("p", "article-base dropcap", text(`It is 03:17 a.m. The coffee machine is making
        a noise that definitely violates some European regulation, and the open-space smells like cold pizza,
        burnt brain cells, and overheated laptops. In the middle of it all: 
        four students, four terminals, and one shared Git repository that could either make or break their sanity.`));

    const col1P2 = el("p", "article-base dropcap");
    col1P2.append(
        text(
            "Transcendence is not just another school exercise. It is the unofficial final boss of the core curriculum: "
        ),
        text(
            "a real-time Pong platform, online matchmaking, tournaments, authentication, profile pages, and a front-end "
        ),
        text(
            "that has to look more like a vintage newspaper from an alternate universe than a tutorial template. "
        ),
        text(
            "You do not simply “finish” Transcendence. You survive it."
        )
    );

    const col1P3 = el("p", "article-base");
    col1P3.append(
        text(
            "“We started with a clean architecture and a beautiful Notion board,” one of them laughs, "
        ),
        text(
            "“and now we just negotiate with the linter like it’s a hostage situation.” "
        ),
        text(
            "Still, between two failed builds, they keep pushing features: rematches, spectators, retro typography, "
        ),
        text("and small details no evaluator will ever notice—except them.")
    );

    col1.append(col1Kicker, col1Title, col1Chapo, col1P1, col1P2, col1P3);

    /************************************************************
     * COLONNE 2 – PHOTO + SOUS-GRILLE (2 ROWS, 2 COLS)
     ************************************************************/
    const col2 = el("section", "space-y-4");

    // Row 1 : photo mise en page "journal"
    const figure = el("figure", "");
    const img = el("img", "frame-photo-img img-newspaper contrast-80") as HTMLImageElement;
    img.src = "/imgs/pong.png";
    img.alt =
        "Real photo of two players of Pong, back in the 1970s.";

    const figcap = el(
        "figcaption",
        "article-xs text-center mt-2 italic"
    );
    figcap.append(
        text(
            "Night shift at 42: monitors glowing, terminals buzzing, and a Pong ball bouncing somewhere in the code."
        )
    );

    figure.append(img, figcap);

    // Row 2 : une sous-grille 2 colonnes (pour tricher la maquette)
    const col2SubGrid = el(
        "div",
        `grid grid-cols-1 gap-4
        md:grid-cols-[45%_45%] md:gap-6`
    );

    // Sous-colonne A : mini portrait / focus
    const subA = el("article", "space-y-2");
    const subATitle = el(
        "h3",
        "subtitle-hed text-left mb-4"
    );
    subATitle.append(text("A Team of Four, Not a Committee"));

    const subAP = el("p", "article-xs text-lg leading-snug");
    subAP.append(
        text(
            "There is Lina, who talks to the database as if it were a moody roommate. "
        ),
        text(
            "Malik, who rewrites TypeScript types until the compiler becomes emotional. "
        ),
        text(
            "Zoé, who refuses to ship a button unless it feels perfect at three different screen sizes. "
        ),
        text(
            "And Jules, who pretends to only care about the backend, but secretly tunes easing curves on hover states at 04:00 a.m."
        )
    );

    subA.append(subATitle, subAP);

    // Sous-colonne B : encart “tech” / humour
    const subB = el("article", "space-y-2 funfact m-1");
    const subBTitle = el(
        "h3",
        "subtitle-hed mb-4"
    );
    subBTitle.append(text("Did You Know?"));

    const subBList = el("ul", "space-y-1 article2-base");
    const sb1 = el("li");
    sb1.append(
        text(
            "Vite + TypeScript: compiles in a blink, unless someone imports three unused libraries “just in case”."
        )
    );
    const sb2 = el("li");
    sb2.append(
        text(
            "Tailwind 4 + custom fonts: every breakpoint is a design decision, every class name a small existential crisis."
        )
    );
    const sb3 = el("li");
    sb3.append(
        text(
            "WebSockets & tournaments: when it works, it feels like magic; when it doesn’t, it feels like group therapy."
        )
    );
    const sb4 = el("li");
    sb4.append(
        text(
            "Git: one branch named “final-final-last-clean” that no one dares to touch anymore."
        )
    );

    // Row 3
    const championTournament = el("div", "items-center space-y-2");
    const champImg = el("img", "w-[90%] img-newspaper contrast-100 items-center rounded-md shadow-lg -translate-y-[200px]") as HTMLImageElement;
    champImg.src = "/imgs/champ.png";
    champImg.alt = "Champion tournament screenshot";
    
    const champHeader = el(
        "h3",
        "uppercase text-[0.8rem] lg:text-xs tracking-[0.25em] mt-2"
    );
    champHeader.append(text("And the last Tournament Winner Is..."));

    const champProfile = el("div", "grid grid-cols-2 gap-2 items-center");
    const champProfileImg = el("img", "w-full rounded-md shadow-lg") as HTMLImageElement;
    champProfileImg.src = "/imgs/champion-profile.png";
    champProfileImg.alt = "Champion profile screenshot";

    const champProfileHeader = el(
        "h3",
        "font-im-great uppercase text-[0.8rem] lg:text-xs tracking-[0.25em]"
    );
    champProfileHeader.append(text("Champion Profile Page"));
    champProfile.append(champProfileImg, champProfileHeader);


    championTournament.append(champImg, champHeader, champProfile);
    subBList.append(sb1, sb2, sb3, sb4);
    subB.append(subBTitle, subBList);
    col2SubGrid.append(subB, subA);
    col2.append(figure, col2SubGrid, championTournament);

    /************************************************************
     * COLONNE 3 – SUITE D’ARTICLE / CITATIONS / RYTHME
     ************************************************************/
    const col3 = el("section", "space-y-3");

    const col3Kicker = el(
        "p",
        "text-[0.6rem] tracking-[0.25em] uppercase font-modern-type"
    );
    col3Kicker.append(text("Voices from the terminal"));

    const col3P1 = el("p", "article-base");
    col3P1.append(
        text(
            "“The weird thing,” Lina says, “is that Transcendence is supposed to be a Pong project, but we spend half of our time "
        ),
        text(
            "designing how people will talk to each other around the game. Chats, invites, friend lists… It is basically social awkwardness as a service.”"
        )
    );

    const col3P2 = el("p", "article-base");
    col3P2.append(
        text(
            "They have built ranking systems that no one will fully understand, animated scoreboards, and a lobby that looks like a "
        ),
        text(
            "front page of an old newspaper trapped inside a modern SPA. Somewhere between the CSS and the SQL, the line between work and play is gone."
        )
    );

    const col3Quote = el(
        "p",
        "article-sm italic border-l border-stone-400 ps-3"
    );
    col3Quote.append(
        text(
            "“If Transcendence works on demo day,” Malik says, “we are not sure if we will be proud… or simply relieved that it did not explode on stage.”"
        )
    );

    const col3P3 = el("p", "article-base");
    col3P3.append(
        text(
            "When the sun finally hits the windows of 42, the four of them will push one last commit, merge with shaking hands, "
        ),
        text(
            "and pretend they slept at least a little. The evaluators will see routes, tests, UI polish and documentation. "
        ),
        text(
            "What they will not see is the quiet promise under all of it: that, whatever happens next, these four will never "
        ),
        text(
            "look at a bouncing Pong ball the same way again."
        )
    );

    col3.append(col3Kicker, col3P1, col3P2, col3Quote, col3P3);

    /************************************************************
     * COLONNE 4 – SIDEBAR “FAITS DIVERS” / NAV
     ************************************************************/
    const sidebar = el(
        "aside",
        `space-y-4
        mt-6 lg:mt-0
        lg:border-l lg:border-stone-400 lg:pl-4`
    );

    // Helper pour fabriquer une “carte” cliquable
    function makeSidebarItem(
        href: string,
        titleText: string,
        kickerText: string,
        bodyText: string
    ): HTMLAnchorElement {
        const link = el(
            "a",
            "block no-underline group cursor-pointer"
        ) as HTMLAnchorElement;
        link.href = href;

        const wrapper = el(
            "article",
            "space-y-1"
        );

        const kicker = el(
            "p",
            "text-[0.55rem] tracking-[0.25em] uppercase font-modern-type text-stone-700"
        );
        kicker.append(text(kickerText));

        const title = el(
            "h3",
            "font-im-great uppercase text-[0.75rem] lg:text-xs group-hover:underline tracking-[0.25em] font-oldprint-extravagant"
        );
        title.append(text(titleText));

        const body = el(
            "p",
            "article-xs group-hover:bg-stone-900 group-hover:text-white transition-colors duration-200"
        );
        body.append(text(bodyText));

        wrapper.append(kicker, title, body);
        link.append(wrapper);
        return link as HTMLAnchorElement;
    }

    const navPlay = makeSidebarItem(
        "#/game",
        "BREAKING GAME · PLAY PONG",
        "Late-night arcade",
        "Anonymous sources confirm that a fully functional Pong arena is hidden behind this link. Side effects may include shouting at pixels."
    );

    const navLogin = makeSidebarItem(
        "#/login",
        "LOG IN BEFORE THE BALL DROPS",
        "Administrative drama",
        "Rumor says your stats, match history, and unfinished glory are waiting here. Identification is optional, but bragging rights are not."
    );

    const navCredits = makeSidebarItem(
        "#/credits",
        "WHO BUILT THIS THING?",
        "Behind the scenes",
        "A suspiciously dedicated group of students claims responsibility. This page lists them before they disappear into internships."
    );

    const navProfile = makeSidebarItem(
        "#/profile",
        "YOUR PONG DOSSIER",
        "Classified file",
        "Win rate, unexpected defeats, and that one unbelievable comeback: everything is neatly archived, as if you were important."
    );

    sidebar.append(navPlay, navLogin, navCredits, navProfile);

    /************************************************************
     * ASSEMBLAGE
     ************************************************************/
    grid.append(col1, col2, col3, sidebar);
    main.append(grid);
    return main;
}




