"use client"

import { useState, useEffect } from 'react'
import { useUserSession } from './use-user-session'

interface GeneratedStack {
  id: string
  stack_name: string
  stack_description: string | null
  technologies: string[]
  download_count: number
  created_at: string
  updated_at: string
}

export function useGeneratedStacks() {
  const [stacks, setStacks] = useState<GeneratedStack[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated } = useUserSession()

  const fetchStacks = async () => {
    if (!isAuthenticated) {
      setStacks([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/user/generated-stacks', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch stacks: ${response.statusText}`)
      }

      const data = await response.json()
      setStacks(data.stacks || [])
    } catch (err) {
      console.error('Error fetching generated stacks:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch stacks')
      setStacks([])
    } finally {
      setIsLoading(false)
    }
  }

  const deleteStack = async (stackId: string) => {
    try {
      const response = await fetch(`/api/user/generated-stacks/${stackId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete stack: ${response.statusText}`)
      }

      // Remove from local state
      setStacks(prev => prev.filter(stack => stack.id !== stackId))
    } catch (err) {
      console.error('Error deleting stack:', err)
      throw err
    }
  }

  const downloadStack = async (stackId: string) => {
    try {
      const response = await fetch(`/api/user/generated-stacks/${stackId}/download`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error(`Failed to download stack: ${response.statusText}`)
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : 'stack.zip'

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Update download count in local state
      setStacks(prev => prev.map(stack => 
        stack.id === stackId 
          ? { ...stack, download_count: stack.download_count + 1 }
          : stack
      ))
    } catch (err) {
      console.error('Error downloading stack:', err)
      throw err
    }
  }

  const saveStack = async (stackData: {
    conversation_id: string
    stack_name: string
    stack_description?: string
    technologies: string[]
    generated_files?: any
  }) => {
    try {
      const response = await fetch('/api/user/generated-stacks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stackData),
      })

      if (!response.ok) {
        throw new Error(`Failed to save stack: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Add to local state
      setStacks(prev => [data.stack, ...prev])
      
      return data.stack
    } catch (err) {
      console.error('Error saving stack:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchStacks()
  }, [isAuthenticated])

  return {
    stacks,
    isLoading,
    error,
    deleteStack,
    downloadStack,
    saveStack,
    refetch: fetchStacks,
  }
}