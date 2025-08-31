'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'

export interface ChatMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  model_used?: string
  tokens_used?: number
  processing_time_ms?: number
  created_at: string
  sequence_number: number
}

export interface Conversation {
  id: string
  user_id?: string
  session_id: string
  title?: string
  phase: 'discovery' | 'requirements' | 'constraints' | 'recommendation' | 'refinement'
  status: 'active' | 'completed' | 'abandoned'
  project_type?: string
  team_size?: 'solo' | 'small' | 'medium' | 'large'
  timeline?: 'asap' | 'weeks' | 'months'
  technical_expertise?: 'beginner' | 'intermediate' | 'advanced'
  budget_constraints?: 'minimal' | 'moderate' | 'flexible'
  created_at: string
  updated_at: string
  completed_at?: string
  message_count: number
  duration_minutes?: number
}

interface UseRealtimeChatReturn {
  messages: ChatMessage[]
  conversation: Conversation | null
  isLoading: boolean
  isStreaming: boolean
  streamingMessage: string
  sendMessage: (content: string) => Promise<void>
  loadConversation: (conversationId: string) => Promise<void>
  createConversation: () => Promise<string | null>
  updateConversationPhase: (phase: Conversation['phase']) => Promise<void>
}

export function useRealtimeChat(conversationId?: string): UseRealtimeChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const { user } = useAuth()
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load conversation and messages
  const loadConversation = useCallback(async (id: string) => {
    setIsLoading(true)
    try {
      // Load conversation
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', id)
        .single()

      if (conversationError) {
        console.error('Error loading conversation:', conversationError)
        return
      }

      setConversation(conversationData)

      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('sequence_number', { ascending: true })

      if (messagesError) {
        console.error('Error loading messages:', messagesError)
        return
      }

      setMessages(messagesData || [])
    } catch (error) {
      console.error('Error loading conversation:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Create new conversation
  const createConversation = useCallback(async (): Promise<string | null> => {
    try {
      const sessionId = user?.id || `anon_${Date.now()}`
      
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user?.id,
          session_id: sessionId,
          phase: 'discovery',
          status: 'active',
          message_count: 0
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating conversation:', error)
        return null
      }

      setConversation(data)
      setMessages([])
      return data.id
    } catch (error) {
      console.error('Error creating conversation:', error)
      return null
    }
  }, [user])

  // Update conversation phase
  const updateConversationPhase = useCallback(async (phase: Conversation['phase']) => {
    if (!conversation) return

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ phase, updated_at: new Date().toISOString() })
        .eq('id', conversation.id)

      if (error) {
        console.error('Error updating conversation phase:', error)
        return
      }

      setConversation(prev => prev ? { ...prev, phase } : null)
    } catch (error) {
      console.error('Error updating conversation phase:', error)
    }
  }, [conversation])

  // Send message with streaming response
  const sendMessage = useCallback(async (content: string) => {
    if (!conversation || isStreaming) return

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()

    try {
      setIsStreaming(true)
      setStreamingMessage('')

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: `temp_${Date.now()}`,
        conversation_id: conversation.id,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
        sequence_number: messages.length + 1
      }

      setMessages(prev => [...prev, userMessage])

      // Send to API with streaming
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: conversation.id,
          message: content,
          messages: messages
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response stream')
      }

      let assistantMessage = ''
      
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              break
            }

            try {
              const parsed = JSON.parse(data)
              
              if (parsed.content) {
                assistantMessage += parsed.content
                setStreamingMessage(assistantMessage)
              }
            } catch (e) {
              // Ignore parsing errors for partial chunks
            }
          }
        }
      }

      // Clear streaming state
      setIsStreaming(false)
      setStreamingMessage('')

      // Reload messages to get the final saved message
      await loadConversation(conversation.id)

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled
        return
      }
      
      console.error('Error sending message:', error)
      setIsStreaming(false)
      setStreamingMessage('')
      
      // Remove the temporary user message on error
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp_')))
    }
  }, [conversation, isStreaming, messages, loadConversation])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!conversation) return

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`messages-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage
          
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) {
              return prev
            }
            return [...prev, newMessage].sort((a, b) => a.sequence_number - b.sequence_number)
          })
        }
      )
      .subscribe()

    // Subscribe to conversation updates
    const conversationChannel = supabase
      .channel(`conversation-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversation.id}`
        },
        (payload) => {
          const updatedConversation = payload.new as Conversation
          setConversation(updatedConversation)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(conversationChannel)
    }
  }, [conversation])

  // Load initial conversation
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId)
    }
  }, [conversationId, loadConversation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    messages,
    conversation,
    isLoading,
    isStreaming,
    streamingMessage,
    sendMessage,
    loadConversation,
    createConversation,
    updateConversationPhase
  }
}