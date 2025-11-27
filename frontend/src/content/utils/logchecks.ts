import { el, text } from "../home";
import { logout } from "./logout";

export async function notLoggedIn(): Promise<boolean> {
    try {
        const response = await fetch(`/api/auth/loggedIn`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });
        const data = await response.json();

        if (response.ok) {
            return data as boolean;
        } else {
            return true;
        }
    } catch (error) {
        console.error("Profile fetch error:", error);
        pongAlert(`An error occurred: ${error instanceof Error ? error.message : 'Network error'}`, { title: "Profile Fetch Error" });
        throw error;
    }
}

export const closeOverlay = () => {
    alertOverlay!.classList.add("hidden");
    document.body.classList.remove("no-scroll");
};


export function redirectToLogin() {
    
    // createRouter("app", route: { "/login": LoginPage });
}

type AlertOptions = {
    title: string;
    onClose?: () => void; // in milliseconds
};

let alertOverlay: HTMLDivElement | null = null;
let alertBox: HTMLDivElement | null = null;
let alertTitle: HTMLDivElement | null = null;
let alertMessage: HTMLParagraphElement | null = null;
let alertButton: HTMLButtonElement | null = null;

function createAlertBox() {
    if (alertOverlay) return;

    const overlay = el("div", "alert-overlay hidden") as HTMLDivElement;
    const box = el("div", "alert-box") as HTMLDivElement;
    const title = el("div", "alert-title") as HTMLDivElement;
    const message = el("p", "alert-message") as HTMLParagraphElement;
    const button = el("button", "alert-button") as HTMLButtonElement;

    button.type = "button";
    button.textContent = "OK";

    box.append(title, message, button);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    alertOverlay = overlay;
    alertBox = box;
    alertTitle = title;
    alertMessage = message;
    alertButton = button;

}

export function pongAlert(mess: string, options?: AlertOptions): void {
    createAlertBox();

    if (!alertOverlay || !alertBox || !alertTitle || !alertMessage || !alertButton) return;

    const title = options && options.title ? options.title : "Alert";

    alertTitle.textContent = title;
    alertMessage.textContent = mess;

    alertOverlay.classList.remove("hidden");

    const viewportCenterY = window.scrollY + window.innerHeight / 2;
    alertBox.style.position = "absolute";
    alertBox.style.left = "50%";
    alertBox.style.top = `${viewportCenterY}px`;
    alertBox.style.transform = "translate(-50%, -50%)";

    document.body.classList.add("no-scroll");

    const handleClick = (): void => {
        alertOverlay!.classList.add("hidden");
        document.body.classList.remove("no-scroll");
        if (alertButton) {
            alertButton.onclick = null;
        }
        if (options && options.onClose) {
            options.onClose();
        }
    }
    alertButton.onclick = handleClick;
}


let reInputLogin: HTMLInputElement | null = null;
let reInputPassword: HTMLInputElement | null = null;
let reInput2FA: HTMLInputElement | null = null;
let reSubmitButton: HTMLButtonElement | null = null;
let reOr: HTMLDivElement | null = null;
let reRegisterButton: HTMLButtonElement | null = null;


function createReLogAlertBox() {
    if (alertOverlay) return;

    const overlay = el("div", "alert-overlay whitespace-pre-line hidden") as HTMLDivElement;
    const box = el("div", "alert-box") as HTMLDivElement;
    const title = el("div", "alert-title") as HTMLDivElement;
    const inputLogin = el("input", "btn-input") as HTMLInputElement;
    const inputPassword = el("input", "btn-input") as HTMLInputElement;
    const submitButton = el("button", "alert-button") as HTMLButtonElement;
    const input2FA = el("input", "btn-input hidden") as HTMLInputElement;
    const or = el("div", "alert-title text-center text-base my-2", text("OR"));
    const googleSignIn = el("button", "alert-button") as HTMLButtonElement;
    const registerButton = el("button", "alert-button") as HTMLButtonElement;

    inputLogin.type = "text";
    inputLogin.placeholder = "Login";

    inputPassword.type = "password";
    inputPassword.placeholder = "Password";

    submitButton.type = "button";
    submitButton.textContent = "Log In";

    input2FA.type = "text";
    input2FA.placeholder = "Submit 2FA";

    googleSignIn.type = "button";
    googleSignIn.textContent = "Sign in with Google";
    googleSignIn.onclick = () => {
        window.location.href = "/api/auth/google";
    };

    registerButton.type = "button";
    registerButton.textContent = "Register";
    registerButton.onclick = () => {
        closeOverlay();
        window.location.href = "#/login";
    };

    box.append(title, inputLogin, inputPassword, input2FA, submitButton, or, googleSignIn, or, registerButton);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    alertOverlay = overlay;
    alertBox = box;
    alertTitle = title;
    reInputLogin = inputLogin;
    reInputPassword = inputPassword;
    reSubmitButton = submitButton;
    reInput2FA = input2FA;
    reOr = or;
    reRegisterButton = registerButton;
}

