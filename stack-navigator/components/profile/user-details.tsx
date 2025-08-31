"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Crown, Calendar, Mail, User as UserIcon } from "lucide-react"
import { useUserSession } from "@/hooks/use-user-session"

export function UserDetails() {
  const { user, tier, isAuthenticated } = useUserSession()

  if (!isAuthenticated || !user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Please sign in to view your profile.</p>
        </CardContent>
      </Card>
    )
  }

  const getTierBadge = () => {
    if (tier === 'starter') {
      return <Badge variant="secondary" className="ml-2">Starter</Badge>
    }
    if (tier === 'pro') {
      return <Badge variant="default" className="ml-2"><Crown className="w-3 h-3 mr-1" />Pro</Badge>
    }
    return <Badge variant="outline" className="ml-2">Free</Badge>
  }

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          Account Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar_url || undefined} alt={user.name || user.email} />
            <AvatarFallback className="text-lg">
              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center">
              <h3 className="text-xl font-semibold">{user.name || 'User'}</h3>
              {getTierBadge()}
            </div>
            <div className="flex items-center text-muted-foreground">
              <Mail className="h-4 w-4 mr-2" />
              {user.email}
            </div>
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              Joined {formatJoinDate(user.created_at)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">0</div>
            <div className="text-sm text-muted-foreground">Stacks Generated</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">0</div>
            <div className="text-sm text-muted-foreground">Total Downloads</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">0</div>
            <div className="text-sm text-muted-foreground">Conversations</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}