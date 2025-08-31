import { NextRequest, NextResponse } from 'next/server'
import { BrowseStacksService } from '@/lib/browse-stacks-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stackId = params.id
    const stack = await BrowseStacksService.getStackById(stackId)
    
    if (!stack) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Stack not found' 
        },
        { status: 404 }
      )
    }

    // Get additional data
    const [similarStacks, stats] = await Promise.all([
      BrowseStacksService.getSimilarStacks(stackId, 5),
      BrowseStacksService.getStackStats(stackId)
    ])

    return NextResponse.json({
      success: true,
      data: {
        stack,
        similar_stacks: similarStacks,
        stats
      }
    })
  } catch (error) {
    console.error('Error in stack details API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch stack details' 
      },
      { status: 500 }
    )
  }
}