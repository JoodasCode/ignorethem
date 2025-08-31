import Stripe from 'stripe'

// Use test key for testing environment
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 
  (process.env.NODE_ENV === 'test' ? 'sk_test_123' : undefined)

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

export const STRIPE_CONFIG = {
  STARTER_PRICE_ID: process.env.STRIPE_STARTER_PRICE_ID || 
    (process.env.NODE_ENV === 'test' ? 'price_test_starter' : ''),
  WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 
    (process.env.NODE_ENV === 'test' ? 'whsec_test' : ''),
  PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 
    (process.env.NODE_ENV === 'test' ? 'pk_test_123' : ''),
} as const

export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  STARTER: 'starter',
  PRO: 'pro',
} as const

export type SubscriptionTier = typeof SUBSCRIPTION_TIERS[keyof typeof SUBSCRIPTION_TIERS]