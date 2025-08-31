import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return user
}

export async function getCurrentUser() {
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}