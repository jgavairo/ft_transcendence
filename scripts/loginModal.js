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
export class LoginManager {
    static isLoggedIn() {
        return localStorage.getItem(this.AUTH_KEY) !== null;
    }
    static showLoginModal() {
        if (!this.isLoggedIn()) {
            document.body.insertAdjacentHTML('beforeend', loginModalHTML);
            this.setupLoginModal();
        }
    }
    static setupLoginModal() {
        console.log("Setting up login modal");
        const loginbutton = document.getElementById('loginButton');
        if (!loginbutton)
            return;
        loginbutton.addEventListener('click', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            if (username === "" || password === "") {
                alert("Please enter a username and password");
                return;
            }
            localStorage.setItem(this.AUTH_KEY, "isauthed");
            if (localStorage.getItem(this.AUTH_KEY) === "isauthed") {
                this.removeLoginModal();
                window.location.reload();
            }
        });
    }
    static removeLoginModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal)
            modal.remove();
    }
}
LoginManager.AUTH_KEY = "isauthed";
