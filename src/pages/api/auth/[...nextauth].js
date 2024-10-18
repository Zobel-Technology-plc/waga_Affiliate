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
  },
  jwt: {
    encryption: true, // Enable encryption
    secret: process.env.NEXTAUTH_SECRET, // Ensure this is set in .env
  },
  callbacks: {
    async jwt({ token, user }) {
      // Attach the username to the JWT token if it exists
      if (user) {
        token.id = user.id;
        token.username = user.username; // Add the username to the token
      }
      return token;
    },
    async session({ session, token }) {
      // Attach the user ID and username to the session
      session.user.id = token.id;
      session.user.username = token.username; // Add username to the session object
      return session;
    },
  },
});
