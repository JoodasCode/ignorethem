import { ChatMessage, ConversationState, TechStackRecommendations, ProjectAnalysis } from './conversation';

// Chat API Types
export interface ChatRequest {
  messages: ChatMessage[];
  conversationContext?: any;
}

export interface ChatResponse {
  message?: string;
  error?: string;
}

// Recommendations API Types
export interface RecommendationsRequest {
  messages: ChatMessage[];
}

export interface RecommendationsResponse {
  recommendations: TechStackRecommendations;
  projectAnalysis: ProjectAnalysis;
  conversationSummary: string;
}

export interface RecommendationsError {
  error: string;
  suggestion?: string;
}

// Explain API Types
export interface ExplainRequest {
  technology: string;
  choice: string;
  context: any;
}

export interface ExplainResponse {
  explanation: string;
}

// Session API Types
export interface SessionCreateResponse {
  sessionId: string;
  conversationState: ConversationState;
}

export interface SessionGetResponse {
  sessionId: string;
  conversationState: ConversationState;
  email?: string;
  projectName?: string;
}

export interface SessionUpdateRequest {
  sessionId: string;
  conversationState?: ConversationState;
  email?: string;
  projectName?: string;
}

export interface SessionUpdateResponse {
  sessionId: string;
  conversationState: ConversationState;
  email?: string;
  projectName?: string;
}

// Email Collection API Types
export interface EmailCollectionRequest {
  sessionId: string;
  email: string;
  projectName?: string;
  subscribeToUpdates?: boolean;
}

export interface EmailCollectionResponse {
  success: boolean;
  message: string;
  sessionId: string;
}

// Generic API Error Response
export interface ApiError {
  error: string;
  details?: any;
}

// API Response Wrapper
export type ApiResponse<T> = T | ApiError;

// Compare Stacks API Types
export interface CompareStacksRequest {
  stack_ids: string[]
  user_context?: {
    experience_level: 'beginner' | 'intermediate' | 'advanced'
    project_type: 'mvp' | 'production' | 'enterprise'
    team_size: 'solo' | 'small' | 'medium' | 'large'
    budget_range: 'minimal' | 'moderate' | 'flexible'
  }
}

export interface CompareStacksResponse {
  success: boolean
  comparison: ComparisonMatrix
}

export interface ComparisonMatrix {
  stacks: StackComparison[]
  comparison_categories: ComparisonCategory[]
  recommendations: ComparisonRecommendation[]
  summary: ComparisonSummary
}

export interface StackComparison {
  id: string
  name: string
  description: string
  technologies: string[]
  stack_config: any
  performance_metrics: PerformanceMetrics
  compatibility_score: number
  pros: string[]
  cons: string[]
  use_cases: string[]
  setup_complexity: 'simple' | 'moderate' | 'complex'
  monthly_cost_estimate: {
    free_tier: string
    low_usage: string
    medium_usage: string
    high_usage: string
  }
  migration_difficulty: {
    from: Record<string, 'easy' | 'moderate' | 'hard'>
    to: Record<string, 'easy' | 'moderate' | 'hard'>
  }
}

export interface PerformanceMetrics {
  build_time_seconds: number
  bundle_size_kb: number
  lighthouse_score: number
  time_to_interactive_ms: number
  first_contentful_paint_ms: number
  scalability_rating: number
  developer_experience_rating: number
  community_support_rating: number
}

export interface ComparisonCategory {
  name: string
  description: string
  weight: number
  metrics: CategoryMetric[]
}

export interface CategoryMetric {
  name: string
  description: string
  values: Record<string, any>
  better_when: 'higher' | 'lower'
  unit?: string
}

export interface ComparisonRecommendation {
  stack_id: string
  reason: string
  confidence: number
  use_case: string
}

export interface ComparisonSummary {
  best_overall: string
  best_for_beginners: string
  best_for_performance: string
  best_for_cost: string
  best_for_scalability: string
}

export interface ChooseStackRequest {
  stack_id: string
  conversation_id?: string
  project_name?: string
}

export interface ChooseStackResponse {
  success: boolean
  message: string
  project_id?: string
  next_steps: {
    generate_project: boolean
    continue_conversation: boolean
    start_new_conversation: boolean
  }
}

export interface ComparisonHistoryResponse {
  success: boolean
  comparisons: any[]
  total: number
  pagination: {
    limit: number
    offset: number
    has_more: boolean
  }
}

// Type guards for API responses
export function isApiError(response: any): response is ApiError {
  return response && typeof response.error === 'string';
}

export function isSuccessResponse<T>(response: ApiResponse<T>): response is T {
  return !isApiError(response);
}