import { el, text } from "./home";
import { getRouteTail } from "../router";
import { getUserDatas } from "../content/utils/todb.ts";
import type { User } from "../content/utils/types.ts";
import { logout } from "../content/utils/logout.ts";
import { deleteAccount } from "./utils/deleteAccount.ts";

const pictureUrl = "/public/imgs/fcoullou.jpg";
const testLogin = "Chatou";
const testEmail = "user123@example.com";

export function Profile(): HTMLElement {
    const main = el("main", "p-4");
    const section = el("section", "grid grid-cols-1 md:grid-cols-2 gap-6");

    const picframe = el("div", "frame-photo");
    const picture = el("img", "frame-photo-img img-newspaper");
    picture.src = pictureUrl;
    picframe.append(picture);

    const infoBox = el("div", "frame-photo p-9 flex flex-col");

    const loginLabel = el("h1", "p-4 font-jmh w-full text-8xl mb-4");
    loginLabel.append(text(`${testLogin}`));
    const emailLabel = el("h2", "p-4 font-modern-type text-3xl mb-4");
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

    // --- Bouton Logout ---
    const logoutBtn = el(
        "button",
        "ml-auto mt-2 mr-2 text-black/60 hover:text-black/80 font-modern-type text-xl underline underline-offset-4 transition"
    );
    logoutBtn.append(text("Logout"));
    logoutBtn.addEventListener("click", () => {
        logout();
    });
    infoBox.append(logoutBtn);

    // --- Bouton Supprimer compte (DA similaire à Logout) ---
    const deleteButton = el(
        "button",
        "ml-auto mt-2 mr-2 text-grey-600 hover:text-red-800 font-modern-type text-xl underline underline-offset-4 transition"
    );
    deleteButton.append(text("Supprimer mon compte"));
    deleteButton.onclick = async () => {
        const sure = confirm("Cette action est irréversible. Voulez-vous vraiment supprimer votre compte ?");
        if (!sure) return;

        const ok = await deleteAccount();
        if (ok) {
            window.location.href = "/#/login";
        } else {
            alert("Impossible de supprimer le compte.");
        }
    };
    infoBox.append(deleteButton);

    section.append(picframe, infoBox);
    main.append(section);

    return main;
}
