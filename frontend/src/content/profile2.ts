import { el, text } from "./home";
import { logout } from "../content/utils/logout.ts"; // Ajuste le chemin selon ton projet

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
    const loginLabel = el("h1", "p-4 font-jmh text-6xl mb-2");
    loginLabel.append(text(`${testLogin}`));
    const emailLabel = el("h2", "p-4 font-modern-type text-2xl mb-4");
    emailLabel.append(text(`${testEmail}`));

    infoBox.append(loginLabel, emailLabel);

    // --- Boutons ---
    const buttonsContainer = el("div", "flex gap-4 mt-4");
    
    // Log out
    const logoutButton = el("button", "px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300");
    logoutButton.textContent = "Log out";
    logoutButton.addEventListener("click", logout);

    // Supprimer compte
    const deleteButton = el("button", "px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700");
    deleteButton.textContent = "Supprimer mon compte";
    deleteButton.addEventListener("click", async () => {
        if (confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
            try {
                const res = await fetch("/api/auth/delete", {
                    method: "DELETE",
                    credentials: "include",
                });
                if (res.ok) {
                    alert("Compte supprimé avec succès");
                    logout();
                } else {
                    alert("Erreur lors de la suppression du compte");
                }
            } catch (err) {
                console.error(err);
                alert("Erreur réseau");
            }
        }
    });

    buttonsContainer.append(logoutButton, deleteButton);
    infoBox.append(buttonsContainer);

    const stats = el("textarea", `p-4 m-4 border-2 border-black/50 bg-white/70 resize-none h-full font-ocean-type text-md`);
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
