import type { Article, NewsProvider, FetchParams } from './types'
import { articleId } from '../lib/hash'
import { toSentiment } from './normalize'

const BASE = 'https://data.alpaca.markets/v1beta1'

export class AlpacaProvider implements NewsProvider {
  name = 'ALPACA' as const
  poll_interval_ms = 30_000
  rate_limit = { requests: 20, window_ms: 60_000 }

  constructor(private apiKey: string, private secretKey: string) {}

  async fetch(params: FetchParams): Promise<Article[]> {
    const now = new Date().toISOString()
    const qp = new URLSearchParams({ limit: String(params.limit ?? 50), sort: 'desc' })
    if (params.symbols?.length) qp.set('symbols', params.symbols.join(','))
    if (params.since) qp.set('start', params.since)
    try {
      const res = await fetch(`${BASE}/news?${qp}`, {
        headers: { 'APCA-API-KEY-ID': this.apiKey, 'APCA-API-SECRET-KEY': this.secretKey },
      })
      if (!res.ok) return []
      const data = await res.json() as { news?: unknown[] }
      return (Array.isArray(data.news) ? data.news : []).map(item => {
        const r = item as Record<string, unknown>
        const url = String(r.url ?? '')
        const images = Array.isArray(r.images) ? r.images : []
        const hero = (images.find((i: unknown) => (i as Record<string, unknown>).size === 'large') ?? images[0]) as Record<string, unknown> | undefined
        return {
          id: articleId(url, 'ALPACA'),
          title: String(r.headline ?? ''),
          summary: String(r.summary ?? '').slice(0, 400),
          url,
          source: 'ALPACA' as const,
          provider_label: 'Alpaca',
          symbols: Array.isArray(r.symbols) ? r.symbols.map(String) : [],
          published_at: r.created_at ? new Date(String(r.created_at)).toISOString() : now,
          ingested_at: now,
          sentiment: toSentiment(r.sentiment as string | undefined),
          image_url: hero?.url ? String(hero.url) : undefined,
        }
      })
    } catch { return [] }
  }
}
