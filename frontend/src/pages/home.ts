// src/main.ts

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function text(t: string): Text {
    return document.createTextNode(t);
}

export function Home(): HTMLElement {
    const main = el("main", "p-4");
    const grid = el("section", "grid grid-cols-1 md:grid-cols-3 gap-6");

    const base = "text-justify text-md font-modern-type";
    const dropcap = "first-line:tracking-widest first-letter:text-6xl first-letter:font-bold first-letter:text-gray-900 dark:first-letter:text-gray-100 first-letter:me-2 first-letter:float-start";

    const aPlay = el("a", "text-black-500 underline decoration-4 hover:bg-black hover:text-white");
    aPlay.href = "#/game";
    aPlay.append(text("Play the game"));

    const aLogin = el("a", "text-black-500 underline decoration-4 hover:bg-black hover:text-white");
    aLogin.href = "#/login";
    aLogin.append(text("Login"));

    function para(txt: SVGStringList, cls = ""): HTMLParagraphElement {
        const p = el()
    }

    const p1 = el("p", "first-line:tracking-widest first-letter:text-6xl first-letter:font-bold first-letter:text-gray-900 dark:first-letter:text-gray-100 first-letter:me-2 first-letter:float-start text-justify text-md font-modern-type")
    p1.append(
        text(
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In volutpat quam et nulla ultricies, eget bibendum nunc pretium. Etiam eleifend leo enim, vitae tincidunt leo tristique in. Aenean fermentum sapien sit amet laoreet mollis. Praesent commodo nibh vitae eros rhoncus aliquet. Nulla facilisi. Cras ac congue ante, eu ultricies eros. In justo orci, convallis in velit in, semper tempus neque. Integer ullamcorper a nisl nec aliquet. Maecenas consequat turpis ultricies tortor scelerisque cursus. Sed blandit ultrices pretium. Vestibulum vitae mi consequat, fringilla risus ac, congue metus. Aenean quis semper ligula. Nulla rutrum at odio nec accumsan. Phasellus laoreet elit malesuada consectetur dapibus. Cras porttitor massa sed rutrum rhoncus. Sed risus risus, accumsan et libero vitae, rutrum porttitor purus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris libero tortor, ullamcorper non nisi non, eleifend convallis nibh."
        )
    );

    const p2 = el("p", "first-line:tracking-widest first-letter:text-6xl first-letter:font-bold first-letter:text-gray-900 dark:first-letter:text-gray-100 first-letter:me-2 first-letter:float-start text-justify text-md font-modern-type")
    p2.append(
        text("Maecenas vel leo in eros lacinia efficitur. Aenean fermentum laoreet mollis. Praesent commodo nibh vitae eros rhoncus aliquet. Cras ac congue ante, eu ultricies eros. In justo orci, convallis in velit in, semper tempus neque. You must "),
        aLogin,
        text(" to access your account. And then you may "),
        aPlay,
        text(". Mauris molestie neque vel vulputate imperdiet. Donec mauris ligula, bibendum ac mattis sit amet, dapibus at ex. Phasellus eu quam sem. Etiam eu laoreet diam. Duis euismod volutpat nisi. Vestibulum ex quam, ultricies ac ipsum et, sagittis condimentum nisi. Donec in lectus a odio ullamcorper aliquet. Cras iaculis in arcu sed porttitor. Fusce tristique feugiat sagittis. Phasellus non scelerisque justo. Nam suscipit nisi at euismod tristique. Fusce et varius tellus. Nam bibendum, arcu id dignissim dictum, velit nibh convallis massa, eget aliquam quam nisi pulvinar tortor.")
    );

    const p3 = el("p", "first-line:tracking-widest first-letter:text-6xl first-letter:font-bold first-letter:text-gray-900 dark:first-letter:text-gray-100 first-letter:me-2 first-letter:float-start text-justify text-md font-modern-type")
    p3.append(
        text(
            "Duis bibendum nunc eget enim ornare, non posuere elit blandit. Pellentesque fermentum dui ut magna ultricies, eu congue sapien convallis. Curabitur mollis malesuada ante et hendrerit. Maecenas ullamcorper odio nulla, sit amet ornare ipsum egestas vel. Nullam ex tortor, sollicitudin id diam id, efficitur sagittis justo. Aenean fermentum sapien sit amet laoreet mollis. Praesent commodo nibh vitae eros rhoncus aliquet. Nulla facilisi. Cras ac congue ante, eu ultricies eros. In justo orci, convallis in velit in, semper tempus neque. Ut pellentesque elit sit amet nisi porttitor pretium. Sed pretium a neque accumsan condimentum. Fusce nibh turpis, facilisis ut lectus vitae, dapibus pharetra nisl. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis risus felis, id ornare tellus iaculis ut. Aenean vitae placerat nulla, congue interdum nisl. Maecenas sit amet lobortis diam."
        )
    );

    grid.append(p1, p2, p3);
    main.append(grid);
    return main;
}

