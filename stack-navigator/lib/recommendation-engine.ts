import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { ProjectAnalysis, TechStackRecommendations, ConversationContext } from './types/conversation';

// Schema for AI-generated recommendations
const TechStackSchema = z.object({
  stack: z.object({
    framework: z.enum(['nextjs', 'remix', 'sveltekit']),
    authentication: z.enum(['clerk', 'supabase-auth', 'nextauth', 'none']),
    database: z.enum(['supabase', 'planetscale', 'neon', 'none']),
    hosting: z.enum(['vercel', 'netlify', 'railway', 'render']),
    payments: z.enum(['stripe', 'paddle', 'none']),
    analytics: z.enum(['posthog', 'plausible', 'ga4', 'none']),
    email: z.enum(['resend', 'postmark', 'sendgrid', 'none']),
    monitoring: z.enum(['sentry', 'bugsnag', 'none']),
  }),
  reasoning: z.record(z.string(), z.string()),
  alternatives: z.record(z.string(), z.array(z.string())),
  migrationPaths: z.record(z.string(), z.string()),
  estimatedCosts: z.object({
    monthly: z.string(),
    breakdown: z.record(z.string(), z.string()),
  }),
});

export class RecommendationEngine {
  async generateRecommendations(
    conversationSummary: string,
    projectAnalysis: ProjectAnalysis,
    context: ConversationContext
  ): Promise<TechStackRecommendations> {
    const prompt = this.buildRecommendationPrompt(conversationSummary, projectAnalysis, context);

    try {
      const result = await generateObject({
        model: openai('gpt-4-turbo'),
        schema: TechStackSchema,
        prompt,
        temperature: 0.3, // Lower temperature for more consistent recommendations
      });

      return {
        framework: result.object.stack.framework,
        authentication: result.object.stack.authentication,
        database: result.object.stack.database,
        hosting: result.object.stack.hosting,
        payments: result.object.stack.payments,
        analytics: result.object.stack.analytics,
        email: result.object.stack.email,
        monitoring: result.object.stack.monitoring,
        reasoning: result.object.reasoning,
        alternatives: result.object.alternatives,
        migrationPaths: result.object.migrationPaths,
        estimatedCosts: result.object.estimatedCosts,
      };
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      // Fallback to default recommendations
      return this.getDefaultRecommendations(projectAnalysis);
    }
  }

  private buildRecommendationPrompt(
    conversationSummary: string,
    analysis: ProjectAnalysis,
    context: ConversationContext
  ): string {
    return `You are a senior SaaS architect generating technology stack recommendations based on a conversation with a user.

CONVERSATION SUMMARY:
${conversationSummary}

PROJECT ANALYSIS:
- Complexity: ${analysis.complexity}
- Scaling needs: ${analysis.scalingNeeds}
- Time constraints: ${analysis.timeConstraints}
- Budget constraints: ${analysis.budgetConstraints}
- Technical expertise: ${analysis.technicalExpertise}
- Business model: ${analysis.businessModel}

CONTEXT:
${JSON.stringify(context, null, 2)}

Based on this information, generate a complete technology stack recommendation. Consider:

1. **Time-to-market vs Perfect Architecture**: For tight timelines, prioritize services that reduce development time
2. **Vendor Lock-in Concerns**: If mentioned, suggest alternatives with migration paths
3. **Budget Constraints**: For minimal budgets, prioritize free tiers and open-source options
4. **Technical Expertise**: Match complexity to user's skill level
5. **Scaling Requirements**: Choose technologies that match expected growth

TECHNOLOGY OPTIONS:
- Framework: Next.js (best for React devs, great ecosystem), Remix (modern, web standards), SvelteKit (simple, fast)
- Auth: Clerk (best B2B/orgs), Supabase Auth (simple, integrated), NextAuth (flexible, self-hosted), None (custom)
- Database: Supabase (PostgreSQL + real-time), PlanetScale (MySQL, serverless), Neon (PostgreSQL, serverless), None (static)
- Hosting: Vercel (Next.js optimized), Netlify (JAMstack), Railway (full-stack), Render (simple deployment)
- Payments: Stripe (most features), Paddle (EU-friendly), None (no monetization yet)
- Analytics: PostHog (product analytics), Plausible (privacy-focused), GA4 (free, comprehensive), None
- Email: Resend (best DX), Postmark (reliable), SendGrid (enterprise), None
- Monitoring: Sentry (error tracking), Bugsnag (alternative), None

For each choice, provide:
- Clear reasoning based on the user's specific context
- Alternative options they could consider
- Migration paths if they're concerned about lock-in
- Realistic cost estimates for their scale

Be practical and honest about trade-offs. Focus on getting them to market quickly while addressing their specific concerns.`;
  }

