import { type AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import User from '@/lib/db/models/user.model'
import { connectToDatabase } from '@/lib/db'

export const authConfig: AuthOptions = {
  secret: process.env.AUTH_SECRET || 'fallback-secret-key-for-dev',
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          console.log('🔐 Auth attempt for:', credentials?.email);
          
          if (!credentials?.email || !credentials?.password) {
            console.log('❌ Missing credentials');
            return null;
          }

          await connectToDatabase();
          console.log('✅ Connected to database');
          
          const user = await User.findOne({ email: credentials.email });
          console.log('👤 User found:', user ? 'Yes' : 'No');
          
          if (!user) {
            console.log('❌ User not found');
            return null;
          }

          if (!user.password) {
            console.log('❌ User has no password (OAuth user?)');
            return null;
          }

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );
          console.log('🔑 Password correct:', isCorrectPassword);

          if (!isCorrectPassword) {
            console.log('❌ Incorrect password');
            return null;
          }

          console.log('✅ Login successful for:', user.email);
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role || 'USER',
          };
        } catch (error) {
          console.error('💥 Auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        console.log('🎫 JWT token created for:', user.email);
      }
      
      // Handle Google OAuth
      if (account?.provider === 'google' && user) {
        try {
          await connectToDatabase();
          
          let dbUser = await User.findOne({ email: user.email });
          
          if (!dbUser) {
            // Create new user for Google OAuth
            dbUser = await User.create({
              email: user.email,
              name: user.name,
              role: 'USER',
              image: user.image,
            });
            console.log('👤 New Google user created:', user.email);
          }
          
          token.id = dbUser._id.toString();
          token.role = dbUser.role;
        } catch (error) {
          console.error('💥 Google OAuth error:', error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        console.log('📝 Session created for:', session.user.email);
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log('🔄 Redirect from:', url, 'to:', baseUrl);
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  debug: true, // Enable debug logs
} 