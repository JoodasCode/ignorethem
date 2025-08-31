import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe'
import { subscriptionService } from '@/lib/subscription-service'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No Stripe signature found' },
      { status: 400 }
    )
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_CONFIG.WEBHOOK_SECRET
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(event.data.object)
        break

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionChange(subscription: any) {
  console.log('Handling subscription change:', subscription.id)
  
  try {
    await subscriptionService.updateSubscriptionFromStripe(subscription)
    
    // Reset usage limits when subscription becomes active
    if (subscription.status === 'active') {
      const userId = subscription.metadata.userId
      if (userId) {
        // Import usage tracking service to reset limits
        const { usageTrackingService } = await import('@/lib/usage-tracking')
        await usageTrackingService.resetMonthlyUsage(userId)
      }
    }
  } catch (error) {
    console.error('Failed to handle subscription change:', error)
    throw error
  }
}

async function handleCheckoutCompleted(session: any) {
  console.log('Handling checkout completed:', session.id)
  
  try {
    // The subscription should already be created by this point
    // We can optionally send a welcome email or trigger other actions
    const userId = session.metadata?.userId
    if (userId) {
      console.log(`Checkout completed for user: ${userId}`)
      // TODO: Send welcome email or trigger onboarding flow
    }
  } catch (error) {
    console.error('Failed to handle checkout completion:', error)
    throw error
  }
}

async function handlePaymentSucceeded(invoice: any) {
  console.log('Handling payment succeeded:', invoice.id)
  
  try {
    // Payment succeeded - subscription should remain active
    // We can optionally send a receipt email or update analytics
    const subscriptionId = invoice.subscription
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const userId = subscription.metadata.userId
      if (userId) {
        console.log(`Payment succeeded for user: ${userId}`)
        // TODO: Send receipt email or update analytics
      }
    }
  } catch (error) {
    console.error('Failed to handle payment success:', error)
    throw error
  }
}

async function handlePaymentFailed(invoice: any) {
  console.log('Handling payment failed:', invoice.id)
  
  try {
    // Payment failed - subscription may be past due
    const subscriptionId = invoice.subscription
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      await subscriptionService.updateSubscriptionFromStripe(subscription)
      
      const userId = subscription.metadata.userId
      if (userId) {
        console.log(`Payment failed for user: ${userId}`)
        // TODO: Send payment failure notification email
      }
    }
  } catch (error) {
    console.error('Failed to handle payment failure:', error)
    throw error
  }
}