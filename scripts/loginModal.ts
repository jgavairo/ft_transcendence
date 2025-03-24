const loginModalHTML = `
    <div> class ="login-modal">
        <div class="login-modal-content">
            <span class="close">&times;</span>
            <h2>Login</h2>
        </div>
    </div>
`;

export class LoginManager
{
    private static readonly AUTH_KEY = "userAuth";

    static isLoggedIn(): boolean
    {
        return localStorage.getItem(this.AUTH_KEY) !== null;
    }
}