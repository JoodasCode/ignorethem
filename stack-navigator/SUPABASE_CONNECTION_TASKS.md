# Supabase Connection & Mock Data Replacement Tasks

## 🔧 Core Supabase Setup

### 1. Client Configuration
- [ ] **1.1** Replace old supabase client with SSR-compatible clients
  - Create `lib/supabase/client.ts` (browser client)
  - Create `lib/supabase/server.ts` (server client) 
  - Create `lib/supabase/middleware.ts` (middleware client)
  - Update all imports across the app

### 2. Authentication System
- [ ] **2.1** Fix auth providers configuration in Supabase dashboard
  - Enable Google OAuth
  - Enable Magic Links
  - Configure redirect URLs
- [ ] **2.2** Create proper auth components
  - Fix `AuthModal` to use correct Supabase auth methods
  - Create `SignInForm` and `SignUpForm` components
  - Add proper error handling and loading states
- [ ] **2.3** Fix auth hooks
  - Rewrite `useAuth` hook with proper Supabase patterns
  - Fix `useUserSession` to work with real auth state
  - Add auth state persistence

### 3. Database Policies & Functions
- [ ] **3.1** Review and fix RLS policies
  - Ensure all tables have proper INSERT/UPDATE/DELETE policies
  - Test policies with different user roles
- [ ] **3.2** Verify database functions exist and work
  - `get_current_usage_period`
  - `can_generate_stack`
  - `can_save_conversation` 
  - `can_send_message`
  - `increment_stack_generation`

## 📊 Replace Mock Data with Real Data

### 4. Landing Page
- [ ] **4.1** Replace hardcoded stats with real database queries
  - "1,247 developers shipped this week" → query actual user count
  - "89% shipped to production" → calculate from project completion rates
  - "4.8★ developer rating" → average from actual ratings
  - "2.3M lines of code generated" → sum from actual projects

### 5. Stack Examples
- [ ] **5.1** Connect to `popular_stacks` table
  - Replace hardcoded stack cards with database data
  - Show real usage counts and ratings
  - Display actual technology combinations

### 6. Chat Interface
- [ ] **6.1** Connect chat to real conversations table
  - Save messages to `messages` table
  - Track conversation state in `conversations` table
  - Implement real-time message streaming
- [ ] **6.2** Replace mock AI responses
  - Connect to actual AI service (OpenAI/Anthropic)
  - Implement proper conversation flow
  - Save AI model usage data

### 7. Dashboard
- [ ] **7.1** Replace mock dashboard data
  - Show real user projects from `projects` table
  - Display actual conversation history
  - Show real usage statistics from `usage_tracking`
- [ ] **7.2** Connect project management
  - Real project creation/deletion
  - Actual file generation and storage
  - Download tracking

### 8. User Profile
- [ ] **8.1** Connect to real user data
  - Load actual user profile from `users` table
  - Save profile updates to database
  - Handle avatar uploads to Supabase Storage

### 9. Subscription System
- [ ] **9.1** Connect Stripe integration
  - Load real subscription data from `subscriptions` table
  - Handle tier-based feature access
  - Implement usage limit enforcement

## 🎨 Empty States & Loading States

### 10. Chat Interface
- [ ] **10.1** Empty conversation state
  - Welcome message with suggested prompts
  - Example conversation starters
  - Clear call-to-action
- [ ] **10.2** Loading states
  - Message sending animation
  - AI thinking indicator
  - Stack generation progress

### 11. Dashboard
- [ ] **11.1** No projects state
  - Friendly illustration
  - "Start your first project" CTA
  - Quick tutorial or demo link
- [ ] **11.2** No conversations state
  - Guide to starting first conversation
  - Template conversation examples

### 12. Profile
- [ ] **12.1** New user state
  - Profile completion prompts
  - Avatar upload encouragement
  - Settings explanation

### 13. Notifications
- [ ] **13.1** No notifications state
  - "All caught up!" message
  - Explanation of what notifications show
- [ ] **13.2** Permission states
  - Browser notification permission request
  - Explanation of notification benefits

## 🔌 API Endpoints

### 14. Chat API
- [ ] **14.1** Fix `/api/chat/route.ts`
  - Connect to real AI service
  - Save conversations to database
  - Handle authentication properly
- [ ] **14.2** Fix `/api/chat/stream/route.ts`
  - Implement real streaming responses
  - Handle connection errors gracefully

### 15. Generation API
- [ ] **15.1** Fix `/api/generate/route.ts`
  - Connect to actual code generation service
  - Save generated projects to database
  - Handle file storage in Supabase Storage

### 16. User API
- [ ] **16.1** Create user management endpoints
  - Profile updates
  - Usage tracking
  - Subscription management

## 🧪 Testing & Validation

### 17. Auth Flow Testing
- [ ] **17.1** Test complete auth flows
  - Email/password signup and signin
  - Google OAuth flow
  - Magic link authentication
  - Password reset flow

### 18. Data Flow Testing
- [ ] **18.1** Test all CRUD operations
  - User profile management
  - Conversation creation and updates
  - Project generation and storage
  - Usage tracking and limits

### 19. Error Handling
- [ ] **19.1** Add comprehensive error handling
  - Database connection errors
  - Authentication failures
  - API rate limits
  - Network connectivity issues

## 🚀 Priority Order

### Phase 1: Critical Auth Fix (Do First)
- Tasks 1.1, 2.1, 2.2, 2.3, 3.1

### Phase 2: Core Functionality
- Tasks 6.1, 14.1, 15.1, 17.1

### Phase 3: User Experience
- Tasks 4.1, 5.1, 7.1, 10.1, 11.1

### Phase 4: Polish & Optimization
- Tasks 8.1, 9.1, 12.1, 13.1, 18.1, 19.1

## 📝 Notes
- Each task should include proper error handling and loading states
- All database operations should respect RLS policies
- Follow the patterns from the Next.js + Supabase + Stripe starter
- Test each component in isolation before integration
- Document any environment variables needed