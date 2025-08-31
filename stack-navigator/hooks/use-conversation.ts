import { useState, useEffect, useCallback } from 'react';
import { apiClient, handleApiResponse } from '@/lib/api-client';
import { 
  ConversationState, 
  ChatMessage, 
  TechStackRecommendations,
  ProjectAnalysis 
} from '@/lib/types/conversation';

export interface UseConversationReturn {
  // Chat state
  messages: ChatMessage[];
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  
  // Session management
  sessionId: string | null;
  conversationState: ConversationState;
  
  // Actions
  sendMessage: () => Promise<void>;
  generateRecommendations: () => Promise<void>;
  collectEmail: (email: string, projectName?: string) => Promise<boolean>;
  
  // Recommendations
  recommendations: TechStackRecommendations | null;
  projectAnalysis: ProjectAnalysis | null;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export function useConversation(): UseConversationReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [conversationState, setConversationState] = useState<ConversationState>({
    messages: [],
    isGenerating: false,
    currentRecommendations: null,
    projectContext: null,
    conversationPhase: 'discovery',
  });
  const [recommendations, setRecommendations] = useState<TechStackRecommendations | null>(null);
  const [projectAnalysis, setProjectAnalysis] = useState<ProjectAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
  }, []);


  const initializeSession = async () => {
    const response = await apiClient.createSession();
    handleApiResponse(
      response,
      (data) => {
        setSessionId(data.sessionId);
        setConversationState(data.conversationState);
      },
      (error) => setError(error)
    );
  };

  const updateConversationState = useCallback(
    async (updates: Partial<ConversationState>) => {
      const newState = { ...conversationState, ...updates };
      setConversationState(newState);

      // Sync with backend if we have a session
      if (sessionId) {
        const response = await apiClient.updateSession({
          sessionId,
          conversationState: newState,
        });

        handleApiResponse(
          response,
          () => {}, // Success handled by local state update
          (error) => setError(error)
        );
      }
    },
    [sessionId, conversationState]
  );

  const sendMessage = useCallback(async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    setError(null);

    // Add user message to conversation state
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    const updatedMessages = [...conversationState.messages, userMessage];
    
    updateConversationState({
      messages: updatedMessages,
      isGenerating: true,
    });

    // Clear input
    setInput('');

    try {
      // Send to chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let aiResponse = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        aiResponse += chunk;
      }

      // Add AI response to conversation
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      updateConversationState({
        messages: [...updatedMessages, aiMessage],
        isGenerating: false,
      });

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send message');
      updateConversationState({
        isGenerating: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, conversationState, updateConversationState]);

  const generateRecommendations = async () => {
    if (!sessionId || conversationState.messages.length === 0) {
      setError('No conversation to analyze');
      return;
    }

    setError(null);
    updateConversationState({ isGenerating: true });

    const response = await apiClient.getRecommendations({
      messages: conversationState.messages,
    });

    handleApiResponse(
      response,
      (data) => {
        setRecommendations(data.recommendations);
        setProjectAnalysis(data.projectAnalysis);
        updateConversationState({
          currentRecommendations: data.recommendations,
          conversationPhase: 'generation',
          isGenerating: false,
        });
      },
      (error) => {
        setError(error);
        updateConversationState({ isGenerating: false });
      }
    );
  };

  const collectEmail = async (email: string, projectName?: string): Promise<boolean> => {
    if (!sessionId) {
      setError('No active session');
      return false;
    }

    setError(null);

    const response = await apiClient.collectEmail({
      sessionId,
      email,
      projectName,
      subscribeToUpdates: true,
    });

    return new Promise((resolve) => {
      handleApiResponse(
        response,
        () => resolve(true),
        (error) => {
          setError(error);
          resolve(false);
        }
      );
    });
  };

  const clearError = () => setError(null);

  return {
    // Chat state
    messages: conversationState.messages,
    input,
    setInput,
    isLoading: isLoading || conversationState.isGenerating,
    
    // Session management
    sessionId,
    conversationState,
    
    // Actions
    sendMessage,
    generateRecommendations,
    collectEmail,
    
    // Recommendations
    recommendations,
    projectAnalysis,
    
    // Error handling
    error,
    clearError,
  };
}