export interface ChatRequest {
  system: string;
  user: string;
  /** Ask the model to answer with a single JSON object. */
  json?: boolean;
  temperature?: number;
}

export interface LlmProvider {
  name: string;
  isConfigured(): boolean;
  complete(req: ChatRequest): Promise<string>;
}

/** Thrown for errors where trying the next provider makes sense (quota, rate limit, outage). */
export class RetryableLlmError extends Error {}
