"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Star, Users, Clock } from "lucide-react"

const popularStacks = [
  {
    id: 1,
    name: "Next.js + Supabase + Stripe",
    description: "Full-stack SaaS starter with authentication, database, and payments",
    tags: ["React", "Next.js", "Supabase", "Stripe", "TypeScript"],
    users: 2847,
    rating: 4.8,
    setupTime: "15 min",
    category: "SaaS",
  },
  {
    id: 2,
    name: "MERN Stack + Auth0",
    description: "MongoDB, Express, React, Node.js with Auth0 authentication",
    tags: ["MongoDB", "Express", "React", "Node.js", "Auth0"],
    users: 1923,
    rating: 4.6,
    setupTime: "20 min",
    category: "Full Stack",
  },
  {
    id: 3,
    name: "Django + PostgreSQL + Redis",
    description: "Python web framework with robust database and caching",
    tags: ["Python", "Django", "PostgreSQL", "Redis", "Celery"],
    users: 1456,
    rating: 4.7,
    setupTime: "25 min",
    category: "Backend",
  },
  {
    id: 4,
    name: "Vue.js + Firebase + Tailwind",
    description: "Modern frontend with real-time database and beautiful styling",
    tags: ["Vue.js", "Firebase", "Tailwind CSS", "Vite"],
    users: 1234,
    rating: 4.5,
    setupTime: "12 min",
    category: "Frontend",
  },
  {
    id: 5,
    name: "Laravel + MySQL + Vue",
    description: "PHP framework with elegant syntax and powerful features",
    tags: ["PHP", "Laravel", "MySQL", "Vue.js", "Inertia"],
    users: 987,
    rating: 4.4,
    setupTime: "18 min",
    category: "Full Stack",
  },
  {
    id: 6,
    name: "Svelte + Prisma + PlanetScale",
    description: "Lightweight frontend with type-safe database access",
    tags: ["Svelte", "Prisma", "PlanetScale", "TypeScript"],
    users: 756,
    rating: 4.6,
    setupTime: "14 min",
    category: "Modern Stack",
  },
]

const categories = ["All", "SaaS", "E-commerce", "Full Stack", "Frontend", "Backend", "Modern Stack"]

export default function BrowsePage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Browse Popular Stacks</h1>
          <p className="text-muted-foreground">
            Discover proven technology combinations used by thousands of developers
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search stacks, technologies, or use cases..." className="pl-10" />
          </div>
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={category === "All" ? "default" : "secondary"}
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
            >
              {category}
            </Badge>
          ))}
        </div>

        {/* Stack Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularStacks.map((stack) => (
            <Card key={stack.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg mb-1">{stack.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {stack.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {stack.rating}
                  </div>
                </div>
                <CardDescription className="text-sm">{stack.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-4">
                  {stack.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {stack.users.toLocaleString()} users
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {stack.setupTime}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" size="sm">
                    Use This Stack
                  </Button>
                  <Button variant="outline" size="sm">
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
