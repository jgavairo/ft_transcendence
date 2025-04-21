import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { dbManager } from '../database/database.js';
import { User } from '../database/database.js';

// Configuration de la stratégie Google OAuth 2.0
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_REDIRECT_URI || 'http://127.0.0.1:8080/api/auth/google/callback',
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google profile received:', profile);
      // Recherche de l'utilisateur par email
      const email = profile.emails?.[0]?.value;
      if (!email) {
        console.error('No email found in Google profile');
        return done(new Error('Email non trouvé dans le profil Google'), false);
      }

      // Vérifier si l'utilisateur existe déjà
      let user = await dbManager.getUserByEmail(email);
      console.log('Existing user found:', user ? 'yes' : 'no');
      
      if (!user) {
        // Créer un nouvel utilisateur si nécessaire
        const newUser: User = {
          username: profile.displayName || 'Utilisateur Google',
          email: email,
          password_hash: Math.random().toString(36).slice(-8), // Mot de passe aléatoire
          profile_picture: profile.photos?.[0]?.value || '../assets/profile_pictures/default.png'
        };
        
        const userId = await dbManager.registerUser(newUser);
        user = await dbManager.getUserById(userId);
        console.log('New user created with ID:', userId);
      }
      
      return done(null, user || false);
    } catch (error) {
      console.error('Error in Google strategy:', error);
      return done(error, false);
    }
  }
));

// Sérialisation de l'utilisateur pour la session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Désérialisation de l'utilisateur depuis la session
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await dbManager.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;