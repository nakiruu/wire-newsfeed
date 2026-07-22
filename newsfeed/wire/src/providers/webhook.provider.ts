import type { Article, NewsProvider, FetchParams } from './types'

// Stub — webhook reception requires a backend (Phase 4)
export class WebhookProvider implements NewsProvider {
  name = 'WEBHOOK' as const
  poll_interval_ms = 0
  rate_limit = { requests: 0, window_ms: 0 }
  async fetch(_params: FetchParams): Promise<Article[]> { return [] }
}
