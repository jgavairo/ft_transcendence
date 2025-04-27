import api from "../../helpers/api.js";
import { showNotification, showErrorNotification } from "../../helpers/notifications.js";

export async function googleSignInHandler()
{
    window.location.href = "http://127.0.0.1:3000/api/auth/google";
}