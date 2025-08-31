"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  Bot,
  User,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
  Building,
  ShoppingCart,
  Settings,
  Code,
  HelpCircle,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useUserSession } from "@/hooks/use-user-session"
import { useRealtimeChat } from "@/hooks/use-realtime-chat"

interface TechRecommendation {
  category: string
  technology: string
  reasoning: string
}

interface QuickStartOption {
  id: string
  label: string
  icon: React.ReactNode
  description: string
  prompt: string
}

const quickStartOptions: QuickStartOption[] = [
  {
    id: "saas",
    label: "Building a SaaS",
    icon: <Building className="w-4 h-4" />,
    description: "B2B or B2C software as a service",
    prompt:
      "I'm building a SaaS application. I need user accounts, subscriptions, and want to validate my idea quickly.",
  },
  {
    id: "ecommerce",
    label: "E-commerce Site",
    icon: <ShoppingCart className="w-4 h-4" />,
    description: "Online store or marketplace",
    prompt:
      "I'm building an e-commerce website. I need product catalogs, shopping cart, payments, and inventory management.",
  },
  {
    id: "internal",
    label: "Internal Tool",
    icon: <Settings className="w-4 h-4" />,
    description: "Company dashboard or admin panel",
    prompt:
      "I'm building an internal tool for my company. We need user management, data visualization, and team collaboration features.",
  },
]

