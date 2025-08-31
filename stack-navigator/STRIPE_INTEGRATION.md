# Stripe Subscription Integration

This document describes the complete Stripe subscription integration for Stack Navigator's freemium model.

## Overview

Stack Navigator uses Stripe to manage subscriptions for the freemium model:

- **Free Tier**: 1 stack generation (lifetime), 20 messages per conversation, save 1 conversation
- **Starter Tier**: $4.99/month - 5 stacks per month, unlimited messages, unlimited saved conversations, compare up to 3 stacks
- **Pro Tier**: Coming soon - unlimited everything + team features

## Architecture

### Components

1. **Stripe Configuration** (`lib/stripe.ts`)
   - Server-side Stripe client initialization
   - Configuration constants for price IDs and webhook secrets

2. **Subscription Service** (`lib/subscription-service.ts`)
   - Customer creation and management
   - Checkout session creation
   - Billing portal integration
   - Subscription status synchronization

3. **API Endpoints**
   - `POST /api/checkout` - Create Stripe checkout sessions
   - `POST /api/billing-portal` - Create billing portal sessions
   - `POST /api/webhooks/stripe` - Handle Stripe webhook events

4. **React Hooks** (`hooks/use-subscription.ts`)
   - Client-side subscription management
   - Checkout and billing portal integration

5. **UI Components**
   - `components/subscription-management.tsx` - Subscription dashboard
   - `components/upgrade-prompt.tsx` - Upgrade prompts with Stripe integration

## Database Schema

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### Users Table Updates
```sql
ALTER TABLE users 
ADD COLUMN stripe_customer_id TEXT UNIQUE,
ADD COLUMN subscription_tier TEXT DEFAULT 'free',
ADD COLUMN subscription_status TEXT DEFAULT 'active';
```

## Environment Variables

Required environment variables for Stripe integration:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000 # or production URL
```

## Setup Instructions

### 1. Stripe Dashboard Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard
3. Create a product for "Stack Navigator Starter"
4. Create a recurring price ($4.99/month) and note the price ID
5. Set up a webhook endpoint pointing to your app's `/api/webhooks/stripe`
6. Configure webhook to listen for these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 2. Database Migration

Run the database migration to add subscription tables:

```sql
-- Run the migration in stack-navigator/lib/migrations/add-subscription-tables.sql
```

### 3. Environment Configuration

Add the Stripe environment variables to your `.env.local` file.

### 4. Test the Integration

```bash
# Run the Stripe integration tests
npm test -- --testPathPatterns=stripe-integration.test.ts
npm test -- --testPathPatterns=stripe-api-integration.test.ts
```

## Usage

### Creating a Checkout Session

```typescript
import { useSubscription } from '@/hooks/use-subscription'

function UpgradeButton() {
  const { createCheckoutSession, isLoading } = useSubscription()

  const handleUpgrade = async () => {
    await createCheckoutSession('starter')
    // User will be redirected to Stripe Checkout
  }

  return (
    <button onClick={handleUpgrade} disabled={isLoading}>
      Upgrade to Starter
    </button>
  )
}
```

### Managing Billing

```typescript
import { useSubscription } from '@/hooks/use-subscription'

function BillingButton() {
  const { createBillingPortalSession } = useSubscription()

  const handleBilling = async () => {
    await createBillingPortalSession()
    // User will be redirected to Stripe Billing Portal
  }

  return (
    <button onClick={handleBilling}>
      Manage Billing
    </button>
  )
}
```

### Checking Subscription Status

```typescript
import { useSubscription } from '@/hooks/use-subscription'

function SubscriptionStatus() {
  const { subscription, tier, hasActiveSubscription } = useSubscription()

  if (hasActiveSubscription) {
    return <div>Active {tier} subscription</div>
  }

  return <div>Free tier</div>
}
```

## Webhook Handling

The webhook handler at `/api/webhooks/stripe` processes the following events:

### Subscription Events
- **subscription.created**: Creates subscription record in database
- **subscription.updated**: Updates subscription status and billing period
- **subscription.deleted**: Marks subscription as canceled

### Payment Events
- **checkout.session.completed**: Confirms successful subscription creation
- **invoice.payment_succeeded**: Confirms successful payment
- **invoice.payment_failed**: Handles failed payments

### Usage Limit Updates

When a subscription becomes active, the system automatically:
1. Updates the user's tier in the database
2. Resets their usage limits based on the new tier
3. Creates a new usage tracking period

## Security Considerations

### Webhook Security
- All webhooks are verified using Stripe's signature verification
- Invalid signatures are rejected with 400 status
- Webhook secrets are stored securely in environment variables

### API Security
- All subscription endpoints require user authentication
- Users can only access their own subscription data
- Row Level Security (RLS) policies protect subscription data

### Data Protection
- Sensitive Stripe data is not stored in the database
- Only necessary metadata (customer ID, subscription ID) is stored
- All API keys are stored as environment variables

## Testing

### Test Environment
- Use Stripe test keys for development and testing
- Test webhooks using Stripe CLI or webhook testing tools
- Verify all subscription flows in test mode before going live

### Test Cards
Use Stripe's test card numbers:
- `4242424242424242` - Successful payment
- `4000000000000002` - Card declined
- `4000000000009995` - Insufficient funds

## Monitoring and Analytics

### Subscription Metrics
Track key metrics:
- Conversion rate from free to paid
- Monthly recurring revenue (MRR)
- Churn rate
- Customer lifetime value (CLV)

### Error Monitoring
- All Stripe API errors are logged
- Webhook failures are tracked
- Failed payments trigger notifications

## Production Deployment

### Checklist
- [ ] Replace test API keys with live keys
- [ ] Update webhook endpoint to production URL
- [ ] Test all subscription flows in production
- [ ] Set up monitoring and alerting
- [ ] Configure backup webhook endpoints
- [ ] Test subscription cancellation and reactivation

### Scaling Considerations
- Webhook endpoints should be idempotent
- Consider implementing webhook retry logic
- Monitor webhook processing times
- Set up database connection pooling for high volume

## Troubleshooting

### Common Issues

1. **Webhook signature verification fails**
   - Check that STRIPE_WEBHOOK_SECRET is correct
   - Ensure webhook endpoint URL is accessible
   - Verify webhook is configured for correct events

2. **Checkout session creation fails**
   - Verify STRIPE_SECRET_KEY is valid
   - Check that price ID exists and is active
   - Ensure customer creation is working

3. **Subscription status not updating**
   - Check webhook delivery in Stripe Dashboard
   - Verify database permissions for webhook handler
   - Check for errors in webhook processing logs

### Debug Mode
Enable debug logging by setting:
```bash
STRIPE_DEBUG=true
```

This will log all Stripe API requests and responses for debugging.