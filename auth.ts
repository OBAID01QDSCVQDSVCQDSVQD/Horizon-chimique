import { type AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { Adapter } from 'next-auth/adapters'
import CredentialsProvider from 'next-auth/providers/credentials'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import clientPromise from '@/lib/db/client'
import bcrypt from 'bcryptjs'
import User from '@/lib/db/models/user.model'
import { connectToDatabase } from '@/lib/db'

export const authConfig: AuthOptions = {
  secret: process.env.AUTH_SECRET,
  adapter: MongoDBAdapter(clientPromise) as Adapter,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/sign-in',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        await connectToDatabase();
        
        const user = await User.findOne({ email: credentials.email });
        console.log('Auth: Found user:', user);
        
        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error('Invalid credentials');
        }

        const userData = {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
        console.log('Auth: Returning user data:', userData);
        return userData;
        }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      } else if (!token.role && token.email) {
        await connectToDatabase();
        const dbUser = await User.findOne({ email: token.email });
        token.id = dbUser?._id?.toString();
        token.role = dbUser?.role || 'USER';
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
      }
  }
}