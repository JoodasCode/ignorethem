import { NextRequest, NextResponse } from 'next/server'
import { templatesService, TemplateFilters } from '@/lib/templates-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query.trim()) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      )
    }

    // Parse additional filters
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

    const templates = await templatesService.searchTemplates(query, filters, limit)

    return NextResponse.json({
      success: true,
      data: templates,
      query,
      total: templates.length
    })
  } catch (error) {
    console.error('Error searching templates:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}