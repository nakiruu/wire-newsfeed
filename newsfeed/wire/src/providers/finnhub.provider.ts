import type { Article, NewsProvider, FetchParams } from './types'
import { articleId } from '../lib/hash'
import { stripHtml, extractSymbols } from './normalize'

const BASE = 'https://finnhub.io/api/v1'

const CATEGORY_MAP: Record<string, string> = {
  earnings: 'earnings',
  ipo: 'ipo',
  merger: 'm&a',
}

export class FinnhubProvider implements NewsProvider {
  name = 'FINNHUB' as const
  poll_interval_ms = 60_000
  rate_limit = { requests: 60, window_ms: 60_000 }

  constructor(private apiKey: string) {}

  async fetch(params: FetchParams): Promise<Article[]> {
    const now = new Date().toISOString()
    const results: Article[] = []
    const categories = ['general', 'merger']

    for (const category of categories) {
      try {
        const res = await fetch(`${BASE}/news?category=${category}&token=${this.apiKey}`)
        if (!res.ok) continue
        const data = await res.json() as unknown[]
        if (!Array.isArray(data)) continue

        for (const item of data.slice(0, params.limit ?? 50)) {
          const r = item as Record<string, unknown>
          const url = String(r.url ?? '')
          if (!url) continue

          const title = String(r.headline ?? '')
          const summary = stripHtml(String(r.summary ?? '')).slice(0, 400)

          // `related` is the primary ticker Finnhub associates with the story
          const related = r.related ? String(r.related).trim() : ''
          const symbols = related
            ? [related]
            : extractSymbols(title + ' ' + summary)

          results.push({
            id: articleId(url, 'FINNHUB'),
            title,
            summary,
            url,
            source: 'FINNHUB',
            provider_label: r.source ? `Finnhub / ${String(r.source)}` : 'Finnhub',
            symbols,
            published_at: r.datetime
              ? new Date(Number(r.datetime) * 1000).toISOString()
              : now,
            ingested_at: now,
            image_url: r.image ? String(r.image) : undefined,
            category: CATEGORY_MAP[String(r.category ?? '').toLowerCase()],
          })
        }
      } catch { /* individual category failure — continue */ }
    }
    return results
  }
}
