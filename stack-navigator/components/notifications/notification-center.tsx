'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotificationCenter() {
  return (
    <Button variant="ghost" size="sm" className="relative">
      <Bell className="w-4 h-4" />
    </Button>
  )
}