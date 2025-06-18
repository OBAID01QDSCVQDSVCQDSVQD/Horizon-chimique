import { NextResponse } from 'next/server'

export async function GET() {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    AUTH_SECRET: process.env.AUTH_SECRET ? '✅ Set' : '❌ Missing',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing',
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID ? '✅ Set' : '❌ Missing',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing',
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET ? '✅ Set' : '❌ Missing',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing',
    MONGODB_URI: process.env.MONGODB_URI ? '✅ Set' : '❌ Missing',
  }

  return NextResponse.json({
    message: 'NextAuth Debug Info',
    environment: envVars,
    timestamp: new Date().toISOString()
  })
} 