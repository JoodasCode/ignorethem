// Content filtering for user inputs
export class ContentFilter {
  private static bannedKeywords = [
    // Add keywords you want to filter
    'jailbreak', 'ignore previous', 'system prompt', 'pretend you are',
    // Add other inappropriate content patterns
  ];

  private static suspiciousPatterns = [
    /ignore.{0,20}(previous|above|system)/i,
    /pretend.{0,20}you.{0,20}are/i,
    /act.{0,20}as.{0,20}(if|though)/i,
    /forget.{0,20}(everything|instructions)/i,
  ];

  static filterMessage(content: string): { allowed: boolean; reason?: string } {
    // Check length
    if (content.length > 4000) {
      return { allowed: false, reason: 'Message too long' };
    }

    // Check for banned keywords
    const lowerContent = content.toLowerCase();
    for (const keyword of this.bannedKeywords) {
      if (lowerContent.includes(keyword)) {
        return { allowed: false, reason: 'Inappropriate content detected' };
      }
    }

    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(content)) {
        return { allowed: false, reason: 'Suspicious prompt detected' };
      }
    }

    return { allowed: true };
  }

  // Check if content is related to tech stack discussion
  static isOnTopic(content: string): boolean {
    const techKeywords = [
      'framework', 'database', 'hosting', 'authentication', 'api', 'frontend',
      'backend', 'react', 'next', 'node', 'python', 'javascript', 'typescript',
      'saas', 'startup', 'project', 'app', 'website', 'tech', 'stack',
      'deployment', 'cloud', 'server', 'client'
    ];

    const lowerContent = content.toLowerCase();
    return techKeywords.some(keyword => lowerContent.includes(keyword)) || 
           content.length < 50; // Allow short messages
  }
}