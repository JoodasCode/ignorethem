import { supabase } from './supabase'
import { UsageTrackingService } from './usage-tracking'
import { PopularStack, BrowseStacksService } from './browse-stacks-service'
import { TechSelections } from './types/template'
import { templateRegistry } from './template-registry'

export interface StackComparison {
  id: string
  name: string
  description: string
  technologies: string[]
  stack_config: TechSelections
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
  scalability_rating: number // 1-10
  developer_experience_rating: number // 1-10
  community_support_rating: number // 1-10
}

export interface ComparisonMatrix {
  stacks: StackComparison[]
  comparison_categories: ComparisonCategory[]
  recommendations: ComparisonRecommendation[]
  summary: ComparisonSummary
}

export interface ComparisonCategory {
  name: string
  description: string
  weight: number // Importance weight for scoring
  metrics: CategoryMetric[]
}

export interface CategoryMetric {
  name: string
  description: string
  values: Record<string, any> // stack_id -> metric value
  better_when: 'higher' | 'lower'
  unit?: string
}

export interface ComparisonRecommendation {
  stack_id: string
  reason: string
  confidence: number // 0-1
  use_case: string
}

export interface ComparisonSummary {
  best_overall: string
  best_for_beginners: string
  best_for_performance: string
  best_for_cost: string
  best_for_scalability: string
}

export interface CompareStacksRequest {
  stack_ids: string[]
  user_context?: {
    experience_level: 'beginner' | 'intermediate' | 'advanced'
    project_type: 'mvp' | 'production' | 'enterprise'
    team_size: 'solo' | 'small' | 'medium' | 'large'
    budget_range: 'minimal' | 'moderate' | 'flexible'
  }
}

export class CompareStacksService {
  /**
   * Compare multiple stacks with tier validation
   */
  static async compareStacks(
    stackIds: string[],
    userId: string,
    userContext?: CompareStacksRequest['user_context']
  ): Promise<ComparisonMatrix | null> {
    // Validate user tier and limits
    const tierCheck = await this.validateComparisonAccess(userId, stackIds.length)
    if (!tierCheck.allowed) {
      throw new Error(tierCheck.reason || 'Comparison not allowed')
    }

    // Validate stack count (max 3 for Starter tier)
    if (stackIds.length > 3) {
      throw new Error('Maximum 3 stacks can be compared at once')
    }

    if (stackIds.length < 2) {
      throw new Error('At least 2 stacks are required for comparison')
    }

    // Get stack details
    const stacks = await Promise.all(
      stackIds.map(id => BrowseStacksService.getStackById(id))
    )

    // Filter out null results
    const validStacks = stacks.filter((stack): stack is PopularStack => stack !== null)
    
    if (validStacks.length !== stackIds.length) {
      throw new Error('One or more stacks not found')
    }

    // Build comparison data
    const stackComparisons = await Promise.all(
      validStacks.map(stack => this.buildStackComparison(stack))
    )

    // Generate comparison matrix
    const comparisonMatrix = await this.generateComparisonMatrix(
      stackComparisons,
      userContext
    )

    // Record usage analytics
    await this.recordComparisonUsage(userId, stackIds)

    return comparisonMatrix
  }

  /**
   * Validate if user can perform stack comparison
   */
  static async validateComparisonAccess(
    userId: string,
    stackCount: number
  ): Promise<{ allowed: boolean; reason?: string }> {
    const tier = await UsageTrackingService.getUserTier(userId)
    
    // Free tier cannot compare stacks
    if (tier === 'free') {
      return {
        allowed: false,
        reason: 'Stack comparison is available for Starter tier and above. Upgrade to compare stacks side-by-side.'
      }
    }

    // Starter tier can compare up to 3 stacks
    if (tier === 'starter' && stackCount > 3) {
      return {
        allowed: false,
        reason: 'Starter tier allows comparing up to 3 stacks. Upgrade to Pro for unlimited comparisons.'
      }
    }

    return { allowed: true }
  }

