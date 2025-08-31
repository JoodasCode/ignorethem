import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  // Create response
  const response = NextResponse.next();
  
  // Create Supabase client for middleware
  const supabase = createMiddlewareClient({ req: request, res: response });

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // Rate limiting for API routes (basic implementation)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    // Log API access for monitoring
    console.log(`API Access: ${request.method} ${request.nextUrl.pathname} from ${ip}`);
  }

  // Handle authentication for non-API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    try {
      // Refresh session if expired - required for Server Components
      const { data: { session } } = await supabase.auth.getSession();

      // Update last active timestamp for authenticated users
      if (session?.user) {
        try {
          await supabase
            .from('users')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', session.user.id);
        } catch (error) {
          console.error('Failed to update last active:', error);
        }
      }

      // Protected routes that require authentication
      const protectedRoutes = ['/dashboard', '/chat', '/settings'];
      const isProtectedRoute = protectedRoutes.some(route => 
        request.nextUrl.pathname.startsWith(route)
      );

      // Redirect to sign in if accessing protected route without session
      if (isProtectedRoute && !session) {
        const redirectUrl = new URL('/auth/signin', request.url);
        redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // Tier-restricted routes
      if (request.nextUrl.pathname.startsWith('/compare')) {
        if (!session) {
          const redirectUrl = new URL('/auth/signin', request.url);
          redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
          return NextResponse.redirect(redirectUrl);
        }

        // Check user tier for compare feature
        try {
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('tier')
            .eq('user_id', session.user.id)
            .eq('status', 'active')
            .single();

          const tier = subscription?.tier || 'free';
          
          if (tier === 'free') {
            // Redirect free users to upgrade page
            const redirectUrl = new URL('/upgrade', request.url);
            redirectUrl.searchParams.set('feature', 'compare');
            return NextResponse.redirect(redirectUrl);
          }
        } catch (error) {
          console.error('Failed to check user tier:', error);
          // Allow access on error to avoid blocking users
        }
      }
    } catch (error) {
      console.error('Middleware auth error:', error);
      // Continue without auth handling on error
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};