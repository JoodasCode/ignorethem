# Navigation Redesign & Unified Sidebar Implementation

## Current Problems
- **Two separate sidebars**: Main sidebar + Chat history sidebar = confusing UX
- **Redundant top nav**: Shows "Chat" and "Dashboard" when we're already IN the dashboard/chat
- **Inconsistent navigation**: Different nav patterns across pages
- **Missing Profile page**: No way for users to see/redownload previous stacks

## Solution: Unified Navigation System

### Top Navigation (Header)
**Purpose**: Brand identity, global actions, user account
**Items**:
- **Logo/Brand**: "Stack Navigator" (always links to home)
- **GitHub Link**: External link to repo/docs
- **Theme Toggle**: Dark/light mode
- **Notifications**: Bell icon (authenticated users only)
- **User Avatar/Menu**: Profile dropdown with:
  - Profile
  - Settings  
  - Sign Out
- **Auth Buttons**: Sign In / Get Started (unauthenticated users)

**Remove from top nav**: Chat, Dashboard (redundant - we're already there)

### Left Sidebar (Unified)
**Purpose**: Primary navigation + contextual chat history
**Structure**:
```
┌─────────────────────┐
│ Stack Navigator     │ <- Brand + collapse button
├─────────────────────┤
│ 👤 John Doe         │ <- User info section
│    Pro ⭐           │
├─────────────────────┤
│ 🏠 Home             │ <- Core navigation
│ 💬 Chat             │
│ 👤 Profile          │
├─────────────────────┤
│ RECENT CHATS ▼      │ <- Collapsible section
│ ┌─────────────────  │
│ │ + New Chat        │
│ │ 🔍 Search...      │
│ │ ─────────────     │
│ │ Today             │
│ │ • React setup     │
│ │ • Node.js API     │
│ │ Yesterday         │
│ │ • Vue project     │
│ └─────────────────  │
├─────────────────────┤
│ ⚙️ Settings         │
└─────────────────────┘
```

### Page Structure
- **Landing (/)**: No sidebar, just top nav
- **Chat (/chat)**: Unified sidebar with expanded chat history
- **Profile (/profile)**: Unified sidebar with collapsed chat history
- **Auth pages**: No sidebar, minimal top nav

## Database Schema for Generated Stacks

```sql
-- New table for user's generated stacks
CREATE TABLE user_generated_stacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  stack_name TEXT NOT NULL,
  stack_description TEXT,
  technologies JSONB NOT NULL, -- Array of tech names/versions
  generated_files JSONB, -- File structure and content
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies
ALTER TABLE user_generated_stacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own stacks" ON user_generated_stacks 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stacks" ON user_generated_stacks 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own stacks" ON user_generated_stacks 
  FOR DELETE USING (auth.uid() = user_id);
```

## Implementation Tasks

### Phase 1: Clean Up Top Navigation ✅
- [x] Remove "Chat" and "Dashboard" from top nav items
- [x] Keep only: Logo, GitHub, Theme, Notifications, User Menu
- [x] Update mobile navigation accordingly
- [x] Test responsive behavior

### Phase 2: Create Unified Sidebar ✅
- [x] Create new `UnifiedSidebar` component
- [x] Merge logic from `SidebarNavigation` + `ChatHistorySidebar`
- [x] Add collapsible "Recent Chats" section
- [x] Implement smart context awareness (expand/collapse based on page)
- [x] Add Profile navigation item

### Phase 3: Database & API Setup ✅
- [x] Run migration to create `user_generated_stacks` table
- [x] Create `lib/stacks-service.ts` for CRUD operations
- [x] Add API endpoints:
  - `GET /api/user/generated-stacks` - List user's stacks
  - `POST /api/user/generated-stacks` - Save new stack
  - `DELETE /api/user/generated-stacks/[id]` - Delete stack
  - `GET /api/user/generated-stacks/[id]/download` - Re-download

### Phase 4: Profile Page ✅
- [x] Create `/profile` page with:
  - User details (name, email, tier, join date)
  - Previous stacks grid with download/delete actions
  - Usage statistics
- [x] Add profile components and hooks

### Phase 5: Update Chat Flow
- [ ] Modify chat interface to save generated stacks to database
- [ ] Link conversations to generated stacks
- [ ] Add "Save Stack" functionality after generation

### Phase 6: Clean Up ✅
- [x] Remove old `ChatHistorySidebar` component
- [x] Update all layouts to use `UnifiedSidebar`
- [x] Remove unused navigation components
- [x] Update routing and page layouts

## File Changes Required

### New Files ✅
- `components/unified-sidebar.tsx` ✅
- `app/profile/page.tsx` ✅
- `components/profile/user-details.tsx` ✅
- `components/profile/previous-stacks.tsx` ✅
- `hooks/use-generated-stacks.ts` ✅
- `app/api/user/generated-stacks/route.ts` ✅
- `app/api/user/generated-stacks/[id]/route.ts` ✅
- `app/api/user/generated-stacks/[id]/download/route.ts` ✅
- `lib/migrations/add-user-generated-stacks-table.sql` ✅

### Modified Files ✅
- `components/navigation.tsx` (clean up top nav) ✅
- `components/dashboard-layout.tsx` (use unified sidebar) ✅
- `app/chat/page.tsx` (remove old chat sidebar) ✅

### Deleted Files ✅
- `components/chat-history-sidebar.tsx` ✅
- `components/sidebar-navigation.tsx` ✅

## Success Criteria
- [ ] Single, consistent sidebar across all authenticated pages
- [ ] Clean top navigation with only essential items
- [ ] Profile page with previous stacks functionality
- [ ] Users can re-download their generated stacks
- [ ] Responsive design works on mobile/desktop
- [ ] No navigation redundancy or confusion