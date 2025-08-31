import { NextRequest, NextResponse } from 'next/server'
import { subscriptionService } from '@/lib/subscription-service'
import { supabase } from '@/lib/supabase'

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

    // Check if user has a subscription
    const subscription = await subscriptionService.getSubscription(user.id)
    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    // Create billing portal session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const returnUrl = `${baseUrl}/dashboard`

    const portalUrl = await subscriptionService.createBillingPortalSession(
      user.id,
      returnUrl
    )

    return NextResponse.json({ url: portalUrl })
  } catch (error) {
    console.error('Billing portal session creation failed:', error)
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    )
  }
}