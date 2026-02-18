import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

const { mockSummarize } = vi.hoisted(() => ({
  mockSummarize: vi.fn(),
}));

vi.mock('../services/summarizer', () => ({
  summarize: mockSummarize,
}));

import { summarizeRouter } from '../routes/summarize';

function createApp() {
  const app = express();
  app.use(express.json({ limit: '100kb' }));
  app.use('/api', summarizeRouter);
  return app;
}

describe('POST /api/summarize', () => {
  beforeEach(() => {
    mockSummarize.mockReset();
    mockSummarize.mockResolvedValue({
      summary: 'Test summary.',
      wordCount: 2,
      strategy: 'concise',
      model: 'claude-haiku-4-5-20251001',
      latencyMs: 100,
    });
  });

  it('returns 200 with summary on valid request', async () => {
    const app = createApp();

    const res = await request(app).post('/api/summarize').send({
      content: 'Some article content.',
      url: 'https://example.com',
      title: 'Test',
    });

    expect(res.status).toBe(200);
    expect(res.body.summary).toBe('Test summary.');
    expect(res.body.wordCount).toBe(2);
    expect(res.body.strategy).toBe('concise');
    expect(mockSummarize).toHaveBeenCalledOnce();
  });

  it('returns 400 on missing content or invalid URL', async () => {
    const app = createApp();

    const res = await request(app).post('/api/summarize').send({
      content: '',
      url: 'not-a-url',
      title: 'Test',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(mockSummarize).not.toHaveBeenCalled();
  });
});
