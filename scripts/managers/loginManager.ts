import { loginModalHTML, registerModalHTML, twoFactorModalHTML } from "../sourcepage.js";
import { HOSTNAME, MainApp, updateChatWidgetVisibility } from "../main.js";
import { showNotification, showErrorNotification } from "../helpers/notifications.js";
import api from "../helpers/api.js";
import { setupProfileButton } from "../header/navigation.js";
import { disconnectNotificationSocket } from "../header/navigation.js";
export class LoginManager
{
    private static async removeLoginModal(): Promise<void>
    {
        const modal = document.getElementById('optionnalModal');
        if (modal)
            modal.innerHTML = "";
        const user = await MainApp.getUserInfo();
        if (user && user.id)
        {
            console.log('user id:', user.id);
        }
        else
        {
            console.log('user id not found');
        }
        showNotification("Logged in successfully");
    }

    static async isLoggedIn(): Promise<boolean>
    {
        const data = await MainApp.checkAuth();
        console.log('data:', data);
        return data.success;
    }

    private static checkGoogleAuthError(): void {
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const message = urlParams.get('message');
        
        if (error === 'google' && message) {
            showErrorNotification(decodeURIComponent(message));
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    static async showLoginModal(): Promise<void>
    {
        if (!await this.isLoggedIn())
        {
            disconnectNotificationSocket();
            const optionnalModal = document.getElementById('optionnalModal');
            if (!optionnalModal)
                return;
            optionnalModal.innerHTML = loginModalHTML;
            this.setupLoginModal();
            this.checkGoogleAuthError();
        }
    }

    private static async setupLoginModal(): Promise<void>
    {
        console.log("Setting up login modal");
        const loginbutton = document.getElementById('loginButton');
        const loginForm = document.getElementById('loginForm');
        if (!loginbutton || !loginForm)
            return;

        // Ajout de l'écouteur pour la touche Entrée sur le formulaire de connexion
        loginForm.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                loginbutton.click();
            }
        });

        loginbutton.addEventListener('click', async (e) => {
            e.preventDefault();

            const username = (document.getElementById('username') as HTMLInputElement).value;
            const password = (document.getElementById('password') as HTMLInputElement).value;

            if (!username || !password)
            {
                showErrorNotification("Please enter a username and password");
                return;
            }

            const usernameRegex = /^[a-zA-Z0-9_-]{5,20}$/;
            if (!usernameRegex.test(username))
            {
                showErrorNotification("Your username is not valid");
                return;
            }

            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%#*?&])[A-Za-z\d@$!%#*?&]{8,25}$/;
            if (!passwordRegex.test(password))
            {
                showErrorNotification("Your password is not valid");
                return;
            }

            api.post(`https://${HOSTNAME}:8443/api/auth/login`, { username, password })
            .then(response => response.json())
            .then(data => {
                console.log('backend response:', data);
                if (data.success) 
                {
                    if (data.message === "2FA")
                    {
                        showNotification("2FA code sent to your email");
                        const modal = document.getElementById('optionnalModal');
                        if (!modal)
                            return;
                        modal.innerHTML = twoFactorModalHTML;
                        const backToLogin = document.getElementById('backToLogin');
                        if (!backToLogin)
                            return;
                        backToLogin.addEventListener('click', async (e) => {
                            e.preventDefault();
                            const modal = document.getElementById('optionnalModal');
                            if (!modal)
                                return;
                            modal.innerHTML = loginModalHTML;
                            this.setupLoginModal();
                        });
                        const loginButton = document.getElementById('loginButton');
                        if (!loginButton)
                            return;
                        loginButton.addEventListener('click', async (e) => {
                            e.preventDefault();
                            console.log('login button clicked');
                            const code = (document.getElementById('code') as HTMLInputElement).value;
                            if (!code)
                            {
                                showErrorNotification("Please enter a code");
                                return;
                            }
                            const codeRegex = /^[0-9]{6}$/;
                            if (!codeRegex.test(code))
                            {
                                showErrorNotification('Invalid code');
                                return;
                            }
                            api.post(`https://${HOSTNAME}:8443/api/auth/confirm2FA`, { username, code })
                            .then(response => response.json())
                            .then(data => 
                            {
                                console.log('backend response:', data);
                                if (data.success)
                                {
                                    console.log('Login successful, user data:', data);
                                    this.removeLoginModal();
                                    MainApp.setupHeader();
                                    MainApp.setupCurrentPage(true);
                                    setupProfileButton();
                                }
                                else
                                    showErrorNotification(data.message);
                            });
                        });
                        return;
                    }
                    console.log('Login successful, user data:', data);
                    this.removeLoginModal();
                    MainApp.setupHeader();
                    MainApp.setupCurrentPage(true);
                    setupProfileButton();
                    updateChatWidgetVisibility();
                }
                else
                {
                    showErrorNotification(data.message);
                }
            });
        });

