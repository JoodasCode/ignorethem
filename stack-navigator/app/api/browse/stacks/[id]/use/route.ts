import { NextRequest, NextResponse } from 'next/server'
import { BrowseStacksService } from '@/lib/browse-stacks-service'
import { auth } from '@clerk/nextjs'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stackId = params.id
    const { userId } = auth()
    const body = await request.json()
    
    const { projectName, conversationId } = body
    
    if (!projectName) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Project name is required' 
        },
        { status: 400 }
      )
    }

    // Record stack usage for analytics
    const userAgent = request.headers.get('user-agent') || undefined
    const forwarded = request.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.ip

    await BrowseStacksService.recordStackUsage(
      stackId,
      userId || undefined,
      ipAddress,
      userAgent
    )

    // Create project from stack
    const projectId = await BrowseStacksService.useStack(
      stackId,
      projectName,
      userId || undefined,
      conversationId
    )

    if (!projectId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create project from stack' 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        project_id: projectId,
        message: 'Project created successfully from stack'
      }
    })
  } catch (error) {
    console.error('Error in use stack API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to use stack' 
      },
      { status: 500 }
    )
  }
}