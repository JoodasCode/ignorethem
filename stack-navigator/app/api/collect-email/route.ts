import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session-manager';
import { z } from 'zod';

const EmailCollectionSchema = z.object({
  sessionId: z.string(),
  email: z.string().email(),
  projectName: z.string().optional(),
  subscribeToUpdates: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = EmailCollectionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input',
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    const { sessionId, email, projectName, subscribeToUpdates } = validation.data;

    // Update session with email information
    const session = SessionManager.collectEmail(sessionId, email, projectName);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Here you would typically:
    // 1. Save to database for future communications
    // 2. Add to email marketing list if subscribeToUpdates is true
    // 3. Send welcome email with setup instructions
    // 4. Track analytics event

    // For now, we'll just log the collection
    console.log('Email collected:', {
      sessionId,
      email,
      projectName,
      subscribeToUpdates,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Email collected successfully',
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Email collection error:', error);
    return NextResponse.json(
      { error: 'Failed to collect email' },
      { status: 500 }
    );
  }
}