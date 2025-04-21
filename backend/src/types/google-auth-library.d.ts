declare module 'google-auth-library' {
  export class OAuth2Client {
    constructor(clientId: string, clientSecret: string, redirectUri: string);
    getToken(code: string): Promise<{ tokens: { access_token: string; refresh_token?: string } }>;
    setCredentials(tokens: { access_token: string; refresh_token?: string }): void;
  }
} 