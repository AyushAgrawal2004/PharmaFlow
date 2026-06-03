import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // If accessing admin pages, require ADMIN role
    if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
      // Redirect unauthorized users to the seller dashboard
      return NextResponse.redirect(new URL('/seller', req.url));
    }
  },
  {
    callbacks: {
      // Require authentication for all matched paths
      authorized: ({ token }) => !!token,
    },
  }
);

// Match all routes starting with /admin or /seller
export const config = {
  matcher: ['/admin/:path*', '/seller/:path*'],
};
