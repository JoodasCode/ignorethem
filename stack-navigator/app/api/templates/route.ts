import { NextRequest, NextResponse } from 'next/server'
import { templatesService, TemplateFilters, TemplateSort } from '@/lib/templates-service'
import { headers } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse filters
    const filters: TemplateFilters = {}
    
    if (searchParams.get('category')) {
      filters.category = searchParams.get('category')!
    }
    
    if (searchParams.get('complexity')) {
      filters.complexity = searchParams.get('complexity')!
    }
    
    if (searchParams.get('technologies')) {
      filters.technologies = searchParams.get('technologies')!.split(',')
    }
    
    if (searchParams.get('featured')) {
      filters.is_featured = searchParams.get('featured') === 'true'
    }
    
    if (searchParams.get('premium')) {
      filters.is_premium = searchParams.get('premium') === 'true'
    }
    
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!
    }

    // Parse sorting
    const sortField = searchParams.get('sort') || 'rating'
    const sortDirection = searchParams.get('order') || 'desc'
    const sort: TemplateSort = {
      field: sortField as any,
      direction: sortDirection as 'asc' | 'desc'
    }

    // Parse pagination
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get templates
    const result = await templatesService.getTemplates(filters, sort, limit, offset)

    return NextResponse.json({
      success: true,
      data: result.templates,
      total: result.total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Sync templates from file system (admin only)
    await templatesService.syncTemplatesFromFileSystem()

    return NextResponse.json({
      success: true,
      message: 'Templates synced successfully'
    })
  } catch (error) {
    console.error('Error syncing templates:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to sync templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}