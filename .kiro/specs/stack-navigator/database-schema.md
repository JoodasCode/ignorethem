# Stack Navigator Database Schema

## Overview

This document defines the complete Supabase PostgreSQL schema needed for Stack Navigator, based on analysis of requirements, design specifications, UI implementation, and task requirements.

## Core Tables

### 1. Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Profile information
  name TEXT,
  avatar_url TEXT,
  
  -- Subscription information
  stripe_customer_id TEXT UNIQUE,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing')),
  
  -- Preferences
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  email_notifications BOOLEAN DEFAULT true,
  
  -- Analytics
  total_projects INTEGER DEFAULT 0,
  total_downloads INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### 2. Conversations Table
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL, -- For anonymous sessions
  
  -- Conversation metadata
  title TEXT,
  phase TEXT DEFAULT 'discovery' CHECK (phase IN ('discovery', 'requirements', 'constraints', 'recommendation', 'refinement')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  
  -- Project context analysis
  project_type TEXT, -- 'saas', 'ecommerce', 'internal', etc.
  team_size TEXT CHECK (team_size IN ('solo', 'small', 'medium', 'large')),
  timeline TEXT CHECK (timeline IN ('asap', 'weeks', 'months')),
  technical_expertise TEXT CHECK (technical_expertise IN ('beginner', 'intermediate', 'advanced')),
  budget_constraints TEXT CHECK (budget_constraints IN ('minimal', 'moderate', 'flexible')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Analytics
  message_count INTEGER DEFAULT 0,
  duration_minutes INTEGER
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);
```

### 3. Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  
  -- AI metadata (for assistant messages)
  model_used TEXT, -- 'gpt-4', 'gpt-3.5-turbo', etc.
  tokens_used INTEGER,
  processing_time_ms INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Message ordering
  sequence_number INTEGER NOT NULL
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view messages from own conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.user_id = auth.uid() OR conversations.user_id IS NULL)
    )
  );

CREATE POLICY "Users can create messages in own conversations" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.user_id = auth.uid() OR conversations.user_id IS NULL)
    )
  );

-- Indexes
CREATE INDEX idx_messages_conversation_sequence ON messages(conversation_id, sequence_number);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

### 4. Projects Table
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  
  -- Project metadata
  name TEXT NOT NULL,
  description TEXT,
  
  -- Stack selections (stored as JSONB for flexibility)
  stack_selections JSONB NOT NULL DEFAULT '{}',
  
  -- Generation metadata
  generation_status TEXT DEFAULT 'pending' CHECK (generation_status IN ('pending', 'generating', 'completed', 'failed')),
  generation_started_at TIMESTAMPTZ,
  generation_completed_at TIMESTAMPTZ,
  generation_error TEXT,
  
  -- File metadata
  zip_file_size INTEGER, -- in bytes
  zip_file_url TEXT, -- S3/storage URL if we store files
  
  -- Analytics
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_projects_user_created ON projects(user_id, created_at DESC);
CREATE INDEX idx_projects_status ON projects(generation_status);
```

### 5. Technology Stack Templates Table
```sql
CREATE TABLE stack_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template metadata
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'saas', 'ecommerce', 'blog', etc.
  
  -- Template configuration
  stack_config JSONB NOT NULL DEFAULT '{}', -- Technologies included
  features JSONB NOT NULL DEFAULT '[]', -- List of features
  
  -- Template files and structure
  template_files JSONB NOT NULL DEFAULT '{}', -- File structure and content
  dependencies JSONB NOT NULL DEFAULT '{}', -- npm dependencies
  env_variables JSONB NOT NULL DEFAULT '{}', -- Required environment variables
  
  -- Metadata
  setup_time_minutes INTEGER DEFAULT 15,
  complexity TEXT DEFAULT 'medium' CHECK (complexity IN ('simple', 'medium', 'complex')),
  
  -- Analytics
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_stack_templates_category ON stack_templates(category);
CREATE INDEX idx_stack_templates_active ON stack_templates(is_active);
CREATE INDEX idx_stack_templates_featured ON stack_templates(is_featured);
CREATE INDEX idx_stack_templates_usage ON stack_templates(usage_count DESC);
```

### 6. Technology Metadata Table
```sql
CREATE TABLE technologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Technology info
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL, -- 'framework', 'auth', 'database', 'hosting', etc.
  
  -- Metadata
  description TEXT,
  website_url TEXT,
  documentation_url TEXT,
  logo_url TEXT,
  
  -- Characteristics
  pricing_model TEXT, -- 'free', 'freemium', 'paid'
  complexity_score INTEGER DEFAULT 5 CHECK (complexity_score BETWEEN 1 AND 10),
  popularity_score INTEGER DEFAULT 5 CHECK (popularity_score BETWEEN 1 AND 10),
  
  -- Compatibility
  compatible_with JSONB DEFAULT '[]', -- Array of technology IDs
  conflicts_with JSONB DEFAULT '[]', -- Array of technology IDs
  
  -- Template integration
  template_config JSONB DEFAULT '{}', -- Configuration for code generation
  
  -- Analytics
  usage_count INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_technologies_category ON technologies(category);
CREATE INDEX idx_technologies_active ON technologies(is_active);
CREATE INDEX idx_technologies_usage ON technologies(usage_count DESC);
```

### 7. Project Downloads Table
```sql
CREATE TABLE project_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Download metadata
  ip_address INET,
  user_agent TEXT,
  download_size INTEGER, -- in bytes
  
  -- Timestamps
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE project_downloads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own downloads" ON project_downloads
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Indexes
CREATE INDEX idx_project_downloads_project ON project_downloads(project_id, downloaded_at DESC);
CREATE INDEX idx_project_downloads_user ON project_downloads(user_id, downloaded_at DESC);
```

### 8. Analytics Events Table
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event metadata
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  
  -- User context
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  
  -- Request context
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_analytics_events_name_date ON analytics_events(event_name, created_at DESC);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id, created_at DESC);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id, created_at DESC);
```

### 9. Subscriptions Table
```sql
CREATE TABLE subscriptions (
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

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### 10. Usage Tracking Table
```sql
CREATE TABLE usage_tracking (
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

-- Enable RLS
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own usage" ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage" ON usage_tracking
  FOR ALL USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX idx_usage_tracking_user_period ON usage_tracking(user_id, period_end DESC);
CREATE INDEX idx_usage_tracking_period_end ON usage_tracking(period_end);
```

### 11. Popular Stacks Table (for Browse page)
```sql
CREATE TABLE popular_stacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Stack metadata
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  
  -- Stack configuration
  technologies JSONB NOT NULL DEFAULT '[]', -- Array of technology names
  stack_config JSONB NOT NULL DEFAULT '{}',
  
  -- Display metadata
  icon_url TEXT,
  preview_image_url TEXT,
  
  -- Analytics
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0,
  
  -- Estimated metrics
  setup_time_minutes INTEGER DEFAULT 15,
  
  -- Status
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_popular_stacks_category ON popular_stacks(category);
CREATE INDEX idx_popular_stacks_usage ON popular_stacks(usage_count DESC);
CREATE INDEX idx_popular_stacks_rating ON popular_stacks(rating DESC);
```

## Views and Functions

### 1. User Dashboard Stats View
```sql
CREATE VIEW user_dashboard_stats AS
SELECT 
  u.id as user_id,
  u.email,
  COUNT(DISTINCT p.id) as total_projects,
  COUNT(DISTINCT pd.id) as total_downloads,
  COUNT(DISTINCT c.id) as total_conversations,
  COUNT(DISTINCT CASE WHEN p.last_accessed_at > NOW() - INTERVAL '7 days' THEN p.id END) as active_projects_week,
  MAX(p.last_accessed_at) as last_project_access
FROM users u
LEFT JOIN projects p ON u.id = p.user_id
LEFT JOIN project_downloads pd ON u.id = pd.user_id
LEFT JOIN conversations c ON u.id = c.user_id
GROUP BY u.id, u.email;
```

### 2. Popular Technologies View
```sql
CREATE VIEW popular_technologies AS
SELECT 
  t.id,
  t.name,
  t.category,
  t.usage_count,
  COUNT(DISTINCT p.id) as project_count,
  AVG(CASE WHEN pd.downloaded_at IS NOT NULL THEN 1 ELSE 0 END) as download_rate
FROM technologies t
LEFT JOIN projects p ON p.stack_selections ? t.name
LEFT JOIN project_downloads pd ON p.id = pd.project_id
WHERE t.is_active = true
GROUP BY t.id, t.name, t.category, t.usage_count
ORDER BY t.usage_count DESC, project_count DESC;
```

### 3. Update Functions
```sql
-- Function to update project download count
CREATE OR REPLACE FUNCTION update_project_download_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects 
  SET 
    download_count = download_count + 1,
    last_downloaded_at = NEW.downloaded_at
  WHERE id = NEW.project_id;
  
  UPDATE users 
  SET total_downloads = total_downloads + 1
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for download count updates
CREATE TRIGGER trigger_update_download_count
  AFTER INSERT ON project_downloads
  FOR EACH ROW
  EXECUTE FUNCTION update_project_download_count();

-- Function to update conversation message count
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET 
    message_count = message_count + 1,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for message count updates
CREATE TRIGGER trigger_update_message_count
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_message_count();
```

## Initial Data Seeds

### 1. Technologies Seed Data
```sql
INSERT INTO technologies (name, slug, category, description, pricing_model, complexity_score, popularity_score) VALUES
-- Frameworks
('Next.js', 'nextjs', 'framework', 'React framework with SSR and SSG', 'free', 6, 9),
('Remix', 'remix', 'framework', 'Full-stack React framework', 'free', 7, 7),
('SvelteKit', 'sveltekit', 'framework', 'Svelte-based full-stack framework', 'free', 6, 6),

-- Authentication
('Clerk', 'clerk', 'auth', 'Complete authentication solution', 'freemium', 4, 8),
('NextAuth.js', 'nextauth', 'auth', 'Authentication for Next.js', 'free', 6, 9),
('Supabase Auth', 'supabase-auth', 'auth', 'Built-in Supabase authentication', 'freemium', 5, 7),

-- Databases
('Supabase', 'supabase', 'database', 'PostgreSQL with real-time features', 'freemium', 5, 8),
('PlanetScale', 'planetscale', 'database', 'MySQL with branching', 'freemium', 6, 7),
('Neon', 'neon', 'database', 'Serverless PostgreSQL', 'freemium', 5, 6),

-- Hosting
('Vercel', 'vercel', 'hosting', 'Frontend deployment platform', 'freemium', 3, 9),
('Railway', 'railway', 'hosting', 'Full-stack deployment platform', 'freemium', 4, 6),
('Render', 'render', 'hosting', 'Cloud application platform', 'freemium', 4, 5),

-- Payments
('Stripe', 'stripe', 'payments', 'Payment processing platform', 'paid', 5, 9),
('Paddle', 'paddle', 'payments', 'Merchant of record platform', 'paid', 6, 6),

-- Analytics
('PostHog', 'posthog', 'analytics', 'Product analytics platform', 'freemium', 4, 7),
('Plausible', 'plausible', 'analytics', 'Privacy-focused analytics', 'paid', 3, 6),

-- Email
('Resend', 'resend', 'email', 'Developer-first email API', 'freemium', 3, 7),
('Postmark', 'postmark', 'email', 'Transactional email service', 'paid', 4, 6),

-- Monitoring
('Sentry', 'sentry', 'monitoring', 'Error tracking and monitoring', 'freemium', 4, 8);
```

### 2. Popular Stacks Seed Data
```sql
INSERT INTO popular_stacks (name, description, category, technologies, usage_count, rating, setup_time_minutes) VALUES
('Next.js + Supabase + Stripe', 'Full-stack SaaS starter with authentication, database, and payments', 'SaaS', 
 '["Next.js", "Supabase", "Stripe", "Tailwind CSS"]', 2847, 4.8, 15),
 
('MERN Stack + Auth0', 'MongoDB, Express, React, Node.js with Auth0 authentication', 'Full Stack',
 '["MongoDB", "Express", "React", "Node.js", "Auth0"]', 1923, 4.6, 20),
 
('Django + PostgreSQL + Redis', 'Python web framework with robust database and caching', 'Backend',
 '["Python", "Django", "PostgreSQL", "Redis", "Celery"]', 1456, 4.7, 25);
```

## Summary

This schema provides:

1. **User Management**: Anonymous-first with optional account creation
2. **Conversation Tracking**: Full AI chat history with context analysis
3. **Project Management**: Generated projects with metadata and analytics
4. **Template System**: Flexible template and technology management
5. **Analytics**: Comprehensive tracking for usage patterns and optimization
6. **Performance**: Proper indexing and RLS for security
7. **Scalability**: JSONB for flexible data structures, efficient queries

The schema supports all UI features we've seen:
- Dashboard with project history and stats
- Browse page with popular stacks
- Compare functionality with technology metadata
- Template gallery with ratings and usage data
- Full conversation history and regeneration
- Download tracking and analytics

This gives us everything we need before implementing the Supabase integration tasks!