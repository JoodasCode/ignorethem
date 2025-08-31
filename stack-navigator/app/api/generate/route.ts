import { NextRequest, NextResponse } from 'next/server'
import { codeGenerator } from '@/lib/code-generator'
import { ZipGeneratorService } from '@/lib/zip-generator'
import { UsageTrackingService } from '@/lib/usage-tracking'
import { createServerSupabaseClient } from '@/lib/supabase-server'
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
    const supabase = createServerSupabaseClient()
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

    // Save to user_generated_stacks table for profile page
    await saveGeneratedStack(user.id, generatedProject, conversationId)

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
    const supabase = createServerSupabaseClient()
    
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

/**
 * Save generated stack to user_generated_stacks table for profile page
 */
async function saveGeneratedStack(
  userId: string,
  project: any,
  conversationId?: string
) {
  try {
    const supabase = createServerSupabaseClient()

    // Extract technologies from selections
    const technologies = Object.entries(project.selections)
      .filter(([key, value]) => value && value !== 'none')
      .map(([key, value]) => {
        // Map selection keys to readable names
        const techMap: Record<string, string> = {
          framework: value === 'nextjs' ? 'Next.js' : value as string,
          authentication: value === 'clerk' ? 'Clerk' : 
                         value === 'supabase-auth' ? 'Supabase Auth' :
                         value === 'nextauth' ? 'NextAuth.js' : value as string,
          database: value === 'supabase' ? 'Supabase' :
                   value === 'planetscale' ? 'PlanetScale' :
                   value === 'neon' ? 'Neon' : value as string,
          hosting: value === 'vercel' ? 'Vercel' :
                  value === 'netlify' ? 'Netlify' :
                  value === 'railway' ? 'Railway' :
                  value === 'render' ? 'Render' : value as string,
          payments: value === 'stripe' ? 'Stripe' :
                   value === 'paddle' ? 'Paddle' : value as string,
          analytics: value === 'posthog' ? 'PostHog' :
                    value === 'plausible' ? 'Plausible' :
                    value === 'ga4' ? 'Google Analytics' : value as string,
          email: value === 'resend' ? 'Resend' :
                value === 'postmark' ? 'Postmark' :
                value === 'sendgrid' ? 'SendGrid' : value as string,
          monitoring: value === 'sentry' ? 'Sentry' :
                     value === 'bugsnag' ? 'Bugsnag' : value as string,
          ui: value === 'shadcn' ? 'shadcn/ui' :
              value === 'chakra' ? 'Chakra UI' :
              value === 'mantine' ? 'Mantine' : value as string
        }
        return techMap[key] || value as string
      })

    // Generate stack description based on selections
    const stackDescription = `Generated stack with ${technologies.slice(0, 3).join(', ')}${technologies.length > 3 ? ` and ${technologies.length - 3} more technologies` : ''}`

    const { error } = await supabase
      .from('user_generated_stacks')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        stack_name: project.name,
        stack_description: stackDescription,
        technologies: technologies,
        generated_files: project.files || null, // Store generated files if available
        download_count: 1 // Initial download
      })

    if (error) {
      console.error('Failed to save generated stack:', error)
    }
  } catch (error) {
    console.error('Error saving generated stack:', error)
  }
}

// GET endpoint for checking generation limits
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
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