import { NextRequest, NextResponse } from 'next/server'
import { templatesService } from '@/lib/templates-service'
import { headers } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { rating, review, user_id } = body

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    await templatesService.rateTemplate({
      template_id: params.id,
      user_id: user_id || undefined,
      rating,
      review: review || undefined
    })

    return NextResponse.json({
      success: true,
      message: 'Template rated successfully'
    })
  } catch (error) {
    console.error('Error rating template:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to rate template',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ratings = await templatesService.getTemplateRatings(params.id)

    return NextResponse.json({
      success: true,
      data: ratings
    })
  } catch (error) {
    console.error('Error fetching template ratings:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch template ratings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}