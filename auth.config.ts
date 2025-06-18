import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { AuthOptions } from 'next-auth'
import { checkUserCredentials } from '@/lib/lib/auth/checkUserCredentials'

const authConfig: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    CredentialsProvider({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        return await checkUserCredentials(credentials as {
          email?: string
          password?: string
        })
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: '/sign-in',
  },

  callbacks: {
    async jwt({ token, user }) {
      // إذا المستخدم تسجل، نحفظ الـ id في التوكن
      if (user) {
        token.id = (user as any).id || (user as any)._id
      }
      return token
    },

    async session({ session, token }) {
      // نمرر الـ id الموجود في التوكن إلى session.user
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },

    async redirect({ url, baseUrl }) {
      return baseUrl
    },
  },
}

export default authConfig