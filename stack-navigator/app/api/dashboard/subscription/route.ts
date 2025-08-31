import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { subscriptionService } from '@/lib/subscription-service'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get subscription data
    const subscription = await subscriptionService.getSubscription(user.id)
    
    if (!subscription) {
      return NextResponse.json({
        subscription: null,
        tier: 'free',
        status: 'inactive'
      })
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        tier: subscription.tier,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt
      }
    })
  } catch (error) {
    console.error('Subscription fetch failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { action } = await request.json()

    if (!action || !['cancel', 'reactivate'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "cancel" or "reactivate"' },
        { status: 400 }
      )
    }

    if (action === 'cancel') {
      await subscriptionService.cancelSubscription(user.id)
    } else if (action === 'reactivate') {
      await subscriptionService.reactivateSubscription(user.id)
    }

    // Get updated subscription data
    const subscription = await subscriptionService.getSubscription(user.id)

    return NextResponse.json({
      subscription: subscription ? {
        id: subscription.id,
        tier: subscription.tier,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt
      } : null
    })
  } catch (error) {
    console.error('Subscription action failed:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}