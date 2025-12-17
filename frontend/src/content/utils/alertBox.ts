import { el } from "../home";
import type { PlayerInfo } from "../pong/game/uiTypes";
import { getUserDatas } from "./todb";
import type { Tournament } from "../tournament/uiTypes";
import { apiFetch } from "./apiFetch";

///////////////     WRAPPERS     ////////////////////
export const closeOverlay = (overlay: HTMLDivElement) => {
  overlay.classList.add("hidden");
  document.body.classList.remove("no-scroll");
};

export async function matchAlert(mode: "sync" | "guest"): Promise<PlayerInfo | null> {
  if (mode === "guest") {
    const res = await runAuthBox("M_GUEST");
    if (res && res.kind === "guest") {
      // guard with 'in' so TS sait que userName est présent, fallback to nested shapes
      const userName =
        ("userName" in res && typeof (res as any).userName === "string")
          ? (res as any).userName
          : (res as any).user?.username ?? (res as any).user?.userName;
      if (userName) return { userName, avatarUrl: "/imgs/avatar.png" };
    }
    return null;
  }

  const res = await runAuthBox("M_SYNC");
  if (res && res.kind === "logged") {
    const userName =
      ("userName" in res && typeof (res as any).userName === "string")
        ? (res as any).userName
        : (res as any).user?.username ?? (res as any).user?.userName;
    if (userName) return { userName };
  }
  return null;
}

// ---------------------------------------------------- //
//              Simple PONG ALERT                       //
// ---------------------------------------------------- //
// ALERT SIMPLE (message + bouton)
type AlertOptions = {
  title?: string;
  onClose?: () => void; // in milliseconds
  where?: string;
};

type AlertKind = "info" | "error" | "success";

type PongAlertDOM = {
  overlay: HTMLDivElement;
  box: HTMLDivElement;
  title: HTMLDivElement;
  message: HTMLParagraphElement;
  button: HTMLButtonElement;
  closeBtn?: HTMLButtonElement;
};
let pongAlertDOM: PongAlertDOM | null = null;

type AliasAlertDOM = {
  overlay: HTMLDivElement;
  box: HTMLDivElement;
  title: HTMLDivElement;
  message: HTMLParagraphElement;
  inputAlias: HTMLInputElement;
  button: HTMLButtonElement;
  closeBtn?: HTMLButtonElement;
};
let aliasAlertDOM: AliasAlertDOM | null = null;

function createPongAlertDOM(): PongAlertDOM {
  if (pongAlertDOM) return pongAlertDOM;

  const overlay = el("div", "alert-overlay hidden z-index-10") as HTMLDivElement;
  const box = el("div", "alert-box z-index-10") as HTMLDivElement;
  const title = el("div", "alert-title z-index-10") as HTMLDivElement;
  const message = el("p", "alert-message z-index-10") as HTMLParagraphElement;
  const button = el("button", "alert-button z-index-10") as HTMLButtonElement;
  const closeBtn = el("button", "alert-close-button z-index-10") as HTMLButtonElement;
  closeBtn.textContent = "✕";
  button.textContent = "OK";
  closeBtn.onclick = () => { closeOverlay(overlay); };
  box.append(closeBtn, title, message, button);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  pongAlertDOM = { overlay, box, title, message, button, closeBtn };
  return pongAlertDOM;
}

function createAliasAlertDOM(): AliasAlertDOM {
  if (aliasAlertDOM) return aliasAlertDOM;

  const overlay = el("div", "alert-overlay hidden z-index-10") as HTMLDivElement;
  const box = el("div", "alert-box z-index-10") as HTMLDivElement;
  const title = el("div", "alert-title z-index-10") as HTMLDivElement;
  const message = el("p", "alert-message z-index-10") as HTMLParagraphElement;
  const inputAlias = el("input", "btn-input mt-4") as HTMLInputElement;
  const button = el("button", "alert-button z-index-10") as HTMLButtonElement;
  const closeBtn = el("button", "alert-close-button z-index-10") as HTMLButtonElement;
  closeBtn.textContent = "✕";
  button.textContent = "OK";

  inputAlias.type = "text";
  inputAlias.placeholder = "Enter your alias";
  inputAlias.value = "";
  inputAlias.classList.remove("hidden");


  closeBtn.onclick = () => { closeOverlay(overlay); };
  box.append(closeBtn, title, message, inputAlias, button);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  aliasAlertDOM = { overlay, box, title, message, inputAlias, button, closeBtn };
  return aliasAlertDOM;
}

