import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { subscriptionService } from '@/lib/subscription-service'

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        user: null, 
        subscription: null, 
        tier: 'free' 
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

    // Get subscription information
    let subscription = null
    let tier = 'free'
    
    try {
      subscription = await subscriptionService.getSubscription(user.id)
      tier = await subscriptionService.getUserTier(user.id)
    } catch (error) {
      console.error('Error fetching subscription:', error)
      // Continue with free tier if subscription fetch fails
    }

    // Get usage information
    let usage = null
    try {
      const { data: usageData } = await supabase
        .rpc('get_current_usage_period', { p_user_id: user.id })
      usage = usageData
    } catch (error) {
      console.error('Error fetching usage:', error)
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