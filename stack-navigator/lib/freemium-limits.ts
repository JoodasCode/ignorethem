// User subscription tiers for authenticated users
export type UserTier = 'free' | 'starter' | 'pro';

export interface UserSubscription {
  userId: string;
  tier: UserTier;
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserUsage {
  userId: string;
  stackGenerationsUsed: number;
  conversationsSaved: number;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  lastResetAt: Date;
}

// Freemium tier limits for authenticated users
export class FreemiumLimits {
  // Free tier limits - FINALIZED STRATEGY
  private static readonly FREE_TIER_LIMITS = {
    MAX_STACK_GENERATIONS_LIFETIME: 1,  // 1 stack generation total (lifetime)
    MAX_MESSAGES_PER_CONVERSATION: 20,  // 20 messages per conversation
    MAX_SAVED_CONVERSATIONS: 1,         // Can save 1 conversation
    BROWSE_TEMPLATES_ONLY: true,        // View-only access to templates
    COMPARE_STACKS: 0,                  // No stack comparison
  };

  private static readonly STARTER_TIER_LIMITS = {
    MAX_STACK_GENERATIONS_MONTHLY: 5,   // 5 stack generations per month
    MAX_MESSAGES_PER_CONVERSATION: -1,  // Unlimited messages
    MAX_SAVED_CONVERSATIONS: -1,        // Unlimited conversations
    MAX_STACK_COMPARISONS: 3,           // Compare up to 3 stacks
    ADVANCED_TEMPLATES: true,           // Access to advanced templates
    PRIORITY_SUPPORT: false,            // Standard support
  };

  private static readonly PRO_TIER_LIMITS = {
    MAX_STACK_GENERATIONS_MONTHLY: -1,  // Unlimited stack generations
    MAX_MESSAGES_PER_CONVERSATION: -1,  // Unlimited messages
    MAX_SAVED_CONVERSATIONS: -1,        // Unlimited conversations
    MAX_STACK_COMPARISONS: -1,          // Unlimited comparisons
    MAX_TEAM_MEMBERS: 3,                // 3 team members
    API_ACCESS: true,                   // API access enabled
    CUSTOM_REQUIREMENTS: true,          // Custom constraints
    PRIORITY_SUPPORT: true,             // Priority support
    WHITE_LABEL: true,                  // White-label options
  };

  // Check if user can send messages in a conversation
  static canSendMessage(userTier: UserTier, conversationMessageCount: number): { 
    allowed: boolean; 
    reason?: string; 
    remainingMessages?: number 
  } {
    const limits = this.getTierLimits(userTier);
    
    // Starter and Pro tiers have unlimited messages
    if (limits.MAX_MESSAGES_PER_CONVERSATION === -1) {
      return { allowed: true };
    }

    // Free tier has 20 message limit per conversation
    if (conversationMessageCount >= limits.MAX_MESSAGES_PER_CONVERSATION) {
      return { 
        allowed: false, 
        reason: 'You\'ve reached the 20 message limit for this conversation. Upgrade to Starter for unlimited messages!',
        remainingMessages: 0
      };
    }

    const remaining = limits.MAX_MESSAGES_PER_CONVERSATION - conversationMessageCount;
    return { 
      allowed: true, 
      remainingMessages: remaining 
    };
  }

  // Check if user can generate a stack recommendation
  static canGenerateStack(userTier: UserTier, usage: UserUsage): { 
    allowed: boolean; 
    reason?: string;
    upgradeRequired?: boolean;
  } {
    const limits = this.getTierLimits(userTier);
    
    if (userTier === 'free') {
      // Free tier: 1 stack generation lifetime
      if (usage.stackGenerationsUsed >= limits.MAX_STACK_GENERATIONS_LIFETIME) {
        return { 
          allowed: false, 
          reason: 'You\'ve used your free stack generation! Upgrade to Starter for 5 stacks per month.',
          upgradeRequired: true
        };
      }
    } else if (userTier === 'starter') {
      // Starter tier: 5 stacks per month
      if (usage.stackGenerationsUsed >= limits.MAX_STACK_GENERATIONS_MONTHLY) {
        return { 
          allowed: false, 
          reason: 'You\'ve used all 5 stack generations this month. Upgrade to Pro for unlimited generations!',
          upgradeRequired: true
        };
      }
    }
    // Pro tier has unlimited generations

    return { allowed: true };
  }

