import { ChatMessage, ConversationContext, ProjectAnalysis, TechStackRecommendations } from './types/conversation';

export class ConversationManager {
  private messages: ChatMessage[] = [];
  private context: ConversationContext = {};

  addMessage(message: ChatMessage) {
    this.messages.push(message);
    this.updateContext(message);
  }

  getMessages(): ChatMessage[] {
    return this.messages;
  }

  getContext(): ConversationContext {
    return this.context;
  }

  private updateContext(message: ChatMessage) {
    if (message.role === 'user') {
      this.extractContextFromUserMessage(message.content);
    }
  }

  private extractContextFromUserMessage(content: string) {
    const lowerContent = content.toLowerCase();

    // Extract project type
    if (lowerContent.includes('saas') || lowerContent.includes('software as a service')) {
      this.context.projectType = 'saas';
    } else if (lowerContent.includes('e-commerce') || lowerContent.includes('ecommerce') || lowerContent.includes('store')) {
      this.context.projectType = 'ecommerce';
    } else if (lowerContent.includes('marketplace')) {
      this.context.projectType = 'marketplace';
    } else if (lowerContent.includes('blog') || lowerContent.includes('content')) {
      this.context.projectType = 'content';
    }

    // Extract team size
    if (lowerContent.includes('solo') || lowerContent.includes('alone') || lowerContent.includes('just me')) {
      this.context.teamSize = 'solo';
    } else if (lowerContent.includes('small team') || lowerContent.includes('2-5')) {
      this.context.teamSize = 'small';
    } else if (lowerContent.includes('large team') || lowerContent.includes('10+')) {
      this.context.teamSize = 'large';
    }

    // Extract timeline
    if (lowerContent.includes('asap') || lowerContent.includes('quickly') || lowerContent.includes('fast') || lowerContent.includes('urgent')) {
      this.context.timeline = 'urgent';
    } else if (lowerContent.includes('few months') || lowerContent.includes('moderate')) {
      this.context.timeline = 'moderate';
    } else if (lowerContent.includes('no rush') || lowerContent.includes('flexible')) {
      this.context.timeline = 'flexible';
    }

    // Extract technical background
    if (lowerContent.includes('beginner') || lowerContent.includes('new to') || lowerContent.includes('learning')) {
      this.context.technicalBackground = 'beginner';
    } else if (lowerContent.includes('experienced') || lowerContent.includes('senior') || lowerContent.includes('years of')) {
      this.context.technicalBackground = 'experienced';
    }

    // Extract specific requirements
    if (!this.context.specificRequirements) {
      this.context.specificRequirements = [];
    }

    if (lowerContent.includes('authentication') || lowerContent.includes('login') || lowerContent.includes('user accounts')) {
      this.context.specificRequirements.push('authentication');
    }
    if (lowerContent.includes('payment') || lowerContent.includes('subscription') || lowerContent.includes('billing')) {
      this.context.specificRequirements.push('payments');
    }
    if (lowerContent.includes('real-time') || lowerContent.includes('live') || lowerContent.includes('websocket')) {
      this.context.specificRequirements.push('realtime');
    }
    if (lowerContent.includes('analytics') || lowerContent.includes('tracking') || lowerContent.includes('metrics')) {
      this.context.specificRequirements.push('analytics');
    }

    // Extract concerns
    if (!this.context.concerns) {
      this.context.concerns = [];
    }

    if (lowerContent.includes('vendor lock-in') || lowerContent.includes('lock in') || lowerContent.includes('locked in')) {
      this.context.concerns.push('vendor-lock-in');
    }
    if (lowerContent.includes('cost') || lowerContent.includes('expensive') || lowerContent.includes('budget')) {
      this.context.concerns.push('cost');
    }
    if (lowerContent.includes('complex') || lowerContent.includes('complicated') || lowerContent.includes('difficult')) {
      this.context.concerns.push('complexity');
    }
    if (lowerContent.includes('scale') || lowerContent.includes('scaling') || lowerContent.includes('growth')) {
      this.context.concerns.push('scalability');
    }
  }

  analyzeProject(): ProjectAnalysis {
    const context = this.context;
    
    // Determine complexity
    let complexity: ProjectAnalysis['complexity'] = 'simple';
    if (context.specificRequirements?.length && context.specificRequirements.length > 3) {
      complexity = 'complex';
    } else if (context.specificRequirements?.length && context.specificRequirements.length > 1) {
      complexity = 'moderate';
    }

    // Determine scaling needs
    let scalingNeeds: ProjectAnalysis['scalingNeeds'] = 'minimal';
    if (context.concerns?.includes('scalability') || context.teamSize === 'large') {
      scalingNeeds = 'high';
    } else if (context.projectType === 'saas' || context.projectType === 'marketplace') {
      scalingNeeds = 'moderate';
    }

    // Determine time constraints
    let timeConstraints: ProjectAnalysis['timeConstraints'] = 'moderate';
    if (context.timeline === 'urgent') {
      timeConstraints = 'tight';
    } else if (context.timeline === 'flexible') {
      timeConstraints = 'flexible';
    }

    // Determine budget constraints
    let budgetConstraints: ProjectAnalysis['budgetConstraints'] = 'moderate';
    if (context.concerns?.includes('cost')) {
      budgetConstraints = 'minimal';
    } else if (context.teamSize === 'large') {
      budgetConstraints = 'flexible';
    }

    // Determine technical expertise
    let technicalExpertise: ProjectAnalysis['technicalExpertise'] = 'intermediate';
    if (context.technicalBackground === 'beginner') {
      technicalExpertise = 'beginner';
    } else if (context.technicalBackground === 'experienced') {
      technicalExpertise = 'advanced';
    }

    // Determine business model
    let businessModel: ProjectAnalysis['businessModel'] = 'other';
    if (context.projectType === 'saas') {
      businessModel = 'saas';
    } else if (context.projectType === 'ecommerce') {
      businessModel = 'b2c';
    } else if (context.projectType === 'marketplace') {
      businessModel = 'marketplace';
    }

    return {
      complexity,
      scalingNeeds,
      timeConstraints,
      budgetConstraints,
      technicalExpertise,
      businessModel,
    };
  }

  shouldGenerateRecommendations(): boolean {
    // Check if we have enough context to make recommendations
    const hasProjectType = !!this.context.projectType;
    const hasTeamInfo = !!this.context.teamSize;
    const hasTimeline = !!this.context.timeline;
    const hasRequirements = this.context.specificRequirements && this.context.specificRequirements.length > 0;

    return hasProjectType && (hasTeamInfo || hasTimeline || !!hasRequirements);
  }

  getConversationSummary(): string {
    const context = this.context;
    const parts = [];

    if (context.projectType) {
      parts.push(`Project type: ${context.projectType}`);
    }
    if (context.teamSize) {
      parts.push(`Team size: ${context.teamSize}`);
    }
    if (context.timeline) {
      parts.push(`Timeline: ${context.timeline}`);
    }
    if (context.technicalBackground) {
      parts.push(`Technical background: ${context.technicalBackground}`);
    }
    if (context.specificRequirements && context.specificRequirements.length > 0) {
      parts.push(`Requirements: ${context.specificRequirements.join(', ')}`);
    }
    if (context.concerns && context.concerns.length > 0) {
      parts.push(`Concerns: ${context.concerns.join(', ')}`);
    }

    return parts.join('; ');
  }
}