-- Migration: Add subscription and usage tracking tables
-- This migration adds the necessary tables for Stripe subscription integration

-- Add subscription fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing'));

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Stripe integration
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  
  -- Subscription details
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing')),
  
  -- Billing period
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one subscription per user
  UNIQUE(user_id)
);

-- Enable RLS on subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Create usage tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Usage period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Stack generation limits
  stack_generations_used INTEGER DEFAULT 0,
  stack_generations_limit INTEGER DEFAULT 1, -- -1 for unlimited
  
  -- Conversation limits
  conversations_saved INTEGER DEFAULT 0,
  conversations_limit INTEGER DEFAULT 1, -- -1 for unlimited
  
  -- Message limits (per conversation)
  messages_sent INTEGER DEFAULT 0,
  messages_limit INTEGER DEFAULT 20, -- -1 for unlimited
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on usage_tracking
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for usage_tracking
CREATE POLICY "Users can view own usage" ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage" ON usage_tracking
  FOR ALL USING (auth.role() = 'service_role');

-- Indexes for usage_tracking
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_period ON usage_tracking(user_id, period_end DESC);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period_end ON usage_tracking(period_end);

-- Function to update subscription tier limits when subscription changes
CREATE OR REPLACE FUNCTION update_usage_limits_on_subscription_change()
RETURNS TRIGGER AS $
BEGIN
  -- Update current usage period limits based on new subscription
  UPDATE usage_tracking
  SET 
    stack_generations_limit = CASE 
      WHEN NEW.tier = 'free' THEN 1
      WHEN NEW.tier = 'starter' THEN 5
      ELSE -1  -- Pro tier unlimited
    END,
    conversations_limit = CASE 
      WHEN NEW.tier = 'free' THEN 1
      ELSE -1  -- Paid tiers unlimited
    END,
    messages_limit = CASE 
      WHEN NEW.tier = 'free' THEN 20
      ELSE -1  -- Paid tiers unlimited
    END,
    updated_at = NOW()
  WHERE user_id = NEW.user_id
    AND period_end > NOW();
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger to update usage limits when subscription changes
DROP TRIGGER IF EXISTS trigger_update_usage_limits ON subscriptions;
CREATE TRIGGER trigger_update_usage_limits
  AFTER INSERT OR UPDATE OF tier, status ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_usage_limits_on_subscription_change();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON subscriptions TO authenticated;
GRANT SELECT ON usage_tracking TO authenticated;