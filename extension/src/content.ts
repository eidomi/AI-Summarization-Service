/** Base URL of the summarization server — change if running on a different port */
const API_BASE = 'http://localhost:3000';
const API_URL = `${API_BASE}/api/summarize`;
const ROOT_ID = 'ai-summarizer-root';

type Strategy = 'concise' | 'bullets';

function extractContent(): string {
  const selection = window.getSelection()?.toString().trim() ?? '';
  if (selection.length > 50) return selection;

  const semantic = document.querySelector<HTMLElement>('article, main, [role="main"]');
  if (semantic) return semantic.innerText.trim();

  return document.body.innerText.trim();
}

function ensureRoot(): HTMLDivElement {
  const existing = document.getElementById(ROOT_ID) as HTMLDivElement | null;
  if (existing) return existing;

  const root = document.createElement('div');
  root.id = ROOT_ID;
  document.body.appendChild(root);
  return root;
}

function injectStyles(): void {
  if (document.getElementById('ai-summarizer-styles')) return;

  const style = document.createElement('style');
  style.id = 'ai-summarizer-styles';
  style.textContent = `
    .ai-summarizer-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: none;
      background: #6366f1;
      color: white;
      font-size: 20px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.15s, background 0.15s;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .ai-summarizer-btn:hover {
      transform: scale(1.1);
      background: #4f46e5;
    }

    .ai-summarizer-panel {
      position: fixed;
      bottom: 84px;
      right: 24px;
      z-index: 2147483647;
      width: 380px;
      max-height: 480px;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      color: #1f2937;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .ai-summarizer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;
    }
    .ai-summarizer-header-title {
      font-weight: 600;
      font-size: 14px;
    }
    .ai-summarizer-header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ai-summarizer-select {
      font-size: 12px;
      padding: 4px 8px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      cursor: pointer;
    }
    .ai-summarizer-close {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #6b7280;
      padding: 0 4px;
      line-height: 1;
    }
    .ai-summarizer-close:hover {
      color: #1f2937;
    }

    .ai-summarizer-body {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
      white-space: pre-wrap;
      line-height: 1.6;
    }
    .ai-summarizer-loading {
      color: #6b7280;
    }
    .ai-summarizer-error {
      color: #dc2626;
    }

    .ai-summarizer-footer {
      padding: 8px 16px;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #9ca3af;
      background: #f9fafb;
    }
  `;
  document.head.appendChild(style);
}

function createPanel(root: HTMLDivElement): {
  body: HTMLDivElement;
  footer: HTMLDivElement;
  select: HTMLSelectElement;
  panel: HTMLDivElement;
} {
  const panel = document.createElement('div');
  panel.className = 'ai-summarizer-panel';

  // Header
  const header = document.createElement('div');
  header.className = 'ai-summarizer-header';

  const title = document.createElement('span');
  title.className = 'ai-summarizer-header-title';
  title.textContent = 'AI Summary';

  const actions = document.createElement('div');
  actions.className = 'ai-summarizer-header-actions';

  const select = document.createElement('select');
  select.className = 'ai-summarizer-select';
  const options: { value: Strategy; label: string }[] = [
    { value: 'concise', label: 'Concise' },
    { value: 'bullets', label: 'Bullets' },
  ];
  for (const opt of options) {
    const o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.label;
    select.appendChild(o);
  }

  const closeBtn = document.createElement('button');
  closeBtn.className = 'ai-summarizer-close';
  closeBtn.textContent = '\u00d7';
  closeBtn.addEventListener('click', () => {
    panel.remove();
  });

  actions.appendChild(select);
  actions.appendChild(closeBtn);
  header.appendChild(title);
  header.appendChild(actions);

  // Body
  const body = document.createElement('div');
  body.className = 'ai-summarizer-body';

  // Footer
  const footer = document.createElement('div');
  footer.className = 'ai-summarizer-footer';
  footer.style.display = 'none';

  panel.appendChild(header);
  panel.appendChild(body);
  panel.appendChild(footer);
  root.appendChild(panel);

  return { body, footer, select, panel };
}

async function fetchSummary(
  content: string,
  strategy: Strategy,
  body: HTMLDivElement,
  footer: HTMLDivElement
): Promise<void> {
  body.textContent = 'Summarizing...';
  body.className = 'ai-summarizer-body ai-summarizer-loading';
  footer.style.display = 'none';

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        url: window.location.href,
        title: document.title,
        strategy,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    body.className = 'ai-summarizer-body';
    body.textContent = data.summary;
    footer.style.display = 'block';
    footer.textContent = `${data.wordCount} words \u00b7 ${data.latencyMs}ms \u00b7 ${data.model}`;
  } catch (err) {
    body.className = 'ai-summarizer-body ai-summarizer-error';
    body.textContent =
      err instanceof Error ? err.message : 'Failed to summarize';
  }
}

function init(): void {
  injectStyles();
  const root = ensureRoot();

  const btn = document.createElement('button');
  btn.className = 'ai-summarizer-btn';
  btn.setAttribute('aria-label', 'Summarize this page');
  btn.textContent = '\u2728';
  root.appendChild(btn);

  btn.addEventListener('click', () => {
    // Remove existing panel if open
    const existingPanel = root.querySelector('.ai-summarizer-panel');
    if (existingPanel) {
      existingPanel.remove();
      return;
    }

    const content = extractContent();
    if (content.length < 10) {
      const { body } = createPanel(root);
      body.className = 'ai-summarizer-body ai-summarizer-error';
      body.textContent = 'Not enough content to summarize on this page.';
      return;
    }

    const { body, footer, select } = createPanel(root);
    const strategy = select.value as Strategy;
    fetchSummary(content, strategy, body, footer);

    select.addEventListener('change', () => {
      fetchSummary(content, select.value as Strategy, body, footer);
    });
  });
}

init();
