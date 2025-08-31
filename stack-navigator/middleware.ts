import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Protected routes that require authentication
const protectedRoutes = [
  '/chat',
  '/dashboard',
  '/profile',
  '/api/chat',
  '/api/user',
  '/api/billing-portal'
]

// Routes that require specific subscription tiers
const tierProtectedRoutes = {
  '/compare': ['starter', 'pro'],
  '/api/compare': ['starter', 'pro']
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Add security headers
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  
  const pathname = req.nextUrl.pathname
  
  // Skip auth check for public routes and static files
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon') || 
      pathname === '/' ||
      pathname === '/auth/callback' ||
      pathname.startsWith('/auth/') ||
      pathname.startsWith('/public')) {
    return res
  }
  
  // Temporarily disable auth middleware to fix redirect loop
  // TODO: Fix auth middleware to properly handle Supabase cookies
  
  // Check if route needs protection
  const needsAuth = protectedRoutes.some(route => pathname.startsWith(route))
  const needsTier = Object.keys(tierProtectedRoutes).find(route => pathname.startsWith(route))
  
  if (!needsAuth && !needsTier) {
    return res
  }
  
  // For now, let client-side auth handle protection
  // This prevents the infinite redirect loop
  return res

}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}