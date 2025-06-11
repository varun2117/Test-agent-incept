import axios from 'axios';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  pricing: {
    prompt: number;
    completion: number;
  };
  context_length: number;
  recommended: boolean;
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    pricing: { prompt: 3.0, completion: 15.0 },
    context_length: 200000,
    recommended: true
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    pricing: { prompt: 0.15, completion: 0.6 },
    context_length: 128000,
    recommended: true
  },
  {
    id: 'meta-llama/llama-4-scout',
    name: 'Llama 4 Scout',
    provider: 'Meta',
    pricing: { prompt: 0.2, completion: 0.8 },
    context_length: 128000,
    recommended: true
  },
  {
    id: 'nousresearch/hermes-3-llama-3.1-70b',
    name: 'Hermes 3 Llama 3.1 70B',
    provider: 'Nous Research',
    pricing: { prompt: 0.9, completion: 0.9 },
    context_length: 128000,
    recommended: false
  },
  {
    id: 'google/gemma-3-27b-it',
    name: 'Gemma 3 27B IT',
    provider: 'Google',
    pricing: { prompt: 0.27, completion: 0.27 },
    context_length: 8192,
    recommended: false
  },
  {
    id: 'google/gemma-3-12b-it',
    name: 'Gemma 3 12B IT',
    provider: 'Google',
    pricing: { prompt: 0.12, completion: 0.12 },
    context_length: 8192,
    recommended: false
  }
];

export class OpenRouterClient {
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(private apiKey?: string) {
    // API key can be passed in constructor or will be provided per request
  }

  async createChatCompletion({
    messages,
    model = 'anthropic/claude-sonnet-4',
    temperature = 0.7,
    maxTokens = 1000,
    apiKey,
  }: {
    messages: OpenRouterMessage[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    apiKey?: string;
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey || this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
            'X-Title': 'Test Chat Agents Platform'
          },
          timeout: 20000
        }
      );

      const data: OpenRouterResponse = response.data;

      return {
        success: true,
        message: data.choices[0]?.message?.content || '',
        usage: data.usage,
        model: data.model,
      };
    } catch (error) {
      console.error('OpenRouter API error:', error);
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.error?.message || error.message;
        
        return {
          success: false,
          message: 'Sorry, I encountered an error. Please try again.',
          error: `OpenRouter API error (${status}): ${message}`,
        };
      }

      return {
        success: false,
        message: 'Sorry, I encountered an error. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getAvailableModels() {
    try {
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
        }
      });

      return {
        success: true,
        models: response.data.data || [],
      };
    } catch (error) {
      console.error('Error fetching models:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const openai = new OpenRouterClient();

export function getModelById(id: string): ModelInfo | undefined {
  return AVAILABLE_MODELS.find(model => model.id === id);
}

export function getRecommendedModels(): ModelInfo[] {
  return AVAILABLE_MODELS.filter(model => model.recommended);
}