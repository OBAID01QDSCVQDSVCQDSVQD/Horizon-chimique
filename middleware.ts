import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    console.log('Middleware: Pathname', pathname);
    console.log('Middleware: Token', token);
    console.log('Middleware: Token role', token?.role);

    // If the path starts with /admin and the user is not an admin, redirect to home
    if (
      pathname.startsWith('/admin') &&
      (!token || typeof token.role !== 'string' || token.role.toLowerCase() !== 'admin')
    ) {
      console.log('Middleware: Redirecting non-admin from admin path');
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Allow access to /admin routes only if the token exists and the role is 'admin'
        // Other routes are allowed for everyone (handled by the middleware function itself)
        if (token) {
          // If token exists, let the middleware function handle role-based access
          return true
        }
        // If no token, only allow access to non-admin routes. Admin routes will be redirected by the middleware function.
        return true 
      },
    },
    pages: {
      signIn: '/sign-in',
    },
  }
)

export const config = {
  matcher: ['/admin/:path*'], // Protect all routes under /admin
} 