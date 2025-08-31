import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { UserService } from '@/lib/user-service'
import { CodeGenerator } from '@/lib/code-generator'
import { ZipGeneratorService } from '@/lib/zip-generator'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const projectId = (await params).id

    // Check if user can generate a stack (usage limits)
    const canGenerate = await UserService.canGenerateStack(user.id)
    if (!canGenerate) {
      return NextResponse.json(
        { error: 'Stack generation limit reached. Please upgrade your plan.' },
        { status: 403 }
      )
    }

    // Get project and verify ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Update project status to generating
    await supabase
      .from('projects')
      .update({
        generation_status: 'generating',
        generation_started_at: new Date().toISOString(),
        generation_error: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)

    try {
      // Generate the project code
      const codeGenerator = new CodeGenerator()
      const generatedProject = await codeGenerator.generateProject(project.name, project.stack_selections)

      // Create ZIP file
      const zipResult = await ZipGeneratorService.generateProjectZip(generatedProject, { userId: project.user_id || 'anonymous', projectName: project.name })

      // Update project with completion status
      await supabase
        .from('projects')
        .update({
          generation_status: 'completed',
          generation_completed_at: new Date().toISOString(),
          zip_file_size: zipResult.zipBuffer?.length || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)

      // Increment usage tracking
      await UserService.incrementStackGeneration(user.id)

      // Return the ZIP file
      if (!zipResult.zipBuffer) {
        throw new Error('Failed to generate ZIP file')
      }

      return new NextResponse(new Uint8Array(zipResult.zipBuffer), {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${project.name}.zip"`,
          'Content-Length': zipResult.zipBuffer.length.toString(),
        },
      })

    } catch (generationError) {
      // Update project with error status
      await supabase
        .from('projects')
        .update({
          generation_status: 'failed',
          generation_error: generationError instanceof Error ? generationError.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)

      throw generationError
    }

  } catch (error) {
    console.error('Project regeneration failed:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate project' },
      { status: 500 }
    )
  }
}