export const STRATEGIES = {
  concise: {
    systemPrompt: 'Summarize in 2-3 sentences. Focus on the main point.',
    maxTokens: 256,
  },
  detailed: {
    systemPrompt:
      'Summarize in 5-7 sentences. Cover key points, context, and conclusions.',
    maxTokens: 512,
  },
  bullets: {
    systemPrompt:
      'Summarize as 3-5 bullet points. Each bullet = one key takeaway.',
    maxTokens: 384,
  },
} as const;

export type StrategyName = keyof typeof STRATEGIES;
