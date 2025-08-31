import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { subscriptionService } from '@/lib/subscription-service'

export async function GET(request: NextRequest) {
  try {
    // Get auth token from request headers (set by middleware)
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ 
        user: null, 
        subscription: null, 
        tier: 'free',
        usage: null
      })
    }

    // Get user from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        user: null, 
        subscription: null, 
        tier: 'free',
        usage: null
      })
    }

    // Get user profile from database
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    // Get subscription information - with error handling
    let subscription = null
    let tier = 'free'
    
    try {
      subscription = await subscriptionService.getSubscription(user.id)
      tier = await subscriptionService.getUserTier(user.id)
    } catch (error) {
      console.warn('Subscription service unavailable, using free tier:', error)
      // Continue with free tier if subscription fetch fails
    }

    // Get usage information - with graceful fallback
    let usage = null
    try {
      const { data: usageData } = await supabase
        .rpc('get_current_usage_period', { p_user_id: user.id })
      usage = usageData
    } catch (error) {
      console.warn('Usage tracking unavailable:', error)
      // Provide default usage for free tier
      usage = {
        id: 'default',
        user_id: user.id,
        period_start: new Date().toISOString(),
        period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        stack_generations_used: 0,
        stack_generations_limit: 1,
        conversations_saved: 0,
        conversations_limit: 1,
        messages_sent: 0,
        messages_limit: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }

    return NextResponse.json({
      user: {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        avatar_url: userProfile.avatar_url,
        theme: userProfile.theme,
        email_notifications: userProfile.email_notifications,
        total_projects: userProfile.total_projects,
        total_downloads: userProfile.total_downloads,
        created_at: userProfile.created_at,
        last_active_at: userProfile.last_active_at
      },
      subscription,
      tier,
      usage
    })
  } catch (error) {
    console.error('Error in GET /api/user/session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}