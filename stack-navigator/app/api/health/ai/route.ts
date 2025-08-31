import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@ai-sdk/openai'
import { withErrorHandling } from '@/lib/monitoring/error-handler'
import { logger } from '@/lib/monitoring/logger'

async function handler(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Simple test to check OpenAI API connectivity
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    })
    
    const responseTime = Date.now() - startTime
    
    if (!response.ok) {
      logger.warn('AI service health check failed', {
        component: 'health_check',
        action: 'ai_check',
        metadata: {
          status: response.status,
          statusText: response.statusText,
          responseTime,
        },
      })
      
      return NextResponse.json(
        { 
          status: 'unhealthy', 
          error: `OpenAI API returned ${response.status}`,
          responseTime,
        },
        { status: 503 }
      )
    }
    
    logger.debug('AI service health check passed', {
      component: 'health_check',
      action: 'ai_check',
      metadata: { responseTime },
    })
    
    return NextResponse.json({
      status: 'healthy',
      responseTime,
      timestamp: new Date().toISOString(),
    })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    logger.error('AI service health check error', error as Error, {
      component: 'health_check',
      action: 'ai_check',
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
  action: 'ai_check',
})