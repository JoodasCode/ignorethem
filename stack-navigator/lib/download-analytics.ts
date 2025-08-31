import { TechSelections } from './types/template'
import { createClient } from '@/lib/supabase'

export interface DownloadEvent {
  userId: string
  projectName: string
  selections: TechSelections
  fileCount: number
  zipSize: number
  generationTime: number
  downloadedAt: Date
  userTier: 'free' | 'starter' | 'pro'
  conversationId?: string
  sessionId?: string
}

export interface ConversionEvent {
  userId: string
  eventType: 'signup' | 'first_generation' | 'upgrade' | 'churn'
  fromTier?: 'free' | 'starter' | 'pro'
  toTier?: 'free' | 'starter' | 'pro'
  metadata?: Record<string, any>
  timestamp: Date
}

export interface AnalyticsMetrics {
  totalDownloads: number
  uniqueUsers: number
  averageGenerationTime: number
  averageZipSize: number
  popularTechCombinations: Array<{
    selections: Partial<TechSelections>
    count: number
    percentage: number
  }>
  conversionFunnel: {
    signups: number
    firstGeneration: number
    upgrades: number
    conversionRate: number
  }
  performanceMetrics: {
    averageGenerationTime: number
    p95GenerationTime: number
    errorRate: number
  }
}

export interface TechPopularity {
  technology: string
  category: string
  usageCount: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
}

/**
 * Service for tracking download analytics and conversion metrics
 */
export class DownloadAnalyticsService {
  /**
   * Track a project download event
   */
  static async trackDownload(event: DownloadEvent): Promise<void> {
    try {
      // Store in database using MCP
      await this.storeDownloadEvent(event)
      
      // Send to PostHog if available
      await this.sendToPostHog('project_downloaded', {
        project_name: event.projectName,
        selections: event.selections,
        file_count: event.fileCount,
        zip_size: event.zipSize,
        generation_time: event.generationTime,
        user_tier: event.userTier,
        conversation_id: event.conversationId
      })
      
      // Track popular technology combinations
      await this.updateTechPopularity(event.selections)
      
    } catch (error) {
      console.error('Failed to track download event:', error)
      // Don't throw - analytics failures shouldn't break the user experience
    }
  }

  /**
   * Track conversion funnel events
   */
  static async trackConversion(event: ConversionEvent): Promise<void> {
    try {
      // Store in database
      await this.storeConversionEvent(event)
      
      // Send to PostHog
      await this.sendToPostHog(`conversion_${event.eventType}`, {
        from_tier: event.fromTier,
        to_tier: event.toTier,
        metadata: event.metadata
      })
      
      // Update conversion metrics
      await this.updateConversionMetrics(event)
      
    } catch (error) {
      console.error('Failed to track conversion event:', error)
    }
  }

  /**
   * Get analytics dashboard metrics
   */
  static async getAnalyticsMetrics(
    startDate?: Date,
    endDate?: Date
  ): Promise<AnalyticsMetrics> {
    try {
      const dateFilter = this.buildDateFilter(startDate, endDate)
      
      const [
        downloadStats,
        conversionStats,
        performanceStats,
        techPopularity
      ] = await Promise.all([
        this.getDownloadStats(dateFilter),
        this.getConversionStats(dateFilter),
        this.getPerformanceStats(dateFilter),
        this.getTechPopularity(dateFilter)
      ])

      return {
        totalDownloads: downloadStats.totalDownloads,
        uniqueUsers: downloadStats.uniqueUsers,
        averageGenerationTime: downloadStats.averageGenerationTime,
        averageZipSize: downloadStats.averageZipSize,
        popularTechCombinations: techPopularity,
        conversionFunnel: conversionStats,
        performanceMetrics: performanceStats
      }
      
    } catch (error) {
      console.error('Failed to get analytics metrics:', error)
      return this.getDefaultMetrics()
    }
  }

