# Template System

This directory contains modular templates for generating technology stacks. Each template is self-contained and can be combined with other compatible templates.

## Directory Structure

```
templates/
├── base/                 # Core framework templates
│   └── nextjs/          # Next.js 14 base template
├── auth/                # Authentication providers
│   ├── clerk/           # Clerk integration
│   ├── nextauth/        # NextAuth.js
│   └── supabase-auth/   # Supabase Auth
├── database/            # Database integrations
│   ├── supabase/        # Supabase PostgreSQL
│   ├── planetscale/     # PlanetScale + Prisma
│   └── neon/            # Neon PostgreSQL
├── payments/            # Payment processing
│   ├── stripe/          # Stripe integration
│   └── paddle/          # Paddle integration
├── analytics/           # Analytics services
│   ├── posthog/         # PostHog
│   ├── plausible/       # Plausible Analytics
│   └── ga4/             # Google Analytics 4
├── email/               # Email services
│   ├── resend/          # Resend
│   ├── postmark/        # Postmark
│   └── sendgrid/        # SendGrid
├── monitoring/          # Error monitoring
│   ├── sentry/          # Sentry
│   └── bugsnag/         # Bugsnag
├── hosting/             # Hosting platforms
│   ├── vercel/          # Vercel configuration
│   ├── netlify/         # Netlify configuration
│   └── railway/         # Railway configuration
└── ui/                  # UI libraries
    ├── shadcn/          # shadcn/ui
    ├── chakra/          # Chakra UI
    └── mantine/         # Mantine
```

## Template Structure

Each template directory contains:

- `template.json` - Template metadata and configuration
- `package.json` - NPM dependencies and scripts (optional)
- `env.json` - Environment variables configuration (optional)
- `setup.json` - Setup instructions (optional)
- `files/` - Template files to be copied to generated project

### template.json Format

```json
{
  "id": "template-id",
  "name": "Template Name",
  "description": "Template description",
  "category": "auth|database|payments|etc",
  "version": "1.0.0",
  "complexity": "simple|moderate|complex",
  "pricing": "free|freemium|paid",
  "setupTime": 15,
  "dependencies": ["other-template-id"],
  "conflicts": ["conflicting-template-id"],
  "requiredEnvVars": ["REQUIRED_VAR"],
  "optionalEnvVars": ["OPTIONAL_VAR"],
  "documentation": "https://docs.example.com",
  "tags": ["tag1", "tag2"],
  "popularity": 100,
  "lastUpdated": "2024-01-01T00:00:00Z"
}
```

### env.json Format

```json
[
  {
    "key": "API_KEY",
    "description": "API key for service",
    "required": true,
    "example": "sk_test_...",
    "category": "auth"
  }
]
```

### setup.json Format

```json
[
  {
    "step": 1,
    "title": "Install dependencies",
    "description": "Install required packages",
    "command": "npm install",
    "category": "installation"
  }
]
```

## Template Development Guidelines

1. **Modularity**: Each template should be self-contained and work independently
2. **Compatibility**: Use the compatibility matrix to define conflicts and dependencies
3. **Documentation**: Include clear setup instructions and environment variable descriptions
4. **Versioning**: Use semantic versioning for template updates
5. **Testing**: Ensure generated code compiles and runs without errors
6. **Security**: Follow security best practices in all template code
7. **Performance**: Optimize for fast generation and minimal bundle size

## Adding New Templates

1. Create a new directory under the appropriate category
2. Add `template.json` with complete metadata
3. Create `files/` directory with template files
4. Add any additional configuration files (package.json, env.json, setup.json)
5. Test template generation and compatibility
6. Update compatibility matrix if needed