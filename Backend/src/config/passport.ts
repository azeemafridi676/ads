import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/userModel';
import bcrypt from 'bcryptjs';

// validate the env variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.FRONTEND_URL) {
  throw new Error('Missing required environment variables');
}

console.log(`${process.env.FRONTEND_URL}/api/user/auth/google/callback`);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.NODE_ENV === 'production'
        ? 'https://api.haulads.com/api/user/auth/google/callback'
        : 'http://localhost:3000/api/user/auth/google/callback',
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("came to passport.use");
        console.log('accessToken', accessToken);
        console.log('refreshToken', refreshToken);
        console.log('profile', profile);
        
        // Check if user already exists
        let user = await User.findOne({ email: profile.emails![0].value });

        if (user) {
          // User exists, return user
          return done(null, user);
        }

        // Instead of returning false, we'll return a special object
        return done(null, { 
          isNewUser: true,
          email: profile.emails![0].value,
          firstName: profile.name?.givenName || '',
          lastName: profile.name?.familyName || '',
          profileImage: profile.photos?.[0]?.value || null
        });
      } catch (error) {
        console.error('Error in passport.use:', error);
        return done(error as Error);
      }
    }
  )
);

export default passport; 