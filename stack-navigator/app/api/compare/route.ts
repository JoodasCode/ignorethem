import { NextRequest, NextResponse } from 'next/server'
import { CompareStacksService, type CompareStacksRequest } from '@/lib/compare-stacks-service'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

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

    const body: CompareStacksRequest = await request.json()
    
    // Validate request
    if (!body.stack_ids || !Array.isArray(body.stack_ids)) {
      return NextResponse.json(
        { error: 'stack_ids array is required' },
        { status: 400 }
      )
    }

    if (body.stack_ids.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 stacks are required for comparison' },
        { status: 400 }
      )
    }

    if (body.stack_ids.length > 3) {
      return NextResponse.json(
        { error: 'Maximum 3 stacks can be compared at once' },
        { status: 400 }
      )
    }

    // Perform comparison
    const comparisonMatrix = await CompareStacksService.compareStacks(
      body.stack_ids,
      user.id,
      body.user_context
    )

    if (!comparisonMatrix) {
      return NextResponse.json(
        { error: 'Failed to generate comparison' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      comparison: comparisonMatrix
    })

  } catch (error: any) {
    console.error('Error in compare stacks API:', error)
    
    // Handle specific error types
    if (error.message.includes('not allowed') || error.message.includes('Upgrade')) {
      return NextResponse.json(
        { 
          error: error.message,
          upgrade_required: true,
          feature: 'stack_comparison'
        },
        { status: 403 }
      )
    }

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get comparison history
    const { comparisons, total } = await CompareStacksService.getComparisonHistory(
      user.id,
      limit,
      offset
    )

    return NextResponse.json({
      success: true,
      comparisons,
      total,
      pagination: {
        limit,
        offset,
        has_more: offset + limit < total
      }
    })

  } catch (error) {
    console.error('Error fetching comparison history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}