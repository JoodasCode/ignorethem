import { NextRequest, NextResponse } from 'next/server'
import { BrowseStacksService, type BrowseFilters, type BrowseOptions } from '@/lib/browse-stacks-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse filters
    const filters: BrowseFilters = {}
    if (searchParams.get('category')) {
      filters.category = searchParams.get('category')!
    }
    if (searchParams.get('technologies')) {
      filters.technologies = searchParams.get('technologies')!.split(',')
    }
    if (searchParams.get('complexity')) {
      filters.complexity = searchParams.get('complexity') as 'simple' | 'medium' | 'complex'
    }
    if (searchParams.get('rating_min')) {
      filters.rating_min = parseFloat(searchParams.get('rating_min')!)
    }
    if (searchParams.get('setup_time_max')) {
      filters.setup_time_max = parseInt(searchParams.get('setup_time_max')!)
    }
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!
    }

    // Parse options
    const options: BrowseOptions = {}
    if (searchParams.get('limit')) {
      options.limit = parseInt(searchParams.get('limit')!)
    }
    if (searchParams.get('offset')) {
      options.offset = parseInt(searchParams.get('offset')!)
    }
    if (searchParams.get('sort_by')) {
      options.sort_by = searchParams.get('sort_by') as 'popularity' | 'rating' | 'newest' | 'setup_time'
    }
    if (searchParams.get('sort_order')) {
      options.sort_order = searchParams.get('sort_order') as 'asc' | 'desc'
    }

    const result = await BrowseStacksService.getPopularStacks(filters, options)
    
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error in browse stacks API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch stacks' 
      },
      { status: 500 }
    )
  }
}