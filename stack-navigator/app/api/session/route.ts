import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session-manager';

// Create a new session
export async function POST(req: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = req.ip || 
                    req.headers.get('x-forwarded-for')?.split(',')[0] || 
                    req.headers.get('x-real-ip') || 
                    'unknown';

    const session = SessionManager.createSession(clientIp);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session creation failed. Rate limit exceeded or system at capacity.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json({
      sessionId: session.id,
      conversationState: session.conversationState,
    });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

// Get session data
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const session = SessionManager.getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      conversationState: session.conversationState,
      email: session.email,
      projectName: session.projectName,
    });
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}

// Update session data
export async function PUT(req: NextRequest) {
  try {
    const { sessionId, conversationState, email, projectName } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (conversationState) updates.conversationState = conversationState;
    if (email) updates.email = email;
    if (projectName) updates.projectName = projectName;

    const session = SessionManager.updateSession(sessionId, updates);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      conversationState: session.conversationState,
      email: session.email,
      projectName: session.projectName,
    });
  } catch (error) {
    console.error('Session update error:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

// Delete session
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const deleted = SessionManager.deleteSession(sessionId);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}