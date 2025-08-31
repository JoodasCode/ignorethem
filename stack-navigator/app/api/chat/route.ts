import { openai } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages } from 'ai';
import { NextRequest } from 'next/server';
import { AbuseProtection } from '@/lib/abuse-protection';
import { ContentFilter } from '@/lib/content-filter';
import { CostMonitor } from '@/lib/cost-monitor';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { messages, conversationContext } = await req.json();

    // Get client IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                    req.headers.get('x-real-ip') || 
                    'unknown';

    // Check if IP is blocked
    if (AbuseProtection.isBlocked(clientIp)) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Rate limiting
    if (!AbuseProtection.checkAPIRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait before sending more messages.' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Input validation
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Limit message count to prevent abuse
    if (messages.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Too many messages' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Content filtering on the latest user message
    const latestMessage = messages[messages.length - 1];
    if (latestMessage?.role === 'user') {
      const filterResult = ContentFilter.filterMessage(latestMessage.content);
      if (!filterResult.allowed) {
        return new Response(
          JSON.stringify({ error: filterResult.reason || 'Message not allowed' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Check for suspicious activity
      if (AbuseProtection.detectSuspiciousActivity(clientIp, latestMessage.content)) {
        return new Response(
          JSON.stringify({ error: 'Suspicious activity detected' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Check if message is on-topic (optional - you might want to be more lenient)
      if (!ContentFilter.isOnTopic(latestMessage.content)) {
        return new Response(
          JSON.stringify({ error: 'Please keep the conversation focused on technology stack recommendations' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Cost monitoring
    const estimatedCost = AbuseProtection.estimateSessionCost(messages.length);
    if (!CostMonitor.trackRequest(estimatedCost)) {
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable. Please try again later.' }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Sanitize messages
    const sanitizedMessages = messages.map(msg => ({
      ...msg,
      content: typeof msg.content === 'string' ? msg.content.slice(0, 4000) : '', // Limit message length
    }));

    // System prompt for SaaS architecture expertise
    const systemPrompt = `You are a senior SaaS architect with 10+ years of experience helping founders build successful products. You've seen hundreds of tech stacks succeed and fail.

Your personality:
- Direct and practical, not academic
- Focus on shipping and validation over perfect architecture
- Acknowledge trade-offs honestly
- Share real-world experience and war stories
- Help users think through concerns, don't just dismiss them

Your expertise:
- Modern SaaS architecture patterns
- Vendor lock-in vs time-to-market trade-offs
- Scaling challenges and migration paths
- Cost optimization strategies
- Team dynamics and technical debt

Conversation style:
- Ask clarifying questions to understand the real problem
- Provide specific, actionable recommendations
- Explain the "why" behind each choice
- Address concerns with concrete migration strategies
- Share relevant examples from similar companies

Current conversation context: ${conversationContext ? JSON.stringify(conversationContext) : 'New conversation'}

Respond naturally and helpfully. If they seem ready for recommendations, suggest generating their stack.`;

    const result = await streamText({
      model: openai('gpt-4-turbo'),
      system: systemPrompt,
      messages: convertToCoreMessages(sanitizedMessages),
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}