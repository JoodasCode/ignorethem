"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Download, 
  Trash2, 
  Search, 
  Calendar,
  Code,
  Package,
  AlertCircle
} from "lucide-react"
import { useGeneratedStacks } from "@/hooks/use-generated-stacks"

interface GeneratedStack {
  id: string
  stack_name: string
  stack_description: string | null
  technologies: string[]
  download_count: number
  created_at: string
  updated_at: string
}

export function PreviousStacks() {
  const [searchQuery, setSearchQuery] = useState("")
  const { stacks, isLoading, error, deleteStack, downloadStack } = useGeneratedStacks()

  const filteredStacks = stacks.filter((stack) =>
    stack.stack_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stack.stack_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stack.technologies.some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleDownload = async (stackId: string) => {
    try {
      await downloadStack(stackId)
    } catch (error) {
      console.error('Failed to download stack:', error)
    }
  }

  const handleDelete = async (stackId: string, stackName: string) => {
    if (!confirm(`Are you sure you want to delete "${stackName}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteStack(stackId)
    } catch (error) {
      console.error('Failed to delete stack:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Previous Stacks
        </CardTitle>
        {stacks.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stacks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your stacks...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <p className="text-red-500 mb-2">Failed to load stacks</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : stacks.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Stacks Generated Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start a conversation in the chat to generate your first tech stack.
            </p>
            <Button asChild>
              <a href="/chat">Start Chatting</a>
            </Button>
          </div>
        ) : filteredStacks.length === 0 ? (
          <div className="text-center py-8">
            <Search className="h-8 w-8 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No stacks match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStacks.map((stack) => (
              <Card key={stack.id} className="relative group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{stack.stack_name}</h4>
                      {stack.stack_description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {stack.stack_description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Technologies */}
                    <div className="flex flex-wrap gap-1">
                      {stack.technologies.slice(0, 3).map((tech, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                      {stack.technologies.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{stack.technologies.length - 3} more
                        </Badge>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(stack.created_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {stack.download_count} downloads
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleDownload(stack.id)}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(stack.id, stack.stack_name)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}