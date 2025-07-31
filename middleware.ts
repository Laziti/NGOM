import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

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

    // Redirect from login if already authenticated
    if (path === '/login') {
      const dashboardPath = getDashboardPath(role);
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
    
    // Redirect from register if already authenticated (except admin can create new users)
    if (path === '/register' && role !== 'admin') {
      const dashboardPath = getDashboardPath(role);
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }

    // Check role-based access
    if (!hasAccess(role, path)) {
      const dashboardPath = getDashboardPath(role);
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
  }

  return response;
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