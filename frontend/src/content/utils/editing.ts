import { el, text } from "../home.ts";


type WrapSide = "left" | "right" | "center";
type WrapShape = "none" | "circle" | "tight" | "custom";

export type WrapOpts = {
  // Où commence le wrap (avant quel <p> on insère la box)
  atParagraphIndex?: number;    // 0 = tout début
  // Placement
  side: WrapSide;               // "left" | "right" | "center"
  width?: string;               // ex: "w-40", "w-56", "w-[18rem]", "w-[30%]"
  margin?: string;           // ex: "mt-[2lh]" ou "mt-6"
  extra?: string;               // classes Tailwind/Custom supp. (ex: "img-newspaper")
  // Forme de wrap
  shape?: WrapShape;            // "none" | "circle" | "tight" | "custom"
  shapeArbitrary?: string;      // arbitraire CSS pour polygon() etc si shape="custom"
  // Fin du wrap
  clearAfter?: boolean;         // true = ajoute <div class="wrap-clear">
  // Quoi insérer
  node?: HTMLElement;        // node à insérer
  kind?: "img" | "button" | "node"; // creation du node
  src?: string;                 // pour kind="img"
  alt?: string;                 // pour kind="img"
  text?: string;                // pour kind="button"
  buttonClass?: string;         // pour kind="button" (ex: "btn-click p-4")
};

export function makeP(content: string) {
    const p = el("p");           // crée <p>
    p.append(text(content));     // y ajoute le Text node
    return p;
}

export function injectWrapBox(article: HTMLElement, opts: WrapOpts) : HTMLElement | undefined {
    const display = getComputedStyle(article).display;
    if (display === "flex" || display === "grid") {
        console.warn("injectWrapBox: le conteneur parent est en flex ou grid, le wrapping peut ne pas fonctionner correctement.");
    }

    let node: HTMLElement;
    switch (opts.kind) {
        case "img": {
            const img = document.createElement("img");
            if (!opts.src) {
                console.error("injectWrapBox: 'src' is required for kind='img'");
                return;
            }
            img.src = opts.src;
            img.alt = opts.alt || "";
            node = img;
            break;
        }
        case "button": {
            const button = document.createElement("button");
            button.className = opts.buttonClass || "btn-click p-4";
            button.textContent = opts.text || "Click Me";
            node = button;
            break;
        }
        case "node": {
            if (!opts.src) {
                console.error("injectWrapBox: 'src' is required for kind='node'");
                return;
            }
            node = document.createElement("div");
            break;
        }
        default: {
            console.error("injectWrapBox: unknown kind");
            return;
        }
    }

    // Side
    const classes: string[] = [];
    if (opts.side === "left" || opts.side === "right") {
        classes.push(opts.side === "left" ? "wrap-left" : "wrap-right");
    } else if (opts.side === "center") {
        classes.push("mx-auto", "block");
    }

    // Width
    if (opts.width) { classes.push(opts.width); }

    // Margin Top
    if (opts.margin) { classes.push(opts.margin); }

    // Shape
    switch (opts.shape) {
        case "circle":
            classes.push("wrap-circle");
            break;
        case "tight": {
            classes.push("wrap-tight");
            break;
        }
        case "custom": {
            if (opts.shapeArbitrary) {
                classes.push(opts.shapeArbitrary);
            }
            break;
        }
        case "none":
        default:
            break;
    }

    // Extra classes
    if (opts.extra) { classes.push(opts.extra); }

    node.className = classes.join(" ").trim();

    const paragraphs = Array.from(article.children).filter(n => n.tagName === "P");

    if (paragraphs.length && opts.atParagraphIndex !== undefined && opts.atParagraphIndex < paragraphs.length) {
        article.insertBefore(node, paragraphs[opts.atParagraphIndex]);
    }
    else {
        article.insertBefore(node, article.firstChild);
    }

    if (opts.clearAfter) {
        const stopper = document.createElement("div");
        stopper.className = "wrap-clear";
        article.appendChild(stopper);
    }

    return node;
}
