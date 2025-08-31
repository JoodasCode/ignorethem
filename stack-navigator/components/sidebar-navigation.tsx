"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  LayoutDashboard, 
  MessageSquare, 
  Search, 
  Layers, 
  Settings, 
  Home, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  Crown,
  Lock
} from "lucide-react"
import { useState } from "react"
import { useUserSession } from "@/hooks/use-user-session"

export function SidebarNavigation() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { user, tier, isAuthenticated } = useUserSession()

  const getSidebarItems = () => {
    const publicItems = [
      {
        title: "Home",
        href: "/",
        icon: Home,
        requiresAuth: false,
      },
      {
        title: "Browse Stacks",
        href: "/browse",
        icon: Search,
        requiresAuth: false,
      },
      {
        title: "Templates",
        href: "/templates",
        icon: FileText,
        requiresAuth: false,
      },
    ]

    const authenticatedItems = [
      {
        title: "Chat",
        href: "/chat",
        icon: MessageSquare,
        requiresAuth: true,
      },
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        requiresAuth: true,
      },
    ]

    const premiumItems = [
      {
        title: "Compare",
        href: "/compare",
        icon: Layers,
        requiresAuth: true,
        requiresTier: ['starter', 'pro'] as const,
        badge: tier === 'free' ? 'Starter+' : undefined,
      },
    ]

    let items = [...publicItems]
    
    if (isAuthenticated) {
      items = [...items, ...authenticatedItems]
      
      // Add premium items with appropriate badges/locks
      items = [...items, ...premiumItems]
    }

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
    if (!item.requiresTier) return true
    return item.requiresTier.includes(tier)
  }

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64",
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
      {isAuthenticated && user && (
        <div className="border-b border-sidebar-border p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar_url || undefined} alt={user.name || user.email} />
              <AvatarFallback>
                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-sidebar-foreground truncate">
                    {user.name || 'User'}
                  </span>
                  {getTierBadge()}
                </div>
                <span className="text-xs text-sidebar-foreground/60 truncate">{user.email}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {getSidebarItems().map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          const hasAccess = canAccessItem(item)

          if (!hasAccess && item.requiresAuth && !isAuthenticated) {
            // Don't show auth-required items to unauthenticated users
            return null
          }

          return (
            <div key={item.href} className="relative">
              {hasAccess ? (
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
                    {!collapsed && (
                      <div className="flex items-center justify-between w-full">
                        <span>{item.title}</span>
                      </div>
                    )}
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="ghost"
                  disabled
                  className={cn(
                    "w-full justify-start text-sidebar-foreground/50 cursor-not-allowed",
                    collapsed && "px-2",
                  )}
                >
                  <div className="relative">
                    <Icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
                    <Lock className="absolute -top-1 -right-1 h-3 w-3" />
                  </div>
                  {!collapsed && (
                    <div className="flex items-center justify-between w-full">
                      <span>{item.title}</span>
                    </div>
                  )}
                </Button>
              )}
            </div>
          )
        })}
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
