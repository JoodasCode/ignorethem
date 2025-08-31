import { NextRequest, NextResponse } from 'next/server'
import { templatesService } from '@/lib/templates-service'
import { headers } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { user_id } = body

    // Record template usage
    const headersList = headers()
    const userAgent = headersList.get('user-agent') || ''
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIp || ''

    await templatesService.recordTemplateUsage({
      template_id: params.id,
      user_id: user_id || undefined,
      action: 'use',
      ip_address: ipAddress,
      user_agent: userAgent
    })

    // Get the template for response
    const template = await templatesService.getTemplate(params.id)

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Template usage recorded',
      data: {
        template_id: template.id,
        template_name: template.name,
        template_config: template.template_config
      }
    })
  } catch (error) {
    console.error('Error recording template usage:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to record template usage',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}