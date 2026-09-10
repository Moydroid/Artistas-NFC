import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Supabase guarda la sesión en cookies que empiezan con "sb-" y contienen "auth"
  const cookies = req.cookies.getAll();
  const hasSession = cookies.some(cookie => cookie.name.startsWith('sb-') && cookie.name.includes('auth'));

  // Si no hay sesión y trata de entrar al admin, lo mandamos al login
  if (!hasSession && req.nextUrl.pathname.startsWith('/admin')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

// Esto le dice a Next.js que solo aplique esto a las rutas de /admin
export const config = {
  matcher: ['/admin/:path*'],
};