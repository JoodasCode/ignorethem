// Paddle server-side utilities
// Note: Paddle doesn't have an official Node.js SDK yet, so we use fetch

const PADDLE_API_BASE = process.env.PADDLE_ENVIRONMENT === 'production' 
  ? 'https://api.paddle.com' 
  : 'https://sandbox-api.paddle.com'

class PaddleAPI {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.PADDLE_API_KEY!
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${PADDLE_API_BASE}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`Paddle API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Get products
  async getProducts() {
    return this.request('/products')
  }

  // Get prices for a product
  async getPrices(productId?: string) {
    const params = productId ? `?product_id=${productId}` : ''
    return this.request(`/prices${params}`)
  }

  // Get customers
  async getCustomers() {
    return this.request('/customers')
  }

  // Create a customer
  async createCustomer(customerData: {
    name?: string
    email: string
    custom_data?: Record<string, any>
  }) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    })
  }

  // Get subscriptions
  async getSubscriptions(customerId?: string) {
    const params = customerId ? `?customer_id=${customerId}` : ''
    return this.request(`/subscriptions${params}`)
  }

  // Cancel a subscription
  async cancelSubscription(subscriptionId: string, effectiveFrom: 'next_billing_period' | 'immediately' = 'next_billing_period') {
    return this.request(`/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({
        effective_from: effectiveFrom,
      }),
    })
  }

  // Update a subscription
  async updateSubscription(subscriptionId: string, updateData: {
    items?: Array<{
      price_id: string
      quantity?: number
    }>
    proration_billing_mode?: 'prorated_immediately' | 'prorated_next_billing_period' | 'full_immediately' | 'full_next_billing_period'
  }) {
    return this.request(`/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    })
  }

  // Verify webhook signature
  verifyWebhookSignature(body: string, signature: string): boolean {
    // Implement webhook signature verification
    // This is a simplified version - implement proper HMAC verification
    const expectedSignature = process.env.PADDLE_WEBHOOK_SECRET!
    return signature === expectedSignature
  }
}

export const paddle = new PaddleAPI()

export const paddleHelpers = {
  // Create checkout URL
  createCheckoutUrl({
    priceId,
    customerId,
    successUrl,
    customData = {},
  }: {
    priceId: string
    customerId?: string
    successUrl?: string
    customData?: Record<string, any>
  }) {
    const params = new URLSearchParams({
      'items[0][price_id]': priceId,
      'items[0][quantity]': '1',
    })

    if (customerId) {
      params.append('customer_id', customerId)
    }

    if (successUrl) {
      params.append('success_url', successUrl)
    }

    Object.entries(customData).forEach(([key, value]) => {
      params.append(`custom_data[${key}]`, String(value))
    })

    const environment = process.env.PADDLE_ENVIRONMENT === 'production' ? 'buy' : 'sandbox-buy'
    return `https://${environment}.paddle.com/checkout?${params.toString()}`
  },
}