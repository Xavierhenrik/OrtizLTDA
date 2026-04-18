import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareSupabase } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (request.method === 'POST' && path === '/admin/login') {
    return NextResponse.rewrite(new URL('/api/auth/admin-login', request.url));
  }

  if (
    request.method === 'GET' &&
    (path === '/admin/login' || path.startsWith('/admin/login/'))
  ) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (path === '/' || path === '/projetos' || path === '/admin/logout') {
    return NextResponse.next();
  }

  const { supabase, response } = createMiddlewareSupabase(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLogout = path.startsWith('/admin/logout');
  const needsAdminPage =
    path === '/admin' || (path.startsWith('/admin/') && !isLogout);

  if (needsAdminPage) {
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|woff2?)$).*)',
  ],
};
