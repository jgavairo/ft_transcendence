import api from "../../helpers/api.js";
import { showNotification, showErrorNotification } from "../../helpers/notifications.js";
import { HOSTNAME } from "../../main.js";
export async function googleSignInHandler()
{
    window.location.href = `http://${HOSTNAME}:3000/api/auth/google`;
}