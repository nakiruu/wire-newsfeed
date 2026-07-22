import Parser from 'rss-parser'
import type { Article, NewsProvider, FetchParams } from './types'
import { articleId } from '../lib/hash'
import { stripHtml } from './normalize'
import { proxyFetch } from '../lib/api'
import { DEFAULT_RSS_FEEDS } from '../lib/constants'

const parser = new Parser()

export class RSSProvider implements NewsProvider {
  name = 'RSS' as const
  poll_interval_ms = 300_000
  rate_limit = { requests: 10, window_ms: 300_000 }

  constructor(private feeds: string[] = DEFAULT_RSS_FEEDS) {}

  async fetch(_params: FetchParams): Promise<Article[]> {
    const now = new Date().toISOString()
    const results: Article[] = []
    await Promise.allSettled(this.feeds.map(async (feedUrl) => {
      try {
        const res = await proxyFetch(feedUrl)
        if (!res.ok) return
        const xml = await res.text()
        const feed = await parser.parseString(xml)
        for (const item of feed.items ?? []) {
          const url = item.link ?? item.guid ?? ''
          if (!url) continue
          results.push({
            id: articleId(url, 'RSS'),
            title: item.title ?? '',
            summary: stripHtml(item.contentSnippet ?? item.summary ?? item.content ?? '').slice(0, 400),
            url,
            source: 'RSS',
            provider_label: feed.title ?? 'RSS',
            symbols: [],
            published_at: item.pubDate ? new Date(item.pubDate).toISOString() : now,
            ingested_at: now,
          })
        }
      } catch { /* individual feed failure — continue */ }
    }))
    return results
  }
}
