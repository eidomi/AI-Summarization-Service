# AI Summarization Service

Chrome extension that extracts web page content and sends it to a backend service that summarizes it using Claude.

## Architecture

```
Chrome Extension (content script)         Express Server
┌──────────────────────────────┐      ┌──────────────────────────────┐
│  content.ts                  │ POST │  routes/summarize.ts         │
│  ├─ extractContent()         │ ───► │  ├─ zod validation           │
│  ├─ Floating button (BR)     │      │  │   └─ z.string().url()     │
│  └─ Result panel             │ ◄─── │  └─ calls service            │
│      ├─ textContent only     │ JSON │                              │
│      └─ loading state        │      │  services/summarizer.ts      │
│                              │      │  └─ Anthropic SDK call       │
└──────────────────────────────┘      └──────────────────────────────┘
```

**Model choice:** Claude Haiku 4.5 — small, fast, cheap model optimized for summarization workloads. Trivial to swap via a single constant.

## Setup

### Server

```bash
cd server
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
npm install
npm run dev
```

The server runs on `http://localhost:3000`.

### Extension

```bash
cd extension
npm install
npm run build
```

1. Open Chrome → `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" → select the `extension/` folder
4. Navigate to any page → click the floating button (bottom-right)

## API

```
POST /api/summarize
Body: { content: string, url: string, title: string, strategy?: "concise" | "bullets" | "detailed" }
Response: { summary: string, wordCount: number, strategy: string, model: string, latencyMs: number }

GET /api/health
Response: { status: "ok", timestamp: string }
```

## Testing

```bash
cd server
npm test
```

4 tests covering:
- **Summarizer service**: happy path (returns summary + metadata), content truncation at 15k chars
- **Route handler**: 200 on valid request, 400 on invalid input

## Key Design Decisions

1. **Content extraction priority**: selected text (>50 chars) → `<article>/<main>/[role="main"]` → `document.body.innerText`
2. **Content script (not popup)**: the floating button is injected directly into pages
3. **IIFE bundle format**: Chrome MV3 content scripts cannot be ES modules
4. **Content truncation at 15,000 chars**: server-side before API call, prevents token overrun
5. **Route/service separation**: route handles HTTP concerns, service is a pure function
6. **Panel renders with `textContent`**: prevents XSS from summary content
7. **Prefixed CSS classes** (`ai-summarizer-*`): avoids host page CSS collisions
8. **`ensureRoot()` helper**: idempotent injection handles SPA re-renders
9. **Generic error responses**: never forwards raw SDK errors to the client

## Summarization Strategies

| Strategy | Description | Max Tokens |
|----------|-------------|------------|
| `concise` (default) | 2-3 sentence summary | 256 |
| `bullets` | 3-5 bullet points | 384 |
| `detailed` | 5-7 sentence summary (server-only) | 512 |

The extension UI exposes concise + bullets. Detailed is implemented server-side as a low-effort future extension.

## What I'd Improve With More Time

- **API authentication**: shared secret or JWT between extension and server
- **CORS origin restriction**: lock down to extension origin
- **Rate limiting**: per-IP or per-key request throttling
- **Request timeouts**: abort long-running Anthropic calls
- **`detailed` strategy in UI**: add to dropdown (server already supports it)
- **Shadow DOM**: stronger CSS isolation from host pages
- **MutationObserver**: re-inject button if removed by SPA frameworks
- **Full accessibility**: keyboard navigation, focus management, ARIA roles beyond button label
- **Streaming**: use Anthropic streaming API for progressive rendering
