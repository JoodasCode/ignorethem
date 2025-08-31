import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { UserService } from '@/lib/user-service'

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        user: null, 
        subscription: null, 
        tier: 'free',
        usage: null,
        isAuthenticated: false
      })
    }

    // Get comprehensive user session data
    const sessionData = await UserService.getUserSession(user.id)

    // Update last active timestamp
    await UserService.updateLastActive(user.id)

    return NextResponse.json({
      ...sessionData,
      isAuthenticated: true
    })
  } catch (error) {
    console.error('Error in GET /api/auth/session:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      user: null,
      subscription: null,
      tier: 'free',
      usage: null,
      isAuthenticated: false
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { preferences } = await request.json()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update user preferences
    const updatedUser = await UserService.updateUserProfile(user.id, preferences)

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Error in POST /api/auth/session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}