export function pongAlert(mess: string, kind?: AlertKind, options?: AlertOptions): void {
  const { overlay, title, message, button } = createPongAlertDOM();
  
  title.textContent = kind ?? "- Pong Alert -";
  message.textContent = mess;

  overlay.classList.remove("hidden");

  button.onclick = () => {
    closeOverlay(overlay);
    if (options?.where) {
      window.location.hash = options.where;
    }
    if (options?.onClose) {
      options.onClose();
    }
  };
}

export function aliasBox(mess: string, kind?: AlertKind, options?: AlertOptions): string | void {
  const { overlay, title, message, inputAlias, button } = createAliasAlertDOM();

  title.textContent = kind ?? "- Pong Alert -";
  message.textContent = mess;

  inputAlias.classList.remove("hidden");
  overlay.classList.remove("hidden");

  button.onclick = () => {
    closeOverlay(overlay);
    if (options?.where) {
      window.location.hash = options.where;
    }
    if (options?.onClose) {
      options.onClose();
    }
  };
  return inputAlias.value;
}


// ---------------------------------------------------- //
//              Auth Multi Modes AlertBOX               //
// ---------------------------------------------------- //
export type AuthMode =
  | "LOGIN"
  | "M_SYNC"
  | "M_GUEST"
  | "JOIN";

export type AuthResult =
  | { kind: "logged"; userName: string; }
  | { kind: "guest"; id?: string; userName?: string; avatarUrl?: string; }
  | { kind: "sync"; id?: string; userName?: string; avatarUrl?: string; }
  | { kind: "join"; userName: string; }
  | { kind: "cancel" }
  | { kind: "unregister"; userName: string; };

type AuthDom = {
  overlay: HTMLDivElement;
  box: HTMLDivElement;
  title: HTMLDivElement;

  inputGuest: HTMLInputElement;
  inputLogin: HTMLInputElement;
  inputPassword: HTMLInputElement;
  input2FA: HTMLInputElement;

  submitBtn: HTMLButtonElement;
  altBtn: HTMLButtonElement;
  googleBtn: HTMLButtonElement;
  closeBtn: HTMLButtonElement;
};
let authDom: AuthDom | null = null;

function createAuthDOMs(): AuthDom {
  if (authDom) return authDom;

  const overlay = el("div", "alert-overlay whitespace-pre-line hidden") as HTMLDivElement;
  const box = el("div", "alert-box") as HTMLDivElement;

  const title = el("div", "alert-title") as HTMLDivElement;

  const inputGuest = el("input", "btn-input") as HTMLInputElement;
  inputGuest.type = "text";
  inputGuest.placeholder = "Guest Name";

  const inputLogin = el("input", "btn-input") as HTMLInputElement;
  inputLogin.type = "text";
  inputLogin.placeholder = "Login";

  const inputPassword = el("input", "btn-input") as HTMLInputElement;
  inputPassword.type = "password";
  inputPassword.placeholder = "Password";

  const input2FA = el("input", "btn-input hidden") as HTMLInputElement;
  input2FA.type = "text";
  input2FA.placeholder = "2FA Code";

  const submitBtn = el("button", "alert-button") as HTMLButtonElement;
  submitBtn.type = "button";
  submitBtn.textContent = "Submit";

  const altBtn = el("button", "alert-button hidden") as HTMLButtonElement;
  altBtn.type = "button";
  altBtn.textContent = "Alternative";

  const googleBtn = el("button", "alert-button hidden") as HTMLButtonElement;
  googleBtn.type = "button";
  googleBtn.textContent = "Sign in with Google";

  const closeBtn = el("button", "alert-close") as HTMLButtonElement;
  closeBtn.type = "button";
  closeBtn.textContent = "✕";

  box.append(
    closeBtn,
    title,
    inputGuest,
    inputLogin,
    inputPassword,
    input2FA,
    submitBtn,
    altBtn,
    googleBtn
  );
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  authDom = {
    overlay,
    box,
    title,
    inputGuest,
    inputLogin,
    inputPassword,
    input2FA,
    submitBtn,
    altBtn,
    googleBtn,
    closeBtn,
  };

  return authDom;
}

