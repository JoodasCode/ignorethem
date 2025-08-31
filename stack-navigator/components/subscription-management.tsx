'use client'

import { useState } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CreditCard, Crown, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function SubscriptionManagement() {
  const {
    subscription,
    tier,
    isLoading,
    error,
    hasActiveSubscription,
    createCheckoutSession,
    createBillingPortalSession,
    cancelSubscription,
    reactivateSubscription,
  } = useSubscription()

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleUpgrade = async () => {
    setActionLoading('upgrade')
    try {
      await createCheckoutSession('starter')
    } catch (err) {
      console.error('Upgrade failed:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleManageBilling = async () => {
    setActionLoading('billing')
    try {
      await createBillingPortalSession()
    } catch (err) {
      console.error('Billing portal failed:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async () => {
    setActionLoading('cancel')
    try {
      await cancelSubscription()
    } catch (err) {
      console.error('Cancel failed:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReactivate = async () => {
    setActionLoading('reactivate')
    try {
      await reactivateSubscription()
    } catch (err) {
      console.error('Reactivate failed:', err)
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading subscription...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>
            Manage your subscription and billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium capitalize">{tier} Plan</span>
                <Badge variant={hasActiveSubscription ? 'default' : 'secondary'}>
                  {subscription?.status || 'Free'}
                </Badge>
              </div>
              {subscription && (
                <p className="text-sm text-muted-foreground mt-1">
                  {subscription.cancelAtPeriodEnd
                    ? `Cancels on ${subscription.currentPeriodEnd.toLocaleDateString()}`
                    : `Renews on ${subscription.currentPeriodEnd.toLocaleDateString()}`}
                </p>
              )}
            </div>
            
            {tier === 'free' && (
              <Button
                onClick={handleUpgrade}
                disabled={actionLoading === 'upgrade'}
              >
                {actionLoading === 'upgrade' && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Upgrade to Starter
              </Button>
            )}
          </div>

          {tier === 'free' && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Upgrade to Starter ($4.99/month)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 5 stack generations per month</li>
                <li>• Unlimited messages per conversation</li>
                <li>• Save unlimited conversations</li>
                <li>• Compare up to 3 stacks side-by-side</li>
                <li>• Priority support</li>
              </ul>
            </div>
          )}

          {hasActiveSubscription && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleManageBilling}
                disabled={actionLoading === 'billing'}
              >
                {actionLoading === 'billing' && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Billing
              </Button>

              {subscription?.cancelAtPeriodEnd ? (
                <Button
                  variant="default"
                  onClick={handleReactivate}
                  disabled={actionLoading === 'reactivate'}
                >
                  {actionLoading === 'reactivate' && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Reactivate Subscription
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={actionLoading === 'cancel'}
                >
                  {actionLoading === 'cancel' && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Cancel Subscription
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Status:</span>
                <span className="ml-2 capitalize">{subscription.status}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tier:</span>
                <span className="ml-2 capitalize">{subscription.tier}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Current Period:</span>
                <span className="ml-2">
                  {subscription.currentPeriodStart.toLocaleDateString()} - {subscription.currentPeriodEnd.toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Auto-renew:</span>
                <span className="ml-2">{subscription.cancelAtPeriodEnd ? 'No' : 'Yes'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}