export function reLogAlert(message?: string): void {
    createReLogAlertBox();
    
    if (!alertOverlay || !alertBox || !alertTitle || !reInputLogin || !reInputPassword || !reInput2FA || !reSubmitButton) return;
    if (message) {
        alertTitle!.textContent = message;
    } else {
        alertTitle.textContent = `Session Expired.
        Please log in again.`;
    }

    reInputLogin.value = "";
    reInputPassword.value = "";
    reInput2FA.value = "";
    reInput2FA.classList.add("hidden");
    delete reInput2FA.dataset.userId;
    reSubmitButton.textContent = "Log In";
    reSubmitButton.disabled = false;

    alertOverlay.classList.remove("hidden");

    const viewportCenterY = window.scrollY + window.innerHeight / 2;
    alertBox.style.position = "absolute";
    alertBox.style.left = "50%";
    alertBox.style.top = `${viewportCenterY}px`;
    alertBox.style.transform = "translate(-50%, -50%)";

    document.body.classList.add("no-scroll");

    const handleSubmit = async (): Promise<void> => {
        try {
            // reSubmitButton!.disabled = true;
            // If 2FA input is visible, verify 2FA
            if (!reInput2FA!.classList.contains("hidden")) {
                reOr!.classList.add("hidden");
                reRegisterButton!.classList.add("hidden");
                
                const code = reInput2FA!.value.trim();
                const userId = reInput2FA!.dataset.userId;
                if (!code || !userId) {
                    pongAlert("Please enter the 2FA code.");
                    reSubmitButton!.disabled = false;
                    return;
                }
                const resp = await fetch("/api/auth/verify-2fa", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId, code }),
                    credentials: "include"
                });
                const data = await resp.json().catch(() => ({}));
                if (resp.ok) {
                    pongAlert("2FA verified! Login successful.");
                    closeOverlay();
                    window.location.reload();
                } else {
                    closeOverlay();
                    reLogAlert(`Wrong 2FA code.
                        Please try again.`);
                    reSubmitButton!.disabled = false;
                }
                return;
            }

            // Phase login
            const username = reInputLogin!.value.trim();
            const password = reInputPassword!.value;
            if (!username || !password) {
                pongAlert("Please fill in all fields.");
                reSubmitButton!.disabled = false;
                return;
            }

            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
                credentials: "include"
            });
            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                // server asks for 2FA (same behavior as login.ts)
                reInput2FA!.classList.remove("hidden");
                reInput2FA!.dataset.userId = data.data?.userId ?? "";
                reInput2FA!.focus();
                reSubmitButton!.textContent = "Submit";
                pongAlert(`Login successful! Please enter your 2FA code.`);
            } else {
                closeOverlay();
                reLogAlert(`Wrong Credentials.
                    Please try again.`);
                reSubmitButton!.disabled = false;
            }
        } catch (err) {
            console.error("reLogAlert submit error:", err);
            pongAlert(`An error occurred: ${err instanceof Error ? err.message : 'Network error'}`);
            reSubmitButton!.disabled = false;
        }
    };

    // attach handler (remove previous to avoid duplicates)
    reSubmitButton.onclick = handleSubmit;
    // allow Enter on inputs to trigger submit
    [reInputLogin, reInputPassword, reInput2FA].forEach((inp) => {
        if (!inp) return;
        inp.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(); } };
    });
}
