// Gestion centralisée des utilisateurs bloqués pour tous les modules (chat principal et widget)
import { HOSTNAME } from "../main.js";

const blockedCache: Record<string, boolean> = {};

export async function isBlocked(author: string): Promise<boolean> {
    if (blockedCache[author] !== undefined) return blockedCache[author];
    try {
        const response = await fetch(`https://${HOSTNAME}:8443/api/user/isBlocked`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: author })
        });
        const data = await response.json();
        blockedCache[author] = !!data.isBlocked;
        return blockedCache[author];
    } catch {
        return false;
    }
}

export function clearBlockedCache() {
    Object.keys(blockedCache).forEach(k => delete blockedCache[k]);
}
