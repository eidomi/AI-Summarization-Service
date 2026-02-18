import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

import { summarize } from '../services/summarizer';

describe('summarize', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'This is a test summary.' }],
    });
  });

  it('returns summary with metadata on valid input', async () => {
    const result = await summarize({
      content: 'Some article content here.',
      url: 'https://example.com',
      title: 'Test Article',
    });

    expect(result.summary).toBe('This is a test summary.');
    expect(result.wordCount).toBe(5);
    expect(result.strategy).toBe('concise');
    expect(result.model).toBe('claude-haiku-4-5-20251001');
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it('truncates content exceeding 15,000 characters', async () => {
    const longContent = 'a'.repeat(20_000);

    await summarize({
      content: longContent,
      url: 'https://example.com',
      title: 'Long Article',
    });

    const callArgs = mockCreate.mock.calls[0][0];
    const userMessage = callArgs.messages[0].content;
    expect(userMessage.length).toBeLessThanOrEqual(15_100);
  });
});
