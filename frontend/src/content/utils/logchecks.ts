import { el } from "../home";

export function notLoggedIn(): boolean {
    // Placeholder function to check if the user is logged in
    // Replace with actual authentication logic
    return false;
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