import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose'; // Using 'jose' for JWT verification

// Define a type for the expected JWT payload
interface UserJwtPayload {
  id: string;
  email: string;
  role: string; // e.g., 'ADMIN', 'STAFF', 'CUSTOMER'
  // Standard JWT claims like iat, exp can also be expected
}

const JWT_SECRET_KEY = process.env.JWT_SECRET;

async function verifyToken(token: string): Promise<UserJwtPayload | null> {
  if (!token || !JWT_SECRET_KEY) {
    console.error("JWT Secret is not configured or token is missing.");
    return null;
  }
  try {
    const secret = new TextEncoder().encode(JWT_SECRET_KEY);
    const { payload } = await jwtVerify<UserJwtPayload>(token, secret);
    return payload;
  } catch (error) {
    console.error('JWT Verification Error:', (error as Error).message);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const tokenCookie = request.cookies.get('auth_token'); // Example cookie name
  const token = tokenCookie?.value;

  const userPayload = await verifyToken(token || '');
  const userRole = userPayload?.role;

  const loginUrl = new URL('/login', request.url); // Ensure (auth) pages are correctly referenced
  loginUrl.searchParams.set('redirectTo', pathname);

  const unauthorizedUrl = new URL('/unauthorized', request.url);


  // Allow access to public routes, auth pages, and static assets
  if (
    pathname === '/' ||
    pathname.startsWith('/login') || // Assuming login is /login not /auth/login from root
    pathname.startsWith('/register') ||
    pathname.startsWith('/unauthorized') ||
    pathname.startsWith('/api/auth') || // Authentication API routes
    pathname.startsWith('/_next/') || // Next.js internals
    pathname.includes('.') // Typically files like favicon.ico, images
  ) {
    return NextResponse.next();
  }

  // --- Authenticated User Required Beyond This Point ---
  if (!userPayload || !userRole) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }
    return NextResponse.redirect(loginUrl);
  }
  
  // --- Role-Based Access Control ---

  // Admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/(admin)')) {
    if (userRole !== 'ADMIN') {
      unauthorizedUrl.searchParams.set('requiredRole', 'ADMIN');
      unauthorizedUrl.searchParams.set('currentRole', userRole);
      if (pathname.startsWith('/api/')) return NextResponse.json({ message: 'Forbidden: Admin access required.' }, { status: 403 });
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  // Staff routes (accessible by ADMIN and STAFF)
  if (pathname.startsWith('/staff') || pathname.startsWith('/(staff)')) {
    if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
      unauthorizedUrl.searchParams.set('requiredRole', 'STAFF');
      unauthorizedUrl.searchParams.set('currentRole', userRole);
      if (pathname.startsWith('/api/')) return NextResponse.json({ message: 'Forbidden: Staff access required.' }, { status: 403 });
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  // Customer routes (accessible by ADMIN, STAFF, CUSTOMER)
  // Example: a customer dashboard at /customer/dashboard
  if (pathname.startsWith('/customer') || pathname.startsWith('/(customer)')) {
    if (!['ADMIN', 'STAFF', 'CUSTOMER'].includes(userRole)) {
       unauthorizedUrl.searchParams.set('requiredRole', 'CUSTOMER');
       unauthorizedUrl.searchParams.set('currentRole', userRole);
      if (pathname.startsWith('/api/')) return NextResponse.json({ message: 'Forbidden: Customer access required.' }, { status: 403 });
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  // API Route Specific Protections (Example for car modification)
  // Note: Staff can also manage cars as per earlier requirements.
  if (pathname.startsWith('/api/cars') && ['POST', 'PUT', 'DELETE'].includes(request.method)) {
    if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
      return NextResponse.json({ message: 'Forbidden: Insufficient privileges for this car operation.' }, { status: 403 });
    }
  }
  
  // Add more specific API route protections as needed, e.g., for reservations.

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     *
     * And explicit public pages like /login, /register, /unauthorized
     * The goal is to run middleware on most paths and handle public access within the middleware logic.
     */
    '/((?!_next/static|_next/image|favicon.ico|login|register|unauthorized).*)',
     // This ensures it runs on '/', '/api/:path*', '/admin/:path*', etc.
  ],
};
