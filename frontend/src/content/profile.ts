import { el, text } from "./home";
// import { getRouteTail } from "../router";
// import { getUserDatas } from "../content/utils/todb.ts";
// import type { User } from "../content/utils/types.ts";

const pictureUrl = "/public/imgs/fcoullou.jpg";
const testLogin = "Chatou";
const testEmail = "user123@example.com";

// Lire l'id dans le href ou le hash
// const userName = getRouteTail("/profile");

// Creer le GET pour recuperer les infos utilisateur
// const userDatas: Promise<User> = getUserDatas(userName);

// creer la const avec les infos recuperees


export function Profile(): HTMLElement {
    const main = el("main", "p-4");
    const section = el("section", "grid grid-cols-1 grid-rows-1 md:grid-cols-2 gap-6");

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

/// Friends Section
    const friendsSection = el("div", "grid grid-cols-1 grid-rows-1 md:grid-cols-2 gap-6 mt-8");
    const list = el("div", "mx-[10%]");
    const friendsTitle = el("h2", "font-royalvogue text-4xl mb-4");
    friendsTitle.append(text("Friends"));

    const friendsList = el("ul", "relative list-disc list-inside font-modern-type text-lg");
    const friendNames = ["Alice", "Bob", "Charlie", "Diana"];
    friendNames.forEach((friend) => {
        const li = el("li", "");
        li.append(text(friend));
        friendsList.append(li);
    });
    list.append(friendsTitle, friendsList);

    const FriendsRequests = el("div", "mx-[10%]");
    const requestsTitle = el("h3", "font-royalvogue text-4xl mb-4 text-right");
    requestsTitle.append(text("Requests"));
    FriendsRequests.append(requestsTitle);

    const requestNames = ["Eve", "Frank"];
    requestNames.forEach((request) => {
        const requestDiv = el("div", "flex items-center mb-2");
        const nameSpan = el("span", "flex-1 font-modern-type text-lg");
        nameSpan.append(text(request));

        const acceptButton = el("button", "btn-click mr-2") as HTMLButtonElement;
        acceptButton.textContent = "Accept";
        const declineButton = el("button", "btn-click") as HTMLButtonElement;
        declineButton.textContent = "Decline";

        requestDiv.append(nameSpan, acceptButton, declineButton);
        FriendsRequests.append(requestDiv);
    });
    friendsSection.append(list, FriendsRequests);
    main.append(section, friendsSection);
    return main;
}

