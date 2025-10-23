import { el } from "./home";
import { text } from "./home";

const pictureUrl = "/public/imgs/fcoullou.jpg";
const testLogin = "Chatou";
const testEmail = "user123@example.com";

export function Profile(): HTMLElement {
    const main = el("main", "p-4");
    const section = el("section", "grid grid-cols-1 grid-rows-1 md:grid-cols-2 grid-rows-2 gap-6");

    const picture = el("img", `
    mix-blend-multiply mx-auto grayscale contrast-250 hover:contrast-170
    transition-all duration-500 backdrop-blur-xs block
    [mask-image:url('/public/imgs/trame2.png')]
    [-webkit-mask-image:url('/public/imgs/trame2.png')]
    [mask-repeat:no-repeat] [-webkit-mask-repeat:no-repeat]
    [mask-size:cover]      [-webkit-mask-size:cover]
    [mask-position:center] [-webkit-mask-position:center]
    `);
    picture.src = pictureUrl;
    picture.alt = "Profile Picture";

    const infoBox = el("div", "border-y-2 border-x-4 border-black/50 p-8 flex flex-col");
    const loginLabel = el("h1", "font-jmh w-full w-full text-8xl mb-4");
    loginLabel.append(text(`${testLogin}`));
    const emailLabel = el("h2", "font-modern-type text-3xl");
    emailLabel.append(text(`${testEmail}`));
    infoBox.append(loginLabel, emailLabel);

    const stats = el("textarea", "mt-8 p-4 border-2 border-black/50 mix-blend-multiply bg-white/70 resize-none h-48 font-ocean-type text-md");
    stats.readOnly = true;
    stats.value = "Game Statistics:\t\n\n" +
                  "Games Played:\t 42\n" +
                  "Games Won:\t 27\n" +
                  "Games Lost:\t 15\n" +
                  "Win Rate:\t 64.3%\n\n" +
                  "Achievements:\t\n" +
                  "- First Win\n" +
                  "- 10 Wins Streak\n" +
                  "- Master Player\n\n" +
                  "Recent Activity:\t\n" +
                  "- Played against User123 - Won\n" +
                  "- Played against GamerX - Lost\n" +
                  "- Played against ProGamer - Won";
    infoBox.append(stats); 

    section.append(picture, infoBox);
    main.append(section);
    return main;
}

