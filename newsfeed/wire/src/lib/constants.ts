import type { ProviderSource } from './hash'

export const DEFAULT_RSS_FEEDS: string[] = [
  'https://feeds.reuters.com/reuters/businessNews',
  'https://feeds.content.dowjones.io/public/rss/mw_realtimeheadlines',
  'https://www.cnbc.com/id/100003114/device/rss/rss.html',
  'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',
  'https://seekingalpha.com/feed.xml',
]

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
