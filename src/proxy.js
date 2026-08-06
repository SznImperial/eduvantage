import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function proxy(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get user session safely.
  const { data: { user } } = await supabase.auth.getUser();

  const url = new URL(request.url);
  const isDashboard = url.pathname.startsWith('/dashboard');
  const isAuthPage = url.pathname.startsWith('/login') || url.pathname.startsWith('/register');
  const isForceResetPage = url.pathname === '/dashboard/force-password-reset';

  // Redirect unauthenticated users attempting to access protected dashboards
  if (isDashboard && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check mandatory password reset gate for authenticated dashboard access
  if (isDashboard && user) {
    const mustChangePassword = user.user_metadata?.must_change_password === true;

    if (mustChangePassword && !isForceResetPage) {
      return NextResponse.redirect(new URL('/dashboard/force-password-reset', request.url));
    }

    if (!mustChangePassword && isForceResetPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Redirect authenticated users trying to access login/register pages back to dashboard
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (svg, png, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
