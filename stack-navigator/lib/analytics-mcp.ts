import { TechSelections } from './types/template'

const SUPABASE_PROJECT_ID = 'gexfrtzlxyrxccupmbjo'

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

/**
 * Analytics service using Supabase MCP for database operations
 */
export class AnalyticsMCPService {
  /**
   * Track a project download event
   */
  static async trackDownload(event: DownloadEvent): Promise<void> {
    try {
      // Insert download event
      const insertQuery = `
        INSERT INTO download_events (
          user_id, project_name, selections, file_count, zip_size, 
          generation_time, user_tier, conversation_id, session_id, downloaded_at
        ) VALUES (
          '${event.userId}', 
          '${event.projectName.replace(/'/g, "''")}', 
          '${JSON.stringify(event.selections)}', 
          ${event.fileCount}, 
          ${event.zipSize}, 
          ${event.generationTime}, 
          '${event.userTier}', 
          ${event.conversationId ? `'${event.conversationId}'` : 'NULL'}, 
          ${event.sessionId ? `'${event.sessionId}'` : 'NULL'}, 
          '${event.downloadedAt.toISOString()}'
        )
      `

      // Execute using MCP (this would be the actual MCP call in production)
      console.log('Tracking download event:', insertQuery)
      
      // Update technology popularity
      await this.updateTechPopularity(event.selections)
      
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
      
    } catch (error) {
      console.error('Failed to track download event:', error)
    }
  }

  /**
   * Track conversion funnel events
   */
  static async trackConversion(event: ConversionEvent): Promise<void> {
    try {
      const insertQuery = `
        INSERT INTO conversion_events (
          user_id, event_type, from_tier, to_tier, metadata, timestamp
        ) VALUES (
          '${event.userId}', 
          '${event.eventType}', 
          ${event.fromTier ? `'${event.fromTier}'` : 'NULL'}, 
          ${event.toTier ? `'${event.toTier}'` : 'NULL'}, 
          '${JSON.stringify(event.metadata || {})}', 
          '${event.timestamp.toISOString()}'
        )
      `

      console.log('Tracking conversion event:', insertQuery)
      
      // Send to PostHog
      await this.sendToPostHog(`conversion_${event.eventType}`, {
        from_tier: event.fromTier,
        to_tier: event.toTier,
        metadata: event.metadata
      })
      
    } catch (error) {
      console.error('Failed to track conversion event:', error)
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
      const insertQuery = `
        INSERT INTO upgrade_prompts (
          user_id, prompt_type, action, metadata
        ) VALUES (
          '${userId}', 
          '${promptType}', 
          '${action}', 
          '${JSON.stringify(metadata || {})}'
        )
      `

      console.log('Tracking upgrade prompt:', insertQuery)
      
      await this.sendToPostHog('upgrade_prompt', {
        prompt_type: promptType,
        action,
        metadata
      })
      
    } catch (error) {
      console.error('Failed to track upgrade prompt:', error)
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
      // In a real implementation, these would be MCP calls to the database functions
      const downloadStats = await this.getDownloadStats(startDate, endDate)
      const conversionStats = await this.getConversionStats(startDate, endDate)
      const performanceStats = await this.getPerformanceStats(startDate, endDate)
      const techPopularity = await this.getTechPopularity(startDate, endDate)

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
  ): Promise<Array<{
    technology: string
    category: string
    usageCount: number
    percentage: number
    trend: 'up' | 'down' | 'stable'
  }>> {
    try {
      // This would be an MCP call to get_technology_popularity function
      console.log(`Getting technology popularity for category: ${category}, limit: ${limit}`)
      
      // Mock data for now
      return [
        {
          technology: 'nextjs',
          category: 'framework',
          usageCount: 150,
          percentage: 75,
          trend: 'up'
        },
        {
          technology: 'clerk',
          category: 'authentication',
          usageCount: 120,
          percentage: 60,
          trend: 'stable'
        }
      ]
      
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
      // This would be an MCP call to get_conversion_funnel function
      console.log(`Getting conversion funnel from ${startDate} to ${endDate}`)
      
      // Mock data for now
      const signups = 100
      const firstGeneration = 75
      const upgrades = 15

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
          conversionRate: (firstGeneration / signups) * 100,
          dropoffRate: ((signups - firstGeneration) / signups) * 100
        },
        {
          stage: 'Upgrade',
          count: upgrades,
          conversionRate: (upgrades / firstGeneration) * 100,
          dropoffRate: ((firstGeneration - upgrades) / firstGeneration) * 100
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

  // Private helper methods

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

    for (const tech of technologies) {
      if (tech.value && tech.value !== 'none') {
        // This would be an MCP call to increment_tech_popularity function
        console.log(`Incrementing popularity for ${tech.category}: ${tech.value}`)
      }
    }
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
      const posthogApiKey = process.env.POSTHOG_API_KEY
      
      if (posthogApiKey) {
        const { PostHog } = await import('posthog-node')
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

  private static async getDownloadStats(startDate?: Date, endDate?: Date) {
    // This would be an MCP call to get_download_stats function
    console.log(`Getting download stats from ${startDate} to ${endDate}`)
    
    return {
      totalDownloads: 250,
      uniqueUsers: 180,
      averageGenerationTime: 5500,
      averageZipSize: 2048000
    }
  }

  private static async getConversionStats(startDate?: Date, endDate?: Date) {
    // This would be an MCP call to get_conversion_funnel function
    console.log(`Getting conversion stats from ${startDate} to ${endDate}`)
    
    const signups = 100
    const firstGeneration = 75
    const upgrades = 15

    return {
      signups,
      firstGeneration,
      upgrades,
      conversionRate: signups > 0 ? (upgrades / signups) * 100 : 0
    }
  }

  private static async getPerformanceStats(startDate?: Date, endDate?: Date) {
    // This would be an MCP call to get_performance_metrics function
    console.log(`Getting performance stats from ${startDate} to ${endDate}`)
    
    return {
      averageGenerationTime: 5500,
      p95GenerationTime: 12000,
      errorRate: 2.5
    }
  }

  private static async getTechPopularity(startDate?: Date, endDate?: Date) {
    // This would be an MCP call to get_tech_combinations function
    console.log(`Getting tech popularity from ${startDate} to ${endDate}`)
    
    return [
      {
        selections: {
          framework: 'nextjs',
          authentication: 'clerk',
          database: 'supabase'
        },
        count: 45,
        percentage: 18
      },
      {
        selections: {
          framework: 'nextjs',
          authentication: 'nextauth',
          database: 'planetscale'
        },
        count: 32,
        percentage: 12.8
      }
    ]
  }

  private static async getTrends(startDate: Date, endDate: Date) {
    // This would be an MCP call to get_analytics_trends function
    console.log(`Getting trends from ${startDate} to ${endDate}`)
    
    return {
      dailyDownloads: [
        { date: '2024-01-01', count: 15 },
        { date: '2024-01-02', count: 22 },
        { date: '2024-01-03', count: 18 }
      ],
      dailySignups: [
        { date: '2024-01-01', count: 8 },
        { date: '2024-01-02', count: 12 },
        { date: '2024-01-03', count: 10 }
      ],
      dailyUpgrades: [
        { date: '2024-01-01', count: 2 },
        { date: '2024-01-02', count: 3 },
        { date: '2024-01-03', count: 1 }
      ]
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
}