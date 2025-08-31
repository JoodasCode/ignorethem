# Usage Tracking and Freemium Limits Implementation

## Overview

This document summarizes the implementation of task 5.2: "Implement freemium limits and usage tracking" for the Stack Navigator application. The implementation provides a comprehensive usage tracking system with tier-based limits, upgrade prompts, and monthly usage reset functionality.

## Components Implemented

### 1. Database Functions (`lib/database-functions.sql`)

Created PostgreSQL functions using Supabase MCP:

- `get_current_usage_period(p_user_id UUID)` - Gets or creates current usage period
- `can_generate_stack(p_user_id UUID)` - Checks stack generation limits
- `can_save_conversation(p_user_id UUID)` - Checks conversation save limits  
- `can_send_message(p_user_id UUID, p_conversation_id UUID)` - Checks message limits
- `increment_stack_generation(p_user_id UUID)` - Increments usage counters
- `increment_conversation_save(p_user_id UUID)` - Increments conversation saves
- `reset_monthly_usage()` - Resets usage for subscription tiers
- `update_usage_limits_on_subscription_change()` - Updates limits when subscription changes

### 2. Usage Tracking Service (`lib/usage-tracking.ts`)

Core service providing:

- **Usage Checks**: Detailed limit checking with remaining counts and upgrade prompts
- **Tier Management**: Free (1 stack lifetime), Starter (5 stacks/month), Pro (unlimited)
- **Usage Increment**: Safe increment operations with validation
- **Monthly Reset**: Automated reset for subscription tiers
- **Upgrade Prompts**: Dynamic upgrade messaging based on current tier and limit type

### 3. Enhanced Usage Hook (`hooks/use-usage.ts`)

React hook providing:

- Real-time usage data and limits
- Detailed usage check functions
- Automatic refresh on usage changes
- Computed values for UI display
- Upgrade prompt generation
- Usage summary for dashboard

### 4. UI Components

#### Upgrade Prompt Component (`components/upgrade-prompt.tsx`)
- **UpgradePromptDialog**: Modal upgrade prompts with pricing and benefits
- **InlineUpgradePrompt**: Compact inline upgrade cards
- Dynamic styling based on target tier (Starter/Pro)
- Benefit lists and pricing display

#### Usage Dashboard (`components/usage-dashboard.tsx`)
- Real-time usage visualization with progress bars
- Tier-based styling and badges
- Compact and full display modes
- Reset date information
- Automatic upgrade prompt integration

### 5. API Middleware (`lib/usage-middleware.ts`)

- **Usage Checking**: Pre-request limit validation
- **Higher-Order Functions**: `withUsageTracking()` wrapper for API routes
- **Automatic Increment**: Post-success usage counter updates
- **Error Responses**: Proper HTTP status codes (402 Payment Required, 429 Too Many Requests)
- **User Authentication**: Integration with Supabase auth

### 6. Cron Job Handler (`app/api/cron/reset-usage/route.ts`)

- Monthly usage reset endpoint
- Secure cron job authentication
- Batch processing for expired usage periods
- Development mode testing support

### 7. Enhanced API Routes

Updated recommendations API (`app/api/recommendations/route.ts`) with:
- Usage tracking middleware integration
- Automatic stack generation limit enforcement
- User authentication requirements
- Usage counter increments on successful generation

## Freemium Tier Structure

### Free Tier
- **Stack Generations**: 1 lifetime
- **Messages per Conversation**: 20
- **Saved Conversations**: 1
- **Stack Comparisons**: 0
- **Templates**: Browse only

### Starter Tier ($4.99/month)
- **Stack Generations**: 5 per month
- **Messages per Conversation**: Unlimited
- **Saved Conversations**: Unlimited
- **Stack Comparisons**: Up to 3
- **Templates**: Advanced access

### Pro Tier ($14.99/month)
- **Stack Generations**: Unlimited
- **Messages per Conversation**: Unlimited
- **Saved Conversations**: Unlimited
- **Stack Comparisons**: Unlimited
- **Team Members**: 3
- **API Access**: Enabled
- **Priority Support**: Included

## Database Integration

### Tables Used
- `users` - User profiles and metadata
- `subscriptions` - User subscription tiers and status
- `usage_tracking` - Usage periods and counters
- `conversations` - Chat conversations with message counts
- `messages` - Individual messages for per-conversation limits

### Triggers and Functions
- Automatic usage limit updates on subscription changes
- Message count tracking on conversation updates
- Usage period creation for new users
- Monthly reset automation for paid tiers

## Testing

Comprehensive test suite (`lib/__tests__/usage-tracking.test.ts`):

- **FreemiumLimits**: Static limit checking and tier configuration
- **UsageTrackingService**: Mocked service method testing
- **Edge Cases**: Limit boundaries and upgrade scenarios
- **Upgrade Prompts**: Dynamic messaging and pricing
- **Usage Summaries**: Dashboard data formatting

All tests passing with proper mocking of Supabase dependencies.

## Key Features

### 1. Tier-Based Limits
- Automatic limit enforcement based on user subscription
- Graceful degradation for free users
- Clear upgrade paths and messaging

### 2. Usage Tracking
- Real-time usage monitoring
- Automatic counter increments
- Monthly reset for subscription tiers
- Historical usage data retention

### 3. Upgrade Prompts
- Context-aware upgrade messaging
- Tier-specific benefits and pricing
- Multiple display formats (modal, inline, compact)
- Clear call-to-action buttons

### 4. Monthly Reset
- Automated reset for paid tiers
- Cron job integration
- Batch processing for efficiency
- Proper error handling and logging

### 5. API Integration
- Middleware-based limit enforcement
- Automatic usage increments
- Proper HTTP status codes
- User authentication integration

## Security Considerations

- **RLS Policies**: Row-level security on all usage tables
- **Function Security**: SECURITY DEFINER for database functions
- **API Authentication**: Required user authentication for usage tracking
- **Cron Security**: Secret-based authentication for reset endpoints

## Performance Optimizations

- **Database Indexes**: Optimized queries for usage lookups
- **Caching**: React hook state management for UI performance
- **Batch Operations**: Efficient monthly reset processing
- **Minimal API Calls**: Smart refresh strategies in hooks

## Future Enhancements

1. **Analytics Dashboard**: Admin view of usage patterns
2. **Usage Alerts**: Email notifications for limit approaches
3. **Custom Limits**: Enterprise tier with custom usage limits
4. **Usage History**: Detailed usage analytics for users
5. **Rate Limiting**: Additional API rate limiting beyond usage limits

## Requirements Satisfied

✅ **7.3**: Usage tracking system for stack generations and conversations  
✅ **8.1**: Tier-based limit enforcement (free: 1 stack, starter: 5 stacks/month)  
✅ **8.2**: Conversation saving with tier-based limits (free: 1, starter: unlimited)  
✅ **9.1**: Monthly usage reset functionality for subscription tiers  
✅ **9.5**: Upgrade prompts when limits are reached  

The implementation provides a robust, scalable usage tracking system that enforces freemium limits while providing clear upgrade paths for users.