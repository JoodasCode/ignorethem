'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Heart, 
  Eye, 
  Download, 
  Star, 
  Users, 
  TrendingUp,
  Clock,
  ExternalLink,
  User,
  Sparkles
} from 'lucide-react'
import { SocialService, type ProjectShare, type CommunityTemplate } from '@/lib/social-service'
import { ShareButton } from './share-button'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface CommunityShowcaseProps {
  className?: string
}

export function CommunityShowcase({ className }: CommunityShowcaseProps) {
  const [sharedProjects, setSharedProjects] = useState<ProjectShare[]>([])
  const [communityTemplates, setCommunityTemplates] = useState<CommunityTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('projects')

  useEffect(() => {
    loadCommunityContent()
  }, [])

  const loadCommunityContent = async () => {
    setIsLoading(true)
    try {
      const [projects, templates] = await Promise.all([
        SocialService.getPopularSharedProjects(12),
        SocialService.getCommunityTemplates({ limit: 12 })
      ])

      setSharedProjects(projects)
      setCommunityTemplates(templates)
    } catch (error) {
      console.error('Error loading community content:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProjectLike = async (shareToken: string) => {
    try {
      await SocialService.toggleProjectLike(shareToken)
      // Refresh the projects to show updated like count
      const updatedProjects = await SocialService.getPopularSharedProjects(12)
      setSharedProjects(updatedProjects)
    } catch (error) {
      console.error('Error liking project:', error)
    }
  }

  const ProjectCard = ({ project }: { project: ProjectShare }) => (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="w-8 h-8">
              <AvatarImage src={(project as any).users?.avatar_url} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate group-hover:text-primary transition-colors">
                {project.title}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                by {(project as any).users?.name || 'Anonymous'} • {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <ShareButton
            type="project"
            title={project.title}
            description={project.description}
            url={`${window.location.origin}/shared/${project.share_token}`}
            variant="ghost"
            size="sm"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {project.description && (
          <CardDescription className="line-clamp-2">
            {project.description}
          </CardDescription>
        )}

        {/* Stack Technologies */}
        <div className="flex flex-wrap gap-1">
          {Object.keys(project.stack_config).slice(0, 4).map((tech) => (
            <Badge key={tech} variant="outline" className="text-xs">
              {tech}
            </Badge>
          ))}
          {Object.keys(project.stack_config).length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{Object.keys(project.stack_config).length - 4}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="w-3 h-3" />
              {project.view_count}
            </div>
            <button
              onClick={() => handleProjectLike(project.share_token)}
              className="flex items-center gap-1 text-muted-foreground hover:text-red-500 transition-colors"
            >
              <Heart className="w-3 h-3" />
              {project.like_count}
            </button>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/shared/${project.share_token}`}>
              <ExternalLink className="w-3 h-3 mr-1" />
              View
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const TemplateCard = ({ template }: { template: CommunityTemplate }) => (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="w-8 h-8">
              <AvatarImage src={(template as any).users?.avatar_url} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate group-hover:text-primary transition-colors">
                {template.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                by {(template as any).users?.name || 'Anonymous'} • {formatDistanceToNow(new Date(template.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {template.category}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <CardDescription className="line-clamp-2">
          {template.description}
        </CardDescription>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {template.tags.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{template.tags.length - 4}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Download className="w-3 h-3" />
              {template.download_count}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Star className="w-3 h-3 fill-current text-yellow-400" />
              {template.rating.toFixed(1)} ({template.rating_count})
            </div>
          </div>
          <div className="flex gap-1">
            <ShareButton
              type="template"
              title={template.name}
              description={template.description}
              technologies={template.tags}
              variant="ghost"
              size="sm"
            />
            <Button size="sm" variant="outline">
              <Download className="w-3 h-3 mr-1" />
              Use
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-48" />
      ))}
    </div>
  )

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Community Showcase
          </CardTitle>
          <CardDescription>
            Discover projects and templates shared by the community
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Shared Projects
                <Badge variant="secondary" className="ml-1">
                  {sharedProjects.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Community Templates
                <Badge variant="secondary" className="ml-1">
                  {communityTemplates.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="mt-6">
              {isLoading ? (
                <LoadingSkeleton />
              ) : sharedProjects.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No shared projects yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to share your project with the community!
                  </p>
                  <Button asChild>
                    <Link href="/dashboard">Share Your Project</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sharedProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="templates" className="mt-6">
              {isLoading ? (
                <LoadingSkeleton />
              ) : communityTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No community templates yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Submit your own template to help other developers!
                  </p>
                  <Button asChild>
                    <Link href="/templates/submit">Submit Template</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {communityTemplates.map((template) => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* View More Button */}
          {((activeTab === 'projects' && sharedProjects.length >= 12) ||
            (activeTab === 'templates' && communityTemplates.length >= 12)) && (
            <div className="mt-6 text-center">
              <Button variant="outline" asChild>
                <Link href={activeTab === 'projects' ? '/community/projects' : '/community/templates'}>
                  View All {activeTab === 'projects' ? 'Projects' : 'Templates'}
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}