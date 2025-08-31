"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Zap, Shield, Rocket, Users, TrendingUp, Eye, User, Building } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { AuthModal } from "@/components/auth/auth-modal"
import { useAuth } from "@/hooks/use-auth"

export function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { isAuthenticated } = useAuth()
  const searchParams = useSearchParams()

  // Handle auth required redirect
  useEffect(() => {
    const authRequired = searchParams.get('auth')
    if (authRequired === 'required') {
      setShowAuthModal(true)
    }
  }, [searchParams])

  const handleDemoClick = () => {
    // Navigate to chat with a pre-filled demo conversation
    window.location.href = "/chat?demo=true"
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6">
            <Users className="w-4 h-4 mr-2" />
            1,247 developers shipped this week
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
            Build Your Perfect <span className="text-primary">SaaS Stack</span> in Minutes
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-8 text-balance max-w-3xl mx-auto">
            Stop researching. Start building. Get a fully integrated starter with your ideal tech stack.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {isAuthenticated ? (
              <Button size="lg" className="text-lg px-8 py-6" asChild>
                <Link href="/chat">
                  Start Building Your Stack
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            ) : (
              <Button 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => setShowAuthModal(true)}
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            )}
          </div>

          <div className="max-w-2xl mx-auto">
            <p className="text-lg text-muted-foreground mb-6">
              Just describe your project and get a complete, production-ready stack in minutes.
            </p>
            
            <Button 
              variant="outline" 
              size="lg" 
              onClick={handleDemoClick}
              className="text-base px-6 py-3"
            >
              See Demo Conversation
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-primary mb-1">1,247</div>
              <div className="text-sm text-muted-foreground">Projects Generated</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary mb-1">89%</div>
              <div className="text-sm text-muted-foreground">Shipped to Production</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary mb-1">4.8★</div>
              <div className="text-sm text-muted-foreground">Developer Rating</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary mb-1">2.3M</div>
              <div className="text-sm text-muted-foreground">Lines of Code Generated</div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Stack Examples */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">AI Generates These Stacks Instantly</h2>
            <p className="text-muted-foreground mt-2">Based on your project description</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 hover:shadow-lg transition-all hover:scale-[1.02]">
              <CardContent className="p-0">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-6 h-6 text-primary" />
                    <h3 className="font-semibold text-xl">Rapid MVP</h3>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    <span>342 built</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 1-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.25 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 0 1 .174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 0 0 4.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 0 0 2.466-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747C19.146 4.318 16.956 1.669 13.94.348A11.947 11.947 0 0 0 11.572 0z" />
                    </svg>
                    <div>
                      <span className="text-base font-semibold">Next.js</span>
                      <p className="text-xs text-muted-foreground">React Framework</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c-.169-.196-.359-.293-.564-.489-.822-.52-1.688-.78-2.594-.78-.906 0-1.772.26-2.594.78-.205.13-.395.293-.564.489L12 7.2l-.852.96zm-.568 7.68c.169.196.359.293.564.489.822.52 1.688.78 2.594.78.906 0 1.772-.26 2.594-.78.205-.13.395-.293-.564.489L12 16.8l.852-.96z" />
                    </svg>
                    <div>
                      <span className="text-base font-semibold">Clerk</span>
                      <p className="text-xs text-muted-foreground">Authentication</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21.362 9.354H12V.396a12.209 12.209 0 0 1 9.362 8.958zM11.638 9.354H2.276A12.212 12.212 0 0 1 11.638.396v8.958zm0 5.292H2.276a12.212 12.212 0 0 1 9.362 8.958v-8.958zm.724 0V24a12.209 12.209 0 0 1 9.362-8.958H12.362z" />
                    </svg>
                    <div>
                      <span className="text-base font-semibold">Supabase</span>
                      <p className="text-xs text-muted-foreground">Database</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <svg className="w-8 h-8 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.274 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
                    </svg>
                    <div>
                      <span className="text-base font-semibold">Stripe</span>
                      <p className="text-xs text-muted-foreground">Payments</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Perfect for solo founders who need to ship fast and validate ideas quickly.
                  </p>
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all hover:scale-[1.02]">
              <CardContent className="p-0">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-6 h-6 text-primary" />
                    <h3 className="font-semibold text-xl">Enterprise Ready</h3>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    <span>189 built</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 1-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.25 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 0 1 .174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 0 0 4.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 0 0 2.466-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747C19.146 4.318 16.956 1.669 13.94.348A11.947 11.947 0 0 0 11.572 0z" />
                    </svg>
                    <div>
                      <span className="text-base font-semibold">Next.js</span>
                      <p className="text-xs text-muted-foreground">React Framework</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <svg className="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm2.5 7.5h-5v9h5v-9z" />
                    </svg>
                    <div>
                      <span className="text-base font-semibold">NextAuth</span>
                      <p className="text-xs text-muted-foreground">Authentication</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <svg className="w-8 h-8 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M0 12C0 5.373 5.373 0 12 0s12 5.373 12 12-5.373 12-12 12S0 18.627 0 12zm12-5a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" />
                    </svg>
                    <div>
                      <span className="text-base font-semibold">PlanetScale</span>
                      <p className="text-xs text-muted-foreground">Database</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <svg className="w-8 h-8 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.274 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
                    </svg>
                    <div>
                      <span className="text-base font-semibold">Stripe</span>
                      <p className="text-xs text-muted-foreground">Payments</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Built for teams that need scalability, security, and enterprise features.
                  </p>
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all hover:scale-[1.02]">
              <CardContent className="p-0">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <Rocket className="w-6 h-6 text-primary" />
                    <h3 className="font-semibold text-xl">Full Stack</h3>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    <span>156 built</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 1-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.25 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 0 1 .174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 0 0 4.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 0 0 2.466-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747C19.146 4.318 16.956 1.669 13.94.348A11.947 11.947 0 0 0 11.572 0z" />
                    </svg>
                    <div>
                      <span className="text-base font-semibold">Next.js</span>
                      <p className="text-xs text-muted-foreground">React Framework</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21.362 9.354H12V.396a12.209 12.209 0 0 1 9.362 8.958zM11.638 9.354H2.276A12.212 12.212 0 0 1 11.638.396v8.958zm0 5.292H2.276a12.212 12.212 0 0 1 9.362 8.958v-8.958zm.724 0V24a12.209 12.209 0 0 1 9.362-8.958H12.362z" />
                    </svg>
                    <div>
                      <span className="text-base font-semibold">Supabase</span>
                      <p className="text-xs text-muted-foreground">Database</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <svg className="w-8 h-8 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14z" />
                    </svg>
                    <div>
                      <span className="text-base font-semibold">PostHog</span>
                      <p className="text-xs text-muted-foreground">Analytics</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                    <div>
                      <span className="text-base font-semibold">Resend</span>
                      <p className="text-xs text-muted-foreground">Email</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Complete solution with analytics, monitoring, and email capabilities.
                  </p>
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Conversation Examples Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">See How It Works</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-6">
              <CardContent className="p-0">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Solo Founder</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="font-medium mb-1">You:</p>
                    <p>
                      "I'm building a project management SaaS for small teams. Need to ship fast to validate the idea."
                    </p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <p className="font-medium mb-1">AI:</p>
                    <p>
                      "Perfect! For fast validation, I recommend Next.js + Clerk + Supabase + Stripe. This gets you team
                      management, real-time updates, and payments in ~2 hours of setup."
                    </p>
                  </div>
                  <div className="text-center pt-2">
                    <Badge variant="secondary">Setup time: ~45 min</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="p-0">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Building className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Enterprise Team</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="font-medium mb-1">You:</p>
                    <p>
                      "Building an internal dashboard for 200+ employees. Need SSO, compliance, and high performance."
                    </p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <p className="font-medium mb-1">AI:</p>
                    <p>
                      "For enterprise needs, I suggest Next.js + Auth0 + PlanetScale + Vercel Pro. This handles SSO,
                      scales to thousands of users, and meets compliance requirements."
                    </p>
                  </div>
                  <div className="text-center pt-2">
                    <Badge variant="secondary">Setup time: ~2 hours</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            {isAuthenticated ? (
              <Button size="lg" asChild>
                <Link href="/chat">Start Building Your Stack</Link>
              </Button>
            ) : (
              <Button 
                size="lg"
                onClick={() => setShowAuthModal(true)}
              >
                Get Started Free
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Ship Faster, Build Smarter</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="font-semibold mb-2">Minutes, Not Weeks</h3>
              <p className="text-muted-foreground">
                Get production-ready code with auth, database, and payments pre-configured.
              </p>
            </div>
            <div>
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="font-semibold mb-2">Personalized Recommendations</h3>
              <p className="text-muted-foreground">
                AI analyzes your specific needs and suggests the perfect tech stack.
              </p>
            </div>
            <div>
              <div className="text-4xl mb-4">💰</div>
              <h3 className="font-semibold mb-2">Cost-Optimized</h3>
              <p className="text-muted-foreground">Start free, scale affordably. See exact costs before you commit.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 text-center bg-primary/5">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Build Your Stack?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of developers who've shipped faster with Stack Navigator.
          </p>
          <Button size="lg" className="text-lg px-8 py-6" asChild>
            <Link href="/chat">
              Start Your Project Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        defaultTab="signup"
      />
    </div>
  )
}
