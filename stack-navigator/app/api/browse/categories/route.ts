import { NextRequest, NextResponse } from 'next/server'
import { BrowseStacksService } from '@/lib/browse-stacks-service'

export async function GET(request: NextRequest) {
  try {
    const categories = await BrowseStacksService.getCategories()
    
    return NextResponse.json({
      success: true,
      data: categories
    })
  } catch (error) {
    console.error('Error in categories API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch categories' 
      },
      { status: 500 }
    )
  }
}