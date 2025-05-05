import { HOSTNAME } from "../../main.js";
export async function googleSignInHandler()
{
    window.location.href = `http://${HOSTNAME}:3000/api/auth/google`;
}