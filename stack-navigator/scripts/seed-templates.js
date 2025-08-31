/**
 * Script to seed the templates table with sample data
 * Run with: node scripts/seed-templates.js
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sampleTemplates = [
  {
    name: 'Next.js SaaS Starter',
    slug: 'nextjs-saas-starter',
    description: 'Complete SaaS starter with authentication, payments, and dashboard',
    category: 'SaaS',
    technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Stripe'],
    features: ['Authentication', 'Payments', 'Dashboard', 'Email', 'Analytics'],
    template_config: {
      framework: 'nextjs',
      auth: 'supabase',
      database: 'supabase',
      payments: 'stripe'
    },
    preview_files: {
      'app/page.tsx': {
        content: `import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Welcome to Your SaaS</h1>
      <Button>Get Started</Button>
    </div>
  )
}`,
        path: 'app/page.tsx'
      }
    },
    full_template: {},
    setup_time_minutes: 20,
    complexity: 'medium',
    preview_image_url: '/saas-dashboard-interface.png',
    demo_url: 'https://demo.example.com',
    github_url: 'https://github.com/example/nextjs-saas',
    is_featured: true,
    is_premium: false,
    rating: 4.8,
    rating_count: 24,
    usage_count: 156,
    view_count: 892
  },
  {
    name: 'E-commerce Store Template',
    slug: 'ecommerce-store-template',
    description: 'Modern e-commerce store with product catalog, cart, and checkout',
    category: 'E-commerce',
    technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Stripe', 'Supabase'],
    features: ['Product Catalog', 'Shopping Cart', 'Checkout', 'User Accounts', 'Order Management'],
    template_config: {
      framework: 'nextjs',
      payments: 'stripe',
      database: 'supabase'
    },
    preview_files: {
      'app/products/page.tsx': {
        content: `import { ProductGrid } from "@/components/product-grid"

export default function Products() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Our Products</h1>
      <ProductGrid />
    </div>
  )
}`,
        path: 'app/products/page.tsx'
      }
    },
    full_template: {},
    setup_time_minutes: 25,
    complexity: 'medium',
    preview_image_url: '/e-commerce-store-homepage.png',
    demo_url: 'https://store-demo.example.com',
    github_url: 'https://github.com/example/ecommerce-template',
    is_featured: true,
    is_premium: false,
    rating: 4.6,
    rating_count: 18,
    usage_count: 89,
    view_count: 567
  },
  {
    name: 'Portfolio Website',
    slug: 'portfolio-website',
    description: 'Clean and modern portfolio website for developers and designers',
    category: 'Portfolio',
    technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
    features: ['Responsive Design', 'Animations', 'Contact Form', 'Blog', 'Project Showcase'],
    template_config: {
      framework: 'nextjs',
      styling: 'tailwind',
      animations: 'framer-motion'
    },
    preview_files: {
      'app/page.tsx': {
        content: `import { Hero } from "@/components/hero"
import { Projects } from "@/components/projects"

export default function Home() {
  return (
    <main>
      <Hero />
      <Projects />
    </main>
  )
}`,
        path: 'app/page.tsx'
      }
    },
    full_template: {},
    setup_time_minutes: 15,
    complexity: 'simple',
    preview_image_url: '/portfolio-website-design.png',
    demo_url: 'https://portfolio-demo.example.com',
    github_url: 'https://github.com/example/portfolio-template',
    is_featured: false,
    is_premium: false,
    rating: 4.7,
    rating_count: 31,
    usage_count: 203,
    view_count: 1245
  },
  {
    name: 'Task Management Dashboard',
    slug: 'task-management-dashboard',
    description: 'Comprehensive task management dashboard with team collaboration',
    category: 'Productivity',
    technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Clerk'],
    features: ['Task Management', 'Team Collaboration', 'Real-time Updates', 'File Uploads', 'Notifications'],
    template_config: {
      framework: 'nextjs',
      auth: 'clerk',
      database: 'supabase',
      realtime: true
    },
    preview_files: {
      'app/dashboard/page.tsx': {
        content: `import { TaskBoard } from "@/components/task-board"
import { TeamSidebar } from "@/components/team-sidebar"

export default function Dashboard() {
  return (
    <div className="flex h-screen">
      <TeamSidebar />
      <main className="flex-1 p-6">
        <TaskBoard />
      </main>
    </div>
  )
}`,
        path: 'app/dashboard/page.tsx'
      }
    },
    full_template: {},
    setup_time_minutes: 30,
    complexity: 'complex',
    preview_image_url: '/task-management-dashboard.png',
    demo_url: 'https://tasks-demo.example.com',
    github_url: 'https://github.com/example/task-dashboard',
    is_featured: true,
    is_premium: true,
    rating: 4.9,
    rating_count: 8,
    usage_count: 34,
    view_count: 198
  }
]

async function seedTemplates() {
  try {
    console.log('Seeding templates...')
    
    const { data, error } = await supabase
      .from('templates')
      .upsert(sampleTemplates, { onConflict: 'slug' })

    if (error) {
      console.error('Error seeding templates:', error)
      return
    }

    console.log(`Successfully seeded ${sampleTemplates.length} templates`)
    
    // Also seed some sample ratings and views
    const { data: templates } = await supabase
      .from('templates')
      .select('id')
      .limit(2)

    if (templates && templates.length > 0) {
      // Add some sample ratings
      const sampleRatings = [
        {
          template_id: templates[0].id,
          rating: 5,
          review: 'Excellent template! Saved me hours of setup time.'
        },
        {
          template_id: templates[0].id,
          rating: 4,
          review: 'Great starter template, very well structured.'
        }
      ]

      await supabase
        .from('template_ratings')
        .upsert(sampleRatings, { onConflict: 'template_id,user_id' })

      // Add some sample usage
      const sampleUsage = [
        {
          template_id: templates[0].id,
          action: 'view'
        },
        {
          template_id: templates[0].id,
          action: 'use'
        }
      ]

      await supabase
        .from('template_usage')
        .insert(sampleUsage)

      console.log('Added sample ratings and usage data')
    }

  } catch (error) {
    console.error('Error in seedTemplates:', error)
  }
}

seedTemplates()