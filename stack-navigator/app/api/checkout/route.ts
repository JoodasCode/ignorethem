import { NextRequest, NextResponse } from 'next/server'
import { subscriptionService } from '@/lib/subscription-service'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { tier } = await request.json()

    // Validate tier
    if (tier !== 'starter') {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user already has an active subscription
    const hasActive = await subscriptionService.hasActiveSubscription(user.id)
    if (hasActive) {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      )
    }

    // Create checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successUrl = `${baseUrl}/dashboard?success=true`
    const cancelUrl = `${baseUrl}/dashboard?canceled=true`

    const checkoutUrl = await subscriptionService.createCheckoutSession(
      user.id,
      successUrl,
      cancelUrl
    )

    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    console.error('Checkout session creation failed:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}