import { NextRequest, NextResponse } from 'next/server';
import { ConversationManager } from '@/lib/conversation-manager';
import { RecommendationEngine } from '@/lib/recommendation-engine';
import { ChatMessage } from '@/lib/types/conversation';
import { withUsageTracking, getUserFromRequest } from '@/lib/usage-middleware';

async function handleRecommendations(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Get user ID from verified request (set by usage middleware)
    const userId = req.headers.get('x-verified-user-id');

    // Initialize conversation manager and add messages
    const conversationManager = new ConversationManager();
    messages.forEach((msg: ChatMessage) => {
      conversationManager.addMessage(msg);
    });

    // Check if we have enough context for recommendations
    if (!conversationManager.shouldGenerateRecommendations()) {
      return NextResponse.json(
        { 
          error: 'Insufficient context for recommendations',
          suggestion: 'Continue the conversation to gather more project details'
        },
        { status: 400 }
      );
    }

    // Analyze the project and generate recommendations
    const projectAnalysis = conversationManager.analyzeProject();
    const conversationSummary = conversationManager.getConversationSummary();
    const context = conversationManager.getContext();

    const recommendationEngine = new RecommendationEngine();
    const recommendations = await recommendationEngine.generateRecommendations(
      conversationSummary,
      projectAnalysis,
      context
    );

    return NextResponse.json({
      recommendations,
      projectAnalysis,
      conversationSummary,
      userId // Include for frontend usage tracking
    });
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

// Wrap the handler with usage tracking for stack generation
export const POST = withUsageTracking(handleRecommendations, {
  action: 'stack_generation',
  requireAuth: true
});