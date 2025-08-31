import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { UserService } from '@/lib/user-service'

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

    // Get current usage data
    const usage = await UserService.getUserUsage(user.id)
    
    if (!usage) {
      return NextResponse.json(
        { error: 'Usage data not found' },
        { status: 404 }
      )
    }

    // Calculate usage percentages
    const stackUsagePercent = usage.stack_generations_limit > 0 
      ? (usage.stack_generations_used / usage.stack_generations_limit) * 100 
      : 0

    const conversationUsagePercent = usage.conversations_limit > 0 
      ? (usage.conversations_saved / usage.conversations_limit) * 100 
      : 0

    const messageUsagePercent = usage.messages_limit > 0 
      ? (usage.messages_sent / usage.messages_limit) * 100 
      : 0

    // Get historical usage data for charts (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: historicalUsage } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', user.id)
      .gte('period_start', sixMonthsAgo.toISOString())
      .order('period_start', { ascending: true })

    return NextResponse.json({
      current: {
        stackGenerationsUsed: usage.stack_generations_used,
        stackGenerationsLimit: usage.stack_generations_limit,
        stackUsagePercent: Math.round(stackUsagePercent),
        conversationsSaved: usage.conversations_saved,
        conversationsLimit: usage.conversations_limit,
        conversationUsagePercent: Math.round(conversationUsagePercent),
        messagesUsed: usage.messages_sent,
        messagesLimit: usage.messages_limit,
        messageUsagePercent: Math.round(messageUsagePercent),
        periodStart: usage.period_start,
        periodEnd: usage.period_end
      },
      historical: historicalUsage || [],
      canGenerateStack: await UserService.canGenerateStack(user.id),
      canSaveConversation: await UserService.canSaveConversation(user.id)
    })
  } catch (error) {
    console.error('Usage data fetch failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    )
  }
}