import type { ProviderSource } from './hash'
import feedsRaw from '../../rss-feeds.txt?raw'

export const DEFAULT_RSS_FEEDS: string[] = feedsRaw
  .split('\n')
  .map(l => l.trim())
  .filter(l => l.length > 0 && !l.startsWith('#'))

export const CATEGORIES = [
  'earnings', 'macro', 'm&a', 'sec-filing', 'press-release', 'ipo', 'analyst',
] as const

export type Category = typeof CATEGORIES[number]

export const PROVIDER_LABELS: Record<ProviderSource, string> = {
  FMP: 'FMP',
  ALPACA: 'Alpaca',
  RSS: 'RSS',
  SEC: 'SEC EDGAR',
  WEBHOOK: 'Webhook',
}

export const DEFAULT_POLL_INTERVALS: Record<ProviderSource, number> = {
  FMP: 60_000,
  ALPACA: 30_000,
  RSS: 300_000,
  SEC: 600_000,
  WEBHOOK: 0,
}
