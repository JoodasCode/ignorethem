import { NextRequest, NextResponse } from 'next/server'
import { codeGenerator } from '@/lib/code-generator'
import { ZipGeneratorService } from '@/lib/zip-generator'
import { UsageTrackingService } from '@/lib/usage-tracking'
import { createClient } from '@/lib/supabase'
import { z } from 'zod'

// Request validation schema
const GenerateRequestSchema = z.object({
  projectName: z.string().min(1).max(50),
  selections: z.object({
    framework: z.enum(['nextjs', 'remix', 'sveltekit']),
    authentication: z.enum(['clerk', 'supabase-auth', 'nextauth', 'none']),
    database: z.enum(['supabase', 'planetscale', 'neon', 'none']),
    hosting: z.enum(['vercel', 'netlify', 'railway', 'render']),
    payments: z.enum(['stripe', 'paddle', 'none']),
    analytics: z.enum(['posthog', 'plausible', 'ga4', 'none']),
    email: z.enum(['resend', 'postmark', 'sendgrid', 'none']),
    monitoring: z.enum(['sentry', 'bugsnag', 'none']),
    ui: z.enum(['shadcn', 'chakra', 'mantine', 'none'])
  }),
  conversationId: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = GenerateRequestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { projectName, selections, conversationId } = validationResult.data

    // Check usage limits before generation
    const usageCheck = await UsageTrackingService.checkStackGeneration(user.id)
    if (!usageCheck.allowed) {
      const upgradePrompt = UsageTrackingService.getUpgradePrompt(
        await UsageTrackingService.getUserTier(user.id),
        'stack'
      )

      return NextResponse.json(
        {
          error: 'Usage limit reached',
          reason: usageCheck.reason,
          upgradeRequired: usageCheck.upgradeRequired,
          upgradePrompt,
          remainingCount: usageCheck.remainingCount,
          resetDate: usageCheck.resetDate
        },
        { status: 429 }
      )
    }

    // Generate the project
    const generatedProject = await codeGenerator.generateProject(projectName, selections)

    // Generate ZIP file
    const zipResult = await ZipGeneratorService.generateProjectZip(generatedProject, {
      userId: user.id,
      projectName,
      includeReadme: true,
      includeEnvTemplate: true,
      compressionLevel: 6
    })

    if (!zipResult.success) {
      return NextResponse.json(
        { 
          error: 'Project generation failed',
          details: zipResult.error
        },
        { status: 500 }
      )
    }

    // Save project configuration to database
    await saveProjectConfig(user.id, generatedProject, conversationId)

    // Return ZIP file as download
    if (!zipResult.zipBuffer) {
      throw new Error('Failed to generate ZIP file')
    }

    const response = new NextResponse(new Uint8Array(zipResult.zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipResult.filename}"`,
        'Content-Length': zipResult.size.toString(),
        'X-Usage-Remaining': zipResult.usageInfo?.remainingGenerations?.toString() || '0',
        'X-Reset-Date': zipResult.usageInfo?.resetDate?.toISOString() || ''
      }
    })

    return response

  } catch (error) {
    console.error('Project generation error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Save project configuration to database for future reference
 */
async function saveProjectConfig(
  userId: string,
  project: any,
  conversationId?: string
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        name: project.name,
        selections: project.selections,
        metadata: project.metadata,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to save project config:', error)
    }
  } catch (error) {
    console.error('Error saving project config:', error)
  }
}

// GET endpoint for checking generation limits
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get usage summary
    const usageSummary = await UsageTrackingService.getUsageSummary(user.id)
    const canGenerate = await UsageTrackingService.checkStackGeneration(user.id)

    return NextResponse.json({
      usage: usageSummary,
      canGenerate: canGenerate.allowed,
      reason: canGenerate.reason,
      remainingCount: canGenerate.remainingCount,
      resetDate: canGenerate.resetDate
    })

  } catch (error) {
    console.error('Usage check error:', error)
    
    return NextResponse.json(
      { error: 'Failed to check usage limits' },
      { status: 500 }
    )
  }
}