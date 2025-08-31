import { NextRequest, NextResponse } from 'next/server'
import { templatesService } from '@/lib/templates-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '6')

    const templates = await templatesService.getFeaturedTemplates(limit)

    return NextResponse.json({
      success: true,
      data: templates
    })
  } catch (error) {
    console.error('Error fetching featured templates:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch featured templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}