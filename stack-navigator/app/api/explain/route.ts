import { NextRequest, NextResponse } from 'next/server';
import { RecommendationEngine } from '@/lib/recommendation-engine';
import { ConversationContext } from '@/lib/types/conversation';

export async function POST(req: NextRequest) {
  try {
    const { technology, choice, context } = await req.json();

    if (!technology || !choice) {
      return NextResponse.json(
        { error: 'Technology and choice parameters are required' },
        { status: 400 }
      );
    }

    const recommendationEngine = new RecommendationEngine();
    const explanation = await recommendationEngine.explainRecommendation(
      technology,
      choice,
      context as ConversationContext
    );

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('Explain API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    );
  }
}