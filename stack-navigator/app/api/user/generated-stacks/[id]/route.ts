import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: stackId } = await params

    // Delete the stack (RLS will ensure user can only delete their own stacks)
    const { error } = await supabase
      .from('user_generated_stacks')
      .delete()
      .eq('id', stackId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting generated stack:', error)
      return NextResponse.json(
        { error: 'Failed to delete stack' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/user/generated-stacks/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}