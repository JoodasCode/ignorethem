// Real-world cost calculations for Stack Navigator
export class CostCalculator {
    // OpenAI GPT-4 Turbo pricing (as of 2024)
    private static readonly INPUT_COST_PER_1K = 0.01;  // $0.01 per 1K input tokens
    private static readonly OUTPUT_COST_PER_1K = 0.03; // $0.03 per 1K output tokens

    // Typical token usage patterns
    private static readonly SYSTEM_PROMPT_TOKENS = 300;
    private static readonly USER_MESSAGE_TOKENS = 50;   // Average user message
    private static readonly AI_RESPONSE_TOKENS = 150;   // Average AI response
    private static readonly RECOMMENDATION_INPUT_TOKENS = 800;  // Complex analysis
    private static readonly RECOMMENDATION_OUTPUT_TOKENS = 600; // Structured JSON

    static calculateChatCost(userMessages: number, aiResponses: number): number {
        const inputTokens = (userMessages * this.USER_MESSAGE_TOKENS) +
            (aiResponses * this.SYSTEM_PROMPT_TOKENS); // System prompt sent each time
        const outputTokens = aiResponses * this.AI_RESPONSE_TOKENS;

        const inputCost = (inputTokens / 1000) * this.INPUT_COST_PER_1K;
        const outputCost = (outputTokens / 1000) * this.OUTPUT_COST_PER_1K;

        return inputCost + outputCost;
    }

    static calculateRecommendationCost(): number {
        const inputCost = (this.RECOMMENDATION_INPUT_TOKENS / 1000) * this.INPUT_COST_PER_1K;
        const outputCost = (this.RECOMMENDATION_OUTPUT_TOKENS / 1000) * this.OUTPUT_COST_PER_1K;

        return inputCost + outputCost;
    }

    // Calculate cost for different user scenarios
    static getScenarioCosts() {
        return {
            // Minimal user: Quick chat, gets recommendation, downloads
            minimal: {
                description: "3 user messages, 3 AI responses, 1 recommendation",
                chatCost: this.calculateChatCost(3, 3),
                recommendationCost: this.calculateRecommendationCost(),
                get total() { return this.chatCost + this.recommendationCost; }
            },

            // Typical user: Has a conversation, asks follow-ups
            typical: {
                description: "6 user messages, 6 AI responses, 1 recommendation, 2 follow-ups",
                chatCost: this.calculateChatCost(6, 6),
                recommendationCost: this.calculateRecommendationCost(),
                followUpCost: this.calculateChatCost(2, 2),
                get total() { return this.chatCost + this.recommendationCost + this.followUpCost; }
            },

            // Heavy user: Lots of questions, multiple iterations
            heavy: {
                description: "15 user messages, 15 AI responses, 3 recommendations",
                chatCost: this.calculateChatCost(15, 15),
                recommendationCost: this.calculateRecommendationCost() * 3,
                get total() { return this.chatCost + this.recommendationCost; }
            },

            // Abusive user: Hitting limits
            abusive: {
                description: "50 user messages, 50 AI responses, 10 recommendations",
                chatCost: this.calculateChatCost(50, 50),
                recommendationCost: this.calculateRecommendationCost() * 10,
                get total() { return this.chatCost + this.recommendationCost; }
            }
        };
    }

    // Calculate how many users you can serve with a budget
    static calculateUserCapacity(dailyBudget: number, userType: 'minimal' | 'typical' | 'heavy' = 'typical') {
        const scenarios = this.getScenarioCosts();
        const costPerUser = scenarios[userType].total;

        return {
            usersPerDay: Math.floor(dailyBudget / costPerUser),
            costPerUser: costPerUser,
            usersPerMonth: Math.floor((dailyBudget * 30) / costPerUser),
            monthlyBudget: dailyBudget * 30
        };
    }

    // Freemium model calculations
    static getFreemiumModel() {
        const scenarios = this.getScenarioCosts();

        return {
            // Free tier: 1 stack generation per user
            freeTier: {
                costPerUser: scenarios.typical.total,
                description: "1 conversation + 1 stack generation",
                recommendedDailyBudget: scenarios.typical.total * 100, // Support 100 free users/day
            },

            // Paid tier: Unlimited within reason
            paidTier: {
                costPerHeavyUser: scenarios.heavy.total,
                description: "Multiple conversations + stack generations",
                recommendedMonthlyPrice: 9.99, // Charge $9.99/month
                profitMargin: 9.99 - (scenarios.heavy.total * 30), // Assuming 1 heavy session per day
            }
        };
    }
}

// Export cost scenarios for easy reference
export const COST_SCENARIOS = CostCalculator.getScenarioCosts();
export const FREEMIUM_MODEL = CostCalculator.getFreemiumModel();