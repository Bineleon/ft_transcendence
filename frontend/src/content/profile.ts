import { el, text } from "./home";

const pictureUrl = "/public/imgs/fcoullou.jpg";
const testLogin = "Chatou";
const testEmail = "user123@example.com";

export function Profile(): HTMLElement {
    const main = el("main", "p-4");
    const section = el("section", "grid grid-cols-1 grid-rows-1 md:grid-cols-2 grid-rows-2 gap-6");

    const picframe = el("div", "frame-photo");
    const picture = el("img", "frame-photo-img img-newspaper");
    picture.src = pictureUrl;
    picframe.append(picture);

    const infoBox = el("div", "frame-photo p-9 flex flex-col");
    const loginLabel = el("h1", "p-4 font-jmh w-full w-full text-8xl mb-4");
    loginLabel.append(text(`${testLogin}`));
    const emailLabel = el("h2", "p-4 font-modern-type text-3xl");
    emailLabel.append(text(`${testEmail}`));
    infoBox.append(loginLabel, emailLabel);

    const stats = el("textarea", `p-4 m-4 border-2 border-black/50 mix-blend-multiply
        bg-white/70 resize-none h-full font-ocean-type text-md`);
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

    section.append(picframe, infoBox);
    main.append(section);
    return main;
}

