import type { Article, NewsProvider, FetchParams } from './types'
import { articleId } from '../lib/hash'
import { stripHtml } from './normalize'
import { proxyFetch } from '../lib/api'

const BASE = 'https://financialmodelingprep.com/api/v3'

export class FMPProvider implements NewsProvider {
  name = 'FMP' as const
  poll_interval_ms = 60_000
  rate_limit = { requests: 10, window_ms: 60_000 }

  constructor(private apiKey: string) {}

  async fetch(params: FetchParams): Promise<Article[]> {
    const now = new Date().toISOString()
    const results: Article[] = []
    const endpoints = [
      `${BASE}/stock_news?limit=${params.limit ?? 50}&apikey=${this.apiKey}`,
      `${BASE}/general_news?limit=20&apikey=${this.apiKey}`,
    ]
    for (const url of endpoints) {
      try {
        const res = await proxyFetch(url)
        if (!res.ok) continue
        const data = await res.json() as unknown[]
        if (!Array.isArray(data)) continue
        for (const item of data) {
          const r = item as Record<string, unknown>
          const articleUrl = String(r.url ?? '')
          if (!articleUrl) continue
          results.push({
            id: articleId(articleUrl, 'FMP'),
            title: String(r.title ?? ''),
            summary: stripHtml(String(r.text ?? r.content ?? '')).slice(0, 400),
            url: articleUrl,
            source: 'FMP',
            provider_label: 'FMP',
            symbols: r.symbol
              ? [String(r.symbol)]
              : Array.isArray(r.symbols)
                ? r.symbols.map(String)
                : [],
            published_at: r.publishedDate
              ? new Date(String(r.publishedDate)).toISOString()
              : now,
            ingested_at: now,
            image_url: r.image ? String(r.image) : undefined,
            category: r.type ? String(r.type).toLowerCase() : undefined,
          })
        }
      } catch { /* individual endpoint failure — continue */ }
    }
    return results
  }
}
