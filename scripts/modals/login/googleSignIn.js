import { HOSTNAME } from "../../main.js";
export async function googleSignInHandler() {
    window.location.href = `https://${HOSTNAME}:8443/api/auth/google`;
}
