import { NextRequest, NextResponse } from 'next/server'
import { templatesService } from '@/lib/templates-service'

export async function GET(request: NextRequest) {
  try {
    const analytics = await templatesService.getTemplateAnalytics()

    return NextResponse.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    console.error('Error fetching template analytics:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch template analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}