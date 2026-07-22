import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FMPProvider } from './fmp.provider'

vi.mock('../lib/api', () => ({ proxyFetch: vi.fn() }))
import { proxyFetch } from '../lib/api'

const mockNewsResponse = [{
  title: 'Apple Reports Record Earnings',
  text: '<p>Apple Inc reported record quarterly earnings.</p>',
  url: 'https://financialmodelingprep.com/news/apple',
  publishedDate: '2024-01-15 14:30:00',
  site: 'Reuters',
  symbol: 'AAPL',
  image: 'https://example.com/img.jpg',
}]

beforeEach(() => {
  vi.mocked(proxyFetch).mockResolvedValue({
    ok: true, json: async () => mockNewsResponse,
  } as Response)
})

describe('FMPProvider', () => {
  it('fetches and normalizes articles', async () => {
    const provider = new FMPProvider('test-api-key')
    const articles = await provider.fetch({})
    expect(articles.length).toBeGreaterThan(0)
    expect(articles[0].title).toBe('Apple Reports Record Earnings')
    expect(articles[0].source).toBe('FMP')
    expect(articles[0].summary).toBe('Apple Inc reported record quarterly earnings.')
    expect(articles[0].symbols).toContain('AAPL')
  })

  it('returns empty array on API error', async () => {
    vi.mocked(proxyFetch).mockResolvedValue({ ok: false, status: 429 } as Response)
    expect(await new FMPProvider('key').fetch({})).toHaveLength(0)
  })

  it('returns empty array on network failure', async () => {
    vi.mocked(proxyFetch).mockRejectedValue(new Error('Network error'))
    expect(await new FMPProvider('key').fetch({})).toHaveLength(0)
  })
})