type AuthBehavior = "guest" | "login" | "sync" | "join";

interface AuthUiConfig {
  title: string;
  showGuestInput: boolean;
  showLoginInputs: boolean;
  show2FA: boolean;
  showGoogleBtn: boolean;
  showAltBtn: boolean;
  submitLabel: string;
  altLabel?: string;
  behavior: AuthBehavior;
}

const AUTH_CONFIG: Record<AuthMode, AuthUiConfig> = {
  LOGIN: {
    title: "Log in to your account",
    showGuestInput: false,
    showLoginInputs: true,
    show2FA: false,
    showGoogleBtn: true,
    showAltBtn: false,
    submitLabel: "Log In",
    behavior: "login",
  },
  M_SYNC: {
    title: "Sync your profile for this match",
    showGuestInput: false,
    showLoginInputs: true,
    show2FA: false,
    showGoogleBtn: false,
    showAltBtn: false,
    submitLabel: "Sync Profile",
    behavior: "sync",
  },
  M_GUEST: {
    title: "Play as Guest",
    showGuestInput: true,
    showLoginInputs: false,
    show2FA: false,
    showGoogleBtn: false,
    showAltBtn: false,
    submitLabel: "Play as Guest",
    behavior: "guest",
  },
  JOIN: {
    title: "Join the tournament",
    showGuestInput: false,
    showLoginInputs: true,
    show2FA: false,
    showGoogleBtn: false,
    showAltBtn: false,
    submitLabel: "Submit",
    behavior: "join",
  }
};

function setupAuthUi(mode: AuthMode, dom: AuthDom): AuthUiConfig {
  const config = AUTH_CONFIG[mode];

  dom.title.textContent = config.title;

  dom.inputGuest.classList.toggle("hidden", !config.showGuestInput);
  dom.inputLogin.classList.toggle("hidden", !config.showLoginInputs);
  dom.inputPassword.classList.toggle("hidden", !config.showLoginInputs);
  dom.input2FA.classList.toggle("hidden", !config.show2FA);

  dom.googleBtn.classList.toggle("hidden", !config.showGoogleBtn);

  dom.submitBtn.textContent = config.submitLabel;
  dom.submitBtn.disabled = false;

  dom.altBtn.textContent = config.altLabel ?? "";
  dom.altBtn.classList.toggle("hidden", !config.showAltBtn);

  dom.overlay.classList.remove("hidden");

  return config;
}

type RunAuthBoxOptions = { tournament?: Tournament, tCode?: string, onClick?: () => void };

