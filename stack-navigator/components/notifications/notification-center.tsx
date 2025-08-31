'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  Package, 
  CreditCard, 
  Info,
  Loader2
} from 'lucide-react'
import { useNotifications, type Notification } from '@/hooks/use-notifications'
import { formatDistanceToNow } from 'date-fns'

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'project_ready':
    case 'generation_complete':
      return <Package className="h-4 w-4 text-green-500" />
    case 'subscription_updated':
      return <CreditCard className="h-4 w-4 text-blue-500" />
    case 'system_message':
    default:
      return <Info className="h-4 w-4 text-blue-500" />
  }
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }

    // Handle navigation based on notification type
    if (notification.type === 'project_ready' && notification.data?.projectId) {
      window.location.href = `/dashboard?project=${notification.data.projectId}`
    } else if (notification.type === 'generation_complete') {
      window.location.href = '/dashboard'
    } else if (notification.type === 'subscription_updated') {
      window.location.href = '/profile'
    }
  }

  return (
    <div
      className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
        !notification.read ? 'bg-muted/30' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">
              {notification.title}
            </p>
            {!notification.read && (
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  )
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    requestPermission,
    hasPermission
  } = useNotifications()

  const handleRequestPermission = async () => {
    await requestPermission()
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80 p-0" align="end">
        <DropdownMenuHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-auto p-1 text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </DropdownMenuHeader>

        {!hasPermission && (
          <div className="p-3 bg-muted/50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enable notifications</p>
                <p className="text-xs text-muted-foreground">
                  Get notified when your projects are ready
                </p>
              </div>
              <Button size="sm" onClick={handleRequestPermission}>
                Enable
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                We'll notify you when your projects are ready
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={markAsRead}
                  />
                  {index < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-3 border-t">
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <a href="/dashboard">View all in dashboard</a>
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}