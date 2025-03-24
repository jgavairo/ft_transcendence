import { setupStore } from "./store";

const loginModalHTML = `
    <div class="modal-overlay">
        <div class="login-modal">
            <h2>ft_transcendence</h2>
            <form id="loginForm" class = "login-form">
                <input type="text" id="username" placeholder="Username" required>
                <input type="password" id="password" placeholder="Password" required>
                </form>
            <button type="submit" id="loginButton" class="loginButton">Sign in</button>
            <button type="googleSignIn" id="googleSignIn" class="googleButton">
                    <img src="../../assets/google.png" class="googleLogo" alt="Google logo">
                    Sign in with Google
            </button>
        </div>
    </div>
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
            document.body.insertAdjacentHTML('beforeend', loginModalHTML);
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
            if (username === "francisletordu")
            {
                alert("Francis, tu n'as pas le droit d'etre ici. tu as ete condamne pour avoir tripoter tes potes!");
                return;
            }
            localStorage.setItem(this.AUTH_KEY, "isauthed");
            if (localStorage.getItem(this.AUTH_KEY) === "isauthed")
            {
                this.removeLoginModal();
                window.location.reload();
            }
        });
    }

    private static removeLoginModal(): void
    {
        const modal = document.querySelector('.modal-overlay');
        if (modal)
            modal.remove();
    }

}