import { el, text } from "./home";
import { pongAlert } from "./utils/logchecks";
import { apiFetch } from "./utils/apiFetch";

export function Settings(): HTMLElement {
    const main = el("main", "p-4 max-w-xl mx-auto space-y-6");

    const title = el("h1", "font-royalvogue text-4xl mb-6 text-center");
    title.append(text("Edit Profile"));

    main.append(title);

    // Section Username
    main.append(sectionTitle("Username"));

    const usernameInput = labeledInput("New username");
    const usernameBtn = actionButton("Update username");

    usernameBtn.onclick = async () => {
        const value = usernameInput.value.trim();
        if (!value) return pongAlert("Username required");

        const res = await apiFetch("/api/users/me/username", {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: value })
        });

        const data = await res.json();

        if (data.success) pongAlert("Username updated!");
        else pongAlert(data?.error?.message || "Update failed");
    };

    main.append(usernameInput, usernameBtn);

    // Section Email
    main.append(sectionTitle("Email"));

    const emailInput = labeledInput("New email");
    const emailBtn = actionButton("Update email");

    emailBtn.onclick = async () => {
        const value = emailInput.value.trim();
        if (!value) return pongAlert("Email required");

        const res = await apiFetch(`/api/users/me`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: value })
        });

        const data = await res.json();

        if (data.success) pongAlert("Email updated!");
        else pongAlert(data?.error?.message || "Update failed");
    };

    main.append(emailInput, emailBtn);

    // Section Password
    main.append(sectionTitle("Password"));

    const currentInput = labeledInput("Current password", true);
    const newInput = labeledInput("New password", true);
    const passBtn = actionButton("Change password");

    passBtn.onclick = async () => {
        if (!currentInput.value || !newInput.value)
            return pongAlert("All fields required");

        const res = await apiFetch(`/api/users/me/password`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                currentPassword: currentInput.value,
                newPassword: newInput.value
            })
        });

        const data = await res.json();

        if (data.success) pongAlert("Password changed!");
        else pongAlert(data?.error?.message || "Update failed");
    };

    main.append(currentInput, newInput, passBtn);

    return main;
}

/* UI HELPERS */

function sectionTitle(title: string): HTMLElement {
    const elmt = el("h2", "font-ocean-type text-2xl mt-8 mb-2");
    elmt.append(text(title));
    return elmt;
}

function labeledInput(placeholder: string, password = false): HTMLInputElement {
    const input = el("input", 
        "border p-2 w-full rounded bg-white/70 font-modern-type mb-2"
    ) as HTMLInputElement;

    input.type = password ? "password" : "text";
    input.placeholder = placeholder;

    return input;
}

function actionButton(label: string): HTMLButtonElement {
    const btn = el("button", "big-link my-2 text-center") as HTMLButtonElement;
    btn.append(text(label));
    return btn;
}
