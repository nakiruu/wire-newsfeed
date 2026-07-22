import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AlpacaProvider } from './alpaca.provider'

vi.mock('../lib/api', () => ({ proxyFetch: vi.fn() }))
import { proxyFetch } from '../lib/api'

const mockResponse = {
  news: [{
    headline: 'Tesla surges on delivery numbers',
    summary: 'Tesla reported record deliveries for Q4.',
    url: 'https://alpaca.markets/news/tesla-q4',
    created_at: '2024-01-15T14:30:00Z',
    symbols: ['TSLA'],
    images: [{ url: 'https://example.com/img.jpg', size: 'large' }],
    sentiment: 'positive',
  }],
}

beforeEach(() => {
  vi.mocked(proxyFetch).mockResolvedValue({ ok: true, json: async () => mockResponse } as Response)
})

describe('AlpacaProvider', () => {
  it('fetches and normalizes articles with sentiment mapped to bullish', async () => {
    const articles = await new AlpacaProvider('key', 'secret').fetch({})
    expect(articles).toHaveLength(1)
    expect(articles[0].sentiment).toBe('bullish')
    expect(articles[0].symbols).toContain('TSLA')
    expect(articles[0].source).toBe('ALPACA')
  })

  it('returns empty array on error', async () => {
    vi.mocked(proxyFetch).mockRejectedValue(new Error('fail'))
    expect(await new AlpacaProvider('key', 'secret').fetch({})).toHaveLength(0)
  })
})
