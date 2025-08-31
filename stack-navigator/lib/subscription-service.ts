import { stripe, STRIPE_CONFIG, SUBSCRIPTION_TIERS, type SubscriptionTier } from './stripe'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

export interface SubscriptionData {
  id: string
  userId: string
  stripeCustomerId: string
  stripeSubscriptionId: string | null
  tier: SubscriptionTier
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  createdAt: Date
  updatedAt: Date
}

export class SubscriptionService {
  /**
   * Create or retrieve Stripe customer for user
   */
  async createOrGetCustomer(user: User): Promise<string> {
    // Check if user already has a Stripe customer ID
    const { data: existingUser } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (existingUser?.stripe_customer_id) {
      return existingUser.stripe_customer_id
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email!,
      metadata: {
        userId: user.id,
      },
    })

    // Update user record with Stripe customer ID
    await supabase
      .from('users')
      .update({ stripe_customer_id: customer.id })
      .eq('id', user.id)

    return customer.id
  }

  /**
   * Create checkout session for Starter tier subscription
   */
  async createCheckoutSession(
    userId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      throw new Error('User not authenticated')
    }

    const customerId = await this.createOrGetCustomer(user.user)

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_CONFIG.STARTER_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
    })

    return session.url!
  }

  /**
   * Create billing portal session for subscription management
   */
  async createBillingPortalSession(userId: string, returnUrl: string): Promise<string> {
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (!user?.stripe_customer_id) {
      throw new Error('No Stripe customer found for user')
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: returnUrl,
    })

    return session.url
  }

  /**
   * Get subscription data for user
   */
  async getSubscription(userId: string): Promise<SubscriptionData | null> {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!data) return null

    return {
      id: data.id,
      userId: data.user_id,
      stripeCustomerId: data.stripe_customer_id,
      stripeSubscriptionId: data.stripe_subscription_id,
      tier: data.tier as SubscriptionTier,
      status: data.status,
      currentPeriodStart: new Date(data.current_period_start),
      currentPeriodEnd: new Date(data.current_period_end),
      cancelAtPeriodEnd: data.cancel_at_period_end,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  }

  /**
   * Update subscription in database from Stripe webhook
   */
  async updateSubscriptionFromStripe(stripeSubscription: any): Promise<void> {
    const userId = stripeSubscription.metadata.userId
    if (!userId) {
      throw new Error('No userId in subscription metadata')
    }

    const subscriptionData = {
      user_id: userId,
      stripe_customer_id: stripeSubscription.customer,
      stripe_subscription_id: stripeSubscription.id,
      tier: this.getTierFromPriceId(stripeSubscription.items.data[0].price.id),
      status: stripeSubscription.status,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    }

    // Upsert subscription record
    await supabase
      .from('subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id',
      })

    // Update user tier
    await supabase
      .from('users')
      .update({
        subscription_tier: subscriptionData.tier,
        subscription_status: subscriptionData.status,
      })
      .eq('id', userId)
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string): Promise<void> {
    const subscription = await this.getSubscription(userId)
    if (!subscription?.stripeSubscriptionId) {
      throw new Error('No active subscription found')
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(userId: string): Promise<void> {
    const subscription = await this.getSubscription(userId)
    if (!subscription?.stripeSubscriptionId) {
      throw new Error('No subscription found')
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    })
  }

  /**
   * Get tier from Stripe price ID
   */
  private getTierFromPriceId(priceId: string): SubscriptionTier {
    if (priceId === STRIPE_CONFIG.STARTER_PRICE_ID) {
      return SUBSCRIPTION_TIERS.STARTER
    }
    return SUBSCRIPTION_TIERS.FREE
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.getSubscription(userId)
    return subscription?.status === 'active' || subscription?.status === 'trialing'
  }

  /**
   * Get user's current tier
   */
  async getUserTier(userId: string): Promise<SubscriptionTier> {
    const subscription = await this.getSubscription(userId)
    if (!subscription || subscription.status !== 'active') {
      return SUBSCRIPTION_TIERS.FREE
    }
    return subscription.tier
  }
}

export const subscriptionService = new SubscriptionService()