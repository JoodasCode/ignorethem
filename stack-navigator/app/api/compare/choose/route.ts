import { NextRequest, NextResponse } from 'next/server'
import { CompareStacksService } from '@/lib/compare-stacks-service'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface ChooseStackRequest {
  stack_id: string
  conversation_id?: string
  project_name?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body: ChooseStackRequest = await request.json()
    
    // Validate request
    if (!body.stack_id) {
      return NextResponse.json(
        { error: 'stack_id is required' },
        { status: 400 }
      )
    }

    // Choose stack and integrate with chat system
    const result = await CompareStacksService.chooseStackFromComparison(
      body.stack_id,
      user.id,
      body.conversation_id,
      body.project_name
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to choose stack' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Stack selected successfully',
      project_id: result.projectId,
      next_steps: {
        generate_project: !!body.project_name,
        continue_conversation: !!body.conversation_id && !body.project_name,
        start_new_conversation: !body.conversation_id && !body.project_name
      }
    })

  } catch (error: any) {
    console.error('Error choosing stack from comparison:', error)
    
    // Handle specific error types
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    if (error.message.includes('limit') || error.message.includes('upgrade')) {
      return NextResponse.json(
        { 
          error: error.message,
          upgrade_required: true,
          feature: 'project_generation'
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}