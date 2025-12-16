import { el, text } from "./home";
import { pongAlert } from "./utils/alertBox";
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

// ========================
// Section 2FA
// ========================
main.append(sectionTitle("Security"));

const twoFaRow = el(
  "div",
  "flex items-center justify-between gap-4 border p-3 rounded bg-white/70"
);

const twoFaLabel = el("label", "font-modern-type text-lg");
twoFaLabel.append(text("Enable Two-Factor Authentication (2FA)"));

const twoFaToggle = el("input") as HTMLInputElement;
twoFaToggle.type = "checkbox";
twoFaToggle.className = "h-5 w-5";
twoFaToggle.disabled = true;

twoFaRow.append(twoFaLabel, twoFaToggle);
main.append(twoFaRow);

// 1) Charger l'état actuel depuis /api/auth/me
// 1) Charger l'état actuel depuis /api/auth/me
apiFetch("/api/auth/me", { credentials: "include" })
  .then((res) =>
    res.json().then((data) => ({
      ok: res.ok,
      status: res.status,
      data,
    }))
  )
  .then(({ ok, status, data }) => {
    // Debug très utile : regarde le JSON exact
    console.log("[/api/auth/me]", status, data);

    if (!ok) {
      if (status === 401) return; // Cas où l'utilisateur est déconnecté
      pongAlert(data?.error?.message || "Failed to load 2FA status");
      return;
    }

    // Récupérer la valeur du 2FA dans la réponse API
    const enabled = data?.data?.user?.twoFactorEnabled === true;
    console.log('2FA Enabled: ', enabled);  // Log pour vérifier la valeur

    // Synchronisation UI <- DB
    twoFaToggle.checked = enabled;
  })
  .catch((err) => {
    console.error(err);
    pongAlert("Network error while loading 2FA status");
  })
  .finally(() => {
    // Activer le toggle après avoir récupéré les données
    twoFaToggle.disabled = false;
  });


// 2) Quand l'utilisateur clique sur le toggle -> PATCH /api/users/me/2fa
twoFaToggle.addEventListener("change", () => {
  const desired = twoFaToggle.checked;
  twoFaToggle.disabled = true;

  apiFetch("/api/users/me/2fa", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled: desired }),
  })
    .then((res) =>
      res.json().then((data) => ({
        ok: res.ok,
        status: res.status,
        data,
      }))
    )
    .then(({ ok, data }) => {
      console.log("[PATCH /api/users/me/2fa]", data);

      if (!ok || !data?.success) {
        // rollback si erreur
        twoFaToggle.checked = !desired;
        pongAlert(data?.error?.message || "Failed to update 2FA");
        return;
      }

      pongAlert(desired ? "2FA enabled!" : "2FA disabled!");
    })
    .catch((err) => {
      console.error(err);
      twoFaToggle.checked = !desired;
      pongAlert("Network error while updating 2FA");
    })
    .finally(() => {
      twoFaToggle.disabled = false;
    });
});


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
