import { NextRequest, NextResponse } from 'next/server'
import { templatesService } from '@/lib/templates-service'
import { headers } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await templatesService.getTemplate(params.id)

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      )
    }

    // Record template view
    const headersList = headers()
    const userAgent = headersList.get('user-agent') || ''
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIp || ''

    await templatesService.recordTemplateView({
      template_id: template.id,
      ip_address: ipAddress,
      user_agent: userAgent,
      referrer: headersList.get('referer') || undefined
    })

    return NextResponse.json({
      success: true,
      data: template
    })
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch template',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}