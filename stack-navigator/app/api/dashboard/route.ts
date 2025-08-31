import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { DashboardService } from '@/lib/dashboard-service'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get comprehensive dashboard data
    const dashboardData = await DashboardService.getDashboardData(user.id)

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Dashboard data fetch failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}