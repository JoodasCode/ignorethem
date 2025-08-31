'use client'

import { AuthGuard } from "@/components/auth/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Navigation } from "@/components/navigation"
import { ChatInterface } from "@/components/chat-interface"

export default function ChatPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <DashboardLayout>
          <ChatInterface />
        </DashboardLayout>
      </div>
    </AuthGuard>
  )
}
