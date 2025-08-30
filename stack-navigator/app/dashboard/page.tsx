"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Download, Share2, RefreshCw, Calendar, MessageSquare, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"

interface UserProject {
  id: string
  name: string
  createdAt: Date
  stackSelections: string[]
  conversationSummary: string
  downloadCount: number
  lastAccessed: Date
}

export default function Dashboard() {
  const [projects] = useState<UserProject[]>([
    {
      id: "1",
      name: "TaskFlow Pro",
      createdAt: new Date("2024-01-15"),
      stackSelections: ["Next.js", "Supabase", "Stripe", "Tailwind CSS"],
      conversationSummary: "Building a SaaS task management tool with team collaboration features",
      downloadCount: 3,
      lastAccessed: new Date("2024-01-20"),
    },
    {
      id: "2",
      name: "E-commerce Store",
      createdAt: new Date("2024-01-10"),
      stackSelections: ["Next.js", "Clerk", "Stripe", "PlanetScale"],
      conversationSummary: "Creating an online store for handmade crafts with inventory management",
      downloadCount: 1,
      lastAccessed: new Date("2024-01-12"),
    },
    {
      id: "3",
      name: "Internal Dashboard",
      createdAt: new Date("2024-01-08"),
      stackSelections: ["Next.js", "NextAuth", "Supabase", "Recharts"],
      conversationSummary: "Building an internal analytics dashboard for team performance tracking",
      downloadCount: 2,
      lastAccessed: new Date("2024-01-18"),
    },
  ])

  const handleRegenerate = (projectId: string) => {
    console.log("Regenerating project:", projectId)
    // This would trigger the regeneration process
  }

  const handleShare = (projectId: string) => {
    console.log("Sharing project:", projectId)
    // This would create a shareable link
  }

  const handleDelete = (projectId: string) => {
    console.log("Deleting project:", projectId)
    // This would delete the project
  }

  return (
    <DashboardLayout>
      <div className="py-8 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Stacks</h1>
              <p className="text-muted-foreground">Manage your generated projects and conversation history</p>
            </div>
            <Button asChild>
              <Link href="/chat">
                <ArrowRight className="mr-2 w-4 h-4" />
                Create New Stack
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">{projects.length}</div>
                <div className="text-sm text-muted-foreground">Total Stacks</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">
                  {projects.reduce((sum, p) => sum + p.downloadCount, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Downloads</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">
                  {projects.filter((p) => p.lastAccessed > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                </div>
                <div className="text-sm text-muted-foreground">Active This Week</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">
                  {new Set(projects.flatMap((p) => p.stackSelections)).size}
                </div>
                <div className="text-sm text-muted-foreground">Technologies Used</div>
              </CardContent>
            </Card>
          </div>

          {/* Projects Grid */}
          <div className="grid gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{project.name}</CardTitle>
                      <p className="text-muted-foreground text-sm mb-4">{project.conversationSummary}</p>

                      {/* Tech Stack */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.stackSelections.map((tech) => (
                          <Badge key={tech} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Created {project.createdAt.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Download className="w-4 h-4" />
                          <span>{project.downloadCount} downloads</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="w-4 h-4" />
                          <Link href={`/chat/${project.id}`} className="hover:text-primary transition-colors">
                            View Conversation
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Button size="sm" variant="outline" onClick={() => handleRegenerate(project.id)}>
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Regenerate
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleShare(project.id)}>
                        <Share2 className="w-4 h-4 mr-1" />
                        Share
                      </Button>
                      <Button size="sm" onClick={() => window.open(`/download/${project.id}`, "_blank")}>
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(project.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {projects.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No stacks yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start a conversation with our AI to generate your first stack
                </p>
                <Button asChild>
                  <Link href="/chat">
                    Create Your First Stack
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
