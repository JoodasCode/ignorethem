import { NextRequest, NextResponse } from 'next/server'
import { monitoringDashboard } from '@/lib/monitoring/dashboard'
import { withErrorHandling } from '@/lib/monitoring/error-handler'
import { logger } from '@/lib/monitoring/logger'

async function handler(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Perform all health checks
    const [databaseHealth, aiHealth, stripeHealth] = await Promise.allSettled([
      monitoringDashboard.checkDatabaseHealth(),
      monitoringDashboard.checkAIServiceHealth(),
      monitoringDashboard.checkStripeHealth(),
    ])
    
    const responseTime = Date.now() - startTime
    
    // Get system health status
    const systemHealth = monitoringDashboard.getSystemHealth()
    
    const healthData = {
      status: systemHealth.status,
      timestamp: new Date().toISOString(),
      responseTime,
      services: {
        database: databaseHealth.status === 'fulfilled' ? databaseHealth.value : { status: 'unhealthy', error: 'Health check failed' },
        ai: aiHealth.status === 'fulfilled' ? aiHealth.value : { status: 'unhealthy', error: 'Health check failed' },
        stripe: stripeHealth.status === 'fulfilled' ? stripeHealth.value : { status: 'unhealthy', error: 'Health check failed' },
      },
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV,
    }
    
    logger.info('System health check completed', {
      component: 'health_check',
      action: 'system_check',
      metadata: {
        status: systemHealth.status,
        responseTime,
        serviceCount: systemHealth.services.length,
      },
    })
    
    // Return appropriate status code based on health
    const statusCode = systemHealth.status === 'healthy' ? 200 : 
                      systemHealth.status === 'degraded' ? 200 : 503
    
    return NextResponse.json(healthData, { status: statusCode })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    logger.error('System health check error', error as Error, {
      component: 'health_check',
      action: 'system_check',
      metadata: { responseTime },
    })
    
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: (error as Error).message,
        responseTime,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}

export const GET = withErrorHandling(handler, {
  component: 'health_check',
  action: 'system_check',
})