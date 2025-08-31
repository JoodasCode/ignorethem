// Temporary stub for analytics functionality
export class AnalyticsService {
  static async trackEvent(event: string, properties?: any) {
    console.log('Analytics event:', event, properties)
  }
  
  static async getAnalytics() {
    return {
      totalGenerations: 0,
      popularTechCombinations: [],
      conversionFunnel: {},
      performanceMetrics: {}
    }
  }

  static async getAnalyticsMetrics(startDate?: Date, endDate?: Date) {
    return {
      metrics: {
        totalStackGenerations: 0,
        totalConversations: 0,
        totalUsers: 0,
        conversionRate: 0,
        popularTechnologies: [],
        techCombinations: [],
        userGrowth: [],
        retentionMetrics: []
      }
    }
  }

  static async getConversionFunnel(startDate?: Date, endDate?: Date) {
    return {
      funnel: {
        visitors: 0,
        signups: 0,
        firstConversation: 0,
        stackGeneration: 0,
        upgrades: 0
      }
    }
  }

  static async getTechnologyPopularity(category?: string, limit: number = 10) {
    return {
      technologies: []
    }
  }

  static async generateAnalyticsReport(startDate?: Date, endDate?: Date) {
    return {
      report: {
        summary: 'No data available',
        insights: [],
        recommendations: []
      }
    }
  }

  static async trackUpgradePrompt(userId: string, promptType: string, action: string, metadata?: any) {
    console.log('Upgrade prompt tracked:', { userId, promptType, action, metadata })
  }

  static async trackConversion(conversionData: any) {
    console.log('Conversion tracked:', conversionData)
  }

  static async trackDownload(downloadData: any) {
    console.log('Download tracked:', downloadData)
  }
}

// Alias for backward compatibility
export const AnalyticsMCPService = AnalyticsService