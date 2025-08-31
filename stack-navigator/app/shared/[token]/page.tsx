import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  Heart, 
  Eye, 
  Download, 
  User, 
  Calendar,
  Code,
  ExternalLink,
  ArrowLeft
} from 'lucide-react'
import { SocialService } from '@/lib/social-service'
import { ShareButton } from '@/components/social/share-button'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface SharedProjectPageProps {
  params: {
    token: string
  }
}

export async function generateMetadata({ params }: SharedProjectPageProps): Promise<Metadata> {
  const project = await SocialService.getSharedProject(params.token)
  
  if (!project) {
    return {
      title: 'Project Not Found - Stack Navigator',
      description: 'The shared project you are looking for could not be found.'
    }
  }

  return {
    title: `${project.title} - Shared Project | Stack Navigator`,
    description: project.description || `Check out this awesome project: ${project.title}`,
    openGraph: {
      title: project.title,
      description: project.description || `Check out this awesome project: ${project.title}`,
      type: 'website',
      url: `${process.env.NEXT_PUBLIC_APP_URL}/shared/${params.token}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description: project.description || `Check out this awesome project: ${project.title}`,
    }
  }
}

export default async function SharedProjectPage({ params }: SharedProjectPageProps) {
  const project = await SocialService.getSharedProject(params.token)

  if (!project) {
    notFound()
  }

  const stackTechnologies = Object.keys(project.stack_config)
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/shared/${params.token}`

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Stack Navigator
              </Link>
            </Button>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={(project as any).users?.avatar_url} />
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{project.title}</h1>
                <p className="text-muted-foreground">
                  Shared by {(project as any).users?.name || 'Anonymous'} • {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ShareButton
                type="project"
                title={project.title}
                description={project.description}
                url={shareUrl}
                technologies={stackTechnologies}
              />
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Use This Stack
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {project.description && (
              <Card>
                <CardHeader>
                  <CardTitle>About This Project</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {project.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Stack Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Technology Stack
                </CardTitle>
                <CardDescription>
                  The technologies and services used in this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(project.stack_config).map(([category, technology]) => (
                    <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="text-sm text-muted-foreground">{technology as string}</p>
                      </div>
                      <Badge variant="outline">{technology as string}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Getting Started */}
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                  How to use this stack for your own project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Generate Your Project</p>
                      <p className="text-sm text-muted-foreground">
                        Click "Use This Stack" to generate a new project with this exact configuration
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Download & Setup</p>
                      <p className="text-sm text-muted-foreground">
                        Download the generated code and follow the setup instructions in the README
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Start Building</p>
                      <p className="text-sm text-muted-foreground">
                        All integrations are pre-configured - just add your API keys and start coding!
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Use This Stack
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/chat">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Customize Stack
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Project Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Views</span>
                  </div>
                  <span className="font-medium">{project.view_count.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Likes</span>
                  </div>
                  <span className="font-medium">{project.like_count.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Shared</span>
                  </div>
                  <span className="font-medium text-sm">
                    {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Technologies */}
            <Card>
              <CardHeader>
                <CardTitle>Technologies Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {stackTechnologies.map((tech) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card>
              <CardHeader>
                <CardTitle>Like This Stack?</CardTitle>
                <CardDescription>
                  Create your own project with Stack Navigator
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" asChild>
                  <Link href="/chat">
                    Start Building
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/browse">
                    Browse More Stacks
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}