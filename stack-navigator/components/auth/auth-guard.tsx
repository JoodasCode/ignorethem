'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { AuthModal } from './auth-modal'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAuth?: boolean
}

export function AuthGuard({ children, fallback, requireAuth = true }: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated && requireAuth) {
      // Show modal instead of redirecting to avoid redirect loops
      setShowAuthModal(true)
    }
  }, [isAuthenticated, loading, requireAuth])

  // Show loading while checking auth
  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show auth modal if not authenticated
  if (!isAuthenticated && requireAuth) {
    return (
      <>
        {fallback || (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Authentication Required</h2>
              <p className="text-muted-foreground">
                Please sign in to access this page.
              </p>
            </div>
          </div>
        )}
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)}
          defaultTab="signin"
        />
      </>
    )
  }

  // Show children if authenticated
  if (isAuthenticated) {
    return <>{children}</>
  }

  // Show fallback while redirecting
  return fallback || (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}