import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch user's generated stacks
    const { data: stacks, error } = await supabase
      .from('user_generated_stacks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching generated stacks:', error)
      return NextResponse.json(
        { error: 'Failed to fetch stacks' },
        { status: 500 }
      )
    }

    return NextResponse.json({ stacks: stacks || [] })
  } catch (error) {
    console.error('Error in GET /api/user/generated-stacks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      conversation_id, 
      stack_name, 
      stack_description, 
      technologies, 
      generated_files 
    } = body

    // Validate required fields
    if (!stack_name || !technologies || !Array.isArray(technologies)) {
      return NextResponse.json(
        { error: 'Missing required fields: stack_name, technologies' },
        { status: 400 }
      )
    }

    // Insert the new stack
    const { data: stack, error } = await supabase
      .from('user_generated_stacks')
      .insert({
        user_id: user.id,
        conversation_id,
        stack_name,
        stack_description,
        technologies,
        generated_files,
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving generated stack:', error)
      return NextResponse.json(
        { error: 'Failed to save stack' },
        { status: 500 }
      )
    }

    return NextResponse.json({ stack })
  } catch (error) {
    console.error('Error in POST /api/user/generated-stacks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}