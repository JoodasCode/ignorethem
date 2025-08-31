import Stripe from 'stripe'

// Use test key for testing environment or development
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 
  (process.env.NODE_ENV === 'test' ? 'sk_test_123' : 
   process.env.NODE_ENV === 'development' ? 'sk_test_dev_placeholder' : undefined)

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY is not set - Stripe functionality will be disabled')
}

export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
}) : null

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