# Wire — Design Spec

**Date:** 2026-07-22  
**Status:** Approved  
**Scope:** Phase 1 + Phase 2 (Core Feed + Full Provider Suite + Search)

---

## Overview

Wire is a self-hosted, real-time stock news aggregation terminal. It pulls from multiple financial data providers (FMP, Alpaca, RSS, SEC EDGAR, Webhook), deduplicates stories, filters by category and source, and presents a unified feed in a Vercel-inspired dark UI.

**Project root:** `newsfeed/wire/` — Vite scaffold lives here.  
**Success criterion:** A single glance at Wire answers "What happened in the last hour that I need to know about?" in under 3 seconds.

---

## Architecture

### Coordinator Pattern (Service Layer)

A `ProviderCoordinator` singleton is initialized once in `main.tsx` and lives entirely outside React. It owns all poll timers, calls provider `fetch()` methods, runs normalization and dedup, and batch-writes net-new articles to Zustand's `feedStore`. React components are pure consumers — they subscribe to stores and never interact with providers directly.

```
main.tsx
  └── ProviderCoordinator (singleton)
        ├── FMPProvider        polls every 60s
        ├── AlpacaProvider     polls every 30s
        ├── RSSProvider        polls every 300s
        ├── SECProvider        polls every 600s
        └── WebhookProvider    passive (push)
              │
              ▼
        normalize() → dedup() → feedStore.addArticles()
```

**Phase 4 migration path:** Replace coordinator internals with a WebSocket client. `coordinator.start()` opens a WS connection instead of setInterval loops. All downstream code (dedup, stores, UI) is untouched.

### CORS

All provider API calls are prefixed with a self-hosted CORS proxy URL (cors-anywhere on Unraid). The proxy base URL is stored in `configStore` (localStorage). If the proxy URL is empty or unreachable, the coordinator marks all providers as errored and shows inline warning badges — no global error modal.

---

## Data Flow

```
Provider.fetch()
  → normalize(raw): Article[]
  → dedup(articles): Article[]         (filter against in-memory Set<id>)
  → feedStore.addArticles(netNew)
       ├── if user scrolled down → feedStore.pendingArticles (shown in banner)
       └── if user at top        → feedStore.articles (visible immediately)
```

Article IDs are deterministic hashes of `(normalized_url, source)` — stripping query params and trailing slashes before hashing.

---

## Provider Layer

### Interface

```typescript
interface NewsProvider {
  name: ProviderSource;
  fetch(params: FetchParams): Promise<Article[]>;
  poll_interval_ms: number;
  rate_limit: { requests: number; window_ms: number };
}
```

### Providers (Phase 1 + 2)

| Provider | Endpoints | Interval | Notes |
|---|---|---|---|
| FMP | `/stock-news`, `/general-news`, `/press-releases` | 60s | Primary, high-volume |
| Alpaca | `/v1beta1/news` | 30s | Includes sentiment field |
| RSS | Generic parser, 5 hardcoded feeds | 300s | Reuters, CNBC, MarketWatch, WSJ, SeekingAlpha |
| SEC EDGAR | EDGAR RSS `?action=getcurrent` | 600s | 8-K, 10-Q, 10-K only |
| Webhook | Passive local endpoint | — | n8n / custom push |

### Article Schema

```typescript
interface Article {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: ProviderSource;
  provider_label: string;
  symbols: string[];
  published_at: string;          // ISO 8601 UTC
  ingested_at: string;           // ISO 8601 UTC
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  category?: string;
  image_url?: string;
  is_breaking?: boolean;
  also_reported_by?: string[];   // Phase 2 fuzzy dedup: ["Reuters", "CNBC"]
}
```

### Dedup Engine

**Level 1 — Exact dedup (Phase 1):** Check incoming article IDs against an in-memory `Set<string>`. O(1) per article. Seeded from `feedStore.articles` on coordinator boot.

**Level 2 — Fuzzy dedup (Phase 2):** Jaccard similarity on title bigrams. Threshold: > 0.75 similarity + published within 30 minutes. The later article is suppressed; its source is appended to the earlier article's `also_reported_by[]`. `ArticleCard` renders this as "Also reported by: Reuters, CNBC."

### Rate Limiting

Each provider tracks its own token bucket (`{ tokens, lastRefill }`). On exhaustion, the coordinator skips that provider's poll cycle and sets a warning badge — no global interruption.

### Retry Strategy

Exponential backoff per provider: `Math.min(base_interval * 2^failures, 10min)`. Resets to normal interval on first success.

---

## State Management

### `feedStore`

