'use client'

import { AuthGuard } from "@/components/auth/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Navigation } from "@/components/navigation"
import { UserDetails } from "@/components/profile/user-details"
import { PreviousStacks } from "@/components/profile/previous-stacks"

export default function ProfilePage() {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <DashboardLayout>
          <div className="p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Profile</h1>
              <p className="text-muted-foreground">Manage your account and view your generated stacks</p>
            </div>
            
            <UserDetails />
            <PreviousStacks />
          </div>
        </DashboardLayout>
      </div>
    </AuthGuard>
  )
}