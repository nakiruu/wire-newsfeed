import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RSSProvider } from './rss.provider'

vi.mock('../lib/api', () => ({ proxyFetch: vi.fn() }))
import { proxyFetch } from '../lib/api'

const mockRSSXml = `<?xml version="1.0"?>
<rss version="2.0"><channel><title>Reuters</title>
<item>
  <title>Markets rally on Fed decision</title>
  <description>Stocks surged after the Federal Reserve held rates steady.</description>
  <link>https://reuters.com/markets/rally-fed</link>
  <pubDate>Mon, 15 Jan 2024 14:30:00 GMT</pubDate>
</item>
</channel></rss>`

beforeEach(() => {
  vi.mocked(proxyFetch).mockResolvedValue({ ok: true, text: async () => mockRSSXml } as unknown as Response)
})

describe('RSSProvider', () => {
  it('parses RSS and returns articles', async () => {
    const articles = await new RSSProvider(['https://feeds.reuters.com/business']).fetch({})
    expect(articles.length).toBeGreaterThan(0)
    expect(articles[0].source).toBe('RSS')
    expect(articles[0].title).toBe('Markets rally on Fed decision')
  })

  it('continues with other feeds if one fails', async () => {
    vi.mocked(proxyFetch)
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce({ ok: true, text: async () => mockRSSXml } as unknown as Response)
    const articles = await new RSSProvider(['https://bad.com/feed', 'https://good.com/feed']).fetch({})
    expect(articles.length).toBeGreaterThan(0)
  })
})
