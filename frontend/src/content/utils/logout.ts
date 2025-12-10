import { apiFetch } from "../utils/apiFetch";

export async function logout(): Promise<void> {
    try {
        const response = await apiFetch("/api/auth/logout", {
            method: "POST",
            credentials: "include"
        });

        if (!response.ok) {
            console.error("Logout failed");
            return;
        }

        // Redirection vers la page de login
        window.location.href = "/#/login";
    } catch (error) {
        console.error("Logout error:", error);
    }
}
