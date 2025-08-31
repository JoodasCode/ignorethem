import { useState, useEffect } from 'react'
import { useAuth } from './use-auth'
import { useTheme } from 'next-themes'

interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  email_notifications: boolean
}

interface UseUserPreferencesReturn {
  preferences: UserPreferences | null
  isLoading: boolean
  error: string | null
  updateTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>
  updateEmailNotifications: (enabled: boolean) => Promise<void>
  refetch: () => Promise<void>
}

export function useUserPreferences(): UseUserPreferencesReturn {
  const { user, isAuthenticated } = useAuth()
  const { setTheme } = useTheme()
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPreferences = async () => {
    if (!isAuthenticated || !user) {
      setPreferences(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/user/preferences')
      
      if (!response.ok) {
        throw new Error('Failed to fetch preferences')
      }

      const data = await response.json()
      setPreferences(data)

      // Sync theme with next-themes
      if (data.theme) {
        setTheme(data.theme)
      }
    } catch (err) {
      console.error('Failed to fetch user preferences:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch preferences')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPreferences()
  }, [user, isAuthenticated])

  const updatePreference = async (updates: Partial<UserPreferences>) => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated')
    }

    try {
      setError(null)

      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update preferences')
      }

      const data = await response.json()
      setPreferences(data)

      // Sync theme with next-themes if theme was updated
      if (updates.theme) {
        setTheme(updates.theme)
      }
    } catch (err) {
      console.error('Failed to update preferences:', err)
      setError(err instanceof Error ? err.message : 'Failed to update preferences')
      throw err
    }
  }

  const updateTheme = async (theme: 'light' | 'dark' | 'system') => {
    await updatePreference({ theme })
  }

  const updateEmailNotifications = async (email_notifications: boolean) => {
    await updatePreference({ email_notifications })
  }

  return {
    preferences,
    isLoading,
    error,
    updateTheme,
    updateEmailNotifications,
    refetch: fetchPreferences,
  }
}