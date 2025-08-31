"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Menu, X, Github, LayoutDashboard, User, LogOut, Crown } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { useUserSession } from "@/hooks/use-user-session"
import { useAuth } from "@/hooks/use-auth"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, tier, isAuthenticated } = useUserSession()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }

  const getTierBadge = () => {
    if (tier === 'starter') {
      return <Badge variant="secondary" className="ml-2 text-xs">Starter</Badge>
    }
    if (tier === 'pro') {
      return <Badge variant="default" className="ml-2 text-xs"><Crown className="w-3 h-3 mr-1" />Pro</Badge>
    }
    return null
  }

  const getNavItems = () => {
    // Simplified navigation - focus only on core features
    const authenticatedItems = [
      { href: "/chat", icon: LayoutDashboard, label: "Chat" },
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ]

    // Only show navigation items for authenticated users
    return isAuthenticated ? authenticatedItems : []
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">S</span>
              </div>
              <span className="font-bold text-xl">Stack Navigator</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {getNavItems().map((item) => {
              const Icon = item.icon
              return (
                <Button key={item.href} variant="ghost" asChild>
                  <Link href={item.href} className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                </Button>
              )
            })}
            
            <Button variant="ghost" asChild>
              <Link href="https://github.com" className="flex items-center space-x-2">
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </Link>
            </Button>
            
            <ThemeToggle />
            
            {/* Notifications */}
            {isAuthenticated && <NotificationCenter />}

            {/* User Menu */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || undefined} alt={user.name || user.email} />
                      <AvatarFallback>
                        {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name || 'User'}
                        {getTierBadge()}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/signup">Get Started Free</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-2">
              {getNavItems().map((item) => {
                const Icon = item.icon
                return (
                  <Button key={item.href} variant="ghost" asChild className="justify-start">
                    <Link href={item.href} className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  </Button>
                )
              })}
              
              <Button variant="ghost" asChild className="justify-start">
                <Link href="https://github.com" className="flex items-center space-x-2">
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </Link>
              </Button>

              {/* Mobile User Section */}
              {isAuthenticated && user ? (
                <>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center space-x-3 px-3 py-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || undefined} alt={user.name || user.email} />
                        <AvatarFallback>
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {user.name || 'User'}
                          {getTierBadge()}
                        </span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" asChild className="justify-start">
                    <Link href="/profile" className="flex items-center space-x-2">
                      <User className="w-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" onClick={handleSignOut} className="justify-start">
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Sign out</span>
                  </Button>
                </>
              ) : (
                <div className="border-t pt-2 mt-2 space-y-2">
                  <Button variant="ghost" asChild className="justify-start">
                    <Link href="/auth/signin">Sign In</Link>
                  </Button>
                  <Button asChild className="justify-start">
                    <Link href="/auth/signup">Get Started Free</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
