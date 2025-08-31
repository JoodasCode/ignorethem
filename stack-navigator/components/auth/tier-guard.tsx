'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useUserSession } from '@/hooks/use-user-session'
import { AuthModal } from './auth-modal'
import { UpgradePrompt } from '@/components/upgrade-prompt'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Lock, Crown, Zap } from 'lucide-react'
import Link from 'next/link'

interface TierGuardProps {
  children: React.ReactNode
  requiredTier?: 'free' | 'starter' | 'pro'
  requireAuth?: boolean
  feature?: string
  fallback?: React.ReactNode
  redirectTo?: string
}

export function TierGuard({ 
  children, 
  requiredTier = 'free',
  requireAuth = false,
  feature,
  fallback,
  redirectTo 
}: TierGuardProps) {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { tier, isLoading: sessionLoading } = useUserSession()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const router = useRouter()

  const loading = authLoading || sessionLoading

  useEffect(() => {
    if (!loading) {
      // Check if auth is required
      if (requireAuth && !isAuthenticated) {
        if (redirectTo) {
          router.push(`/auth/signin?redirect_to=${encodeURIComponent(redirectTo)}`)
        } else {
          setShowAuthModal(true)
        }
        return
      }

      // Check tier requirements (only for authenticated users)
      if (isAuthenticated && requiredTier !== 'free') {
        const tierHierarchy = { free: 0, starter: 1, pro: 2 }
        const userTierLevel = tierHierarchy[tier as keyof typeof tierHierarchy] || 0
        const requiredTierLevel = tierHierarchy[requiredTier]

        if (userTierLevel < requiredTierLevel) {
          setShowUpgradePrompt(true)
          return
        }
      }
    }
  }, [loading, isAuthenticated, tier, requiredTier, requireAuth, redirectTo, router])

  // Show loading while checking auth/tier
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

  // Show auth modal if auth required but not authenticated
  if (requireAuth && !isAuthenticated && !redirectTo) {
    return (
      <>
        {fallback || (
          <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Sign In Required</CardTitle>
                <CardDescription>
                  {feature ? `Sign in to access ${feature}` : 'Please sign in to continue'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" onClick={() => setShowAuthModal(true)}>
                  Sign In
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Button variant="link" className="p-0 h-auto" onClick={() => setShowAuthModal(true)}>
                    Sign up free
                  </Button>
                </p>
              </CardContent>
            </Card>
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

  // Show upgrade prompt if tier insufficient
  if (isAuthenticated && showUpgradePrompt) {
    const getTierInfo = (tier: string) => {
      switch (tier) {
        case 'starter':
          return {
            name: 'Starter',
            price: '$4.99/month',
            icon: <Zap className="h-5 w-5" />,
            features: [
              '5 stack generations per month',
              'Unlimited messages per conversation',
              'Save unlimited conversations',
              'Compare up to 3 stacks side-by-side',
              'Advanced setup guides'
            ]
          }
        case 'pro':
          return {
            name: 'Pro',
            price: 'Coming Soon',
            icon: <Crown className="h-5 w-5" />,
            features: [
              'Unlimited stack generations',
              'Team collaboration features',
              'API access for integrations',
              'Custom requirements and constraints',
              'White-label options'
            ]
          }
        default:
          return null
      }
    }

    const tierInfo = getTierInfo(requiredTier)

    return (
      <>
        {fallback || (
          <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  {tierInfo?.icon}
                </div>
                <CardTitle className="flex items-center justify-center gap-2">
                  Upgrade to {tierInfo?.name}
                  <Badge variant="secondary">{tierInfo?.price}</Badge>
                </CardTitle>
                <CardDescription>
                  {feature ? `${feature} requires ${tierInfo?.name} tier` : `This feature requires ${tierInfo?.name} tier`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {tierInfo?.features && (
                  <div className="space-y-2">
                    <h4 className="font-medium">What you'll get:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {tierInfo.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex gap-2">
                  {requiredTier === 'starter' ? (
                    <Button className="flex-1" asChild>
                      <Link href="/api/checkout">
                        Upgrade to Starter
                      </Link>
                    </Button>
                  ) : (
                    <Button className="flex-1" disabled>
                      Coming Soon
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setShowUpgradePrompt(false)}>
                    Maybe Later
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        <UpgradePrompt 
          open={showUpgradePrompt} 
          onOpenChange={setShowUpgradePrompt}
          prompt={{
            title: `Upgrade to ${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}`,
            message: `${feature || 'This feature'} requires a ${requiredTier} subscription.`,
            targetTier: requiredTier,
            pricing: { monthly: requiredTier === 'starter' ? 4.99 : 19.99 },
            benefits: requiredTier === 'starter' 
              ? ['5 stack generations per month', 'Unlimited conversations', 'Priority support']
              : ['Unlimited stack generations', 'Advanced features', 'Priority support'],
            ctaText: `Upgrade to ${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}`
          }}
        />
      </>
    )
  }

  // Show children if all checks pass
  if (!requireAuth || isAuthenticated) {
    // For authenticated users, also check tier
    if (isAuthenticated && requiredTier !== 'free') {
      const tierHierarchy = { free: 0, starter: 1, pro: 2 }
      const userTierLevel = tierHierarchy[tier as keyof typeof tierHierarchy] || 0
      const requiredTierLevel = tierHierarchy[requiredTier]

      if (userTierLevel >= requiredTierLevel) {
        return <>{children}</>
      }
    } else {
      return <>{children}</>
    }
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