```typescript
{
  articles: Article[];           // sorted by published_at desc
  pendingArticles: Article[];    // fetched, not yet shown (user scrolled down)
  readIds: Set<string>;          // persisted to localStorage
  bookmarkIds: Set<string>;      // persisted to localStorage
  focusedIndex: number;          // j/k keyboard nav cursor

  addArticles(articles: Article[]): void;
  flushPending(): void;          // called on banner click / scroll-to-top
  markRead(id: string): void;
  toggleBookmark(id: string): void;
}
```

### `filterStore`

```typescript
{
  activeCategory: string | null;
  activeSources: Set<ProviderSource>;
  searchQuery: string;
  dateRange: { from: string | null; to: string | null };

  getFilteredArticles(): Article[];   // single source of truth for feed rendering
}
```

### `configStore`

```typescript
{
  corsProxyUrl: string;
  providers: Record<ProviderSource, ProviderConfig>;
  watchlistSymbols: string[];
  displayDensity: 'compact' | 'comfortable';
  autoRefresh: boolean;
}

interface ProviderConfig {
  enabled: boolean;
  api_key?: string;
  poll_interval_ms: number;
  custom_feeds?: string[];        // RSS feed URLs
  lastError?: string;             // runtime only, not persisted
  lastErrorAt?: string;           // runtime only, not persisted
  consecutiveFailures: number;    // badge appears after 2+
}
```

**Persistence:** `feedStore` persists only `readIds` and `bookmarkIds`. `configStore` persists everything. Article cache for offline use goes to IndexedDB via `idb`, keyed by article ID.

---

## UI Components

### Layout

```
┌──────────────────────────────────────────────────────┐
│  ● Wire                     [Search]  [⚙]  [●·live] │  Header
├────────────────────────────────┬─────────────────────┤
│  ┌─ Filter Bar ─────────────┐ │  WATCHLIST           │
│  │ All | Earnings | M&A ... │ │  AAPL  +1.24%       │
│  └──────────────────────────┘ │  MSFT  -0.31%       │
│                                │                     │
│  ┌─ Article ────────────────┐ │  SOURCES            │
│  │ AAPL │ 2m ago │ FMP      │ │  ☑ FMP              │
│  │ Apple Reports Record Q3  │ │  ☑ Alpaca           │
│  │ Revenue beat estimates...│ │  ☑ Reuters RSS      │
│  ├──────────────────────────┤ │  ☐ SEC EDGAR        │
│  │ NVDA │ 8m ago │ Alpaca   │ │                     │
│  │ Jensen Huang Keynote...  │ │  ACTIVITY           │
│  └──────────────────────────┘ │  ▂▃▅▇▆▄▃▂▅▇ 24h   │
└────────────────────────────────┴─────────────────────┘
```

### Component Inventory

**`Shell`** — root layout, calls `coordinator.start()` on mount.

**`Header`** — wordmark, `⌘K` search trigger, settings gear, live pulse dot + "Last updated Xs ago" in mono.

**`FilterBar`** — sticky pill toggles: All / Earnings / M&A / Macro / SEC Filings / Press Releases. Active pill: `--accent-blue` text + `rgba(0,112,243,0.1)` background.

**`ArticleFeed`** — `@tanstack/react-virtual` list. Initialized with virtual scroll from day one.

**`ArticleCard`** — stacked rows with 1px `--border` dividers (no floating shadows). Left `2px --accent-blue` border = unread. Ticker badges in `--font-mono`. Metadata row: source • relative time • category • sentiment dot. Hover transitions background to `--surface-elevated` in 150ms.

**`NewArticlesBanner`** — fixed bar above feed when `feedStore.pendingArticles.length > 0`. "↑ N new articles." Slide-down entrance. Click calls `flushPending()` and scrolls to top.

**`Sidebar`** — watchlist with live price change (FMP quote), source checkboxes, 24h activity sparkline.

**`CommandPalette`** — `⌘K` overlay. Fuse.js search across `title`, `summary`, `symbols[]`. Sections: recent searches, matched articles, provider status. Keyboard navigable.

**`SettingsPanel`** — slide-over from right, 400px. Sections: CORS Proxy URL (first field, prominent), Provider API keys with inline test-fetch validation (green/red badge on save), RSS feed URL list, poll intervals, watchlist management, display density toggle.

**`EmptyState`** — two variants: no filter matches ("Clear filters") and no providers configured ("Configure sources →").

### Interaction Patterns

