import { loginModalHTML, registerModalHTML } from "../sourcepage.js";
import { MainApp } from "../main.js";
import { showNotification, showErrorNotification } from "../helpers/notifications.js";
import api from "../helpers/api.js";
import { setupProfileButton } from "../header/navigation.js";
import { googleSignInHandler } from "../modals/login/googleSignIn.js";
export class LoginManager {
    static removeLoginModal() {
        const modal = document.getElementById('optionnalModal');
        if (modal)
            modal.innerHTML = "";
        showNotification("Logged in successfully");
    }
    static async isLoggedIn() {
        const data = await MainApp.checkAuth();
        console.log('data:', data);
        return data.success;
    }
    static async showLoginModal() {
        if (!await this.isLoggedIn()) {
            const optionnalModal = document.getElementById('optionnalModal');
            if (!optionnalModal)
                return;
            optionnalModal.innerHTML = loginModalHTML;
            this.setupLoginModal();
        }
    }
    static async setupLoginModal() {
        console.log("Setting up login modal");
        const loginbutton = document.getElementById('loginButton');
        if (!loginbutton)
            return;
        loginbutton.addEventListener('click', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            if (!username || !password) {
                showErrorNotification("Please enter a username and password");
                return;
            }
            api.post('http://127.0.0.1:8080/api/auth/login', { username, password })
                .then(response => response.json())
                .then(data => {
                console.log('backend response:', data);
                if (data.success) {
                    console.log(data.message);
                    this.removeLoginModal();
                    MainApp.setupHeader();
                    MainApp.setupCurrentPage();
                    setupProfileButton();
                }
                else {
                    showErrorNotification(data.message);
                }
            });
        });
        const googleButton = document.getElementById('googleSignIn');
        if (!googleButton)
            return;
        googleButton.addEventListener('click', async (e) => {
            console.log("google button clicked");
            await googleSignInHandler();
        });
        const registerButton = document.getElementById('registerButton');
        if (!registerButton)
            return;
        registerButton.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = document.getElementById('login-modal');
            if (!modal)
                return;
            modal.innerHTML = registerModalHTML;
            const cancelButton = document.getElementById('cancelButton');
            if (!cancelButton)
                return;
            cancelButton.addEventListener('click', (e) => {
                e.preventDefault();
                const modal = document.getElementById('optionnalModal');
                if (!modal)
                    return;
                modal.innerHTML = loginModalHTML;
                this.setupLoginModal();
            });
            const registerRequestButton = document.getElementById('registerRequestButton');
            if (!registerRequestButton)
                return;
            registerRequestButton.addEventListener('click', (e) => {
                e.preventDefault();
                const username = document.getElementById('Rusername').value;
                const password = document.getElementById('Rpassword').value;
                const confirmPassword = document.getElementById('RconfirmPassword').value;
                const email = document.getElementById('Remail').value;
                if (!username || !password || !confirmPassword || !email) {
                    showErrorNotification("Please enter a username, password and email");
                    return;
                }
                if (password !== confirmPassword) {
                    showErrorNotification("Passwords do not match");
                    return;
                }
                api.post('http://127.0.0.1:8080/api/auth/register', { username, password, email })
                    .then(response => response.json())
                    .then(data => {
                    console.log('backend response:', data);
                    if (data.success) {
                        showNotification("User registered successfully");
                        const modal = document.getElementById('optionnalModal');
                        if (!modal)
                            return;
                        modal.innerHTML = loginModalHTML;
                        this.setupLoginModal();
                    }
                    else
                        showErrorNotification(data.message);
                });
            });
        });
    }
}
LoginManager.AUTH_KEY = "isauthed";
