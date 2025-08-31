import { NextRequest, NextResponse } from 'next/server'
import { BrowseStacksService } from '@/lib/browse-stacks-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 6

    const stacks = await BrowseStacksService.getFeaturedStacks(limit)
    
    return NextResponse.json({
      success: true,
      data: stacks
    })
  } catch (error) {
    console.error('Error in featured stacks API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch featured stacks' 
      },
      { status: 500 }
    )
  }
}