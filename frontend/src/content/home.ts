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

function makeSidebarItem(href: string, titleText: string, bodyText: string): HTMLAnchorElement {

    const link = el("a", "block no-underline group cursor-pointer") as HTMLAnchorElement;
    link.href = href;

    const wrapper = el("article", "space-y-1");

    const title = el("h3", `font-oldprint -tracking-[0.02em] text-center
        uppercase
        text-lg lg:text-lg
        xxl:text-2xl
        group-hover:underline font-oldprint-extravagant`);
    title.append(text(titleText));

    const body = el("p", `font-hello-print text-sm xxl:text-xl text-justify
        group-hover:bg-stone-900 group-hover:text-white`);
    body.append(text(bodyText));

    wrapper.append(title, body);
    link.append(wrapper);
    return link as HTMLAnchorElement;
}


function spacer(char: string): HTMLElement {
    const span = el("h1", `font-screenprint-regular text-black text-[100px] text-center -mb-[45px] -mt-[80px]`);
    span.append(text(char));
    return span;
}

export function techList(title: string, contents: string): HTMLElement {
    const section = el("section", "space-y-2");
    const secTitle = el("h3", `font-arcade-narrow text-sm xxl:text-lg uppercase -ml-1`, text(title));
    const secContent = el("p", "font-ocean-type text-sm xxl:text-lg", text(contents));
    section.append(secTitle, secContent);
    return section;
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
        `grid grid-cols-1
        lg:[grid-template-columns:20%_40%_20%_13%] lg:gap-7
        xl:[grid-template-columns:20%_40%_20%_13%] xl:gap-8
        xxl:[grid-template-columns:20%_40%_20%_13%] xxl:gap-10`
    );

    /************************************************************
     * COLONNE 1 – INTRO / ARTICLE PRINCIPAL
     ************************************************************/
    const col1 = el("article", "space-y-3");

    const col1Kicker = el("p", "subtitle-cat", text(" · Campus · 42 Paris · "));

    const col1Title = el("h2", `article-hed font-lapresse text-4xl lg:text-3xl xl:text-4xl xxl:text-5xl leading-[3rem]`,
        text(`FOUR CAREER CHANGES, ONE ARCADE MACHINE`));

    const col1Chapo = el("p", "article-sm italic -tracking-[0.07em] leading-[1.4rem]", text(`In the basement glow of 42 Paris,
        four exhausted students are trying to ship one last project before the school spits them back into the real world:
        a full-stack Pong universe called Transcendence.`));

    const article1 = el("p", "article-base dropcap", text(`They are four. Between 31 and 37 years old.
        All from the November 2023 intake. All in the middle of a professional reinvention.
        For two months, Nelbi, Yoann, Jérôme and Félix have been building this project the same way Pong was born:
        face to face, hands on the same keyboard, no shortcuts.`));

    const article2 = el("p", "article-base dropcap", text(`From the start, the team made a clear choice: no remote modules.
        Everything was designed around local play, shared space, and immediate interaction. Two players, one machine.
        Less latency, more responsibility.`));

    const article3 = el("p", "article-base dropcap", text(`Nelbi took charge of the foundations. Database design, data consistency,
        and the blockchain layer that secures tournament results. She also shared backend development with Yoann,
        who focused on security tools, authentication flows, and defensive architecture. Nothing flashy,
         just systems meant to survive real use.`));

    const article4 = el("p", "article-base dropcap", text(`Jérôme handled observability. Logs, metrics, dashboards.
        If something breaks, it should be visible, measurable, explainable. Grafana is not decoration here;
        it is a window into the system’s behavior.`));

    const article5 = el("p", "article-base dropcap", text(`Félix did what he always does: build, refine, rethink.
        The visual identity, the frontend architecture, and the games themselves. From the newspaper-style interface
        to the second game, everything on screen was designed to feel intentional — playful, but structured.`));

    const article6 = el("p", "article-base dropcap", text(`Two months in, the project stands as a complete ecosystem
        rather than a checklist. Built for the three evaluators it is now presented to, with one simple hope:
        that it feels as coherent to play as it was to build.`));

        col1.append(col1Kicker, col1Title, col1Chapo, article1, article2, article3);

    /************************************************************
     * COLONNE 2 – PHOTO + SOUS-GRILLE (2 ROWS, 2 COLS)
     ************************************************************/
    const col2 = el("section", "space-y-4");

    // Row 1 : photo mise en page "journal"
    const figure = el("figure", "");
    const img = el("img", "frame-photo-img img-newspaper contrast-150") as HTMLImageElement;
    img.src = "/imgs/OldPongAdd.png";
    img.alt ="Real photo of two players of Pong, back in the 1970s.";

    const figcap = el("figcaption", "article-sm italic -tracking-[0.07em] leading-[1.4rem]", text(`Night shift at 42: monitors glowing,
        terminals buzzing, and a Pong ball bouncing somewhere in the code.`));
    figure.append(img, figcap);

    // Row 2 : une sous-grille 2 colonnes (pour tricher la maquette)
    const col2SubGrid = el(
        "div",
        `grid grid-cols-1 gap-4
        md:grid-cols-[45%_45%] md:gap-6`
    );

    const articleWrapper = el("div", "space-y-2");


    ////// FUN FACT //////
    const subB = el("article", "flex flex-col");
    const funFactBox = el("div", "funfact space-y-2 m-1");
    const funFactTitle = el("h3", "subtitle-hed mb-4");
    funFactTitle.append(text("Fun Fact"));

    const funFact = el("p", "article-base", text(`Did you know? The original Pong arcade machines were so popular
        that they often ran out of quarters! Players would sometimes resort to using slugs or washers
        to keep the game going.`));

    const add = el("img", "img-newspaper w-full my-4") as HTMLImageElement;
    add.src = "/imgs/PongAdd.png";

    funFactBox.append(funFactTitle, funFact);
    subB.append(funFactBox, add);
    articleWrapper.append(article4, article5, article6);
    col2SubGrid.append(articleWrapper, subB);
    col2.append(figure, col2SubGrid);

    /************************************************************
     * COLONNE 3 – SUITE D’ARTICLE / CITATIONS / RYTHME
     ************************************************************/
    const col3 = el("section", "space-y-3");

    const col3Kicker = el("p", "subtitle-cat");
    col3Kicker.append(text(" · TECH' NOTES · SELECTED MODULES · "));

    const techList1 = techList("SQLite Model",
        `A lightweight, reliable database choice ensuring consistency across services and ease of deployment.`);

    const techList2 = techList("Fastify / Node Backend",
        `A clean, fast backend framework used to structure APIs and handle real-time interactions without unnecessary abstraction.`);

    const techList3 = techList("User Management",
        `Account creation, profiles, stats, avatars, and persistent identities across games and tournaments.`);

    const techList4 = techList("Two-Factor Authentication (2FA)",
        `An extra security layer to protect user accounts and sensitive actions.`);

    const techList5 = techList("Google OAuth 2.0",
        `External authentication for fast, secure login without reinventing identity verification.`);

    const techList6 = techList("GDPR Compliance",
        `User data control, anonymization, and account deletion — implemented as features, not afterthoughts.`);

    const techList7 = techList("Prometheus & Grafana",
        `Monitoring, metrics collection, and dashboards to observe system health and performance in real time.`);

    const techList8 = techList("Dashboards",
        `Readable visual summaries for game stats, system metrics, and activity tracking.`);

    const techList9 = techList("Blockchain (Tournament Scores)",
        `Immutable storage of tournament results, ensuring transparency and tamper resistance.`);

    const techList10 = techList("Another Game",
        `A second playable experience built alongside Pong, extending the platform beyond a single title.`);

    const techList11 = techList("Firefox QA (No Warnings)",
        `Strict compatibility with Firefox, without console warnings or runtime errors.`);

    const techList12 = techList("Tailwind CSS",
        `A utility-first styling approach used to keep layout, typography, and responsiveness consistent.`);

    col3.append(col3Kicker, techList1, techList2, techList3, techList4, techList5, techList6,
        techList7, techList8, techList9, techList10, techList11, techList12);

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
    const linksLabel = el("h1", "text-[70px] xxl:text-[110px] font-lapresse text-center -m-6", text(`Links`));
    const s1 = spacer("-");
    const s2 = spacer("-");
    const s3 = spacer("-");
    const arrow = el("img", "img-newspaper w-full h-12 mx-auto my-4") as HTMLImageElement;
    arrow.src = "imgs/arrow.png";


    const navPlay = makeSidebarItem(
        "#/game",
        "- GAME ON -",
        "Anonymous sources confirm that a fully functional Pong arena is hidden behind this link. Side effects may include shouting at pixels."
    );

    const navLogin = makeSidebarItem(
        "#/login",
        "LOG IN BEFORE THE BALL DROPS",
        "Rumor says your stats, match history, and unfinished glory are waiting here. Identification is optional, but bragging rights are not."
    );

    const navCredits = makeSidebarItem(
        "#/credits",
        "WHO BUILT THIS THING?",
        "A suspiciously dedicated group of students claims responsibility. This page lists them before they disappear into internships."
    );

    const navProfile = makeSidebarItem(
        "#/profile",
        "YOUR PONG DOSSIER",
        "Win rate, unexpected defeats, and that one unbelievable comeback: everything is neatly archived, as if you were important."
    );

    sidebar.append(linksLabel, arrow, navPlay, s1, navLogin, s2, navCredits, s3, navProfile);

    /************************************************************
     * ASSEMBLAGE
     ************************************************************/
    grid.append(col1, col2, col3, sidebar);
    main.append(grid);
    return main;
}




