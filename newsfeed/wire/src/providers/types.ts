import type { ProviderSource } from '../lib/hash'

export type { ProviderSource }

export interface Article {
  id: string
  title: string
  summary: string
  url: string
  source: ProviderSource
  provider_label: string
  symbols: string[]
  published_at: string          // ISO 8601 UTC
  ingested_at: string           // ISO 8601 UTC
  sentiment?: 'bullish' | 'bearish' | 'neutral'
  category?: string
  image_url?: string
  is_breaking?: boolean
  also_reported_by?: string[]   // fuzzy dedup: ["Reuters", "CNBC"]
}

export interface FetchParams {
  symbols?: string[]
  since?: string
  limit?: number
  category?: string
}

export interface NewsProvider {
  name: ProviderSource
  fetch(params: FetchParams): Promise<Article[]>
  poll_interval_ms: number
  rate_limit: { requests: number; window_ms: number }
}

export interface ProviderConfig {
  enabled: boolean
  api_key?: string
  poll_interval_ms: number
  custom_feeds?: string[]
  lastError?: string
  lastErrorAt?: string
  consecutiveFailures: number
}
