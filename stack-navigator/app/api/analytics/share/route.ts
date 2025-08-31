import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { type, platform, title, url } = await request.json()

    // Get user from session (optional for analytics)
    const { data: { user } } = await supabase.auth.getUser()

    // Track the share event
    const { error } = await supabase
      .from('share_analytics')
      .insert({
        user_id: user?.id,
        content_type: type,
        platform,
        title,
        url,
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error tracking share:', error)
      return NextResponse.json({ error: 'Failed to track share' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in share analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}