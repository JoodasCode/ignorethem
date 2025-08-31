import { useState, useEffect } from 'react'
import { useAuth } from './use-auth'

export interface Conversation {
  id: string
  title: string | null
  phase: 'discovery' | 'requirements' | 'constraints' | 'recommendation' | 'refinement'
  status: 'active' | 'completed' | 'abandoned'
  created_at: string
  updated_at: string
  message_count: number
  project_type?: string
}

interface UseConversationsReturn {
  conversations: Conversation[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useConversations(): UseConversationsReturn {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = async () => {
    // If auth is still loading, wait
    if (authLoading) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/dashboard/conversations')
      
      if (!response.ok) {
        if (response.status === 401) {
          // Auth error, but still show empty state instead of loading forever
          setConversations([])
          setError(null) // Don't show error for auth issues
          setIsLoading(false)
          return
        }
        throw new Error(`Failed to fetch conversations: ${response.status}`)
      }

      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations')
      setConversations([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [user, isAuthenticated, authLoading])

  return {
    conversations,
    isLoading: authLoading || isLoading,
    error,
    refetch: fetchConversations,
  }
}