import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequestWithAuth } from 'next-auth/middleware'

export default async function middleware(request: NextRequestWithAuth) {
  console.log('Middleware: Checking request for path:', request.nextUrl.pathname)
  
  const token = await getToken({ req: request })
  console.log('Middleware: Token:', token)
  
  // التحقق من وجود المستخدم
  if (!token) {
    console.log('Middleware: No token found, redirecting to signin')
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // التحقق من صلاحيات الأدمن
  if (request.nextUrl.pathname.startsWith('/admin')) {
    console.log('Middleware: Checking admin access. User role:', token.role)
    const userRole = (token.role as string)?.toUpperCase()
    if (userRole !== 'ADMIN') {
      console.log('Middleware: Access denied, redirecting to home')
      return NextResponse.redirect(new URL('/', request.url))
    }
    console.log('Middleware: Admin access granted')
  }

  return NextResponse.next()
}

// تحديد المسارات التي يجب حمايتها
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*'
  ]
} 