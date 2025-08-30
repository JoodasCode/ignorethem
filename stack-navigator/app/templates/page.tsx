"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Download, Eye, Star, Clock } from "lucide-react"

const templates = [
  {
    id: 1,
    name: "SaaS Starter Kit",
    description: "Complete SaaS application with authentication, billing, and dashboard",
    image: "/saas-dashboard-interface.png",
    stack: ["Next.js", "Supabase", "Stripe", "Tailwind"],
    category: "SaaS",
    downloads: 1247,
    rating: 4.9,
    setupTime: "10 min",
    features: ["User Auth", "Payments", "Admin Panel", "Email Templates"],
  },
  {
    id: 2,
    name: "E-commerce Store",
    description: "Full-featured online store with cart, checkout, and inventory management",
    image: "/e-commerce-store-homepage.png",
    stack: ["React", "Node.js", "MongoDB", "Stripe"],
    category: "E-commerce",
    downloads: 892,
    rating: 4.7,
    setupTime: "15 min",
    features: ["Product Catalog", "Shopping Cart", "Order Management", "Payment Processing"],
  },
  {
    id: 3,
    name: "Blog Platform",
    description: "Modern blog with CMS, SEO optimization, and comment system",
    image: "/modern-blog-layout.png",
    stack: ["Next.js", "Sanity", "Vercel"],
    category: "Content",
    downloads: 634,
    rating: 4.6,
    setupTime: "8 min",
    features: ["CMS Integration", "SEO Optimized", "Comments", "Newsletter"],
  },
  {
    id: 4,
    name: "Portfolio Website",
    description: "Professional portfolio with project showcase and contact forms",
    image: "/portfolio-website-design.png",
    stack: ["Vue.js", "Nuxt", "Tailwind"],
    category: "Portfolio",
    downloads: 456,
    rating: 4.5,
    setupTime: "5 min",
    features: ["Project Gallery", "Contact Form", "Resume Section", "Dark Mode"],
  },
  {
    id: 5,
    name: "Task Management App",
    description: "Collaborative task management with real-time updates and team features",
    image: "/task-management-dashboard.png",
    stack: ["React", "Firebase", "Material-UI"],
    category: "Productivity",
    downloads: 723,
    rating: 4.8,
    setupTime: "12 min",
    features: ["Real-time Sync", "Team Collaboration", "File Attachments", "Time Tracking"],
  },
  {
    id: 6,
    name: "Landing Page Kit",
    description: "High-converting landing page templates for various industries",
    image: "/landing-page-template.png",
    stack: ["HTML", "CSS", "JavaScript"],
    category: "Marketing",
    downloads: 1089,
    rating: 4.4,
    setupTime: "3 min",
    features: ["Multiple Layouts", "Contact Forms", "Analytics", "Mobile Responsive"],
  },
]

const categories = ["All", "SaaS", "E-commerce", "Content", "Portfolio", "Productivity", "Marketing"]

export default function TemplatesPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Ready-to-Use Templates</h1>
          <p className="text-muted-foreground">Jump-start your project with professionally designed templates</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search templates by name, category, or technology..." className="pl-10" />
          </div>
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

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-muted relative overflow-hidden">
                <img
                  src={template.image || "/placeholder.svg"}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="text-xs">
                    {template.category}
                  </Badge>
                </div>
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg mb-1">{template.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {template.rating}
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {template.downloads}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {template.setupTime}
                      </div>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-sm">{template.description}</CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Tech Stack */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.stack.map((tech) => (
                    <Badge key={tech} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>

                {/* Features */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Key Features:</h4>
                  <div className="flex flex-wrap gap-1">
                    {template.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button className="flex-1" size="sm">
                    <Download className="h-3 w-3 mr-1" />
                    Use Template
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-3 w-3 mr-1" />
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