        const googleButton = document.getElementById('googleSignIn');
        if (!googleButton)
            return;
        googleButton.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log("google button clicked");
            const { googleSignInHandler } = await import('../modals/login/googleSignIn.js');
            googleSignInHandler();
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
            const registerForm = document.getElementById('registerForm');
            if (!registerRequestButton || !registerForm)
                return;

            // Ajout de l'écouteur pour la touche Entrée sur le formulaire d'inscription
            registerForm.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    registerRequestButton.click();
                }
            });

            registerRequestButton.addEventListener('click', (e) => {
                e.preventDefault();
                const username = (document.getElementById('Rusername') as HTMLInputElement).value;
                const password = (document.getElementById('Rpassword') as HTMLInputElement).value;
                const confirmPassword = (document.getElementById('RconfirmPassword') as HTMLInputElement).value;
                const email = (document.getElementById('Remail') as HTMLInputElement).value;
                if (!username || !password || !confirmPassword || !email)
                {
                    showErrorNotification("Please enter a username, password and email");
                    return;
                }
                if (password !== confirmPassword)
                {
                    showErrorNotification("Passwords do not match");
                    return;
                }

                const usernameRegex = /^[a-zA-Z0-9_-]{5,20}$/;
                if (!usernameRegex.test(username)) {
                    showErrorNotification("Username must be between 5 and 20 characters and can only contain letters, numbers, underscores and hyphens");
                    return;
                }

                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%#*?&])[A-Za-z\d@$!%#*?&]{8,25}$/;
                if (!passwordRegex.test(password)) {
                    showErrorNotification("Password must be between 8 and 25 characters and contain at least one uppercase letter, one lowercase letter, one number and one special character (@$!%#*?&)");
                    return;
                }

                const emailRegex = /^[a-zA-Z0-9._%+-]{1,30}@[a-zA-Z0-9.-]{1,30}\.[a-zA-Z]{2,}$/;
                if (!emailRegex.test(email)) {
                    showErrorNotification("Please enter a valid email address (max 65 characters)");
                    return;
                }

                api.post(`https://${HOSTNAME}:8443/api/auth/register`, { username, password, email })
                .then(response => response.json())
                .then(data => {
                    console.log('backend response:', data);
                    if (data.success)
                    {
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

    static async logout(): Promise<void>
    {
        try {
            const response = await api.get(`https://${HOSTNAME}:8443/api/auth/logout`);
            const data = await response.json();
            console.log('response:', data);
            if (data.success) {
                showNotification("Logged out successfully");
                const main = document.getElementById('main');
                if (!main)
                    return;
                main.innerHTML = "";
                disconnectNotificationSocket();
                updateChatWidgetVisibility();
                LoginManager.showLoginModal();
            } else {
                showErrorNotification(data.message);
            }
        } catch (error) {
            console.error('Error during logout:', error);
            showErrorNotification("Error during logout");
        }
    }
}