  /**
   * Get technology popularity rankings
   */
  static async getTechnologyPopularity(
    category?: string,
    limit = 10
  ): Promise<TechPopularity[]> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data, error } = await supabase
        .rpc('get_technology_popularity', {
          p_category: category,
          p_limit: limit
        })

      if (error) throw error

      return data || []
      
    } catch (error) {
      console.error('Failed to get technology popularity:', error)
      return []
    }
  }

  /**
   * Get conversion funnel analysis
   */
  static async getConversionFunnel(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    signups: number
    firstGeneration: number
    upgrades: number
    stages: Array<{
      stage: string
      count: number
      conversionRate: number
      dropoffRate: number
    }>
  }> {
    try {
      const dateFilter = this.buildDateFilter(startDate, endDate)
      
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data, error } = await supabase
        .rpc('get_conversion_funnel', dateFilter)

      if (error) throw error

      const signups = data?.signups || 0
      const firstGeneration = data?.first_generation || 0
      const upgrades = data?.upgrades || 0

      const stages = [
        {
          stage: 'Signup',
          count: signups,
          conversionRate: 100,
          dropoffRate: 0
        },
        {
          stage: 'First Generation',
          count: firstGeneration,
          conversionRate: signups > 0 ? (firstGeneration / signups) * 100 : 0,
          dropoffRate: signups > 0 ? ((signups - firstGeneration) / signups) * 100 : 0
        },
        {
          stage: 'Upgrade',
          count: upgrades,
          conversionRate: firstGeneration > 0 ? (upgrades / firstGeneration) * 100 : 0,
          dropoffRate: firstGeneration > 0 ? ((firstGeneration - upgrades) / firstGeneration) * 100 : 0
        }
      ]

      return {
        signups,
        firstGeneration,
        upgrades,
        stages
      }
      
    } catch (error) {
      console.error('Failed to get conversion funnel:', error)
      return {
        signups: 0,
        firstGeneration: 0,
        upgrades: 0,
        stages: []
      }
    }
  }

  /**
   * Get performance monitoring data
   */
  static async getPerformanceMetrics(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    averageGenerationTime: number
    p95GenerationTime: number
    p99GenerationTime: number
    errorRate: number
    throughput: number
    peakHours: Array<{ hour: number; count: number }>
  }> {
    try {
      const dateFilter = this.buildDateFilter(startDate, endDate)
      
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data, error } = await supabase
        .rpc('get_performance_metrics', dateFilter)

      if (error) throw error

      return data || {
        averageGenerationTime: 0,
        p95GenerationTime: 0,
        p99GenerationTime: 0,
        errorRate: 0,
        throughput: 0,
        peakHours: []
      }
      
    } catch (error) {
      console.error('Failed to get performance metrics:', error)
      return {
        averageGenerationTime: 0,
        p95GenerationTime: 0,
        p99GenerationTime: 0,
        errorRate: 0,
        throughput: 0,
        peakHours: []
      }
    }
  }

  /**
   * Track upgrade prompt effectiveness
   */
  static async trackUpgradePrompt(
    userId: string,
    promptType: 'stack_limit' | 'conversation_limit' | 'message_limit',
    action: 'shown' | 'clicked' | 'dismissed' | 'converted',
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await this.sendToPostHog('upgrade_prompt', {
        prompt_type: promptType,
        action,
        metadata
      })

      // Store in database for analysis
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { error } = await supabase
        .from('upgrade_prompts')
        .insert({
          user_id: userId,
          prompt_type: promptType,
          action,
          metadata,
          created_at: new Date().toISOString()
        })

      if (error) throw error
      
    } catch (error) {
      console.error('Failed to track upgrade prompt:', error)
    }
  }

  /**
   * Get upgrade prompt conversion rates
   */
  static async getUpgradePromptMetrics(): Promise<{
    promptTypes: Array<{
      type: string
      shown: number
      clicked: number
      converted: number
      clickRate: number
      conversionRate: number
    }>
  }> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data, error } = await supabase
        .rpc('get_upgrade_prompt_metrics')

      if (error) throw error

      return { promptTypes: data || [] }
      
    } catch (error) {
      console.error('Failed to get upgrade prompt metrics:', error)
      return { promptTypes: [] }
    }
  }

  // Private helper methods

  private static async storeDownloadEvent(event: DownloadEvent): Promise<void> {
    // Use MCP to execute SQL insert
    const query = `
      INSERT INTO download_events (
        user_id, project_name, selections, file_count, zip_size, 
        generation_time, user_tier, conversation_id, session_id, downloaded_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )
    `
    
    // Note: In a real implementation, we'd need to use the MCP execute_sql function
    // For now, we'll use a placeholder that would be replaced with actual MCP call
    console.log('Would execute:', query, [
      event.userId,
      event.projectName,
      JSON.stringify(event.selections),
      event.fileCount,
      event.zipSize,
      event.generationTime,
      event.userTier,
      event.conversationId,
      event.sessionId,
      event.downloadedAt.toISOString()
    ])
  }

  private static async storeConversionEvent(event: ConversionEvent): Promise<void> {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { error } = await supabase
      .from('conversion_events')
      .insert({
        user_id: event.userId,
        event_type: event.eventType,
        from_tier: event.fromTier,
        to_tier: event.toTier,
        metadata: event.metadata,
        timestamp: event.timestamp.toISOString()
      })

    if (error) throw error
  }

  private static async sendToPostHog(
    eventName: string,
    properties: Record<string, any>
  ): Promise<void> {
    try {
      // Client-side PostHog
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture(eventName, properties)
      }
      
      // Server-side PostHog (if configured)
      const { PostHog } = await import('posthog-node')
      const posthogApiKey = process.env.POSTHOG_API_KEY
      
      if (posthogApiKey) {
        const client = new PostHog(posthogApiKey, {
          host: process.env.POSTHOG_HOST || 'https://app.posthog.com'
        })
        
        client.capture({
          distinctId: properties.user_id || 'anonymous',
          event: eventName,
          properties
        })
        
        await client.shutdown()
      }
      
    } catch (error) {
      console.warn('Failed to send event to PostHog:', error)
    }
  }

  private static async updateTechPopularity(selections: TechSelections): Promise<void> {
    const technologies = [
      { category: 'framework', value: selections.framework },
      { category: 'authentication', value: selections.authentication },
      { category: 'database', value: selections.database },
      { category: 'hosting', value: selections.hosting },
      { category: 'payments', value: selections.payments },
      { category: 'analytics', value: selections.analytics },
      { category: 'email', value: selections.email },
      { category: 'monitoring', value: selections.monitoring },
      { category: 'ui', value: selections.ui }
    ]

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    for (const tech of technologies) {
      if (tech.value && tech.value !== 'none') {
        await supabase
          .rpc('increment_tech_popularity', {
            p_category: tech.category,
            p_technology: tech.value
          })
      }
    }
  }

  private static async updateConversionMetrics(event: ConversionEvent): Promise<void> {
    // Update conversion tracking tables
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { error } = await supabase
      .rpc('update_conversion_metrics', {
        p_user_id: event.userId,
        p_event_type: event.eventType,
        p_from_tier: event.fromTier,
        p_to_tier: event.toTier
      })

    if (error) {
      console.warn('Failed to update conversion metrics:', error)
    }
  }

  private static buildDateFilter(startDate?: Date, endDate?: Date): Record<string, string> {
    const filter: Record<string, string> = {}
    
    if (startDate) {
      filter.start_date = startDate.toISOString()
    }
    
    if (endDate) {
      filter.end_date = endDate.toISOString()
    }
    
    return filter
  }

  private static async getDownloadStats(dateFilter: Record<string, string>) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase
      .rpc('get_download_stats', dateFilter)

    if (error) throw error

    return {
      totalDownloads: data?.total_downloads || 0,
      uniqueUsers: data?.unique_users || 0,
      averageGenerationTime: data?.avg_generation_time || 0,
      averageZipSize: data?.avg_zip_size || 0
    }
  }

  private static async getConversionStats(dateFilter: Record<string, string>) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase
      .rpc('get_conversion_stats', dateFilter)

    if (error) throw error

    const signups = data?.signups || 0
    const firstGeneration = data?.first_generation || 0
    const upgrades = data?.upgrades || 0

    return {
      signups,
      firstGeneration,
      upgrades,
      conversionRate: signups > 0 ? (upgrades / signups) * 100 : 0
    }
  }

  private static async getPerformanceStats(dateFilter: Record<string, string>) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase
      .rpc('get_performance_stats', dateFilter)

    if (error) throw error

    return {
      averageGenerationTime: data?.avg_generation_time || 0,
      p95GenerationTime: data?.p95_generation_time || 0,
      errorRate: data?.error_rate || 0
    }
  }

  private static async getTechPopularity(dateFilter: Record<string, string>) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase
      .rpc('get_tech_combinations', dateFilter)

    if (error) throw error

    return data || []
  }

  private static getDefaultMetrics(): AnalyticsMetrics {
    return {
      totalDownloads: 0,
      uniqueUsers: 0,
      averageGenerationTime: 0,
      averageZipSize: 0,
      popularTechCombinations: [],
      conversionFunnel: {
        signups: 0,
        firstGeneration: 0,
        upgrades: 0,
        conversionRate: 0
      },
      performanceMetrics: {
        averageGenerationTime: 0,
        p95GenerationTime: 0,
        errorRate: 0
      }
    }
  }

  /**
   * Generate analytics report for admin dashboard
   */
  static async generateAnalyticsReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    summary: AnalyticsMetrics
    trends: {
      dailyDownloads: Array<{ date: string; count: number }>
      dailySignups: Array<{ date: string; count: number }>
      dailyUpgrades: Array<{ date: string; count: number }>
    }
    insights: string[]
  }> {
    try {
      const [summary, trends] = await Promise.all([
        this.getAnalyticsMetrics(startDate, endDate),
        this.getTrends(startDate, endDate)
      ])

      const insights = this.generateInsights(summary, trends)

      return {
        summary,
        trends,
        insights
      }
      
    } catch (error) {
      console.error('Failed to generate analytics report:', error)
      throw error
    }
  }

  private static async getTrends(startDate: Date, endDate: Date) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase
      .rpc('get_analytics_trends', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      })

    if (error) throw error

    return {
      dailyDownloads: data?.daily_downloads || [],
      dailySignups: data?.daily_signups || [],
      dailyUpgrades: data?.daily_upgrades || []
    }
  }

  private static generateInsights(
    summary: AnalyticsMetrics,
    trends: any
  ): string[] {
    const insights: string[] = []

    // Conversion rate insights
    if (summary.conversionFunnel.conversionRate > 5) {
      insights.push('🎉 Excellent conversion rate! Your freemium model is working well.')
    } else if (summary.conversionFunnel.conversionRate < 2) {
      insights.push('⚠️ Low conversion rate. Consider optimizing upgrade prompts or pricing.')
    }

    // Performance insights
    if (summary.performanceMetrics.averageGenerationTime > 30000) {
      insights.push('🐌 Generation times are high. Consider optimizing the code generation process.')
    }

    // Popular technology insights
    if (summary.popularTechCombinations.length > 0) {
      const topCombo = summary.popularTechCombinations[0]
      insights.push(`🔥 Most popular stack includes ${Object.values(topCombo.selections).join(', ')}`)
    }

    // Growth insights
    const recentDownloads = trends.dailyDownloads.slice(-7)
    const previousDownloads = trends.dailyDownloads.slice(-14, -7)
    
    if (recentDownloads.length > 0 && previousDownloads.length > 0) {
      const recentAvg = recentDownloads.reduce((sum: number, day: any) => sum + day.count, 0) / recentDownloads.length
      const previousAvg = previousDownloads.reduce((sum: number, day: any) => sum + day.count, 0) / previousDownloads.length
      
      if (recentAvg > previousAvg * 1.2) {
        insights.push('📈 Downloads are trending up! Great momentum.')
      } else if (recentAvg < previousAvg * 0.8) {
        insights.push('📉 Downloads are declining. Consider marketing initiatives.')
      }
    }

    return insights
  }
}