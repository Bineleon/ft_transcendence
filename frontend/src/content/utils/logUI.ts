import { el, text } from "../home.ts";
import { apiFetch } from "./apiFetch";

let _bound = false;

export function logUI() {
  const container = document.getElementById("user-status");
  if (!container) return;

  let logStatus = container.querySelector(".user-status-span") as HTMLSpanElement | null;
  let logBtn = container.querySelector(".user-status-logout") as HTMLButtonElement | null;

  if (!logStatus || !logBtn) {
    container.innerHTML = "";
    container.classList.add("grid", "items-center", "grid-cols-2");

    logStatus = el("span", "user-status-span justify-self-start article-xs text-sm") as HTMLSpanElement;
    logBtn = el("button", "user-status-logout article-xs article-link justify-self-end text-sm cursor-pointer") as HTMLButtonElement;

    container.append(logStatus, logBtn);
  }

  // ✅ important : nettoyer les vieux handlers AVANT d’en remettre
  const freshBtn = logBtn.cloneNode(true) as HTMLButtonElement;
  logBtn.replaceWith(freshBtn);
  logBtn = freshBtn;

  // ✅ état par défaut : non loggé
  logStatus.textContent = "Not logged in";
  logStatus.onclick = null;

  logBtn.textContent = "Log In";
  logBtn.classList.remove("hover:text-red-200");
  logBtn.onclick = () => {
    window.location.hash = "#/login";
  };

  // ✅ check auth silencieux (ne casse pas les pages publiques)
  (async () => {
    try {
      const res = await apiFetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) return;

      const body = await res.json();
      const user = body?.data?.user;
      const username = user?.username;
      if (!username) return;

      // ✅ logged in UI
      const prompt = el("span", "", text("Logged in as "));
      const nameLink = el(
        "a",
        "article-link cursor-pointer decoration-1 decoration-wavy",
        text(username)
      ) as HTMLAnchorElement;

      logStatus.replaceChildren(prompt, nameLink);
      logStatus.onclick = () => {
        window.location.hash = "#/profile";
      };

      logBtn.textContent = "Log Out";
      logBtn.classList.add("hover:text-red-200");
      logBtn.onclick = async () => {
        try {
          await apiFetch("/api/auth/logout", { method: "POST", credentials: "include" });
        } catch (e) {
          console.error("Logout error:", e);
        }
        sessionStorage.clear();
        window.location.reload();
      };
    } catch (e) {
      console.error("logUI silent auth check failed:", e);
    }
  })();

  if (!_bound) {
    _bound = true;
    window.addEventListener("auth-changed", () => logUI());
  }
}
