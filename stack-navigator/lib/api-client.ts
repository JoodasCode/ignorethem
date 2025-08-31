import {
  ChatRequest,
  ChatResponse,
  RecommendationsRequest,
  RecommendationsResponse,
  ExplainRequest,
  ExplainResponse,
  SessionCreateResponse,
  SessionGetResponse,
  SessionUpdateRequest,
  SessionUpdateResponse,
  EmailCollectionRequest,
  EmailCollectionResponse,
  ApiResponse,
  isApiError,
} from './types/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Request failed', details: data.details };
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return { error: 'Network error occurred' };
    }
  }

  // Session Management
  async createSession(): Promise<ApiResponse<SessionCreateResponse>> {
    const response = await this.request<SessionCreateResponse>('/session', {
      method: 'POST',
    });

    // Handle rate limiting specifically
    if (isApiError(response) && response.error.includes('Rate limit')) {
      console.warn('Session creation rate limited');
    }

    return response;
  }

  async getSession(sessionId: string): Promise<ApiResponse<SessionGetResponse>> {
    return this.request<SessionGetResponse>(`/session?sessionId=${sessionId}`);
  }

  async updateSession(
    data: SessionUpdateRequest
  ): Promise<ApiResponse<SessionUpdateResponse>> {
    return this.request<SessionUpdateResponse>('/session', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSession(sessionId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(`/session?sessionId=${sessionId}`, {
      method: 'DELETE',
    });
  }

  // Chat
  async sendChatMessage(data: ChatRequest): Promise<Response> {
    // Return raw response for streaming
    return fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  // Recommendations
  async getRecommendations(
    data: RecommendationsRequest
  ): Promise<ApiResponse<RecommendationsResponse>> {
    return this.request<RecommendationsResponse>('/recommendations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Explanations
  async explainChoice(data: ExplainRequest): Promise<ApiResponse<ExplainResponse>> {
    return this.request<ExplainResponse>('/explain', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Email Collection
  async collectEmail(
    data: EmailCollectionRequest
  ): Promise<ApiResponse<EmailCollectionResponse>> {
    return this.request<EmailCollectionResponse>('/collect-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };

// Helper functions for handling API responses
export function handleApiResponse<T>(
  response: ApiResponse<T>,
  onSuccess: (data: T) => void,
  onError: (error: string, details?: any) => void
) {
  if (isApiError(response)) {
    onError(response.error, response.details);
  } else {
    onSuccess(response);
  }
}

export async function withErrorHandling<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  onError?: (error: string) => void
): Promise<T | null> {
  const response = await apiCall();
  
  if (isApiError(response)) {
    if (onError) {
      onError(response.error);
    } else {
      console.error('API Error:', response.error);
    }
    return null;
  }
  
  return response;
}