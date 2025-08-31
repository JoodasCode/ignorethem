import { NextRequest, NextResponse } from 'next/server'
import { templatesService } from '@/lib/templates-service'
import { headers } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userTier = (searchParams.get('tier') || 'free') as 'free' | 'starter' | 'pro'

    const preview = await templatesService.getTemplatePreview(params.id, userTier)

    // Record template usage
    const headersList = headers()
    const userAgent = headersList.get('user-agent') || ''
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIp || ''

    await templatesService.recordTemplateUsage({
      template_id: params.id,
      action: 'preview',
      ip_address: ipAddress,
      user_agent: userAgent
    })

    return NextResponse.json({
      success: true,
      data: preview
    })
  } catch (error) {
    console.error('Error fetching template preview:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch template preview',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}