import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { withErrorHandling } from '@/lib/monitoring/error-handler'
import { logger } from '@/lib/monitoring/logger'

async function handler(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { 
          status: 'unhealthy', 
          error: 'Stripe secret key not configured',
          responseTime: Date.now() - startTime,
        },
        { status: 503 }
      )
    }
    
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })
    
    // Simple test to check Stripe API connectivity
    await stripe.products.list({ limit: 1 })
    
    const responseTime = Date.now() - startTime
    
    logger.debug('Stripe health check passed', {
      component: 'health_check',
      action: 'stripe_check',
      metadata: { responseTime },
    })
    
    return NextResponse.json({
      status: 'healthy',
      responseTime,
      timestamp: new Date().toISOString(),
    })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    logger.error('Stripe health check error', error as Error, {
      component: 'health_check',
      action: 'stripe_check',
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
  action: 'stripe_check',
})