export function ChatInterface() {
  const { user } = useUserSession()
  const searchParams = useSearchParams()
  const conversationId = searchParams.get('conversation')
  
  const {
    messages,
    conversation,
    isLoading,
    isStreaming,
    streamingMessage,
    sendMessage,
    loadConversation,
    createConversation,
    updateConversationPhase
  } = useRealtimeChat(conversationId || undefined)

  const [input, setInput] = useState("")
  const [showStackSummary, setShowStackSummary] = useState(false)
  const [showQuickStart, setShowQuickStart] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Initialize conversation if none exists
  useEffect(() => {
    if (!conversationId && !conversation && user) {
      createConversation().then((newConversationId) => {
        if (newConversationId) {
          // Update URL with new conversation ID
          const url = new URL(window.location.href)
          url.searchParams.set('conversation', newConversationId)
          window.history.replaceState({}, '', url.toString())
        }
      })
    }
  }, [conversationId, conversation, user, createConversation])

  // Show welcome message for new conversations
  const shouldShowWelcome = conversation && messages.length === 0 && !isLoading && !isStreaming

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const handleQuickStart = async (option: QuickStartOption) => {
    if (!conversation) return
    
    setShowQuickStart(false)
    await sendMessage(option.prompt)
  }

  const handleSend = async () => {
    if (!input.trim() || !conversation) return

    const currentInput = input
    setInput("")
    setShowQuickStart(false)
    
    await sendMessage(currentInput)
  }



  const getPhaseInfo = (phase: string) => {
    switch (phase) {
      case "discovery":
        return { label: "Discovery", description: "Understanding your project", timeLeft: "3-4 questions" }
      case "requirements":
        return { label: "Requirements", description: "Gathering technical needs", timeLeft: "2-3 questions" }
      case "constraints":
        return { label: "Constraints", description: "Budget and timeline considerations", timeLeft: "1-2 questions" }
      case "recommendation":
        return { label: "Recommendation", description: "Suggesting your stack", timeLeft: "Almost done" }
      case "refinement":
        return { label: "Refinement", description: "Addressing concerns", timeLeft: "Final touches" }
      case "generation":
        return { label: "Generation", description: "Creating your project", timeLeft: "Complete" }
      default:
        return { label: "Discovery", description: "Understanding your project", timeLeft: "3-4 questions" }
    }
  }

  const handleGenerateStack = () => {
    setShowStackSummary(true)
  }

  if (showStackSummary) {
    return <StackSummary onBack={() => setShowStackSummary(false)} conversation={conversation} />
  }

  const formatMessageContent = (content: string) => {
    const parts = content.split(/(`[^`]+`|\*\*[^*]+\*\*|•\s)/g)

    return parts.map((part, i) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        const tech = part.slice(1, -1)
        return (
          <span
            key={i}
            className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm font-mono border border-primary/20"
          >
            <Code className="w-3 h-3" />
            {tech}
          </span>
        )
      }
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="text-primary font-semibold">
            {part.slice(2, -2)}
          </strong>
        )
      }
      if (part.startsWith("• ")) {
        return (
          <div key={i} className="flex items-start gap-2 my-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
            <span>{part.slice(2)}</span>
          </div>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 border border-primary/30 rotate-45" />
        <div className="absolute top-40 right-32 w-24 h-24 border border-primary/30 rotate-12" />
        <div className="absolute bottom-32 left-40 w-28 h-28 border border-primary/30 -rotate-12" />
        <div className="absolute bottom-20 right-20 w-20 h-20 border border-primary/30 rotate-45" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 border border-primary/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-card/50 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="w-10 h-10 border-2 border-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                    <Bot className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">AI Stack Architect</h2>
                <p className="text-xs text-muted-foreground">Senior Technical Consultant • Online</p>
              </div>
            </div>

            <div className="text-right">
              <Badge variant="secondary" className="mb-1 bg-primary/10 text-primary border-primary/20 text-xs">
                {getPhaseInfo(conversation?.phase || 'discovery').label}
              </Badge>
              <p className="text-xs text-muted-foreground">{getPhaseInfo(conversation?.phase || 'discovery').description}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {/* Welcome message for new conversations */}
            {shouldShowWelcome && (
              <div className="flex gap-4 justify-start">
                <Avatar className="w-8 h-8 flex-shrink-0 border border-primary/30">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 max-w-[85%]">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>Senior Architect</span>
                    <span>{formatTime(new Date())}</span>
                  </div>
                  <div className="bg-muted/50 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="space-y-3">
                      <p className="text-sm leading-relaxed">
                        Hey {user?.name || 'there'}! I'm here to help you build the perfect tech stack for your project.
                      </p>
                      <p className="text-sm leading-relaxed">
                        Let me ask a few key questions to understand what you need:
                      </p>
                      <ul className="space-y-2 ml-4">
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm leading-relaxed">What type of application are you building?</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm leading-relaxed">Are you a solo founder or do you have a team?</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm leading-relaxed">What's your timeline - need to ship ASAP or have time to build properly?</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm leading-relaxed">What's your technical background with modern web development?</span>
                        </li>
                      </ul>
                      <p className="text-sm leading-relaxed">
                        Feel free to answer in your own words - I'll ask follow-ups based on what you tell me!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {messages.map((message, index) => {
              const isConsecutive = index > 0 && messages[index - 1].role === message.role
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-4",
                    message.role === "user" ? "justify-end" : "justify-start",
                    isConsecutive ? "mt-2" : "mt-6",
                  )}
                >
                  {/* AI Avatar - only show for first message in sequence */}
                  {message.role === "assistant" && !isConsecutive && (
                    <Avatar className="w-8 h-8 flex-shrink-0 border border-primary/30">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  {/* Spacer for consecutive AI messages */}
                  {message.role === "assistant" && isConsecutive && <div className="w-8 h-8 flex-shrink-0" />}

                  {/* Message content */}
                  <div className={cn("space-y-1", message.role === "user" ? "max-w-[70%]" : "max-w-[85%]")}>
                    {/* Timestamp - only for first message in sequence */}
                    {!isConsecutive && (
                      <div
                        className={cn(
                          "text-xs text-muted-foreground flex items-center gap-2",
                          message.role === "user" ? "justify-end" : "justify-start",
                        )}
                      >
                        <span>{message.role === "assistant" ? "Senior Architect" : "You"}</span>
                        <span>{formatTime(new Date(message.created_at))}</span>
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 shadow-sm",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-muted/50 text-foreground mr-auto",
                      )}
                    >
                      {message.role === "assistant" ? (
                        <div className="space-y-3">
                          {message.content.split("\n\n").map((paragraph, pIndex) => {
                            if (paragraph.trim().startsWith("•") || paragraph.trim().startsWith("-")) {
                              // Handle bullet points
                              const bullets = paragraph.split("\n").filter((line) => line.trim())
                              return (
                                <ul key={pIndex} className="space-y-2 ml-4">
                                  {bullets.map((bullet, bIndex) => (
                                    <li key={bIndex} className="flex items-start gap-2">
                                      <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                                      <span className="text-sm leading-relaxed">
                                        {highlightTechnicalTerms(bullet.replace(/^[•-]\s*/, ""))}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )
                            } else if (paragraph.includes("?")) {
                              // Handle questions
                              return (
                                <div key={pIndex} className="flex items-start gap-2">
                                  <HelpCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                  <p className="text-sm leading-relaxed font-medium">
                                    {highlightTechnicalTerms(paragraph)}
                                  </p>
                                </div>
                              )
                            } else {
                              // Regular paragraph
                              return (
                                <p key={pIndex} className="text-sm leading-relaxed">
                                  {highlightTechnicalTerms(paragraph)}
                                </p>
                              )
                            }
                          })}
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      )}
                    </div>
                  </div>

                  {/* User avatar - only show for first message in sequence */}
                  {message.role === "user" && !isConsecutive && (
                    <Avatar className="w-8 h-8 flex-shrink-0 border border-primary/30">
                      <AvatarFallback className="bg-gradient-to-br from-secondary to-secondary/80">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  {/* Spacer for consecutive user messages */}
                  {message.role === "user" && isConsecutive && <div className="w-8 h-8 flex-shrink-0" />}
                </div>
              )
            })}

            {/* Streaming message */}
            {isStreaming && streamingMessage && (
              <div className="flex gap-4 justify-start">
                <Avatar className="w-8 h-8 flex-shrink-0 border border-primary/30">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 max-w-[85%]">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>Senior Architect</span>
                    <span>{formatTime(new Date())}</span>
                  </div>
                  <div className="bg-muted/50 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="space-y-3">
                      {streamingMessage.split("\n\n").map((paragraph, pIndex) => (
                        <p key={pIndex} className="text-sm leading-relaxed">
                          {highlightTechnicalTerms(paragraph)}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Typing indicator */}
            {isStreaming && !streamingMessage && (
              <div className="flex gap-4 justify-start">
                <Avatar className="w-8 h-8 flex-shrink-0 border border-primary/30">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted/50 rounded-2xl px-4 py-3 shadow-sm max-w-[85%]">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t bg-card/50 backdrop-blur-sm p-4 sticky bottom-0">
          <div className="max-w-4xl mx-auto space-y-4">
            {showQuickStart && (
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-sm flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      Quick Start Options
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowQuickStart(false)}
                      className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 bg-transparent border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                      onClick={() => handleQuickStart(quickStartOptions.find(opt => opt.label === "Building a SaaS")!)}
                    >
                      <Building className="w-4 h-4" />
                      Building a SaaS
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 bg-transparent border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                      onClick={() => handleQuickStart(quickStartOptions.find(opt => opt.label === "E-commerce")!)}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      E-commerce
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 bg-transparent border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                      onClick={() => handleQuickStart(quickStartOptions.find(opt => opt.label === "Internal Tool")!)}
                    >
                      <Settings className="w-4 h-4" />
                      Internal Tool
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Share your project details... Need inspiration? Try: 'I'm a solo founder building a project management tool for small teams. I need to ship fast to validate the idea, but also want something that can scale if it takes off.'"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  disabled={isLoading || isStreaming}
                  className="min-h-[60px] max-h-[120px] resize-none text-sm leading-relaxed border focus:border-primary/50 bg-background rounded-xl"
                  rows={2}
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={isLoading || isStreaming || !input.trim()}
                size="lg"
                className="px-4 h-[60px] rounded-xl bg-primary hover:bg-primary/90"
              >
                {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )



  function highlightTechnicalTerms(text: string) {
    return text.split(/(\b(?:React|Next\.js|Clerk|Supabase|Stripe|PostHog|Resend)\b)/).map((part, index) => {
      if (/(React|Next\.js|Clerk|Supabase|Stripe|PostHog|Resend)/.test(part)) {
        return (
          <span key={index} className="font-medium text-primary">
            {part}
          </span>
        )
      }
      return part
    })
  }
}

function StackSummary({ onBack }: { onBack: () => void }) {
  const [projectName, setProjectName] = useState("my-saas-app")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showDownload, setShowDownload] = useState(false)
  const [expandedTech, setExpandedTech] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    
    try {
      // Mock selections based on the tech stack shown in the UI
      // In a real implementation, these would come from the conversation context
      const selections = {
        framework: 'nextjs' as const,
        authentication: 'clerk' as const,
        database: 'supabase' as const,
        hosting: 'vercel' as const,
        payments: 'stripe' as const,
        analytics: 'posthog' as const,
        email: 'resend' as const,
        monitoring: 'sentry' as const,
        ui: 'shadcn' as const
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName,
          selections,
          conversationId: conversation?.id
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate stack')
      }

      // The response is a ZIP file, trigger download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectName}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setIsGenerating(false)
      setShowDownload(true)
    } catch (error) {
      console.error('Error generating stack:', error)
      setIsGenerating(false)
      // You might want to show an error message to the user here
      alert('Failed to generate stack. Please try again.')
    }
  }

  const techStack = [
    {
      id: "auth",
      icon: "🔐",
      name: "Authentication: Clerk",
      description: "Handles B2B teams/orgs out of the box",
      reasoning:
        "Clerk was chosen because you mentioned needing team functionality for your B2B SaaS. It provides built-in organization management, team invites, role-based access control, and SSO capabilities that would take weeks to build from scratch. The migration path to custom auth is straightforward once you have revenue.",
      alternatives: ["NextAuth.js", "Supabase Auth", "Auth0"],
    },
    {
      id: "database",
      icon: "🗄️",
      name: "Database: Supabase",
      description: "Real-time for live project updates",
      reasoning:
        "Supabase fits your real-time collaboration needs perfectly. It provides PostgreSQL with real-time subscriptions, built-in auth integration, and row-level security. The generous free tier helps with early validation, and it scales seamlessly as you grow.",
      alternatives: ["PlanetScale", "Neon", "Railway PostgreSQL"],
    },
    {
      id: "hosting",
      icon: "🚀",
      name: "Hosting: Vercel",
      description: "Zero-config Next.js deployments",
      reasoning:
        "Vercel is the natural choice for Next.js applications. It provides automatic deployments, edge functions, and excellent developer experience. The preview deployments are perfect for team collaboration and testing.",
      alternatives: ["Netlify", "Railway", "AWS Amplify"],
    },
    {
      id: "payments",
      icon: "💳",
      name: "Payments: Stripe",
      description: "Fastest path to revenue validation",
      reasoning:
        "Stripe is the gold standard for SaaS payments. It handles subscription billing, invoicing, tax compliance, and provides excellent documentation. The Stripe Customer Portal saves months of development time for subscription management.",
      alternatives: ["Paddle", "LemonSqueezy", "Chargebee"],
    },
    {
      id: "analytics",
      icon: "📊",
      name: "Analytics: PostHog",
      description: "Product analytics + feature flags",
      reasoning:
        "PostHog provides both analytics and feature flags in one platform. This is crucial for a B2B SaaS where you need to understand user behavior and gradually roll out features to different customer segments.",
      alternatives: ["Mixpanel", "Amplitude", "Google Analytics"],
    },
    {
      id: "email",
      icon: "📧",
      name: "Email: Resend",
      description: "Best DX for transactional emails",
      reasoning:
        "Resend offers the best developer experience for transactional emails with excellent deliverability. It integrates seamlessly with React Email for beautiful, maintainable email templates.",
      alternatives: ["SendGrid", "Mailgun", "AWS SES"],
    },
  ]

  if (showDownload) {
    return <DownloadModal projectName={projectName} onBack={onBack} />
  }

  if (isGenerating) {
    return <GenerationProgress />
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        ← Back to Chat
      </Button>

      <Card className="p-8">
        <CardContent className="p-0">
          <div className="flex items-center space-x-3 mb-6">
            <Bot className="w-8 h-8 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Your Personalized Stack</h2>
              <p className="text-muted-foreground">
                Based on our conversation about your B2B SaaS with team functionality and real-time features
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-4">
              {techStack.map((tech) => (
                <div key={tech.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-lg">
                        {tech.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold">{tech.name}</h3>
                        <p className="text-sm text-muted-foreground">{tech.description}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedTech(expandedTech === tech.id ? null : tech.id)}
                    >
                      Why this choice?
                      {expandedTech === tech.id ? (
                        <ChevronUp className="w-4 h-4 ml-1" />
                      ) : (
                        <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </Button>
                  </div>

                  {expandedTech === tech.id && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Why we chose this:</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{tech.reasoning}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Alternatives considered:</h4>
                        <div className="flex flex-wrap gap-2">
                          {tech.alternatives.map((alt) => (
                            <span key={alt} className="text-xs bg-muted px-2 py-1 rounded">
                              {alt}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Setup time</p>
                  <p className="font-semibold">~45 minutes</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Free tier cost</p>
                  <p className="font-semibold">$0/month</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">At 1K users</p>
                  <p className="font-semibold">~$75/month</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium">Project name:</span>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="mt-1"
                  placeholder="my-awesome-saas"
                />
              </label>

              <Button onClick={handleGenerate} size="lg" className="w-full">
                Generate My Stack
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function GenerationProgress() {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("Setting up base structure...")

  useEffect(() => {
    const steps = [
      { text: "Setting up base structure...", duration: 800 },
      { text: "Adding dependencies...", duration: 600 },
      { text: "Configuring Clerk...", duration: 700 },
      { text: "Setting up Supabase...", duration: 500 },
      { text: "Configuring Stripe...", duration: 400 },
      { text: "Finalizing project...", duration: 300 },
    ]

    let currentProgress = 0
    let stepIndex = 0

    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setCurrentStep(steps[stepIndex].text)
        currentProgress += 100 / steps.length
        setProgress(Math.min(currentProgress, 100))
        stepIndex++
      } else {
        clearInterval(interval)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Generating Project</h3>
            <p className="text-muted-foreground">{currentStep}</p>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">{Math.round(progress)}%</p>
          </div>

          <div className="mt-6 space-y-2 text-left">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Created Next.js app</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Added dependencies</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Configured Clerk</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Setting up Supabase</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Configuring Stripe</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DownloadModal({ projectName, onBack }: { projectName: string; onBack: () => void }) {
  const [email, setEmail] = useState("")
  const [showEmailPreview, setShowEmailPreview] = useState(false)

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎉</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Project Ready!</h3>
            <p className="text-muted-foreground">Get your personalized setup guide via email</p>
          </div>

          <div className="space-y-4 mb-6">
            <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmailPreview(!showEmailPreview)}
              className="text-xs"
            >
              {showEmailPreview ? "Hide" : "Preview"} email content
            </Button>

            {showEmailPreview && (
              <Card className="text-left p-4 bg-muted/30">
                <div className="text-xs space-y-2">
                  <p>
                    <strong>Subject:</strong> Your {projectName} stack is ready! 🚀
                  </p>
                  <p>
                    <strong>Includes:</strong>
                  </p>
                  <ul className="text-xs space-y-1 ml-4">
                    <li>• Step-by-step setup guide</li>
                    <li>• Environment variables template</li>
                    <li>• Deployment instructions</li>
                    <li>• Common troubleshooting tips</li>
                    <li>• Architecture explanation</li>
                  </ul>
                </div>
              </Card>
            )}
          </div>

          <div className="bg-muted/50 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl">📦</span>
              <div>
                <p className="font-medium">{projectName}.zip</p>
                <p className="text-sm text-muted-foreground">(2.3 MB)</p>
              </div>
            </div>
          </div>

          <Button className="w-full mb-4" size="lg" disabled={!email}>
            Send Setup Guide & Download
          </Button>

          <div className="space-y-2">
            <Button variant="outline" className="w-full bg-transparent">
              View Setup Guide
            </Button>
            <Button variant="ghost" onClick={onBack} className="w-full">
              Start Another Project
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