  private getDefaultRecommendations(analysis: ProjectAnalysis): TechStackRecommendations {
    // Fallback recommendations based on project analysis
    const isSimple = analysis.complexity === 'simple';
    const isTightTimeline = analysis.timeConstraints === 'tight';
    const isMinimalBudget = analysis.budgetConstraints === 'minimal';
    const isBeginner = analysis.technicalExpertise === 'beginner';

    return {
      framework: 'nextjs',
      authentication: isBeginner || isSimple ? 'clerk' : 'nextauth',
      database: isMinimalBudget ? 'supabase' : 'supabase',
      hosting: 'vercel',
      payments: isTightTimeline ? 'none' : 'stripe',
      analytics: isMinimalBudget ? 'plausible' : 'posthog',
      email: 'resend',
      monitoring: isMinimalBudget ? 'none' : 'sentry',
      reasoning: {
        framework: 'Next.js chosen for its excellent developer experience and ecosystem',
        authentication: isBeginner ? 'Clerk for easy setup and B2B features' : 'NextAuth for flexibility',
        database: 'Supabase for PostgreSQL with real-time features',
        hosting: 'Vercel for seamless Next.js deployment',
        payments: isTightTimeline ? 'Payments deferred for faster launch' : 'Stripe for comprehensive payment processing',
        analytics: isMinimalBudget ? 'Plausible for privacy-focused analytics' : 'PostHog for product analytics',
        email: 'Resend for excellent developer experience',
        monitoring: isMinimalBudget ? 'Basic logging for now' : 'Sentry for error tracking',
      },
      alternatives: {
        framework: ['remix', 'sveltekit'],
        authentication: ['supabase-auth', 'nextauth'],
        database: ['planetscale', 'neon'],
        hosting: ['netlify', 'railway'],
        payments: ['paddle'],
        analytics: ['ga4', 'plausible'],
        email: ['postmark', 'sendgrid'],
        monitoring: ['bugsnag'],
      },
      migrationPaths: {
        clerk: 'Can migrate to Auth0 or custom solution when you have 50k+ users',
        supabase: 'Can migrate to self-hosted PostgreSQL when needed',
        vercel: 'Can deploy anywhere that supports Node.js',
        stripe: 'Payment processors are generally interchangeable',
      },
      estimatedCosts: {
        monthly: '$0-25 for first 1000 users',
        breakdown: {
          'Vercel': '$0 (hobby plan)',
          'Supabase': '$0-25 (free tier then $25/month)',
          'Clerk': '$0-25 (free tier then $25/month)',
          'Stripe': '2.9% + 30¢ per transaction',
          'Other services': '$0-10/month',
        },
      },
    };
  }

  async explainRecommendation(
    technology: string,
    choice: string,
    context: ConversationContext
  ): Promise<string> {
    const prompt = `Explain why ${choice} is recommended for ${technology} given this context:
    
${JSON.stringify(context, null, 2)}

Provide a brief, practical explanation focusing on:
1. Why this choice fits their specific needs
2. Key benefits for their use case
3. Any trade-offs they should be aware of
4. Migration path if they outgrow it

Keep it conversational and honest, like advice from an experienced developer.`;

    try {
      const result = await generateObject({
        model: openai('gpt-4-turbo'),
        schema: z.object({
          explanation: z.string(),
        }),
        prompt,
        temperature: 0.7,
      });

      return result.object.explanation;
    } catch (error) {
      console.error('Failed to generate explanation:', error);
      return `${choice} is a solid choice for ${technology} that balances ease of use with functionality.`;
    }
  }
}