  // Check if user can save a conversation
  static canSaveConversation(userTier: UserTier, currentSavedCount: number): { 
    allowed: boolean; 
    reason?: string;
    upgradeRequired?: boolean;
  } {
    const limits = this.getTierLimits(userTier);
    
    // Unlimited for Starter and Pro
    if (limits.MAX_SAVED_CONVERSATIONS === -1) {
      return { allowed: true };
    }

    // Free tier: 1 saved conversation
    if (currentSavedCount >= limits.MAX_SAVED_CONVERSATIONS) {
      return { 
        allowed: false, 
        reason: 'You can only save 1 conversation on the free tier. Upgrade to Starter for unlimited saved conversations!',
        upgradeRequired: true
      };
    }

    return { allowed: true };
  }

  // Check if user can compare stacks
  static canCompareStacks(userTier: UserTier, currentComparisons: number): { 
    allowed: boolean; 
    reason?: string;
    upgradeRequired?: boolean;
  } {
    const limits = this.getTierLimits(userTier);
    
    if (userTier === 'free') {
      return { 
        allowed: false, 
        reason: 'Stack comparison is available with Starter tier. Upgrade to compare up to 3 stacks!',
        upgradeRequired: true
      };
    }

    if (limits.MAX_STACK_COMPARISONS !== -1 && currentComparisons >= limits.MAX_STACK_COMPARISONS) {
      return { 
        allowed: false, 
        reason: `You can compare up to ${limits.MAX_STACK_COMPARISONS} stacks with your current plan.`,
        upgradeRequired: userTier === 'starter'
      };
    }

    return { allowed: true };
  }

  // Get tier limits
  static getTierLimits(tier: UserTier) {
    switch (tier) {
      case 'free':
        return this.FREE_TIER_LIMITS;
      case 'starter':
        return this.STARTER_TIER_LIMITS;
      case 'pro':
        return this.PRO_TIER_LIMITS;
      default:
        return this.FREE_TIER_LIMITS;
    }
  }

  // Get tier pricing
  static getTierPricing(tier: UserTier): { monthly: number; yearly?: number } {
    switch (tier) {
      case 'free':
        return { monthly: 0 };
      case 'starter':
        return { monthly: 4.99 };
      case 'pro':
        return { monthly: 14.99 }; // Coming soon
      default:
        return { monthly: 0 };
    }
  }

  // Get upgrade benefits for display
  static getUpgradeBenefits(fromTier: UserTier, toTier: UserTier): string[] {
    if (fromTier === 'free' && toTier === 'starter') {
      return [
        '5 stack generations per month',
        'Unlimited messages per conversation',
        'Save unlimited conversations',
        'Compare up to 3 stacks',
        'Advanced setup guides',
        'Priority templates'
      ];
    }
    
    if (toTier === 'pro') {
      return [
        'Unlimited stack generations',
        'Team collaboration (3 members)',
        'API access for integrations',
        'Custom requirements & constraints',
        'Priority support',
        'White-label options'
      ];
    }

    return [];
  }

  // Reset monthly usage (called by cron job)
  static shouldResetUsage(usage: UserUsage): boolean {
    const now = new Date();
    return now >= usage.currentPeriodEnd;
  }

  // Create new usage period
  static createNewUsagePeriod(userId: string): UserUsage {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    return {
      userId,
      stackGenerationsUsed: 0,
      conversationsSaved: 0,
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
      lastResetAt: now,
    };
  }
}