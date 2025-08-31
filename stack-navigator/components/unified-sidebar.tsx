"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Home, 
  MessageSquare, 
  User, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  Clock,
  Trash2,
  Crown
} from "lucide-react"
import { useState } from "react"
import { useUserSession } from "@/hooks/use-user-session"
import { useConversations } from "@/hooks/use-conversations"

interface ChatSession {
  id: string
  title: string | null
  phase: "discovery" | "requirements" | "constraints" | "recommendation" | "refinement"
  status: "active" | "completed" | "abandoned"
  created_at: string
  updated_at: string
  message_count: number
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}h ago`
  } else {
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }
}

export function UnifiedSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [chatHistoryExpanded, setChatHistoryExpanded] = useState(pathname === '/chat')
  const [searchQuery, setSearchQuery] = useState("")
  const { user, tier, isAuthenticated } = useUserSession()
  const { conversations, isLoading, error } = useConversations()

  const getSidebarItems = () => {
    const items = [
      {
        title: "Home",
        href: "/",
        icon: Home,
        requiresAuth: false,
      },
      {
        title: "Chat",
        href: "/chat",
        icon: MessageSquare,
        requiresAuth: true,
      },
      {
        title: "Profile",
        href: "/profile",
        icon: User,
        requiresAuth: true,
      },
    ]

    return items
  }

  const getTierBadge = () => {
    if (!collapsed) {
      if (tier === 'starter') {
        return <Badge variant="secondary" className="text-xs">Starter</Badge>
      }
      if (tier === 'pro') {
        return <Badge variant="default" className="text-xs"><Crown className="w-3 h-3 mr-1" />Pro</Badge>
      }
    }
    return null
  }

  const canAccessItem = (item: any) => {
    if (!item.requiresAuth) return true
    if (!isAuthenticated) return false
    return true
  }

  const filteredChats = conversations.filter((chat) =>
    chat.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.phase.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupedChats = {
    today: filteredChats.filter((chat) => {
      const today = new Date()
      const chatDate = new Date(chat.updated_at)
      return chatDate.toDateString() === today.toDateString()
    }),
    yesterday: filteredChats.filter((chat) => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const chatDate = new Date(chat.updated_at)
      return chatDate.toDateString() === yesterday.toDateString()
    }),
    older: filteredChats.filter((chat) => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const chatDate = new Date(chat.updated_at)
      return chatDate < yesterday
    }),
  }

  const handleNewChat = () => {
    window.location.href = '/chat'
  }

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-80",
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold text-sm">SN</span>
            </div>
            <span className="font-bold text-sidebar-foreground">Stack Navigator</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* User Info */}
      {isAuthenticated && user && !collapsed && (
        <div className="border-b border-sidebar-border p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar_url || undefined} alt={user.name || user.email} />
              <AvatarFallback>
                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.name || 'User'}
                </span>
                {getTierBadge()}
              </div>
              <span className="text-xs text-sidebar-foreground/60 truncate">{user.email}</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2 overflow-hidden">
        {getSidebarItems().map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          const hasAccess = canAccessItem(item)

          if (!hasAccess && item.requiresAuth && !isAuthenticated) {
            return null
          }

          return (
            <div key={item.href}>
              <Link href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90",
                    collapsed && "px-2",
                  )}
                >
                  <Icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
                  {!collapsed && <span>{item.title}</span>}
                </Button>
              </Link>
            </div>
          )
        })}

        {/* Chat History Section */}
        {isAuthenticated && !collapsed && (
          <div className="pt-4">
            <Button
              variant="ghost"
              onClick={() => setChatHistoryExpanded(!chatHistoryExpanded)}
              className="w-full justify-between text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground mb-2"
            >
              <span className="text-sm font-medium">Recent Chats</span>
              {chatHistoryExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {chatHistoryExpanded && (
              <div className="space-y-2">
                <Button 
                  className="w-full justify-start gap-2" 
                  size="sm"
                  onClick={handleNewChat}
                >
                  <Plus className="h-4 w-4" />
                  New Chat
                </Button>

                {conversations.length > 0 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-8"
                      size="sm"
                    />
                  </div>
                )}

                <ScrollArea className="h-64">
                  <div className="space-y-1">
                    {isLoading ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-xs">Loading...</p>
                      </div>
                    ) : error ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-xs text-red-500">Failed to load</p>
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-xs">No conversations yet</p>
                      </div>
                    ) : (
                      <>
                        {groupedChats.today.length > 0 && (
                          <div className="mb-2">
                            <h4 className="text-xs font-medium text-muted-foreground mb-1 px-2">Today</h4>
                            {groupedChats.today.map((chat) => (
                              <ChatHistoryItem key={chat.id} chat={chat} />
                            ))}
                          </div>
                        )}

                        {groupedChats.yesterday.length > 0 && (
                          <div className="mb-2">
                            <h4 className="text-xs font-medium text-muted-foreground mb-1 px-2">Yesterday</h4>
                            {groupedChats.yesterday.map((chat) => (
                              <ChatHistoryItem key={chat.id} chat={chat} />
                            ))}
                          </div>
                        )}

                        {groupedChats.older.length > 0 && (
                          <div className="mb-2">
                            <h4 className="text-xs font-medium text-muted-foreground mb-1 px-2">Previous 7 days</h4>
                            {groupedChats.older.map((chat) => (
                              <ChatHistoryItem key={chat.id} chat={chat} />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2">
        {isAuthenticated ? (
          <Link href="/settings">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "px-2",
              )}
            >
              <Settings className={cn("h-4 w-4", !collapsed && "mr-2")} />
              {!collapsed && "Settings"}
            </Button>
          </Link>
        ) : (
          <div className="space-y-2">
            <Link href="/auth/signin">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed && "px-2",
                )}
              >
                {!collapsed && "Sign In"}
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button
                className={cn(
                  "w-full justify-start",
                  collapsed && "px-2",
                )}
              >
                {!collapsed && "Get Started"}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

interface ChatHistoryItemProps {
  chat: ChatSession
}

function ChatHistoryItem({ chat }: ChatHistoryItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleChatClick = () => {
    window.location.href = `/chat?conversation=${chat.id}`
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return
    }

    try {
      const response = await fetch('/api/dashboard/conversations', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversationId: chat.id }),
      })

      if (response.ok) {
        window.location.reload()
      } else {
        console.error('Failed to delete conversation')
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  return (
    <div
      className="group relative p-2 rounded-lg cursor-pointer transition-colors hover:bg-muted/50"
      onClick={handleChatClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h5 className="font-medium text-xs truncate mb-1">
            {chat.title || 'Untitled Conversation'}
          </h5>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(new Date(chat.updated_at))}
            </span>
          </div>
        </div>

        {isHovered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}