import { NextRequest, NextResponse } from 'next/server'
import { BrowseStacksService } from '@/lib/browse-stacks-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Search query is required' 
        },
        { status: 400 }
      )
    }

    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    const result = await BrowseStacksService.searchStacks(query, limit, offset)
    
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error in search stacks API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search stacks' 
      },
      { status: 500 }
    )
  }
}