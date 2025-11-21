import { el, text } from "./home";
import { logout } from "../content/utils/logout.ts";
import { deleteAccount } from "./utils/deleteAccount.ts";

export function Profile(): HTMLElement {
    const main = el("main", "p-4");

    // ——— Structure générale ———
    const section = el("section", "grid grid-cols-1 md:grid-cols-2 gap-6");

    // ——— Frame photo ———
    const picframe = el("div", "frame-photo");
    const picture = el("img", "frame-photo-img img-newspaper");
    picframe.append(picture);

    // ——— Info box ———
    const infoBox = el("div", "frame-photo p-9 flex flex-col");

    const loginLabel = el("h1", "p-4 font-jmh w-full text-8xl mb-4");
    const emailLabel = el("h2", "p-4 font-modern-type text-3xl mb-4");

    infoBox.append(loginLabel, emailLabel);

    const stats = el("textarea", `
        p-4 m-4 border-2 border-black/50 mix-blend-multiply
        bg-white/70 resize-none h-full font-ocean-type text-md
    `);
    stats.readOnly = true;
    infoBox.append(stats);

    // ——— Bouton Logout ———
    const logoutBtn = el(
        "button",
        "ml-auto mt-2 mr-2 text-black/60 hover:text-black/80 font-modern-type text-xl underline underline-offset-4 transition"
    );
    logoutBtn.append(text("Logout"));
    logoutBtn.onclick = () => logout();
    infoBox.append(logoutBtn);

    // ——— Bouton Delete Account (style similaire) ———
    const deleteButton = el(
        "button",
        "ml-auto mt-2 mr-2 text-red-600/60 hover:text-red-700/80 font-modern-type text-xl underline underline-offset-4 transition"
    );
    deleteButton.append(text("Supprimer mon compte"));
    deleteButton.onclick = async () => {
        const sure = confirm("Cette action est irréversible. Voulez-vous vraiment supprimer votre compte ?");
        if (!sure) return;

        const ok = await deleteAccount();
        if (ok) window.location.href = "/#/login";
        else alert("Impossible de supprimer le compte.");
    };
    infoBox.append(deleteButton);

    // ——— Assemblage section principale ———
    section.append(picframe, infoBox);
    main.append(section);

    // ——— Friends Section ———
    const friendsSection = el("div", "grid grid-cols-1 md:grid-cols-2 gap-6 mt-8");

    // Liste des amis
    const list = el("div", "mx-[10%]");
    const friendsTitle = el("h2", "font-royalvogue text-4xl mb-4");
    friendsTitle.append(text("Friends"));

    const friendsList = el("ul", "relative list-disc list-inside font-modern-type text-lg");
    list.append(friendsTitle, friendsList);

    // Demandes d'amis
    const requestsBox = el("div", "mx-[10%]");
    const requestsTitle = el("h3", "font-royalvogue text-4xl mb-4 text-right");
    requestsTitle.append(text("Requests"));
    requestsBox.append(requestsTitle);

    friendsSection.append(list, requestsBox);
    main.append(friendsSection);

    // ——— Charger dynamiquement les infos utilisateur + amis ———
    loadProfileData(picture, loginLabel, emailLabel, stats, friendsList, requestsBox);

    return main;
}

/**
 * Charge l'utilisateur connecté + ses relations depuis /api/auth/me
 */
async function loadProfileData(
    picture: HTMLImageElement,
    loginLabel: HTMLElement,
    emailLabel: HTMLElement,
    stats: HTMLTextAreaElement,
    friendsList: HTMLElement,
    requestsBox: HTMLElement
) {
    try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) throw new Error("Impossible de charger le profil");

        const data = await res.json();
        const user = data.data.user;

        // Avatar
        picture.src = user.avatarUrl || "/public/imgs/default-avatar.png";

        // Nom / email
        loginLabel.textContent = user.username;
        emailLabel.textContent = user.email;

        // Stats placeholder
        stats.value =
            "Informations du compte:\n\n" +
            `ID: ${user.id}\n` +
            `Créé le: ${new Date(user.createdAt).toLocaleString()}\n\n` +
            "Statistiques:\n" +
            "(À connecter bientôt à la DB)";

        // ——— Friends (exemple en attendant route dédiée) ———
        const fakeFriends = ["Alice", "Bob", "Charlie"];
        fakeFriends.forEach(name => {
            const li = el("li", "");
            li.append(text(name));
            friendsList.append(li);
        });

        // ——— Requests (exemple en attendant route dédiée) ———
        const fakeRequests = ["Diana", "Eric"];
        fakeRequests.forEach(name => {
            const req = el("div", "flex items-center mb-2");
            const nameSpan = el("span", "flex-1 font-modern-type text-lg");
            nameSpan.textContent = name;

            const accept = el("button", "btn-click mr-2") as HTMLButtonElement;
            accept.textContent = "Accept";

            const decline = el("button", "btn-click") as HTMLButtonElement;
            decline.textContent = "Decline";

            req.append(nameSpan, accept, decline);
            requestsBox.append(req);
        });

    } catch (err) {
        loginLabel.textContent = "Erreur";
        emailLabel.textContent = "Impossible de charger le profil";
        stats.value = "Une erreur est survenue.";
    }
}
