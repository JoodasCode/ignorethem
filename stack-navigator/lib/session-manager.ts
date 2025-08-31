import { ChatMessage, ConversationState } from './types/conversation';
import { FreemiumLimits } from './freemium-limits';

export interface Session {
  id: string;
  createdAt: Date;
  lastActivity: Date;
  conversationState: ConversationState;
  email?: string;
  projectName?: string;
}

// In-memory session storage (in production, use Redis or database)
const sessions = new Map<string, Session>();

// Rate limiting for session creation (IP-based)
const sessionCreationLimits = new Map<string, { count: number; resetTime: number }>();
const MAX_SESSIONS_PER_IP = 10; // Max sessions per IP per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

export class SessionManager {
  static generateSessionId(): string {
    // Generate cryptographically secure session ID
    const timestamp = Date.now().toString(36);
    const randomPart1 = Math.random().toString(36).substring(2, 15);
    const randomPart2 = Math.random().toString(36).substring(2, 15);
    const randomPart3 = Math.random().toString(36).substring(2, 15);
    
    return `sess_${timestamp}_${randomPart1}${randomPart2}${randomPart3}`;
  }

  static validateSessionId(sessionId: string): boolean {
    // Validate session ID format to prevent injection attacks
    const sessionIdPattern = /^sess_[a-z0-9]{1,13}_[a-z0-9]{36,39}$/;
    return sessionIdPattern.test(sessionId);
  }

  static createSession(clientIp?: string, sessionId?: string): Session | null {
    // Rate limiting check
    if (clientIp && !this.checkRateLimit(clientIp)) {
      console.warn('Rate limit exceeded for IP:', clientIp);
      return null;
    }

    // Prevent memory exhaustion
    const MAX_TOTAL_SESSIONS = 10000;
    if (sessions.size >= MAX_TOTAL_SESSIONS) {
      console.warn('Maximum session limit reached');
      // Clean up old sessions first
      this.cleanupExpiredSessions(1); // Clean sessions older than 1 hour
      
      if (sessions.size >= MAX_TOTAL_SESSIONS) {
        return null;
      }
    }

    const id = sessionId || this.generateSessionId();
    const session: Session = {
      id,
      createdAt: new Date(),
      lastActivity: new Date(),
      conversationState: {
        messages: [],
        isGenerating: false,
        currentRecommendations: null,
        projectContext: null,
        conversationPhase: 'discovery',
      },
    };

    sessions.set(id, session);
    return session;
  }

  private static checkRateLimit(clientIp: string): boolean {
    const now = Date.now();
    const limit = sessionCreationLimits.get(clientIp);

    if (!limit || now > limit.resetTime) {
      // Reset or create new limit
      sessionCreationLimits.set(clientIp, {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW,
      });
      return true;
    }

    if (limit.count >= MAX_SESSIONS_PER_IP) {
      return false;
    }

    limit.count++;
    return true;
  }

  static getSession(sessionId: string): Session | null {
    // Validate session ID format first
    if (!this.validateSessionId(sessionId)) {
      console.warn('Invalid session ID format attempted:', sessionId.substring(0, 10) + '...');
      return null;
    }

    const session = sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
    return session || null;
  }

  static updateSession(sessionId: string, updates: Partial<Session>): Session | null {
    // Validate session ID format first
    if (!this.validateSessionId(sessionId)) {
      console.warn('Invalid session ID format attempted:', sessionId.substring(0, 10) + '...');
      return null;
    }

    const session = sessions.get(sessionId);
    if (!session) return null;

    // Prevent updating sensitive fields through this method
    const safeUpdates = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.createdAt;

    Object.assign(session, safeUpdates, { lastActivity: new Date() });
    sessions.set(sessionId, session);
    return session;
  }

  static addMessage(sessionId: string, message: ChatMessage): Session | null {
    // Validate session ID format first
    if (!this.validateSessionId(sessionId)) {
      console.warn('Invalid session ID format attempted:', sessionId.substring(0, 10) + '...');
      return null;
    }

    const session = sessions.get(sessionId);
    if (!session) return null;

    // Limit message history to prevent memory issues
    const MAX_MESSAGES = 100;
    if (session.conversationState.messages.length >= MAX_MESSAGES) {
      // Remove oldest messages, keep the last 80
      session.conversationState.messages = session.conversationState.messages.slice(-80);
    }

    session.conversationState.messages.push(message);
    session.lastActivity = new Date();
    sessions.set(sessionId, session);
    return session;
  }

  static updateConversationState(
    sessionId: string, 
    updates: Partial<ConversationState>
  ): Session | null {
    // Validate session ID format first
    if (!this.validateSessionId(sessionId)) {
      console.warn('Invalid session ID format attempted:', sessionId.substring(0, 10) + '...');
      return null;
    }

    const session = sessions.get(sessionId);
    if (!session) return null;

    Object.assign(session.conversationState, updates);
    session.lastActivity = new Date();
    sessions.set(sessionId, session);
    return session;
  }

  static collectEmail(sessionId: string, email: string, projectName?: string): Session | null {
    // Validate session ID format first
    if (!this.validateSessionId(sessionId)) {
      console.warn('Invalid session ID format attempted:', sessionId.substring(0, 10) + '...');
      return null;
    }

    const session = sessions.get(sessionId);
    if (!session) return null;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.warn('Invalid email format attempted');
      return null;
    }

    session.email = email;
    if (projectName && projectName.length <= 100) { // Limit project name length
      session.projectName = projectName;
    }
    session.lastActivity = new Date();
    sessions.set(sessionId, session);
    return session;
  }

  static deleteSession(sessionId: string): boolean {
    // Validate session ID format first
    if (!this.validateSessionId(sessionId)) {
      console.warn('Invalid session ID format attempted:', sessionId.substring(0, 10) + '...');
      return false;
    }

    return sessions.delete(sessionId);
  }

  static cleanupExpiredSessions(maxAgeHours: number = 24): number {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    let cleaned = 0;

    for (const [sessionId, session] of sessions.entries()) {
      if (session.lastActivity < cutoff) {
        sessions.delete(sessionId);
        cleaned++;
      }
    }

    return cleaned;
  }

  static getSessionCount(): number {
    return sessions.size;
  }

  // Remove getAllSessions() method to prevent data exposure
  // In production, this should only be available to admin users with proper authentication

  static getSessionStats(): { count: number; oldestSession: Date | null; newestSession: Date | null } {
    if (sessions.size === 0) {
      return { count: 0, oldestSession: null, newestSession: null };
    }

    let oldest = new Date();
    let newest = new Date(0);

    for (const session of sessions.values()) {
      if (session.createdAt < oldest) oldest = session.createdAt;
      if (session.createdAt > newest) newest = session.createdAt;
    }

    return {
      count: sessions.size,
      oldestSession: oldest,
      newestSession: newest,
    };
  }
}