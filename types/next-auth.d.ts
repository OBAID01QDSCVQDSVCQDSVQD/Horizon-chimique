// types/next-auth.d.ts
import NextAuth, { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      company?: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: string
    company?: string
  }

  interface JWT {
    id: string
    role: string
    company?: string
  }
}
