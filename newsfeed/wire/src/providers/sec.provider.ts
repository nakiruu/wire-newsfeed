import Parser from 'rss-parser'
import type { Article, NewsProvider, FetchParams } from './types'
import { articleId } from '../lib/hash'
import { extractSymbols } from './normalize'
import { proxyFetch } from '../lib/api'

const SEC_FEEDS = [
  'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&dateb=&owner=include&count=40&search_text=&output=atom',
  'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=10-Q&dateb=&owner=include&count=40&search_text=&output=atom',
  'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=10-K&dateb=&owner=include&count=40&search_text=&output=atom',
]

const parser = new Parser()

export class SECProvider implements NewsProvider {
  name = 'SEC' as const
  poll_interval_ms = 600_000
  rate_limit = { requests: 10, window_ms: 600_000 }

  async fetch(_params: FetchParams): Promise<Article[]> {
    const now = new Date().toISOString()
    const results: Article[] = []
    const headers = {
      'User-Agent': 'Wire/1.0 (self-hosted news terminal; contact@example.com)',
      'Accept': 'application/atom+xml',
    }
    await Promise.allSettled(SEC_FEEDS.map(async (feedUrl) => {
      try {
        const res = await proxyFetch(feedUrl, { headers })
        if (!res.ok) return
        const feed = await parser.parseString(await res.text())
        for (const item of feed.items ?? []) {
          const url = item.link ?? (item as Record<string, unknown>).id as string ?? ''
          if (!url) continue
          results.push({
            id: articleId(url, 'SEC'),
            title: item.title ?? '',
            summary: item.contentSnippet ?? item.summary ?? '',
            url,
            source: 'SEC' as const,
            provider_label: 'SEC EDGAR',
            symbols: extractSymbols(item.title ?? ''),
            published_at: item.pubDate ? new Date(item.pubDate).toISOString() : now,
            ingested_at: now,
            category: 'sec-filing',
          })
        }
      } catch { /* individual feed failure — continue */ }
    }))
    return results
  }
}
