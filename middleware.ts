import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check auth condition
  if (!session) {
    // Auth condition not met, redirect to login page
    if (request.nextUrl.pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } else {
    // If logged in, get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const role = userData?.role;
    const path = request.nextUrl.pathname;

    // Redirect from login/register if already authenticated
    if (path === '/login' || (path === '/register' && role !== 'admin')) {
      const dashboardPath = getDashboardPath(role);
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }

    // Check role-based access
    if (!hasAccess(role, path)) {
      const dashboardPath = getDashboardPath(role);
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
  }

  return res;
}

function getDashboardPath(role?: string): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'donor':
      return '/donor/dashboard';
    case 'mentor':
      return '/mentor/dashboard';
    case 'student':
      return '/student/dashboard';
    default:
      return '/login';
  }
}

function hasAccess(role: string | undefined, path: string): boolean {
  if (!role) return false;

  // Admin can access everything
  if (role === 'admin') return true;

  // Check if path starts with the user's role
  return path.startsWith(`/${role}`);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 