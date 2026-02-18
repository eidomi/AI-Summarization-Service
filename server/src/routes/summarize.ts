import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { summarize } from '../services/summarizer';

const summarizeSchema = z.object({
  content: z.string().min(1),
  url: z.string().url(),
  title: z.string(),
  strategy: z.enum(['concise', 'detailed', 'bullets']).optional(),
});

export const summarizeRouter = Router();

summarizeRouter.post('/summarize', async (req: Request, res: Response) => {
  const parsed = summarizeSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request: ' + parsed.error.issues.map(i => i.message).join(', ') });
    return;
  }

  try {
    const result = await summarize(parsed.data);
    res.json(result);
  } catch (err) {
    console.error('Summarize error:', err);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

summarizeRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