  /**
   * Build detailed comparison data for a stack
   */
  static async buildStackComparison(stack: PopularStack): Promise<StackComparison> {
    // Get performance metrics (mock data for now, would be real metrics in production)
    const performanceMetrics = await this.getPerformanceMetrics(stack.stack_config as any)
    
    // Calculate compatibility score
    const compatibilityScore = await this.calculateCompatibilityScore(stack.stack_config as any)
    
    // Generate pros/cons based on stack configuration
    const { pros, cons } = this.generateProsAndCons(stack.stack_config as any)
    
    // Get use cases
    const useCases = this.getUseCases(stack.stack_config as any)
    
    // Calculate setup complexity
    const setupComplexity = this.calculateSetupComplexity(stack.stack_config as any)
    
    // Estimate costs
    const costEstimate = this.estimateCosts(stack.stack_config as any)
    
    // Calculate migration difficulty
    const migrationDifficulty = this.calculateMigrationDifficulty(stack.stack_config as any)

    return {
      id: stack.id,
      name: stack.name,
      description: stack.description,
      technologies: stack.technologies,
      stack_config: stack.stack_config as TechSelections,
      performance_metrics: performanceMetrics,
      compatibility_score: compatibilityScore,
      pros,
      cons,
      use_cases: useCases,
      setup_complexity: setupComplexity,
      monthly_cost_estimate: costEstimate,
      migration_difficulty: migrationDifficulty
    }
  }

  /**
   * Generate comparison matrix with categories and recommendations
   */
  static async generateComparisonMatrix(
    stacks: StackComparison[],
    userContext?: CompareStacksRequest['user_context']
  ): Promise<ComparisonMatrix> {
    const categories = this.getComparisonCategories()
    const recommendations = this.generateRecommendations(stacks, userContext)
    const summary = this.generateComparisonSummary(stacks)

    // Populate category metrics with stack data
    const populatedCategories = categories.map(category => ({
      ...category,
      metrics: category.metrics.map(metric => ({
        ...metric,
        values: this.getMetricValues(metric.name, stacks)
      }))
    }))

    return {
      stacks,
      comparison_categories: populatedCategories,
      recommendations,
      summary
    }
  }

  /**
   * Get performance metrics for a stack configuration
   */
  static async getPerformanceMetrics(stackConfig: TechSelections): Promise<PerformanceMetrics> {
    // In a real implementation, these would be actual measured metrics
    // For now, we'll use estimated values based on technology choices
    
    let buildTime = 30 // Base build time in seconds
    let bundleSize = 200 // Base bundle size in KB
    let lighthouseScore = 90
    let timeToInteractive = 1500
    let firstContentfulPaint = 800
    let scalabilityRating = 7
    let developerExperienceRating = 8
    let communitySupportRating = 8

    // Adjust based on framework
    if (stackConfig.framework === 'nextjs') {
      buildTime += 10
      bundleSize += 50
      developerExperienceRating = 9
      communitySupportRating = 9
    } else if (stackConfig.framework === 'remix') {
      buildTime += 5
      bundleSize += 30
      timeToInteractive -= 200
      scalabilityRating = 8
    }

    // Adjust based on authentication
    if (stackConfig.authentication === 'clerk') {
      bundleSize += 80
      developerExperienceRating = 9
    } else if (stackConfig.authentication === 'nextauth') {
      bundleSize += 60
      buildTime += 5
    }

    // Adjust based on database
    if (stackConfig.database === 'supabase') {
      developerExperienceRating = 9
      scalabilityRating = 8
    } else if (stackConfig.database === 'planetscale') {
      scalabilityRating = 9
      buildTime += 3
    }

    // Adjust based on other selections
    if (stackConfig.payments === 'stripe') {
      bundleSize += 40
      developerExperienceRating = 9
    }

    if (stackConfig.analytics === 'posthog') {
      bundleSize += 30
      firstContentfulPaint += 100
    }

    if (stackConfig.monitoring === 'sentry') {
      bundleSize += 25
      developerExperienceRating += 0.5
    }

    return {
      build_time_seconds: Math.round(buildTime),
      bundle_size_kb: Math.round(bundleSize),
      lighthouse_score: Math.min(100, Math.round(lighthouseScore)),
      time_to_interactive_ms: Math.round(timeToInteractive),
      first_contentful_paint_ms: Math.round(firstContentfulPaint),
      scalability_rating: Math.min(10, Math.round(scalabilityRating * 10) / 10),
      developer_experience_rating: Math.min(10, Math.round(developerExperienceRating * 10) / 10),
      community_support_rating: Math.min(10, Math.round(communitySupportRating * 10) / 10)
    }
  }

