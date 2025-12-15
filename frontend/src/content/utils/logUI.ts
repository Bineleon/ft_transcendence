import { el, text } from "../home.ts";
import { apiFetch } from "./apiFetch";
// import { getLoggedName, notLoggedIn } from "./todb.ts";

// let _bound = false;

export async function logUI() {
    const container = document.getElementById("user-status");
    if (!container) return;

    container.innerHTML = "";
    container.classList.add("grid", "items-center", "grid-cols-2");

    const logStatus = el(
        "span",
        "user-status-span justify-self-start article-xs text-sm"
    ) as HTMLSpanElement;

    const logBtn = el(
        "button",
        "user-status-logout article-xs article-link justify-self-end text-sm cursor-pointer"
    ) as HTMLButtonElement;

    container.append(logStatus, logBtn);

    try {
        // 🔥 SOURCE DE VÉRITÉ
        const res = await apiFetch("/api/auth/publicme", {
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error("Not authenticated");
        }

        const data = await res.json();
        const username = data.username;

        if (!username) {
            throw new Error("No username");
        }

        // ✅ LOGGÉ
        const prompt = el("span", "", text("Logged in as "));
        const nameLink = el(
            "a",
            "article-link cursor-pointer decoration-1 decoration-wavy",
            text(username)
        ) as HTMLAnchorElement;

        nameLink.onclick = () => {
            window.location.hash = "#/profile";
        };

        logStatus.replaceChildren(prompt, nameLink);

        logBtn.textContent = "Log Out";
        logBtn.classList.add("hover:text-red-200");
        logBtn.onclick = async () => {
            try {
                await apiFetch("/api/auth/logout", {
                    method: "POST",
                    credentials: "include",
                });
            } catch (e) {
                console.error("Logout error", e);
            }
            window.location.reload();
        };
    } catch {
        // ❌ PAS LOGGÉ (cookie mort, token invalide, etc.)
        logStatus.textContent = "Not logged in";
        logBtn.textContent = "Log In";
        logBtn.onclick = () => {
            window.location.hash = "#/login";
        };
    }
}
