import { NextRequest, NextResponse } from 'next/server'
import { UsageTrackingService } from './usage-tracking'
import { supabase } from './supabase'

export interface UsageMiddlewareOptions {
  action: 'stack_generation' | 'conversation_save' | 'message_send'
  conversationId?: string
  requireAuth?: boolean
}

export interface UsageMiddlewareResult {
  allowed: boolean
  reason?: string
  upgradeRequired?: boolean
  remainingCount?: number
  userId?: string
}

/**
 * Middleware to check usage limits before allowing actions
 */
export async function checkUsageLimits(
  request: NextRequest,
  options: UsageMiddlewareOptions
): Promise<UsageMiddlewareResult> {
  try {
    // Get user from request (assuming auth middleware has run)
    const authHeader = request.headers.get('authorization')
    if (!authHeader && options.requireAuth) {
      return {
        allowed: false,
        reason: 'Authentication required'
      }
    }

    // Extract user ID from auth token or session
    let userId: string | null = null
    
    if (authHeader) {
      // In a real implementation, you'd verify the JWT token here
      // For now, we'll assume the user ID is in the request headers
      userId = request.headers.get('x-user-id')
    }

    if (!userId && options.requireAuth) {
      return {
        allowed: false,
        reason: 'User not authenticated'
      }
    }

    if (!userId) {
      // For anonymous users, we might allow limited actions
      // or require authentication based on the action
      if (options.action === 'stack_generation') {
        return {
          allowed: false,
          reason: 'Account required for stack generation',
          upgradeRequired: false
        }
      }
      
      // Allow anonymous conversation/message actions with limits
      return { allowed: true, userId: undefined }
    }

    // Check usage limits based on action type
    let result
    switch (options.action) {
      case 'stack_generation':
        result = await UsageTrackingService.checkStackGeneration(userId)
        break
      
      case 'conversation_save':
        result = await UsageTrackingService.checkConversationSave(userId)
        break
      
      case 'message_send':
        if (!options.conversationId) {
          return {
            allowed: false,
            reason: 'Conversation ID required for message send check'
          }
        }
        result = await UsageTrackingService.checkMessageSend(userId, options.conversationId)
        break
      
      default:
        return {
          allowed: false,
          reason: 'Unknown action type'
        }
    }

    return {
      ...result,
      userId
    }

  } catch (error) {
    console.error('Usage middleware error:', error)
    return {
      allowed: false,
      reason: 'Internal error checking usage limits'
    }
  }
}

/**
 * Higher-order function to create usage-aware API route handlers
 */
export function withUsageTracking<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  options: UsageMiddlewareOptions
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    // Check usage limits
    const usageResult = await checkUsageLimits(request, options)
    
    if (!usageResult.allowed) {
      return NextResponse.json(
        {
          error: usageResult.reason || 'Usage limit exceeded',
          upgradeRequired: usageResult.upgradeRequired || false,
          remainingCount: usageResult.remainingCount
        },
        { status: usageResult.upgradeRequired ? 402 : 429 } // 402 Payment Required or 429 Too Many Requests
      )
    }

    // Add user ID to request headers for the handler
    if (usageResult.userId) {
      request.headers.set('x-verified-user-id', usageResult.userId)
    }

    // Call the original handler
    const response = await handler(request, ...args)

    // If the action was successful, increment usage counters
    if (response.ok && usageResult.userId) {
      try {
        switch (options.action) {
          case 'stack_generation':
            await UsageTrackingService.incrementStackGeneration(usageResult.userId)
            break
          
          case 'conversation_save':
            await UsageTrackingService.incrementConversationSave(usageResult.userId)
            break
          
          // Message send is tracked automatically by database triggers
          case 'message_send':
            break
        }
      } catch (error) {
        console.error('Failed to increment usage counter:', error)
        // Don't fail the request if usage tracking fails
      }
    }

    return response
  }
}

/**
 * Utility function to get user ID from Supabase auth
 */
export async function getUserFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return null

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) return null
    
    return user.id
  } catch (error) {
    console.error('Error getting user from request:', error)
    return null
  }
}

/**
 * Response helper for usage limit errors
 */
export function createUsageLimitResponse(
  reason: string,
  upgradeRequired: boolean = false,
  remainingCount?: number
) {
  return NextResponse.json(
    {
      error: reason,
      upgradeRequired,
      remainingCount,
      code: upgradeRequired ? 'UPGRADE_REQUIRED' : 'USAGE_LIMIT_EXCEEDED'
    },
    { 
      status: upgradeRequired ? 402 : 429,
      headers: {
        'Retry-After': upgradeRequired ? '0' : '3600' // 1 hour for rate limits
      }
    }
  )
}