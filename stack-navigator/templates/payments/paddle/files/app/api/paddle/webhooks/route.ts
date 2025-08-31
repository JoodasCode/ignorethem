import { NextRequest, NextResponse } from 'next/server'
import { paddle } from '@/lib/paddle/server'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('paddle-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing paddle-signature header' },
      { status: 400 }
    )
  }

  // Verify webhook signature
  if (!paddle.verifyWebhookSignature(body, signature)) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  let event
  try {
    event = JSON.parse(body)
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    )
  }

  try {
    switch (event.event_type) {
      case 'transaction.completed':
        await handleTransactionCompleted(event.data)
        break

      case 'subscription.created':
        await handleSubscriptionCreated(event.data)
        break

      case 'subscription.updated':
        await handleSubscriptionUpdated(event.data)
        break

      case 'subscription.canceled':
        await handleSubscriptionCanceled(event.data)
        break

      case 'subscription.paused':
        await handleSubscriptionPaused(event.data)
        break

      case 'subscription.resumed':
        await handleSubscriptionResumed(event.data)
        break

      default:
        console.log(`Unhandled event type: ${event.event_type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleTransactionCompleted(transaction: any) {
  console.log('Transaction completed:', transaction.id)
  
  // TODO: Update your database with the successful payment
  // Example:
  // - Update user account
  // - Grant access to purchased items
  // - Send confirmation email
}

async function handleSubscriptionCreated(subscription: any) {
  console.log('Subscription created:', subscription.id)
  
  // TODO: Update your database
  // Example:
  // - Create subscription record
  // - Update user's subscription status
  // - Grant premium access
}

async function handleSubscriptionUpdated(subscription: any) {
  console.log('Subscription updated:', subscription.id)
  
  // TODO: Update your database
  // Example:
  // - Update subscription details
  // - Handle plan changes
  // - Update billing information
}

async function handleSubscriptionCanceled(subscription: any) {
  console.log('Subscription canceled:', subscription.id)
  
  // TODO: Update your database
  // Example:
  // - Mark subscription as cancelled
  // - Revoke premium access (if immediate)
  // - Send cancellation confirmation
}

async function handleSubscriptionPaused(subscription: any) {
  console.log('Subscription paused:', subscription.id)
  
  // TODO: Update your database
  // Example:
  // - Mark subscription as paused
  // - Temporarily revoke access
}

async function handleSubscriptionResumed(subscription: any) {
  console.log('Subscription resumed:', subscription.id)
  
  // TODO: Update your database
  // Example:
  // - Mark subscription as active
  // - Restore access
}