// Cost monitoring and alerts
export class CostMonitor {
  private static dailyCost = 0;
  private static dailyRequests = 0;
  private static lastReset = new Date().toDateString();

  // Cost limits
  private static readonly DAILY_COST_LIMIT = 50; // $50 per day
  private static readonly HOURLY_REQUEST_LIMIT = 1000;
  
  static trackRequest(estimatedCost: number): boolean {
    const today = new Date().toDateString();
    
    // Reset daily counters
    if (today !== this.lastReset) {
      this.dailyCost = 0;
      this.dailyRequests = 0;
      this.lastReset = today;
    }

    // Check limits
    if (this.dailyCost + estimatedCost > this.DAILY_COST_LIMIT) {
      console.error('Daily cost limit exceeded!');
      return false;
    }

    // Track the request
    this.dailyCost += estimatedCost;
    this.dailyRequests++;

    // Alert at 80% of limit
    if (this.dailyCost > this.DAILY_COST_LIMIT * 0.8) {
      console.warn(`Cost alert: $${this.dailyCost.toFixed(2)} of $${this.DAILY_COST_LIMIT} daily limit used`);
    }

    return true;
  }

  static getStats() {
    return {
      dailyCost: this.dailyCost,
      dailyRequests: this.dailyRequests,
      costLimit: this.DAILY_COST_LIMIT,
      utilizationPercent: (this.dailyCost / this.DAILY_COST_LIMIT) * 100
    };
  }
}