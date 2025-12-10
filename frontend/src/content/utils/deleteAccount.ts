// utils/deleteAccount.ts
import { apiFetch } from "../utils/apiFetch";

export async function deleteAccount(): Promise<boolean> {
  try {
    const response = await apiFetch('/api/auth/delete-account', {
      method: 'DELETE',
      credentials: 'include',
      headers: {} // pas de Content-Type
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      console.error('Delete account error:', data);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Delete account failed:', err);
    return false;
  }
}