  /**
   * Calculate compatibility score based on how well technologies work together
   */
  static async calculateCompatibilityScore(stackConfig: TechSelections): Promise<number> {
    let score = 100

    // Check for known compatibility issues
    const compatibilityRules = [
      // NextAuth + Supabase can have session conflicts
      {
        condition: stackConfig.authentication === 'nextauth' && stackConfig.database === 'supabase',
        penalty: 10,
        reason: 'NextAuth and Supabase Auth can have session management conflicts'
      },
      // Clerk works best with Vercel
      {
        condition: stackConfig.authentication === 'clerk' && stackConfig.hosting === 'vercel',
        bonus: 5,
        reason: 'Clerk has excellent Vercel integration'
      },
      // Supabase stack synergy
      {
        condition: stackConfig.database === 'supabase' && stackConfig.authentication === 'supabase-auth',
        bonus: 10,
        reason: 'Supabase Auth and Database work seamlessly together'
      },
      // Stripe + PostHog integration
      {
        condition: stackConfig.payments === 'stripe' && stackConfig.analytics === 'posthog',
        bonus: 5,
        reason: 'PostHog has built-in Stripe integration for revenue tracking'
      }
    ]

    for (const rule of compatibilityRules) {
      if (rule.condition) {
        if (rule.penalty) {
          score -= rule.penalty
        }
        if (rule.bonus) {
          score += rule.bonus
        }
      }
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Generate pros and cons for a stack configuration
   */
  static generateProsAndCons(stackConfig: TechSelections): { pros: string[]; cons: string[] } {
    const pros: string[] = []
    const cons: string[] = []

    // Framework pros/cons
    if (stackConfig.framework === 'nextjs') {
      pros.push('Excellent developer experience and documentation')
      pros.push('Built-in optimizations and performance features')
      pros.push('Large ecosystem and community support')
      cons.push('Can be overkill for simple projects')
      cons.push('Steeper learning curve for beginners')
    }

    // Authentication pros/cons
    if (stackConfig.authentication === 'clerk') {
      pros.push('Complete user management with organizations')
      pros.push('Beautiful pre-built UI components')
      cons.push('Vendor lock-in concerns')
      cons.push('Higher cost at scale')
    } else if (stackConfig.authentication === 'nextauth') {
      pros.push('Open source and flexible')
      pros.push('Supports many OAuth providers')
      cons.push('Requires more setup and configuration')
      cons.push('Limited built-in UI components')
    }

    // Database pros/cons
    if (stackConfig.database === 'supabase') {
      pros.push('Real-time subscriptions out of the box')
      pros.push('Built-in authentication and row-level security')
      pros.push('Excellent TypeScript support')
      cons.push('Vendor lock-in to Supabase ecosystem')
      cons.push('Limited customization of auth flows')
    }

    // Add more based on other selections...
    
    return { pros, cons }
  }

  /**
   * Get use cases for a stack configuration
   */
  static getUseCases(stackConfig: TechSelections): string[] {
    const useCases: string[] = []

    // Determine use cases based on stack composition
    if (stackConfig.authentication === 'clerk' && stackConfig.payments === 'stripe') {
      useCases.push('B2B SaaS with team management')
      useCases.push('Subscription-based applications')
    }

    if (stackConfig.database === 'supabase' && stackConfig.analytics === 'posthog') {
      useCases.push('Real-time collaborative applications')
      useCases.push('Data-driven product development')
    }

    if (stackConfig.framework === 'nextjs' && stackConfig.hosting === 'vercel') {
      useCases.push('High-performance web applications')
      useCases.push('SEO-optimized marketing sites')
    }

    // Add default use cases if none specific
    if (useCases.length === 0) {
      useCases.push('General web applications')
      useCases.push('MVP development')
      useCases.push('Small to medium-scale projects')
    }

    return useCases
  }

  /**
   * Calculate setup complexity
   */
  static calculateSetupComplexity(stackConfig: TechSelections): 'simple' | 'moderate' | 'complex' {
    let complexityScore = 0

    // Count number of integrations
    const integrations = Object.values(stackConfig).filter(value => value !== 'none').length
    complexityScore += integrations * 2

    // Add complexity for specific technologies
    if (stackConfig.authentication === 'nextauth') complexityScore += 3
    if (stackConfig.database === 'planetscale') complexityScore += 2
    if (stackConfig.payments !== 'none') complexityScore += 4
    if (stackConfig.monitoring !== 'none') complexityScore += 2

    if (complexityScore <= 8) return 'simple'
    if (complexityScore <= 15) return 'moderate'
    return 'complex'
  }

  /**
   * Estimate monthly costs for different usage levels
   */
  static estimateCosts(stackConfig: TechSelections) {
    const costs = {
      free_tier: '$0',
      low_usage: '$0-25',
      medium_usage: '$25-100',
      high_usage: '$100-500'
    }

    // Adjust based on selections
    let baseCost = 0

    if (stackConfig.authentication === 'clerk') {
      baseCost += 25 // Clerk Pro plan
    }

    if (stackConfig.database === 'planetscale') {
      baseCost += 29 // PlanetScale Scaler plan
    }

    if (stackConfig.payments === 'stripe') {
      // Stripe is usage-based, no base cost
    }

    // Update cost estimates
    if (baseCost > 0) {
      costs.low_usage = `$${baseCost}-${baseCost + 25}`
      costs.medium_usage = `$${baseCost + 25}-${baseCost + 100}`
      costs.high_usage = `$${baseCost + 100}-${baseCost + 500}`
    }

    return costs
  }

  /**
   * Calculate migration difficulty to/from other stacks
   */
  static calculateMigrationDifficulty(stackConfig: TechSelections) {
    // This would be more sophisticated in a real implementation
    return {
      from: {
        'basic-stack': 'easy' as const,
        'enterprise-stack': 'moderate' as const,
        'custom-stack': 'hard' as const
      },
      to: {
        'basic-stack': 'moderate' as const,
        'enterprise-stack': 'hard' as const,
        'custom-stack': 'moderate' as const
      }
    }
  }

  /**
   * Get comparison categories for the matrix
   */
  static getComparisonCategories(): ComparisonCategory[] {
    return [
      {
        name: 'Performance',
        description: 'Speed, bundle size, and runtime performance',
        weight: 0.25,
        metrics: [
          {
            name: 'build_time',
            description: 'Time to build the project',
            values: {},
            better_when: 'lower',
            unit: 'seconds'
          },
          {
            name: 'bundle_size',
            description: 'JavaScript bundle size',
            values: {},
            better_when: 'lower',
            unit: 'KB'
          },
          {
            name: 'lighthouse_score',
            description: 'Google Lighthouse performance score',
            values: {},
            better_when: 'higher',
            unit: '/100'
          }
        ]
      },
      {
        name: 'Developer Experience',
        description: 'Ease of development and maintenance',
        weight: 0.3,
        metrics: [
          {
            name: 'setup_complexity',
            description: 'How complex is the initial setup',
            values: {},
            better_when: 'lower'
          },
          {
            name: 'developer_experience_rating',
            description: 'Overall developer experience rating',
            values: {},
            better_when: 'higher',
            unit: '/10'
          },
          {
            name: 'community_support_rating',
            description: 'Community and ecosystem support',
            values: {},
            better_when: 'higher',
            unit: '/10'
          }
        ]
      },
      {
        name: 'Scalability',
        description: 'Ability to handle growth and scale',
        weight: 0.2,
        metrics: [
          {
            name: 'scalability_rating',
            description: 'How well the stack scales',
            values: {},
            better_when: 'higher',
            unit: '/10'
          },
          {
            name: 'compatibility_score',
            description: 'How well technologies work together',
            values: {},
            better_when: 'higher',
            unit: '/100'
          }
        ]
      },
      {
        name: 'Cost',
        description: 'Pricing and cost considerations',
        weight: 0.25,
        metrics: [
          {
            name: 'monthly_cost_low',
            description: 'Estimated monthly cost for low usage',
            values: {},
            better_when: 'lower'
          },
          {
            name: 'monthly_cost_medium',
            description: 'Estimated monthly cost for medium usage',
            values: {},
            better_when: 'lower'
          }
        ]
      }
    ]
  }

  /**
   * Get metric values for all stacks
   */
  static getMetricValues(metricName: string, stacks: StackComparison[]): Record<string, any> {
    const values: Record<string, any> = {}

    for (const stack of stacks) {
      switch (metricName) {
        case 'build_time':
          values[stack.id] = stack.performance_metrics.build_time_seconds
          break
        case 'bundle_size':
          values[stack.id] = stack.performance_metrics.bundle_size_kb
          break
        case 'lighthouse_score':
          values[stack.id] = stack.performance_metrics.lighthouse_score
          break
        case 'setup_complexity':
          values[stack.id] = stack.setup_complexity
          break
        case 'developer_experience_rating':
          values[stack.id] = stack.performance_metrics.developer_experience_rating
          break
        case 'community_support_rating':
          values[stack.id] = stack.performance_metrics.community_support_rating
          break
        case 'scalability_rating':
          values[stack.id] = stack.performance_metrics.scalability_rating
          break
        case 'compatibility_score':
          values[stack.id] = stack.compatibility_score
          break
        case 'monthly_cost_low':
          values[stack.id] = stack.monthly_cost_estimate.low_usage
          break
        case 'monthly_cost_medium':
          values[stack.id] = stack.monthly_cost_estimate.medium_usage
          break
      }
    }

    return values
  }

  /**
   * Generate recommendations based on user context
   */
  static generateRecommendations(
    stacks: StackComparison[],
    userContext?: CompareStacksRequest['user_context']
  ): ComparisonRecommendation[] {
    const recommendations: ComparisonRecommendation[] = []

    // Recommend based on experience level
    if (userContext?.experience_level === 'beginner') {
      const simplestStack = stacks.reduce((prev, current) => 
        prev.setup_complexity === 'simple' && current.setup_complexity !== 'simple' ? prev :
        current.setup_complexity === 'simple' && prev.setup_complexity !== 'simple' ? current :
        prev.performance_metrics.developer_experience_rating > current.performance_metrics.developer_experience_rating ? prev : current
      )
      
      recommendations.push({
        stack_id: simplestStack.id,
        reason: 'Best for beginners due to simple setup and excellent developer experience',
        confidence: 0.9,
        use_case: 'Learning and getting started quickly'
      })
    }

    // Recommend based on project type
    if (userContext?.project_type === 'mvp') {
      const mvpStack = stacks.reduce((prev, current) => 
        prev.performance_metrics.developer_experience_rating > current.performance_metrics.developer_experience_rating ? prev : current
      )
      
      recommendations.push({
        stack_id: mvpStack.id,
        reason: 'Fastest time to market with excellent developer experience',
        confidence: 0.85,
        use_case: 'MVP development and rapid prototyping'
      })
    }

    // Recommend based on budget
    if (userContext?.budget_range === 'minimal') {
      // Find stack with lowest cost
      const budgetStack = stacks.reduce((prev, current) => {
        const prevCost = prev.monthly_cost_estimate.low_usage
        const currentCost = current.monthly_cost_estimate.low_usage
        return prevCost.includes('$0') && !currentCost.includes('$0') ? prev :
               !prevCost.includes('$0') && currentCost.includes('$0') ? current : prev
      })
      
      recommendations.push({
        stack_id: budgetStack.id,
        reason: 'Most cost-effective option with generous free tiers',
        confidence: 0.8,
        use_case: 'Budget-conscious projects and startups'
      })
    }

    return recommendations
  }

  /**
   * Generate comparison summary
   */
  static generateComparisonSummary(stacks: StackComparison[]): ComparisonSummary {
    const bestOverall = stacks.reduce((prev, current) => 
      (prev.performance_metrics.developer_experience_rating + prev.performance_metrics.scalability_rating) >
      (current.performance_metrics.developer_experience_rating + current.performance_metrics.scalability_rating) ? prev : current
    )

    const bestForBeginners = stacks.reduce((prev, current) => 
      prev.setup_complexity === 'simple' && current.setup_complexity !== 'simple' ? prev :
      current.setup_complexity === 'simple' && prev.setup_complexity !== 'simple' ? current :
      prev.performance_metrics.developer_experience_rating > current.performance_metrics.developer_experience_rating ? prev : current
    )

    const bestForPerformance = stacks.reduce((prev, current) => 
      prev.performance_metrics.lighthouse_score > current.performance_metrics.lighthouse_score ? prev : current
    )

    const bestForCost = stacks.reduce((prev, current) => {
      const prevCost = prev.monthly_cost_estimate.low_usage
      const currentCost = current.monthly_cost_estimate.low_usage
      return prevCost.includes('$0') && !currentCost.includes('$0') ? prev :
             !prevCost.includes('$0') && currentCost.includes('$0') ? current : prev
    })

    const bestForScalability = stacks.reduce((prev, current) => 
      prev.performance_metrics.scalability_rating > current.performance_metrics.scalability_rating ? prev : current
    )

    return {
      best_overall: bestOverall.id,
      best_for_beginners: bestForBeginners.id,
      best_for_performance: bestForPerformance.id,
      best_for_cost: bestForCost.id,
      best_for_scalability: bestForScalability.id
    }
  }

  /**
   * Record comparison usage for analytics
   */
  static async recordComparisonUsage(userId: string, stackIds: string[]): Promise<void> {
    try {
      await supabase
        .from('stack_comparisons')
        .insert({
          user_id: userId,
          stack_ids: stackIds,
          comparison_count: stackIds.length,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error recording comparison usage:', error)
    }
  }

  /**
   * Get comparison history for a user
   */
  static async getComparisonHistory(
    userId: string,
    limit = 10,
    offset = 0
  ): Promise<{ comparisons: any[]; total: number }> {
    const { data, error, count } = await supabase
      .from('stack_comparisons')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching comparison history:', error)
      return { comparisons: [], total: 0 }
    }

    return { comparisons: data || [], total: count || 0 }
  }

  /**
   * Choose a stack from comparison and integrate with chat system
   */
  static async chooseStackFromComparison(
    stackId: string,
    userId: string,
    conversationId?: string,
    projectName?: string
  ): Promise<{ success: boolean; projectId?: string; error?: string }> {
    try {
      // Get the selected stack
      const stack = await BrowseStacksService.getStackById(stackId)
      if (!stack) {
        return { success: false, error: 'Stack not found' }
      }

      // Create a new conversation or update existing one with the selected stack
      if (conversationId) {
        // Update existing conversation with stack selection
        const { error: updateError } = await supabase
          .from('conversations')
          .update({
            selected_stack_id: stackId,
            stack_selections: stack.stack_config,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationId)
          .eq('user_id', userId)

        if (updateError) {
          console.error('Error updating conversation with stack selection:', updateError)
          return { success: false, error: 'Failed to update conversation' }
        }
      }

      // Create project if project name provided
      let projectId: string | undefined
      if (projectName) {
        projectId = (await BrowseStacksService.useStack(stackId, projectName, userId, conversationId)) || undefined
        if (!projectId) {
          return { success: false, error: 'Failed to create project from stack' }
        }
      }

      // Record stack usage
      await BrowseStacksService.recordStackUsage(stackId, userId)

      return { success: true, projectId }
    } catch (error) {
      console.error('Error choosing stack from comparison:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }
}