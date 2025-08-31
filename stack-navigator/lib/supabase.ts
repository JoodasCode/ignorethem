import { createClient } from '@supabase/supabase-js'

// Use test values for testing environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
  (process.env.NODE_ENV === 'test' ? 'https://test.supabase.co' : '')
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  (process.env.NODE_ENV === 'test' ? 'test-anon-key' : '')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Re-export createClient for convenience
export { createClient }

// Database types
export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
  last_active_at: string
  name?: string
  avatar_url?: string
  theme: 'light' | 'dark' | 'system'
  email_notifications: boolean
  total_projects: number
  total_downloads: number
}

export interface Conversation {
  id: string
  user_id?: string
  session_id: string
  title?: string
  phase: 'discovery' | 'requirements' | 'constraints' | 'recommendation' | 'refinement'
  status: 'active' | 'completed' | 'abandoned'
  project_type?: string
  team_size?: 'solo' | 'small' | 'medium' | 'large'
  timeline?: 'asap' | 'weeks' | 'months'
  technical_expertise?: 'beginner' | 'intermediate' | 'advanced'
  budget_constraints?: 'minimal' | 'moderate' | 'flexible'
  created_at: string
  updated_at: string
  completed_at?: string
  message_count: number
  duration_minutes?: number
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  model_used?: string
  tokens_used?: number
  processing_time_ms?: number
  created_at: string
  sequence_number: number
}

export interface Project {
  id: string
  user_id?: string
  conversation_id?: string
  name: string
  description?: string
  stack_selections: Record<string, any>
  generation_status: 'pending' | 'generating' | 'completed' | 'failed'
  generation_started_at?: string
  generation_completed_at?: string
  generation_error?: string
  zip_file_size?: number
  zip_file_url?: string
  download_count: number
  last_downloaded_at?: string
  last_accessed_at: string
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  stripe_price_id?: string
  tier: 'free' | 'starter' | 'pro'
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete'
  current_period_start?: string
  current_period_end?: string
  cancel_at_period_end: boolean
  canceled_at?: string
  created_at: string
  updated_at: string
}

export interface UsageTracking {
  id: string
  user_id: string
  period_start: string
  period_end: string
  stack_generations_used: number
  stack_generations_limit: number
  conversations_saved: number
  conversations_limit: number
  messages_sent: number
  messages_limit: number
  created_at: string
  updated_at: string
}

export interface Technology {
  id: string
  name: string
  slug: string
  category: string
  description?: string
  website_url?: string
  documentation_url?: string
  logo_url?: string
  pricing_model?: string
  complexity_score: number
  popularity_score: number
  compatible_with: string[]
  conflicts_with: string[]
  template_config: Record<string, any>
  usage_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PopularStack {
  id: string
  name: string
  description: string
  category: string
  technologies: string[]
  stack_config: Record<string, any>
  icon_url?: string
  preview_image_url?: string
  usage_count: number
  rating: number
  rating_count: number
  setup_time_minutes: number
  is_featured: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StackRating {
  id: string
  stack_id: string
  user_id?: string
  rating: number
  review?: string
  created_at: string
}

export interface StackUsage {
  id: string
  stack_id: string
  user_id?: string
  ip_address?: string
  user_agent?: string
  created_at: string
}