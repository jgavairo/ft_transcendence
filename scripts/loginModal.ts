import { setupStore } from "./store";
import api from "./api.js";
import { MainApp } from "./main.js";
const loginModalHTML = `
    <div class="modal-overlay" id="modalWindow">
        <div class="login-modal" id="login-modal">
            <h2>ft_transcendence</h2>
            <form id="loginForm" class = "login-form">
                <input type="text" id="username" placeholder="Username" required>
                <input type="password" id="password" placeholder="Password" required>
                </form>
            <button id="loginButton" class="loginButton">Sign in</button>
            <button id="googleSignIn" class="googleButton">
                    <img src="../../assets/google.png" class="googleLogo" alt="Google logo">
                    Sign in with Google
            </button>
            <div class="registerContainer">
                you don't have an account? 
                <button id="registerButton" class="registerButton">Sign up</button>
            </div>
        </div>
    </div>
`;

const registerModalHTML = `
            <div class="registerModalTitle">
                <button id="cancelButton" class="cancelButton">Cancel</button>
                <h2>Sign up</h2>
            </div>
            <form id="registerForm" class = "register-form">
                <input type="text" id="Rusername" placeholder="Username" required>
                <input type="password" id="Rpassword" placeholder="Password" required>
                <input type="password" id="RconfirmPassword" placeholder="confirm password" required>
                <input type="email" id="Remail" placeholder="Email" required>
            </form>
            <button id="registerRequestButton" class="signupButton">Sign up</button>
`;
<<<<<<< HEAD
=======

async function googleSignInHandler()
{
    console.log("google sign in handler");
    window.location.href = 'http://127.0.0.1:3000/api/auth/google';
}
>>>>>>> 028ad59c6a8c74fca564bd04b39fd270d4e9a8f4
export class LoginManager
{
    private static readonly AUTH_KEY = "isauthed";

    static async isLoggedIn(): Promise<boolean>
    {
        const data = await MainApp.checkAuth();
        console.log('data:', data);
        return data.success;
    }

    static async showLoginModal(): Promise<void>
    {
        if (!await this.isLoggedIn())
        {
            const optionnalModal = document.getElementById('optionnalModal');
            if (!optionnalModal)
                return;
            optionnalModal.innerHTML = loginModalHTML;
            this.setupLoginModal();
        }
    }

<<<<<<< HEAD
    private static setupLoginModal(): void
=======
    private static async setupLoginModal(): Promise<void>
>>>>>>> 028ad59c6a8c74fca564bd04b39fd270d4e9a8f4
    {
        console.log("Setting up login modal");
        const loginbutton = document.getElementById('loginButton');
        if (!loginbutton)
            return;
        loginbutton.addEventListener('click', (e) => {
            e.preventDefault();

            const username = (document.getElementById('username') as HTMLInputElement).value;
            const password = (document.getElementById('password') as HTMLInputElement).value;

            if (!username || !password)
            {
                alert("Please enter a username and password");
                return;
            }
            api.post('http://127.0.0.1:3000/api/auth/login', { username, password })
            .then(response => response.json())
            .then(data => {
                console.log('backend response:', data);
                if (data.success) {
                    localStorage.setItem(this.AUTH_KEY, "isauthed");
                    alert(data.message);
                    this.removeLoginModal();
                    window.location.reload();
                }
                else
                {
                    alert(data.message);
                }
            });
        });
<<<<<<< HEAD
=======

        const googleButton = document.getElementById('googleSignIn');
        if (!googleButton)
            return;
        googleButton.addEventListener('click', async (e) => {
            console.log("google button clicked");
            await googleSignInHandler();
        });

>>>>>>> 028ad59c6a8c74fca564bd04b39fd270d4e9a8f4
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
                const username = (document.getElementById('Rusername') as HTMLInputElement).value;
                const password = (document.getElementById('Rpassword') as HTMLInputElement).value;
                const confirmPassword = (document.getElementById('RconfirmPassword') as HTMLInputElement).value;
                const email = (document.getElementById('Remail') as HTMLInputElement).value;
                if (!username || !password || !confirmPassword || !email)
                {
                    alert("Please enter a username, password and email");
                    return;
                }
                if (password !== confirmPassword)
                {
                    alert("Passwords do not match");
                    return;
                }
                api.post('http://127.0.0.1:3000/api/auth/register', { username, password, email })
                .then(response => response.json())
                .then(data => {
                    console.log('backend response:', data);
                    if (data.success)
                    {
                        alert("User registered successfully");
                        const modal = document.getElementById('optionnalModal');
                        if (!modal)
                            return;
                        modal.innerHTML = loginModalHTML;
                        this.setupLoginModal();
                    }
                    else
<<<<<<< HEAD
                    {
                        alert(data.message);
                    }
                });
            });
            const googleButton = document.getElementById('googleSignIn');
            if (!googleButton)
                return;
            googleButton.addEventListener('click', (e) => {
                e.preventDefault();
                alert("google is not available yet");
            });
=======
                        alert(data.message);
                });
            });
>>>>>>> 028ad59c6a8c74fca564bd04b39fd270d4e9a8f4
        });
    }

    private static removeLoginModal(): void
    {
        const modal = document.querySelector('.modal-overlay');
        if (modal)
            modal.innerHTML = "";
    }
}