import { NextRequest, NextResponse } from 'next/server'
import { templatesService } from '@/lib/templates-service'

export async function GET(request: NextRequest) {
  try {
    const categories = await templatesService.getCategories()

    return NextResponse.json({
      success: true,
      data: categories
    })
  } catch (error) {
    console.error('Error fetching template categories:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch template categories',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}