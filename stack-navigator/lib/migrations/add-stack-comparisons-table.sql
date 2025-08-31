-- Migration: Add stack comparisons table for tracking comparison usage
-- This supports the compare stacks feature for Starter tier users

-- Create stack_comparisons table
CREATE TABLE IF NOT EXISTS stack_comparisons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stack_ids TEXT[] NOT NULL, -- Array of stack IDs being compared
  comparison_count INTEGER NOT NULL DEFAULT 2, -- Number of stacks compared
  user_context JSONB, -- User context data (experience level, project type, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stack_comparisons_user_id ON stack_comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_stack_comparisons_created_at ON stack_comparisons(created_at);
CREATE INDEX IF NOT EXISTS idx_stack_comparisons_stack_ids ON stack_comparisons USING GIN(stack_ids);

-- Add RLS policies
ALTER TABLE stack_comparisons ENABLE ROW LEVEL SECURITY;

-- Users can only see their own comparisons
CREATE POLICY "Users can view own comparisons" ON stack_comparisons
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own comparisons
CREATE POLICY "Users can insert own comparisons" ON stack_comparisons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own comparisons
CREATE POLICY "Users can update own comparisons" ON stack_comparisons
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own comparisons
CREATE POLICY "Users can delete own comparisons" ON stack_comparisons
  FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_stack_comparisons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stack_comparisons_updated_at
  BEFORE UPDATE ON stack_comparisons
  FOR EACH ROW
  EXECUTE FUNCTION update_stack_comparisons_updated_at();

-- Add selected_stack_id to conversations table for tracking chosen stacks
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS selected_stack_id UUID REFERENCES popular_stacks(id) ON DELETE SET NULL;

-- Add index for selected_stack_id
CREATE INDEX IF NOT EXISTS idx_conversations_selected_stack_id ON conversations(selected_stack_id);

-- Add comment
COMMENT ON TABLE stack_comparisons IS 'Tracks stack comparison usage for analytics and tier validation';
COMMENT ON COLUMN stack_comparisons.stack_ids IS 'Array of stack IDs being compared (2-3 stacks)';
COMMENT ON COLUMN stack_comparisons.comparison_count IS 'Number of stacks in this comparison';
COMMENT ON COLUMN stack_comparisons.user_context IS 'User context for personalized recommendations';
COMMENT ON COLUMN conversations.selected_stack_id IS 'Stack chosen from comparison or browse pages';