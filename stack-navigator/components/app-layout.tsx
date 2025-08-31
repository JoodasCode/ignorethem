"use client"

import { useEffect } from 'react'
import { useUserSession } from '@/hooks/use-user-session'
import { useUserPreferences } from '@/hooks/use-user-preferences'
import { useTheme } from 'next-themes'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, isAuthenticated } = useUserSession()
  const { preferences } = useUserPreferences()
  const { setTheme } = useTheme()

  // Sync theme with user preferences when user logs in
  useEffect(() => {
    if (isAuthenticated && preferences?.theme) {
      setTheme(preferences.theme)
    }
  }, [isAuthenticated, preferences?.theme, setTheme])

  return <>{children}</>
}