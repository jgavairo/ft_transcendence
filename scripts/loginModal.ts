import { setupStore } from "./store";

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
            <button id="registerButton" class="signupButton">Sign up</button>
`;
export class LoginManager
{
    private static readonly AUTH_KEY = "isauthed";

    static isLoggedIn(): boolean
    {
        return localStorage.getItem(this.AUTH_KEY) !== null;
    }

    static showLoginModal(): void
    {
        if (!this.isLoggedIn())
        {
            const optionnalModal = document.getElementById('optionnalModal');
            if (!optionnalModal)
                return;
            optionnalModal.innerHTML = loginModalHTML;
            this.setupLoginModal();
        }
    }

    private static setupLoginModal(): void
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
            localStorage.setItem(this.AUTH_KEY, "isauthed");
            if (localStorage.getItem(this.AUTH_KEY) === "isauthed")
            {
                this.removeLoginModal();
                window.location.reload();
            }
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
        });
        const googleButton = document.getElementById('googleSignIn');
        if (!googleButton)
            return;
        googleButton.addEventListener('click', (e) => {
            e.preventDefault();
            alert("google is not available yet");
        });
    }

    private static removeLoginModal(): void
    {
        const modal = document.querySelector('.modal-overlay');
        if (modal)
            modal.remove();
    }



}