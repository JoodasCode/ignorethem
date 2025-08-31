import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const config = {
  currency: 'usd',
  payment_method_types: ['card'],
}

// Helper functions for common Stripe operations
export const stripeHelpers = {
  // Create a checkout session for one-time payments
  async createCheckoutSession({
    priceId,
    successUrl,
    cancelUrl,
    customerId,
    metadata = {},
  }: {
    priceId: string
    successUrl: string
    cancelUrl: string
    customerId?: string
    metadata?: Record<string, string>
  }) {
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: config.payment_method_types,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    })
  },

  // Create a subscription checkout session
  async createSubscriptionSession({
    priceId,
    successUrl,
    cancelUrl,
    customerId,
    trialPeriodDays,
    metadata = {},
  }: {
    priceId: string
    successUrl: string
    cancelUrl: string
    customerId?: string
    trialPeriodDays?: number
    metadata?: Record<string, string>
  }) {
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: config.payment_method_types,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    }

    if (trialPeriodDays) {
      sessionConfig.subscription_data = {
        trial_period_days: trialPeriodDays,
      }
    }

    return await stripe.checkout.sessions.create(sessionConfig)
  },

  // Create or retrieve a customer
  async createOrRetrieveCustomer({
    email,
    userId,
    name,
  }: {
    email: string
    userId: string
    name?: string
  }) {
    // First, try to find existing customer
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0]
    }

    // Create new customer
    return await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    })
  },

  // Create a billing portal session
  async createBillingPortalSession({
    customerId,
    returnUrl,
  }: {
    customerId: string
    returnUrl: string
  }) {
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })
  },

  // Get customer subscriptions
  async getCustomerSubscriptions(customerId: string) {
    return await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      expand: ['data.default_payment_method'],
    })
  },

  // Cancel a subscription
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true) {
    if (cancelAtPeriodEnd) {
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      })
    } else {
      return await stripe.subscriptions.cancel(subscriptionId)
    }
  },

  // Update subscription
  async updateSubscription({
    subscriptionId,
    priceId,
    prorationBehavior = 'create_prorations',
  }: {
    subscriptionId: string
    priceId: string
    prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice'
  }) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    return await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: priceId,
        },
      ],
      proration_behavior: prorationBehavior,
    })
  },

  // Construct webhook event
  constructWebhookEvent(body: string | Buffer, signature: string) {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  },
}