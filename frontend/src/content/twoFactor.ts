import { el } from "./home";

/* Fonction pour gérer la saisie du code 2FA côté front */
export async function requestTwoFactorCode(userId: number): Promise<boolean> {
    return new Promise((resolve) => {
        const container = el("div", "fixed inset-0 bg-black/70 flex justify-center items-center z-50");
        const box = el("div", "bg-white p-6 rounded shadow-lg flex flex-col gap-4 w-80");

        const title = el("h2", "text-xl font-bold text-center");
        title.textContent = "Enter your 2FA code";

        const input = el("input", "border-2 border-gray-400 p-2 text-center text-md");
        input.type = "text";
        input.placeholder = "6-digit code";

        const submit = el("button", "bg-black text-white p-2 hover:bg-gray-800 cursor-pointer");
        submit.textContent = "Validate";

        box.append(title, input, submit);
        container.append(box);
        document.body.append(container);

        submit.addEventListener("click", async (event) => {
            event.preventDefault();
            submit.disabled = true;

            if (!input.value) {
                alert("Please enter the 2FA code.");
                submit.disabled = false;
                return;
            }

            try {
                const res = await fetch("/api/auth/2fa", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ userId, code: input.value }),
                });

                const data = await res.json();

                if (res.ok) {
                    resolve(true);
                } else {
                    alert(data.error?.message || "Invalid 2FA code. Try again.");
                    submit.disabled = false;
                }
            } catch (err) {
                console.error(err);
                alert("Network error during 2FA validation.");
                submit.disabled = false;
            }
        });
    });
}
