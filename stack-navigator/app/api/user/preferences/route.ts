import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user preferences from database
    const { data: userPrefs, error } = await supabase
      .from('users')
      .select('theme, email_notifications')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user preferences:', error)
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }

    return NextResponse.json({
      theme: userPrefs?.theme || 'system',
      email_notifications: userPrefs?.email_notifications ?? true
    })
  } catch (error) {
    console.error('Error in GET /api/user/preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { theme, email_notifications } = body

    // Validate theme value
    if (theme && !['light', 'dark', 'system'].includes(theme)) {
      return NextResponse.json({ error: 'Invalid theme value' }, { status: 400 })
    }

    // Update user preferences
    const updates: any = {}
    if (theme !== undefined) updates.theme = theme
    if (email_notifications !== undefined) updates.email_notifications = email_notifications

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select('theme, email_notifications')
      .single()

    if (error) {
      console.error('Error updating user preferences:', error)
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    return NextResponse.json({
      theme: data.theme,
      email_notifications: data.email_notifications
    })
  } catch (error) {
    console.error('Error in PATCH /api/user/preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}