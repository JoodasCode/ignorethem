import { NextRequest, NextResponse } from 'next/server'
import { AnalyticsMCPService } from '@/lib/analytics-mcp'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and has admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has admin role (you might want to implement proper role checking)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate')!) 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default: 30 days ago
    const endDate = searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate')!) 
      : new Date() // Default: now
    const metric = searchParams.get('metric') || 'overview'

    let data

    switch (metric) {
      case 'overview':
        data = await AnalyticsMCPService.getAnalyticsMetrics(startDate, endDate)
        break
      
      case 'conversion':
        data = await AnalyticsMCPService.getConversionFunnel(startDate, endDate)
        break
      
      case 'technology':
        const category = searchParams.get('category')
        const limit = parseInt(searchParams.get('limit') || '10')
        data = await AnalyticsMCPService.getTechnologyPopularity(category || undefined, limit)
        break
      
      case 'report':
        data = await AnalyticsMCPService.generateAnalyticsReport(startDate, endDate)
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid metric type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    })

  } catch (error) {
    console.error('Analytics API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST endpoint for tracking custom events
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { eventType, data: eventData } = body

    switch (eventType) {
      case 'upgrade_prompt':
        await AnalyticsMCPService.trackUpgradePrompt(
          user.id,
          eventData.promptType,
          eventData.action,
          eventData.metadata
        )
        break
      
      case 'conversion':
        await AnalyticsMCPService.trackConversion({
          userId: user.id,
          eventType: eventData.eventType,
          fromTier: eventData.fromTier,
          toTier: eventData.toTier,
          metadata: eventData.metadata,
          timestamp: new Date()
        })
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid event type' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Analytics tracking error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to track event',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}