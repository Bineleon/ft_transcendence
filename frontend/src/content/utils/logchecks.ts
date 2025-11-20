import { el } from "../home";

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
            return false;
        }
    } catch (error) {
        console.error("Profile fetch error:", error);
        pongAlert(`An error occurred: ${error instanceof Error ? error.message : 'Network error'}`, { title: "Profile Fetch Error" });
        throw error;
    }
    // return false;
}

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