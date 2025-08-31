import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export async function POST(request: NextRequest) {
  try {
    const { conversationId, message, messages } = await request.json()

    // Create server-side Supabase client
    const supabase = createServerSupabaseClient()

    // Get conversation context
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (conversationError || !conversation) {
      return new Response('Conversation not found', { status: 404 })
    }

    // Save user message
    const { error: userMessageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
        sequence_number: messages.length + 1
      })

    if (userMessageError) {
      console.error('Error saving user message:', userMessageError)
      return new Response('Failed to save message', { status: 500 })
    }

    // Prepare system prompt based on conversation phase
    const getSystemPrompt = (phase: string) => {
      const basePrompt = `You are a senior SaaS architect with 10+ years of experience helping founders build successful products. You've seen hundreds of tech stacks succeed and fail.

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
- Team dynamics and technical debt`

      switch (phase) {
        case 'discovery':
          return `${basePrompt}

Current phase: Discovery - Help the user understand their project needs and constraints.
Ask clarifying questions about their project type, team size, timeline, and technical background.
Keep questions conversational and explain why you're asking.`

        case 'requirements':
          return `${basePrompt}

Current phase: Requirements gathering - Help clarify specific technical requirements.
Focus on understanding their scaling needs, integration requirements, and constraints.`

        case 'recommendation':
          return `${basePrompt}

Current phase: Making recommendations - Provide specific technology recommendations.
Explain your reasoning and address potential concerns proactively.`

        case 'refinement':
          return `${basePrompt}

Current phase: Refinement - Help the user refine their stack choices.
Address concerns, suggest alternatives, and explain migration paths.`

        default:
          return basePrompt
      }
    }

    // Prepare conversation history
    const conversationHistory = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }))

    // Add current user message
    conversationHistory.push({
      role: 'user',
      content: message
    })

    // Stream AI response
    const result = streamText({
      model: openai('gpt-4-turbo-preview'),
      system: getSystemPrompt(conversation.phase),
      messages: conversationHistory,
      temperature: 0.7,
    })

    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = ''
        const startTime = Date.now()

        try {
          for await (const delta of result.textStream) {
            fullResponse += delta
            
            // Send chunk to client
            const chunk = `data: ${JSON.stringify({ content: delta })}\n\n`
            controller.enqueue(new TextEncoder().encode(chunk))
          }

          // Save assistant message to database
          const processingTime = Date.now() - startTime
          
          await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: fullResponse,
              model_used: 'gpt-4-turbo-preview',
              processing_time_ms: processingTime,
              sequence_number: messages.length + 2
            })

          // Update conversation
          await supabase
            .from('conversations')
            .update({
              message_count: messages.length + 2,
              updated_at: new Date().toISOString()
            })
            .eq('id', conversationId)

          // Send completion signal
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()

        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Error in chat stream:', error)
    return new Response('Internal server error', { status: 500 })
  }
}