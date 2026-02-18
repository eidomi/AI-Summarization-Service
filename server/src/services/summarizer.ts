import Anthropic from '@anthropic-ai/sdk';
import { SummarizeRequest, SummarizeResponse } from '../types';
import { STRATEGIES, StrategyName } from './strategies';

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_CONTENT_LENGTH = 15_000;

const client = new Anthropic();

export async function summarize(
  request: SummarizeRequest
): Promise<SummarizeResponse> {
  const strategy: StrategyName = request.strategy ?? 'concise';
  const { systemPrompt, maxTokens } = STRATEGIES[strategy];

  const truncatedContent = request.content.slice(0, MAX_CONTENT_LENGTH);
  const userMessage = `Title: ${request.title}\nURL: ${request.url}\n\n${truncatedContent}`;

  const start = Date.now();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const latencyMs = Date.now() - start;

  const summary =
    response.content[0].type === 'text' ? response.content[0].text : '';

  return {
    summary,
    wordCount: summary.split(/\s+/).filter(Boolean).length,
    strategy,
    model: MODEL,
    latencyMs,
  };
}
