import { createClient } from '../supabase/client'
import { createClient as createServerClient } from '../supabase/server'
import { Database } from '../types/database'

type Tables = Database['public']['Tables']

// Client-side queries (for use in components)
export const clientQueries = {
  // Example: Get all records from a table
  // async getUsers() {
  //   const supabase = createClient()
  //   const { data, error } = await supabase
  //     .from('users')
  //     .select('*')
  //   
  //   if (error) throw error
  //   return data
  // },

  // Example: Insert a new record
  // async createUser(user: TablesInsert<'users'>) {
  //   const supabase = createClient()
  //   const { data, error } = await supabase
  //     .from('users')
  //     .insert(user)
  //     .select()
  //     .single()
  //   
  //   if (error) throw error
  //   return data
  // },

  // Example: Update a record
  // async updateUser(id: string, updates: TablesUpdate<'users'>) {
  //   const supabase = createClient()
  //   const { data, error } = await supabase
  //     .from('users')
  //     .update(updates)
  //     .eq('id', id)
  //     .select()
  //     .single()
  //   
  //   if (error) throw error
  //   return data
  // },

  // Example: Delete a record
  // async deleteUser(id: string) {
  //   const supabase = createClient()
  //   const { error } = await supabase
  //     .from('users')
  //     .delete()
  //     .eq('id', id)
  //   
  //   if (error) throw error
  // },
}

// Server-side queries (for use in API routes and server components)
export const serverQueries = {
  // Example: Get all records from a table (server-side)
  // async getUsers() {
  //   const supabase = createServerClient()
  //   const { data, error } = await supabase
  //     .from('users')
  //     .select('*')
  //   
  //   if (error) throw error
  //   return data
  // },

  // Example: Get user by ID with error handling
  // async getUserById(id: string) {
  //   const supabase = createServerClient()
  //   const { data, error } = await supabase
  //     .from('users')
  //     .select('*')
  //     .eq('id', id)
  //     .single()
  //   
  //   if (error) {
  //     if (error.code === 'PGRST116') {
  //       return null // User not found
  //     }
  //     throw error
  //   }
  //   return data
  // },
}

// Utility functions for common database operations
export const dbUtils = {
  // Handle Supabase errors consistently
  handleError(error: any) {
    console.error('Database error:', error)
    
    // Common error codes and user-friendly messages
    const errorMessages: Record<string, string> = {
      '23505': 'This record already exists',
      '23503': 'Referenced record does not exist',
      '42501': 'Permission denied',
      'PGRST116': 'Record not found',
    }

    const message = errorMessages[error.code] || error.message || 'An unexpected error occurred'
    
    return {
      error: true,
      message,
      code: error.code,
    }
  },

  // Paginate results
  async paginate<T>(
    query: any,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ data: T[]; count: number; hasMore: boolean }> {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await query
      .range(from, to)
      .select('*', { count: 'exact' })

    if (error) throw error

    return {
      data: data || [],
      count: count || 0,
      hasMore: (count || 0) > to + 1,
    }
  },
}