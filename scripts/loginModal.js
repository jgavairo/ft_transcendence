const loginModalHTML = `
    <div> class ="login-modal">
        <div class="login-modal-content">
            <span class="close">&times;</span>
            <h2>Login</h2>
        </div>
    </div>
`;
export class LoginManager {
    static isLoggedIn() {
        return localStorage.getItem(this.AUTH_KEY) !== null;
    }
}
LoginManager.AUTH_KEY = "userAuth";
