import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { withErrorHandling } from '@/lib/monitoring/error-handler'
import { logger } from '@/lib/monitoring/logger'

async function handler(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const supabase = createClient()
    
    // Simple query to test database connectivity
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    const responseTime = Date.now() - startTime
    
    if (error) {
      logger.warn('Database health check failed', {
        component: 'health_check',
        action: 'database_check',
        metadata: {
          error: error.message,
          responseTime,
        },
      })
      
      return NextResponse.json(
        { 
          status: 'unhealthy', 
          error: error.message,
          responseTime,
        },
        { status: 503 }
      )
    }
    
    logger.debug('Database health check passed', {
      component: 'health_check',
      action: 'database_check',
      metadata: { responseTime },
    })
    
    return NextResponse.json({
      status: 'healthy',
      responseTime,
      timestamp: new Date().toISOString(),
    })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    logger.error('Database health check error', error as Error, {
      component: 'health_check',
      action: 'database_check',
      metadata: { responseTime },
    })
    
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: (error as Error).message,
        responseTime,
      },
      { status: 503 }
    )
  }
}

export const GET = withErrorHandling(handler, {
  component: 'health_check',
  action: 'database_check',
})