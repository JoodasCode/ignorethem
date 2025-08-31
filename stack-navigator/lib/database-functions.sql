-- Database functions for usage tracking and freemium limits

-- Function to get current usage period for a user
CREATE OR REPLACE FUNCTION get_current_usage_period(p_user_id UUID)
RETURNS usage_tracking AS $$
DECLARE
  current_usage usage_tracking;
BEGIN
  -- Try to get current active usage period
  SELECT * INTO current_usage
  FROM usage_tracking
  WHERE user_id = p_user_id
    AND period_end > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no active period found, create a new one
  IF current_usage IS NULL THEN
    INSERT INTO usage_tracking (
      user_id,
      period_start,
      period_end,
      stack_generations_used,
      stack_generations_limit,
      conversations_saved,
      conversations_limit,
      messages_sent,
      messages_limit
    ) VALUES (
      p_user_id,
      NOW(),
      DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
      0,
      CASE 
        WHEN EXISTS(SELECT 1 FROM subscriptions WHERE user_id = p_user_id AND status = 'active' AND tier != 'free') 
        THEN 5  -- Starter tier gets 5 per month
        ELSE 1  -- Free tier gets 1 lifetime
      END,
      0,
      CASE 
        WHEN EXISTS(SELECT 1 FROM subscriptions WHERE user_id = p_user_id AND status = 'active' AND tier != 'free') 
        THEN -1  -- Unlimited for paid tiers
        ELSE 1   -- 1 for free tier
      END,
      0,
      CASE 
        WHEN EXISTS(SELECT 1 FROM subscriptions WHERE user_id = p_user_id AND status = 'active' AND tier != 'free') 
        THEN -1  -- Unlimited for paid tiers
        ELSE 20  -- 20 messages per conversation for free tier
      END
    )
    RETURNING * INTO current_usage;
  END IF;
  
  RETURN current_usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can generate a stack
CREATE OR REPLACE FUNCTION can_generate_stack(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier TEXT;
  current_usage usage_tracking;
BEGIN
  -- Get user tier
  SELECT COALESCE(s.tier, 'free') INTO user_tier
  FROM users u
  LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
  WHERE u.id = p_user_id;
  
  -- Get current usage
  SELECT * INTO current_usage FROM get_current_usage_period(p_user_id);
  
  -- Check limits based on tier
  IF user_tier = 'free' THEN
    -- Free tier: 1 stack generation lifetime
    RETURN current_usage.stack_generations_used < current_usage.stack_generations_limit;
  ELSIF user_tier = 'starter' THEN
    -- Starter tier: 5 stacks per month
    RETURN current_usage.stack_generations_used < current_usage.stack_generations_limit;
  ELSE
    -- Pro tier: unlimited
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can save a conversation
CREATE OR REPLACE FUNCTION can_save_conversation(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier TEXT;
  current_usage usage_tracking;
BEGIN
  -- Get user tier
  SELECT COALESCE(s.tier, 'free') INTO user_tier
  FROM users u
  LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
  WHERE u.id = p_user_id;
  
  -- Get current usage
  SELECT * INTO current_usage FROM get_current_usage_period(p_user_id);
  
  -- Check limits based on tier
  IF user_tier = 'free' THEN
    -- Free tier: 1 saved conversation
    RETURN current_usage.conversations_saved < current_usage.conversations_limit;
  ELSE
    -- Paid tiers: unlimited
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can send a message in a conversation
CREATE OR REPLACE FUNCTION can_send_message(p_user_id UUID, p_conversation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier TEXT;
  message_count INTEGER;
BEGIN
  -- Get user tier
  SELECT COALESCE(s.tier, 'free') INTO user_tier
  FROM users u
  LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
  WHERE u.id = p_user_id;
  
  -- For paid tiers, unlimited messages
  IF user_tier != 'free' THEN
    RETURN TRUE;
  END IF;
  
  -- For free tier, check message count in conversation
  SELECT COUNT(*) INTO message_count
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  WHERE c.id = p_conversation_id
    AND (c.user_id = p_user_id OR c.user_id IS NULL);
  
  -- Free tier: 20 messages per conversation
  RETURN message_count < 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment stack generation usage
CREATE OR REPLACE FUNCTION increment_stack_generation(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_usage usage_tracking;
  can_generate BOOLEAN;
BEGIN
  -- Check if user can generate
  SELECT can_generate_stack(p_user_id) INTO can_generate;
  
  IF NOT can_generate THEN
    RETURN FALSE;
  END IF;
  
  -- Get current usage period
  SELECT * INTO current_usage FROM get_current_usage_period(p_user_id);
  
  -- Increment usage
  UPDATE usage_tracking
  SET 
    stack_generations_used = stack_generations_used + 1,
    updated_at = NOW()
  WHERE id = current_usage.id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment conversation save count
CREATE OR REPLACE FUNCTION increment_conversation_save(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_usage usage_tracking;
  can_save BOOLEAN;
BEGIN
  -- Check if user can save
  SELECT can_save_conversation(p_user_id) INTO can_save;
  
  IF NOT can_save THEN
    RETURN FALSE;
  END IF;
  
  -- Get current usage period
  SELECT * INTO current_usage FROM get_current_usage_period(p_user_id);
  
  -- Increment usage
  UPDATE usage_tracking
  SET 
    conversations_saved = conversations_saved + 1,
    updated_at = NOW()
  WHERE id = current_usage.id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset usage for subscription tiers (called by cron)
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS INTEGER AS $$
DECLARE
  reset_count INTEGER := 0;
  user_record RECORD;
BEGIN
  -- Find users with expired usage periods who have active subscriptions
  FOR user_record IN
    SELECT DISTINCT ut.user_id
    FROM usage_tracking ut
    JOIN subscriptions s ON ut.user_id = s.user_id
    WHERE ut.period_end <= NOW()
      AND s.status = 'active'
      AND s.tier IN ('starter', 'pro')
  LOOP
    -- Create new usage period
    INSERT INTO usage_tracking (
      user_id,
      period_start,
      period_end,
      stack_generations_used,
      stack_generations_limit,
      conversations_saved,
      conversations_limit,
      messages_sent,
      messages_limit
    ) VALUES (
      user_record.user_id,
      NOW(),
      DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
      0,
      CASE 
        WHEN EXISTS(SELECT 1 FROM subscriptions WHERE user_id = user_record.user_id AND tier = 'pro') 
        THEN -1  -- Unlimited for Pro
        ELSE 5   -- 5 for Starter
      END,
      0,
      -1,  -- Unlimited conversations for paid tiers
      0,
      -1   -- Unlimited messages for paid tiers
    );
    
    reset_count := reset_count + 1;
  END LOOP;
  
  RETURN reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update subscription tier limits when subscription changes
CREATE OR REPLACE FUNCTION update_usage_limits_on_subscription_change()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger to update usage limits when subscription changes
DROP TRIGGER IF EXISTS trigger_update_usage_limits ON subscriptions;
CREATE TRIGGER trigger_update_usage_limits
  AFTER INSERT OR UPDATE OF tier, status ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_usage_limits_on_subscription_change();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_current_usage_period(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_generate_stack(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_save_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_send_message(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_stack_generation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_conversation_save(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_monthly_usage() TO service_role;