export function runAuthBox(mode: AuthMode, options?: RunAuthBoxOptions): Promise<AuthResult> {
  return new Promise((resolve) => {
    const dom = createAuthDOMs();
    const config = setupAuthUi(mode, dom);
    const tCode = options?.tCode ?? null;
    const t = options?.tournament ?? null;

    let currentUserId: string | null = null;
    let currentLogin: string | null = null;

    // comportement au Click ( login / guest / join / sync )
    let handleSubmitBehavior: AuthBehavior = config.behavior;

    function finish(result: AuthResult): void {
      closeOverlay(dom.overlay);
      resolve(result);
    }

    dom.inputGuest.value = "";
    dom.inputLogin.value = "";
    dom.inputPassword.value = "";
    dom.input2FA.value = "";

    dom.closeBtn.onclick = () => { finish({ kind: "cancel" }); };
    dom.googleBtn.onclick = () => { window.location.href = "/api/auth/google"; };

    // ✅ helper LOCAL : join tournoi via bearer (nolog token)
    async function joinTournamentBearer(code: string, bearerToken: string) {
      const resp = await apiFetch(`/api/tournaments/${code}/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
        credentials: "include",
      });

      const json = await resp.json().catch(() => null);

      if (!resp.ok || !json?.success) {
        throw new Error(json?.error?.message || json?.message || "Failed to join tournament");
      }
    }

    dom.submitBtn.onclick = async () => {
      try {
        dom.submitBtn.disabled = true;
        const twoFAVisible = !dom.input2FA.classList.contains("hidden");

        console.log("SubmitBehavior:", handleSubmitBehavior, "TwoFAVisible:", twoFAVisible, "Mode:", mode);

        // 1) M_GUEST
        if (handleSubmitBehavior === "guest") {
          const guestName = dom.inputGuest.value.trim();
          if (!guestName) {
            pongAlert("Please enter a guest name.", "error");
            dom.submitBtn.disabled = false;
            return;
          }
          finish({ kind: "guest", userName: guestName });
          return;
        }

        // 2) MATCH SYNC - (inchangé)
        if (handleSubmitBehavior === "sync") {
          dom.googleBtn.classList.add("hidden");

          const userName = dom.inputLogin.value.trim();
          if (!userName) {
            pongAlert("Please enter your login to sync.", "error");
            dom.submitBtn.disabled = false;
            return;
          }
          const password = dom.inputPassword.value;
          if (!password) {
            pongAlert("Please enter your password to sync.", "error");
            dom.submitBtn.disabled = false;
            return;
          }

          const resp = await apiFetch("/api/auth/login/nolog", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: userName, password }),
            credentials: "include",
          });

          const data = await resp.json();

          if (!resp.ok) {
            const msg = data.error?.message || data.message || "Login failed";
            pongAlert(msg, "error");
            dom.submitBtn.disabled = false;
			closeOverlay(dom.overlay);
            return;
          }

          currentLogin = userName;

          console.log("Sync profile for logged user:", currentLogin);
          const user = await getUserDatas(currentLogin).catch(() => null);
          const avatarUrl = user?.data.user.avatarUrl || "/imgs/avatar.png";
		  const id = user?.data.user.id || "";
          finish({ kind: "sync", id, userName, avatarUrl });
          return;
        }

        // 3) LOGIN (inchangé)
        if (handleSubmitBehavior === "login" && !twoFAVisible) {
          const username = dom.inputLogin.value.trim();
          const password = dom.inputPassword.value;
          if (!username || !password) {
            pongAlert("Please fill in all fields.", "error");
            dom.submitBtn.disabled = false;
            return;
          }

          const resp = await apiFetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
            credentials: "include",
          });

          const data = await resp.json();

          if (resp.ok) {
            currentLogin = username;
            currentUserId = data.data?.userId ?? null;
            dom.input2FA.classList.remove("hidden");
            dom.submitBtn.textContent = "Verify 2FA";
            pongAlert("Login successful! Please enter your 2FA code sent by email.", "info");
            dom.submitBtn.disabled = false;
            return;
          }

          const msg = data.error?.message || data.message || "Login failed";
          pongAlert(msg, "error");
          dom.submitBtn.disabled = false;
          return;
        }

        // 3bis) LOGIN 2FA (inchangé)
        if (handleSubmitBehavior === "login" && twoFAVisible) {
          const code = dom.input2FA.value.trim();
          if (!code || !currentUserId) {
            pongAlert("Missing 2FA code or userId.", "error");
            dom.submitBtn.disabled = false;
            return;
          }

          const verifyResp = await apiFetch("/api/auth/verify-2fa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUserId, code }),
            credentials: "include",
          });

          const verifyData = await verifyResp.json();
          if (!verifyResp.ok) {
            const msg = verifyData.error?.message || verifyData.message || "Invalid 2FA code";
            pongAlert(msg, "error");
            dom.submitBtn.disabled = false;
            return;
          }
          finish({ kind: "logged", userName: currentLogin || "Player" });
          return;
        }

        // =========================================================
        // ✅ 4) JOIN - PHASE 1 (MODIFIÉ UNIQUEMENT ICI)
        // - utilise /api/auth/login/nolog
        // - si requires2FA=false => join direct via Bearer token
        // - si requires2FA=true => afficher input2FA
        // =========================================================
        if (handleSubmitBehavior === "join" && !twoFAVisible) {
          dom.googleBtn.classList.add("hidden");

          if (!tCode) {
            pongAlert("Tournament code missing.", "error");
            dom.submitBtn.disabled = false;
            return;
          }

          const username = dom.inputLogin.value.trim();
          const password = dom.inputPassword.value;
          if (!username || !password) {
            pongAlert("Please fill in all fields.", "error");
            dom.submitBtn.disabled = false;
            return;
          }

          const resp = await apiFetch("/api/auth/login/nolog", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
            credentials: "include",
          });

          const data = await resp.json().catch(() => null);

          if (!resp.ok || !data?.success) {
            const msg = data?.error?.message || data?.message || "Login failed";
            pongAlert(msg, "error");
            dom.submitBtn.disabled = false;
            return;
          }

          currentLogin = username;

          // ✅ 2FA DISABLED => backend must return token directly
          if (data?.data?.requires2FA === false) {
            const token = data?.data?.token as string | undefined;
            if (!token) {
              pongAlert("Missing token from login/nolog.", "error");
              dom.submitBtn.disabled = false;
              return;
            }

            try {
              await joinTournamentBearer(tCode, token);
              finish({ kind: "join", userName: username });
            } catch (err) {
              console.error("Join as new (nolog no2fa) error:", err);
              pongAlert(
                `Failed to add player to tournament: ${err instanceof Error ? err.message : "An unexpected error occurred"}`,
                "error"
              );
              dom.submitBtn.disabled = false;
            }
            return;
          }

          // ✅ 2FA REQUIRED => show input
          currentUserId = data?.data?.userId ?? null;
          dom.input2FA.classList.remove("hidden");
          dom.submitBtn.textContent = "Verify 2FA";
          pongAlert("Login successful! Please enter your 2FA code sent by email.", "info");
          dom.submitBtn.disabled = false;
          return;
        }

        // =========================================================
        // ✅ 4bis) JOIN - PHASE 2 (MODIFIÉ UNIQUEMENT ICI)
        // - verify-2fa/nolog -> token
        // - join via Bearer token
        // =========================================================
        if (handleSubmitBehavior === "join" && twoFAVisible) {
          dom.googleBtn.classList.add("hidden");

          if (!tCode) {
            pongAlert("Tournament code missing.", "error");
            dom.submitBtn.disabled = false;
            return;
          }

          const code = dom.input2FA.value.trim();
          if (!code || !currentUserId) {
            pongAlert("Missing 2FA code or userId.", "error");
            dom.submitBtn.disabled = false;
            return;
          }

          const verifyResp = await apiFetch("/api/auth/verify-2fa/nolog", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUserId, code }),
            credentials: "include",
          });

          const verifyData = await verifyResp.json().catch(() => null);
          if (!verifyResp.ok || !verifyData?.success) {
            const msg = verifyData?.error?.message || verifyData?.message || "Invalid 2FA code";
            pongAlert(msg, "error");
            dom.submitBtn.disabled = false;
            return;
          }

          const token = verifyData?.data?.token as string | undefined;
          if (!token) {
            pongAlert("Missing token from verify-2fa/nolog.", "error");
            dom.submitBtn.disabled = false;
            return;
          }

          try {
            await joinTournamentBearer(tCode, token);
            finish({ kind: "join", userName: currentLogin || "Player" });
          } catch (err) {
            console.error("Join as new (nolog 2fa) error:", err);
            pongAlert(
              `Failed to add player to tournament: ${err instanceof Error ? err.message : "An unexpected error occurred"}`,
              "error"
            );
            dom.submitBtn.disabled = false;
          }
          return;
        }

        console.warn("Unhandled auth flow case.", { handleSubmitBehavior, mode });
        dom.submitBtn.disabled = false;
      } catch (err) {
        console.error("runAuthBox error:", err);
        pongAlert("An error occurred. Please try again.", "error");
        dom.submitBtn.disabled = false;
      }
    };

    dom.altBtn.onclick = () => {
      if (mode === "JOIN") {
        dom.inputGuest.classList.add("hidden");
        dom.inputLogin.classList.remove("hidden");
        dom.inputPassword.classList.remove("hidden");
        dom.input2FA.classList.add("hidden");
        dom.altBtn.classList.add("hidden");
        dom.submitBtn.textContent = "Submit";

        handleSubmitBehavior = "join";
        dom.submitBtn.disabled = false;
        return;
      }
    };
  });
}
