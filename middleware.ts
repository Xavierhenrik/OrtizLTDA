import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareSupabase } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (request.method === 'POST' && path === '/admin/login') {
    return NextResponse.rewrite(new URL('/api/auth/admin-login', request.url));
  }

  // Rotas que não precisam de refresh de sessão no middleware — evita loading infinito se o Supabase
  // demorar ou falhar na rede (getUser() bloqueava até a home).
  if (
    path === '/' ||
    path === '/projetos' ||
    path === '/admin/login' ||
    path === '/admin/logout'
  ) {
    return NextResponse.next();
  }

  const { supabase, response } = createMiddlewareSupabase(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLogin = path === '/admin/login' || path.startsWith('/admin/login/');
  const isLogout = path === '/admin/logout' || path.startsWith('/admin/logout/');
  const needsAdminPage =
    path === '/admin' ||
    (path.startsWith('/admin/') && !isLogin && !isLogout);

  if (needsAdminPage) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|woff2?)$).*)',
  ],
};
