"use client"

import type React from "react"

import { UnifiedSidebar } from "./unified-sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <UnifiedSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

export default DashboardLayout
