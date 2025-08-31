// Enhanced abuse protection for anonymous users
export class AbuseProtection {
  private static requestCounts = new Map<string, { count: number; resetTime: number }>();
  private static suspiciousIPs = new Set<string>();
  
  // Rate limiting per IP for API calls
  static checkAPIRateLimit(ip: string): boolean {
    const now = Date.now();
    const limit = this.requestCounts.get(ip);
    const MAX_REQUESTS_PER_MINUTE = 20;
    const WINDOW = 60 * 1000; // 1 minute

    if (!limit || now > limit.resetTime) {
      this.requestCounts.set(ip, { count: 1, resetTime: now + WINDOW });
      return true;
    }

    if (limit.count >= MAX_REQUESTS_PER_MINUTE) {
      this.suspiciousIPs.add(ip);
      return false;
    }

    limit.count++;
    return true;
  }

  // Detect suspicious patterns
  static detectSuspiciousActivity(ip: string, content: string): boolean {
    // Check for repeated identical messages
    if (content.length < 10) return true; // Too short
    
    // Check for common spam patterns
    const spamPatterns = [
      /(.)\1{10,}/, // Repeated characters
      /https?:\/\/[^\s]+/gi, // URLs
      /\b(buy|sell|cheap|free|click|download)\b/gi, // Spam keywords
    ];

    return spamPatterns.some(pattern => pattern.test(content));
  }

  // Get cost estimate for session
  static estimateSessionCost(messageCount: number): number {
    // More accurate GPT-4 Turbo pricing
    const avgUserTokensPerMessage = 50; // User messages are typically shorter
    const avgAssistantTokensPerMessage = 150; // AI responses are longer
    const systemPromptTokens = 300; // Our system prompt
    
    const inputTokens = (messageCount * avgUserTokensPerMessage) + systemPromptTokens;
    const outputTokens = messageCount * avgAssistantTokensPerMessage;
    
    const inputCost = (inputTokens / 1000) * 0.01; // $0.01 per 1K input tokens
    const outputCost = (outputTokens / 1000) * 0.03; // $0.03 per 1K output tokens
    
    return inputCost + outputCost;
  }

  // Estimate cost for a complete stack generation
  static estimateStackGenerationCost(): number {
    // Typical journey:
    // - 8 chat messages (4 user, 4 assistant)
    // - 1 recommendation generation (more complex)
    // - 2 follow-up questions
    
    const chatCost = this.estimateSessionCost(8);
    
    // Recommendation generation uses more tokens (structured output)
    const recommendationInputTokens = 800; // Conversation summary + prompts
    const recommendationOutputTokens = 600; // Structured JSON response
    const recommendationCost = (recommendationInputTokens / 1000) * 0.01 + 
                              (recommendationOutputTokens / 1000) * 0.03;
    
    const followUpCost = this.estimateSessionCost(4);
    
    return chatCost + recommendationCost + followUpCost;
  }

  // Check if IP should be blocked
  static isBlocked(ip: string): boolean {
    return this.suspiciousIPs.has(ip);
  }
}