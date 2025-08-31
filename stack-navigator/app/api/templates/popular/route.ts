import { NextRequest, NextResponse } from 'next/server'
import { templatesService } from '@/lib/templates-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const templates = await templatesService.getPopularTemplates(limit)

    return NextResponse.json({
      success: true,
      data: templates
    })
  } catch (error) {
    console.error('Error fetching popular templates:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch popular templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}