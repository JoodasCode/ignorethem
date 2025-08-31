import { NextRequest, NextResponse } from 'next/server'
import { stripeHelpers } from '@/lib/stripe/server'

export async function POST(request: NextRequest) {
  try {
    const { priceId, mode = 'subscription', customerId, trialPeriodDays } = await request.json()

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000'
    const successUrl = `${origin}/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${origin}/cancel`

    let session

    if (mode === 'subscription') {
      session = await stripeHelpers.createSubscriptionSession({
        priceId,
        successUrl,
        cancelUrl,
        customerId,
        trialPeriodDays,
      })
    } else {
      session = await stripeHelpers.createCheckoutSession({
        priceId,
        successUrl,
        cancelUrl,
        customerId,
      })
    }

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}