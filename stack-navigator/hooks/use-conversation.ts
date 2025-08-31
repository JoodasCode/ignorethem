import { useState, useEffect, useCallback } from 'react';
import { useChat } from 'ai/react';
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
  sendMessage: () => void;
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

  // Initialize chat with Vercel AI SDK
  const {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    append,
  } = useChat({
    api: '/api/chat',
    onError: (error) => {
      setError(error.message);
    },
    onFinish: (message) => {
      // Update conversation state when AI responds
      const newMessage: ChatMessage = {
        id: message.id,
        role: 'assistant',
        content: message.content,
        timestamp: new Date(),
      };
      
      updateConversationState({
        messages: [...conversationState.messages, newMessage],
      });
    },
  });

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
  }, []);

  // Sync messages with conversation state
  useEffect(() => {
    if (messages.length > 0) {
      const chatMessages: ChatMessage[] = messages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(),
      }));

      updateConversationState({
        messages: chatMessages,
      });
    }
  }, [messages]);

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

  const sendMessage = useCallback(() => {
    if (!input.trim()) return;

    // Add user message to conversation state
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    updateConversationState({
      messages: [...conversationState.messages, userMessage],
      isGenerating: true,
    });

    // Send message through Vercel AI SDK
    handleSubmit();
  }, [input, handleSubmit, conversationState, updateConversationState]);

  const generateRecommendations = async () => {
    if (!sessionId || messages.length === 0) {
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