'use client'

import { AuthGuard } from '@/components/auth/auth-guard'
import { UserProfile } from '@/components/auth/user-profile'
import { DashboardLayout } from '@/components/dashboard-layout'

export default function ProfilePage() {
  return (
    <AuthGuard redirectTo="/profile">
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your account information and preferences
            </p>
          </div>
          
          <UserProfile />
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}