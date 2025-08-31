import { supabase, type Conversation, type Message } from './supabase'

export class ConversationService {
  /**
   * Create a new conversation
   */
  static async createConversation(
    sessionId: string,
    userId?: string,
    title?: string
  ): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        session_id: sessionId,
        title: title || 'New Stack Conversation',
        phase: 'discovery',
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating conversation:', error)
      return null
    }

    return data
  }

  /**
   * Get conversation by ID
   */
  static async getConversation(conversationId: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (error) {
      console.error('Error fetching conversation:', error)
      return null
    }

    return data
  }

  /**
   * Get conversations for a user
   */
  static async getUserConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching user conversations:', error)
      return []
    }

    return data || []
  }

  /**
   * Get conversation by session ID (for anonymous users)
   */
  static async getConversationBySession(sessionId: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching conversation by session:', error)
      return null
    }

    return data
  }

  /**
   * Update conversation
   */
  static async updateConversation(
    conversationId: string,
    updates: Partial<Conversation>
  ): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating conversation:', error)
      return null
    }

    return data
  }

  /**
   * Add message to conversation
   */
  static async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: {
      model_used?: string
      tokens_used?: number
      processing_time_ms?: number
    }
  ): Promise<Message | null> {
    // Get next sequence number
    const { data: lastMessage } = await supabase
      .from('messages')
      .select('sequence_number')
      .eq('conversation_id', conversationId)
      .order('sequence_number', { ascending: false })
      .limit(1)
      .single()

    const sequenceNumber = (lastMessage?.sequence_number || 0) + 1

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        sequence_number: sequenceNumber,
        ...metadata
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding message:', error)
      return null
    }

    return data
  }

  /**
   * Get messages for a conversation
   */
  static async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('sequence_number', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return []
    }

    return data || []
  }

  /**
   * Complete a conversation
   */
  static async completeConversation(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)

    if (error) {
      console.error('Error completing conversation:', error)
    }
  }

  /**
   * Delete a conversation and all its messages
   */
  static async deleteConversation(conversationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)

    if (error) {
      console.error('Error deleting conversation:', error)
      return false
    }

    return true
  }
}