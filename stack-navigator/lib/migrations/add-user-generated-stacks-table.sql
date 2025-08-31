-- Migration: Add user_generated_stacks table
-- Description: Store user's generated tech stacks for re-download functionality

-- Create the user_generated_stacks table
CREATE TABLE IF NOT EXISTS user_generated_stacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  stack_name TEXT NOT NULL,
  stack_description TEXT,
  technologies JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_files JSONB,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_generated_stacks_user_id ON user_generated_stacks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_generated_stacks_conversation_id ON user_generated_stacks(conversation_id);
CREATE INDEX IF NOT EXISTS idx_user_generated_stacks_created_at ON user_generated_stacks(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_generated_stacks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own generated stacks" ON user_generated_stacks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generated stacks" ON user_generated_stacks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generated stacks" ON user_generated_stacks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own generated stacks" ON user_generated_stacks
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_generated_stacks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_generated_stacks_updated_at
  BEFORE UPDATE ON user_generated_stacks
  FOR EACH ROW
  EXECUTE FUNCTION update_user_generated_stacks_updated_at();

-- Add comment to table
COMMENT ON TABLE user_generated_stacks IS 'Stores user-generated tech stacks for re-download functionality';
COMMENT ON COLUMN user_generated_stacks.technologies IS 'Array of technology names/versions used in the stack';
COMMENT ON COLUMN user_generated_stacks.generated_files IS 'JSON structure containing generated files and their content';
COMMENT ON COLUMN user_generated_stacks.download_count IS 'Number of times this stack has been downloaded';