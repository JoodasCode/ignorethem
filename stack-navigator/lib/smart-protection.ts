// Smart protection for authenticated users - prevents abuse while maintaining good UX
export class SmartProtection {
  private static ipRegistrations = new Map<string, { count: number; resetTime: number }>();
  private static suspiciousEmails = new Set<string>();
  
  // Rate limit account creation per IP
  static canCreateAccount(ip: string): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    let ipData = this.ipRegistrations.get(ip);
    
    // Reset daily limits
    if (!ipData || now > ipData.resetTime) {
      ipData = {
        count: 0,
        resetTime: now + dayInMs
      };
      this.ipRegistrations.set(ip, ipData);
    }
    
    // Allow up to 5 account creations per IP per day (reasonable for families/offices/coworking)
    if (ipData.count >= 5) {
      return {
        allowed: false,
        reason: 'Too many accounts created from this location today. Please try again tomorrow or contact support.'
      };
    }
    
    return { allowed: true };
  }
  
  static trackAccountCreation(ip: string): void {
    const ipData = this.ipRegistrations.get(ip);
    if (ipData) {
      ipData.count++;
    }
  }
  
  // Email validation for account creation
  static isValidEmail(email: string): { valid: boolean; reason?: string } {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return {
        valid: false,
        reason: 'Please enter a valid email address.'
      };
    }
    
    // Check for obviously fake emails
    const fakePatterns = [
      /^test@/,
      /^fake@/,
      /^spam@/,
      /^temp@/,
      /^throwaway@/,
      /^noreply@/,
      /@test\./,
      /@fake\./,
      /@example\./,
      /@temp\./,
      /@localhost/,
      /@127\.0\.0\.1/
    ];
    
    if (fakePatterns.some(pattern => pattern.test(normalizedEmail))) {
      return {
        valid: false,
        reason: 'Please use a real email address to create your account.'
      };
    }
    
    // Check against known temporary email domains
    if (!this.isValidEmailDomain(normalizedEmail)) {
      return {
        valid: false,
        reason: 'Temporary email addresses are not allowed. Please use a permanent email address.'
      };
    }
    
    // Check if email is flagged as suspicious
    if (this.suspiciousEmails.has(normalizedEmail)) {
      return {
        valid: false,
        reason: 'This email address has been flagged. Please contact support if you believe this is an error.'
      };
    }
    
    return { valid: true };
  }
  
  // Flag suspicious email for future blocking
  static flagSuspiciousEmail(email: string, reason: string): void {
    const normalizedEmail = email.toLowerCase().trim();
    this.suspiciousEmails.add(normalizedEmail);
    console.warn(`Flagged suspicious email: ${normalizedEmail} - Reason: ${reason}`);
  }
  
  // Validate email domain (basic check)
  static isValidEmailDomain(email: string): boolean {
    const domain = email.split('@')[1];
    if (!domain) return false;
    
    // Block common temporary email domains
    const tempDomains = [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
      'mailinator.com',
      'throwaway.email',
      'temp-mail.org',
      'yopmail.com',
      'sharklasers.com',
      'guerrillamailblock.com',
      'pokemail.net',
      'spam4.me',
      'bccto.me',
      'chacuo.net',
      'dispostable.com',
      'emailondeck.com'
    ];
    
    return !tempDomains.includes(domain.toLowerCase());
  }
  
  // Rate limiting for API endpoints
  static canMakeRequest(userId: string, endpoint: string, windowMs: number = 60000, maxRequests: number = 10): { 
    allowed: boolean; 
    reason?: string;
    retryAfter?: number;
  } {
    const key = `${userId}:${endpoint}`;
    const now = Date.now();
    
    // This would typically use Redis in production, but for now using in-memory
    // In production, implement proper rate limiting with Redis or similar
    
    return { allowed: true }; // Simplified for now
  }
  
  // Generate secure download token for authenticated users
  static generateDownloadToken(userId: string, projectId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `dl_${timestamp}_${random}_${userId.slice(-8)}_${projectId.slice(-8)}`;
  }
  
  // Validate download token (expires after 1 hour for security)
  static isValidDownloadToken(token: string, userId: string): boolean {
    if (!token.startsWith('dl_')) return false;
    
    const parts = token.split('_');
    if (parts.length !== 5) return false;
    
    const timestamp = parseInt(parts[1]);
    const tokenUserId = parts[3];
    const hourInMs = 60 * 60 * 1000;
    
    // Check if token is expired (1 hour)
    if (Date.now() - timestamp > hourInMs) return false;
    
    // Check if token belongs to the requesting user
    return userId.slice(-8) === tokenUserId;
  }
  
  // Content filtering for AI conversations
  static isContentAppropriate(message: string): { appropriate: boolean; reason?: string } {
    const inappropriatePatterns = [
      /hack|exploit|vulnerability|sql injection/i,
      /illegal|piracy|copyright infringement/i,
      /spam|scam|phishing/i,
      /adult content|nsfw|explicit/i
    ];
    
    for (const pattern of inappropriatePatterns) {
      if (pattern.test(message)) {
        return {
          appropriate: false,
          reason: 'Message contains inappropriate content for a technical discussion.'
        };
      }
    }
    
    return { appropriate: true };
  }
}