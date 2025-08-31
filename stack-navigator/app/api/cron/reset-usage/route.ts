import { NextRequest, NextResponse } from 'next/server'
import { UsageTrackingService } from '@/lib/usage-tracking'

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Reset expired usage periods
    const resetCount = await UsageTrackingService.checkAndResetExpiredPeriods()
    
    console.log(`Reset usage for ${resetCount} users`)
    
    return NextResponse.json({
      success: true,
      resetCount,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error in usage reset cron job:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 404 }
    )
  }
  
  return POST(request)
}