import { el, text } from "../home.ts";
import { apiFetch } from "./apiFetch";
import { getLoggedName, notLoggedIn } from "./todb.ts";

let _bound = false;

export function logUI() {
    const container = document.getElementById("user-status");
    // container?.classList.add("grid", "items-center", "grid-cols-2");
    if (!container) return;

    let logStatus = container.querySelector(".user-status-span") as HTMLSpanElement | null;
    let logBtn = container.querySelector(".user-status-logout") as HTMLButtonElement | null;

    if (!logStatus || !logBtn) {
        container.innerHTML = ""; // nettoie tout ce qui pourrait trainer
        container.classList.add("grid", "items-center", "grid-cols-2");

        logStatus = el("span", "user-status-span justify-self-start article-xs text-sm") as HTMLSpanElement;
        logBtn = el("button", "user-status-logout article-xs article-link justify-self-end text-sm cursor-pointer") as HTMLButtonElement;

        container.append(logStatus, logBtn);
    }
    notLoggedIn().then(async (isNotLogged) => {
        if (!logStatus || !logBtn) return;

        const newBtn = logBtn.cloneNode(true) as HTMLButtonElement;
        logBtn.replaceWith(newBtn);
        logBtn = newBtn;
    
        if (isNotLogged) {
            logStatus.textContent = "Not logged in";
            logBtn.textContent = "Log In";
            logBtn.onclick = () => { window.location.hash = "#/login"; };
        } else {
            const userName = await getLoggedName();
            const prompt = el("span", "", text("Logged in as "));
            const nameLink = el("a", "article-link cursor-pointer decoration-1 decoration-wavy", text(userName)) as HTMLAnchorElement;
            logStatus.onclick = () => { window.location.hash = `#/profile`; };
            logStatus.replaceChildren(prompt, nameLink);
            logBtn.textContent = "Log Out";
            logBtn.classList.add("hover:text-red-200");
            logBtn.onclick = async () => {
                try {
                    await apiFetch("/api/auth/logout", { method: "POST", credentials: "include" });
                } catch (error) {
                    console.error("Logout error:", error);
                }
                sessionStorage.clear();
                window.location.reload();
                // window.location.hash = "#/";
            };
        }
    }).catch((error) => {
        console.error("Error checking login status:", error);
    });

    if (!_bound) {
        _bound = true;
        window.addEventListener("auth-changed", () => logUI());
    }
}