'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'

export interface GenerationStatus {
  id: string
  user_id: string
  project_name: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  progress: number
  current_step: string
  steps_completed: string[]
  error_message?: string
  download_url?: string
  created_at: string
  updated_at: string
}

interface UseRealtimeGenerationReturn {
  activeGenerations: GenerationStatus[]
  isGenerating: boolean
  getGenerationStatus: (id: string) => GenerationStatus | undefined
  subscribeToGeneration: (id: string) => void
  unsubscribeFromGeneration: (id: string) => void
}

export function useRealtimeGeneration(): UseRealtimeGenerationReturn {
  const [activeGenerations, setActiveGenerations] = useState<GenerationStatus[]>([])
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set())
  const { user } = useAuth()

  // Get generation status by ID
  const getGenerationStatus = useCallback((id: string): GenerationStatus | undefined => {
    return activeGenerations.find(gen => gen.id === id)
  }, [activeGenerations])

  // Subscribe to a specific generation
  const subscribeToGeneration = useCallback((id: string) => {
    if (!user || subscriptions.has(id)) return

    setSubscriptions(prev => new Set(prev).add(id))

    // Fetch initial status
    const fetchInitialStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('project_generations')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single()

        if (error) {
          console.error('Error fetching generation status:', error)
          return
        }

        if (data) {
          setActiveGenerations(prev => {
            const existing = prev.find(gen => gen.id === id)
            if (existing) {
              return prev.map(gen => gen.id === id ? data : gen)
            }
            return [...prev, data]
          })
        }
      } catch (error) {
        console.error('Error fetching generation status:', error)
      }
    }

    fetchInitialStatus()

    // Set up real-time subscription
    const channel = supabase
      .channel(`generation-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_generations',
          filter: `id=eq.${id}`
        },
        (payload) => {
          const updatedGeneration = payload.new as GenerationStatus

          setActiveGenerations(prev => {
            const existing = prev.find(gen => gen.id === id)
            if (existing) {
              return prev.map(gen => gen.id === id ? updatedGeneration : gen)
            }
            return [...prev, updatedGeneration]
          })

          // Remove from active generations if completed or failed
          if (updatedGeneration.status === 'completed' || updatedGeneration.status === 'failed') {
            setTimeout(() => {
              setActiveGenerations(prev => prev.filter(gen => gen.id !== id))
              setSubscriptions(prev => {
                const newSet = new Set(prev)
                newSet.delete(id)
                return newSet
              })
            }, 5000) // Keep for 5 seconds after completion
          }
        }
      )
      .subscribe()

    // Store channel reference for cleanup
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, subscriptions])

  // Unsubscribe from a specific generation
  const unsubscribeFromGeneration = useCallback((id: string) => {
    setSubscriptions(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })

    setActiveGenerations(prev => prev.filter(gen => gen.id !== id))
  }, [])

  // Fetch all active generations on mount
  useEffect(() => {
    if (!user) {
      setActiveGenerations([])
      return
    }

    const fetchActiveGenerations = async () => {
      try {
        const { data, error } = await supabase
          .from('project_generations')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['pending', 'generating'])
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching active generations:', error)
          return
        }

        setActiveGenerations(data || [])

        // Subscribe to each active generation
        data?.forEach(generation => {
          subscribeToGeneration(generation.id)
        })
      } catch (error) {
        console.error('Error fetching active generations:', error)
      }
    }

    fetchActiveGenerations()
  }, [user, subscribeToGeneration])

  const isGenerating = activeGenerations.some(gen => 
    gen.status === 'pending' || gen.status === 'generating'
  )

  return {
    activeGenerations,
    isGenerating,
    getGenerationStatus,
    subscribeToGeneration,
    unsubscribeFromGeneration
  }
}