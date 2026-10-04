export interface AiPromptOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  contextData?: Record<string, any>;
}

export interface AiResponse {
  content: string;
  provider: 'gemini' | 'openai' | 'anthropic' | 'offline';
  model: string;
  tokensUsed?: number;
}

export interface AiProvider {
  name: 'gemini' | 'openai' | 'anthropic' | 'offline';
  generateText(prompt: string, options?: AiPromptOptions): Promise<AiResponse>;
}
