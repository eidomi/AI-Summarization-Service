export interface SummarizeRequest {
  content: string;
  url: string;
  title: string;
  strategy?: 'concise' | 'detailed' | 'bullets';
}

export interface SummarizeResponse {
  summary: string;
  wordCount: number;
  strategy: string;
  model: string;
  latencyMs: number;
}

export interface ErrorResponse {
  error: string;
}
