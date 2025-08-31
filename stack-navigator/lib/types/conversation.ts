export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  recommendations?: TechStackRecommendations;
}

export interface ConversationState {
  messages: ChatMessage[];
  isGenerating: boolean;
  currentRecommendations: TechStackRecommendations | null;
  projectContext: ProjectAnalysis | null;
  conversationPhase: 'discovery' | 'recommendation' | 'refinement' | 'generation';
}

export interface ProjectAnalysis {
  complexity: 'simple' | 'moderate' | 'complex';
  scalingNeeds: 'minimal' | 'moderate' | 'high';
  timeConstraints: 'tight' | 'moderate' | 'flexible';
  budgetConstraints: 'minimal' | 'moderate' | 'flexible';
  technicalExpertise: 'beginner' | 'intermediate' | 'advanced';
  businessModel: 'b2c' | 'b2b' | 'marketplace' | 'saas' | 'other';
}

export interface TechStackRecommendations {
  framework: 'nextjs' | 'remix' | 'sveltekit';
  authentication: 'clerk' | 'supabase-auth' | 'nextauth' | 'none';
  database: 'supabase' | 'planetscale' | 'neon' | 'none';
  hosting: 'vercel' | 'netlify' | 'railway' | 'render';
  payments: 'stripe' | 'paddle' | 'none';
  analytics: 'posthog' | 'plausible' | 'ga4' | 'none';
  email: 'resend' | 'postmark' | 'sendgrid' | 'none';
  monitoring: 'sentry' | 'bugsnag' | 'none';
  reasoning: Record<string, string>;
  alternatives: Record<string, string[]>;
  migrationPaths: Record<string, string>;
  estimatedCosts: {
    monthly: string;
    breakdown: Record<string, string>;
  };
}

export interface ConversationContext {
  projectType?: string;
  teamSize?: string;
  timeline?: string;
  technicalBackground?: string;
  specificRequirements?: string[];
  concerns?: string[];
  preferences?: Record<string, any>;
}