- Keyboard: `j`/`k` navigate, `o` open, `b` bookmark, `r` mark read, `/` focus search, `⌘K` palette, `Esc` close overlays.
- All hover/focus transitions: `150ms ease`. No spring physics.
- Focus rings: `box-shadow: 0 0 0 2px var(--ring-focus)` on `:focus-visible` only.
- Timestamps: relative format ("4m ago") with absolute ISO tooltip on hover.
- Mobile: sidebar collapses to bottom sheet. Feed goes full-width. Touch targets 44px minimum.

---

## Error Handling

| Failure | Surface | User Impact |
|---|---|---|
| CORS proxy unreachable | Badge on all source toggles | Feed empty; prompted to check Settings |
| Provider API error | Badge on that source toggle only | Other providers unaffected |
| Rate limit hit | Same warning badge | Clears on next successful poll |
| RSS parse failure | Badge on RSS toggle | Other providers unaffected |
| No results after filter | `EmptyState` | "Clear filters" CTA |
| No providers configured | `EmptyState` variant | "Configure sources →" CTA |

**API key validation:** Test fetch on key save. Green checkmark on success, red badge with error message on failure. No separate "Test connection" button.

---

## File Structure

```
newsfeed/wire/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Shell.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── feed/
│   │   │   ├── ArticleFeed.tsx
│   │   │   ├── ArticleCard.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   ├── NewArticlesBanner.tsx
│   │   │   └── EmptyState.tsx
│   │   ├── search/
│   │   │   └── CommandPalette.tsx
│   │   ├── settings/
│   │   │   └── SettingsPanel.tsx
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Toggle.tsx
│   │       ├── Tooltip.tsx
│   │       └── Sparkline.tsx
│   ├── services/
│   │   └── coordinator.ts
│   ├── providers/
│   │   ├── types.ts
│   │   ├── normalize.ts
│   │   ├── dedup.ts
│   │   ├── fmp.provider.ts
│   │   ├── alpaca.provider.ts
│   │   ├── rss.provider.ts
│   │   ├── sec.provider.ts
│   │   └── webhook.provider.ts
│   ├── stores/
│   │   ├── feedStore.ts
│   │   ├── filterStore.ts
│   │   └── configStore.ts
│   ├── hooks/
│   │   ├── useKeyboard.ts
│   │   ├── useArticleSearch.ts
│   │   └── useRelativeTime.ts
│   └── lib/
│       ├── api.ts
│       ├── storage.ts
│       ├── hash.ts
│       └── constants.ts
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Tech Stack

| Concern | Library |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS 4 + CSS custom properties |
| State | Zustand |
| Virtual list | @tanstack/react-virtual |
| Search | Fuse.js |
| Dates | date-fns |
| RSS parsing | rss-parser |
| Storage | localStorage + idb (IndexedDB) |
| Icons | Lucide React |
| HTTP | Native fetch via api.ts wrapper |
| Fonts | @fontsource/geist + @fontsource/geist-mono |

---

## Design System Tokens

```css
--background:        #0A0A0A;
--surface:           #111111;
--surface-elevated:  #1A1A1A;
--border:            #1F1F1F;
--border-hover:      #333333;
--text-primary:      #EDEDED;
--text-secondary:    #888888;
--text-tertiary:     #555555;
--accent-blue:       #0070F3;
--accent-green:      #00C853;
--accent-red:        #FF4444;
--accent-amber:      #F5A623;
--ring-focus:        rgba(0, 112, 243, 0.4);

--font-sans:         'Geist', 'Inter', system-ui, sans-serif;
--font-mono:         'Geist Mono', 'JetBrains Mono', monospace;

--radius-sm:         6px;
--radius-md:         8px;
--radius-lg:         12px;
--radius-full:       9999px;
```

---

## Behavioral Rules

1. Never auto-scroll. New articles go to `pendingArticles` — user controls when to reveal them.
2. No loading skeletons for the initial feed. Fast, content-ful first paint.
3. Degrade gracefully per provider. One failure never interrupts the others.
4. Respect rate limits. Each provider tracks its own budget.
5. No analytics, telemetry, or external calls beyond configured provider APIs.
6. Mobile-responsive. Sidebar collapses to bottom sheet. Touch targets 44px minimum.
7. Dark mode only.
8. All timestamps relative with absolute ISO tooltip on hover.

---

## Future Extensibility (Phase 3+)

The `Article` schema reserves `sentiment`, `category`, and `also_reported_by` for enrichment. The coordinator's internal `fetch()` calls are the only thing that changes when migrating to a backend — a WebSocket client replaces the setInterval loops, and an AI enrichment pipeline (sentiment analysis, classification, summarization) runs server-side before articles are pushed to the frontend. No component or store changes required.
