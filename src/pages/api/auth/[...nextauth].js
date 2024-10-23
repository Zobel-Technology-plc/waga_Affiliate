import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '../../../backend/config/dbConnect';
import Admin from '../../../backend/models/Admin';
import bcrypt from 'bcryptjs';

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        await dbConnect();

        const admin = await Admin.findOne({ username: credentials.username });
        if (!admin) {
          throw new Error('No user found with the entered username');
        }

        const isPasswordCorrect = await bcrypt.compare(credentials.password, admin.password);
        if (!isPasswordCorrect) {
          throw new Error('Invalid credentials');
        }

        // Returning username along with id
        return { id: admin._id, username: admin.username };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 60, // Set session max age to 30 minutes (30 * 60 seconds)
  },
  jwt: {
    encryption: true,
    secret: process.env.NEXTAUTH_SECRET || "VO4WKRonCpGirgR8/4LFmQA+GqsE+h/HAPM4/0JQxgc",
    maxAge: 30 * 60, // Token expires after 30 minutes
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Attach user data to JWT if user exists
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }

      // Handle token renewal on session activity
      const now = Date.now() / 1000;
      if (now - token.iat > 30 * 60) {
        // Invalidate the token after 30 minutes of inactivity
        return null;
      }

      return token;
    },
    async session({ session, token }) {
      // Attach user data to the session
      session.user.id = token.id;
      session.user.username = token.username;
      return session;
    },
  },
});
