import { auth, currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  return userId
}

export async function getCurrentUser() {
  const user = await currentUser()
  return user
}

export async function requireUser() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/sign-in')
  }
  
  return user
}