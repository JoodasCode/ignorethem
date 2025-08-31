import { createClient } from '../supabase/client'
import { Database } from '../types/database'

type Tables = Database['public']['Tables']

// Real-time subscription utilities
export class RealtimeSubscription {
  private supabase = createClient()
  private subscriptions = new Map<string, any>()

  // Subscribe to table changes
  subscribeToTable<T extends keyof Tables>(
    table: T,
    callback: (payload: any) => void,
    filter?: string
  ) {
    const channel = this.supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table as string,
          filter,
        },
        callback
      )
      .subscribe()

    this.subscriptions.set(`${table}_${filter || 'all'}`, channel)
    return channel
  }

  // Subscribe to specific record changes
  subscribeToRecord<T extends keyof Tables>(
    table: T,
    id: string,
    callback: (payload: any) => void
  ) {
    return this.subscribeToTable(table, callback, `id=eq.${id}`)
  }

  // Subscribe to user's own records (requires RLS)
  subscribeToUserRecords<T extends keyof Tables>(
    table: T,
    userId: string,
    callback: (payload: any) => void
  ) {
    return this.subscribeToTable(table, callback, `user_id=eq.${userId}`)
  }

  // Unsubscribe from a specific subscription
  unsubscribe(key: string) {
    const subscription = this.subscriptions.get(key)
    if (subscription) {
      this.supabase.removeChannel(subscription)
      this.subscriptions.delete(key)
    }
  }

  // Unsubscribe from all subscriptions
  unsubscribeAll() {
    this.subscriptions.forEach((subscription) => {
      this.supabase.removeChannel(subscription)
    })
    this.subscriptions.clear()
  }
}

// React hook for real-time subscriptions
export function useRealtimeSubscription() {
  return new RealtimeSubscription()
}

// Example usage functions
export const realtimeExamples = {
  // Example: Subscribe to new messages in a chat
  // subscribeToNewMessages(chatId: string, onNewMessage: (message: any) => void) {
  //   const subscription = new RealtimeSubscription()
  //   return subscription.subscribeToTable(
  //     'messages',
  //     (payload) => {
  //       if (payload.eventType === 'INSERT') {
  //         onNewMessage(payload.new)
  //       }
  //     },
  //     `chat_id=eq.${chatId}`
  //   )
  // },

  // Example: Subscribe to user presence
  // subscribeToPresence(roomId: string, onPresenceChange: (presence: any) => void) {
  //   const supabase = createClient()
  //   const channel = supabase.channel(`room_${roomId}`)
  //   
  //   channel
  //     .on('presence', { event: 'sync' }, () => {
  //       const state = channel.presenceState()
  //       onPresenceChange(state)
  //     })
  //     .on('presence', { event: 'join' }, ({ key, newPresences }) => {
  //       console.log('User joined:', key, newPresences)
  //     })
  //     .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
  //       console.log('User left:', key, leftPresences)
  //     })
  //     .subscribe(async (status) => {
  //       if (status === 'SUBSCRIBED') {
  //         await channel.track({
  //           user_id: 'user-id',
  //           online_at: new Date().toISOString(),
  //         })
  //       }
  //     })
  //   
  //   return channel
  // },

  // Example: Subscribe to broadcast messages
  // subscribeToBroadcast(roomId: string, onBroadcast: (message: any) => void) {
  //   const supabase = createClient()
  //   const channel = supabase.channel(`broadcast_${roomId}`)
  //   
  //   channel
  //     .on('broadcast', { event: 'message' }, (payload) => {
  //       onBroadcast(payload)
  //     })
  //     .subscribe()
  //   
  //   return {
  //     channel,
  //     send: (message: any) => {
  //       channel.send({
  //         type: 'broadcast',
  //         event: 'message',
  //         payload: message,
  //       })
  //     },
  //   }
  // },
}