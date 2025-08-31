import { NextRequest, NextResponse } from 'next/server'
import { BrowseStacksService } from '@/lib/browse-stacks-service'
import { auth } from '@clerk/nextjs'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stackId = params.id
    const { userId } = auth()
    const body = await request.json()
    
    const { rating, review } = body
    
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rating must be between 1 and 5' 
        },
        { status: 400 }
      )
    }

    const success = await BrowseStacksService.rateStack(
      stackId,
      rating,
      userId || undefined,
      review
    )

    if (!success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to save rating' 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Rating saved successfully'
      }
    })
  } catch (error) {
    console.error('Error in rate stack API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to rate stack' 
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stackId = params.id
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    const result = await BrowseStacksService.getStackRatings(stackId, limit, offset)
    
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error in get stack ratings API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch ratings' 
      },
      { status: 500 }
    )
  }
}