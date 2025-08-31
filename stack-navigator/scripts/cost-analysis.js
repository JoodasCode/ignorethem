// Run this to see actual cost projections
// Usage: node scripts/cost-analysis.js

class CostCalculator {
  static INPUT_COST_PER_1K = 0.01;  // $0.01 per 1K input tokens
  static OUTPUT_COST_PER_1K = 0.03; // $0.03 per 1K output tokens

  static calculateChatCost(userMessages, aiResponses) {
    const SYSTEM_PROMPT_TOKENS = 300;
    const USER_MESSAGE_TOKENS = 50;
    const AI_RESPONSE_TOKENS = 150;

    const inputTokens = (userMessages * USER_MESSAGE_TOKENS) + 
                       (aiResponses * SYSTEM_PROMPT_TOKENS);
    const outputTokens = aiResponses * AI_RESPONSE_TOKENS;

    const inputCost = (inputTokens / 1000) * this.INPUT_COST_PER_1K;
    const outputCost = (outputTokens / 1000) * this.OUTPUT_COST_PER_1K;

    return inputCost + outputCost;
  }

  static calculateRecommendationCost() {
    const inputCost = (800 / 1000) * this.INPUT_COST_PER_1K;  // 800 input tokens
    const outputCost = (600 / 1000) * this.OUTPUT_COST_PER_1K; // 600 output tokens
    return inputCost + outputCost;
  }
}

console.log("🚀 Stack Navigator - Cost Analysis\n");

// Scenario 1: Quick user (generates 1 stack)
const quickChat = CostCalculator.calculateChatCost(3, 3);
const oneRecommendation = CostCalculator.calculateRecommendationCost();
const quickUserCost = quickChat + oneRecommendation;

console.log("💡 QUICK USER (1 stack generation):");
console.log(`   Chat cost: $${quickChat.toFixed(4)}`);
console.log(`   Recommendation: $${oneRecommendation.toFixed(4)}`);
console.log(`   Total: $${quickUserCost.toFixed(4)}`);
console.log(`   Per 100 users: $${(quickUserCost * 100).toFixed(2)}\n`);

// Scenario 2: Typical user (generates 1-2 stacks)
const typicalChat = CostCalculator.calculateChatCost(6, 6);
const followUp = CostCalculator.calculateChatCost(2, 2);
const typicalUserCost = typicalChat + oneRecommendation + followUp;

console.log("👤 TYPICAL USER (1 stack + follow-ups):");
console.log(`   Chat cost: $${typicalChat.toFixed(4)}`);
console.log(`   Recommendation: $${oneRecommendation.toFixed(4)}`);
console.log(`   Follow-up: $${followUp.toFixed(4)}`);
console.log(`   Total: $${typicalUserCost.toFixed(4)}`);
console.log(`   Per 100 users: $${(typicalUserCost * 100).toFixed(2)}\n`);

// Scenario 3: Power user (generates 3 stacks)
const powerChat = CostCalculator.calculateChatCost(12, 12);
const threeRecommendations = oneRecommendation * 3;
const powerUserCost = powerChat + threeRecommendations;

console.log("⚡ POWER USER (3 stack generations):");
console.log(`   Chat cost: $${powerChat.toFixed(4)}`);
console.log(`   3 Recommendations: $${threeRecommendations.toFixed(4)}`);
console.log(`   Total: $${powerUserCost.toFixed(4)}`);
console.log(`   Per 100 users: $${(powerUserCost * 100).toFixed(2)}\n`);

// Budget calculations
console.log("💰 BUDGET SCENARIOS:");
console.log(`   $10/day budget supports:`);
console.log(`   - ${Math.floor(10 / quickUserCost)} quick users`);
console.log(`   - ${Math.floor(10 / typicalUserCost)} typical users`);
console.log(`   - ${Math.floor(10 / powerUserCost)} power users\n`);

console.log(`   $50/day budget supports:`);
console.log(`   - ${Math.floor(50 / quickUserCost)} quick users`);
console.log(`   - ${Math.floor(50 / typicalUserCost)} typical users`);
console.log(`   - ${Math.floor(50 / powerUserCost)} power users\n`);

// Freemium model
console.log("🎯 FREEMIUM MODEL RECOMMENDATION:");
console.log(`   Free tier: 1 stack generation = $${typicalUserCost.toFixed(4)} per user`);
console.log(`   Cost for 1000 free users/month: $${(typicalUserCost * 1000).toFixed(2)}`);
console.log(`   Suggested paid tier: $4.99/month for unlimited generations`);
console.log(`   Break-even: ${Math.ceil(4.99 / powerUserCost)} power sessions per month`);